/* ═══════════════════════════════════════════════════════════════
   Auto-compress images before upload (Matro Art Studio CMS)
   ───────────────────────────────────────────────────────────────
   Intercepts file selection (both the file picker and drag-and-drop)
   at the browser level, BEFORE Decap CMS ever sees the file. If the
   file is a large image, it's resized/re-encoded client-side, then
   handed back to Decap CMS as if the user had picked the smaller file
   all along. This never touches Decap's internals, so it can't break
   uploading — if anything about compression fails, the original file
   is used untouched.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Only touch files bigger than this (bytes). Small files are left alone.
  var SIZE_THRESHOLD = 500 * 1024; // 500 KB
  // Images are downscaled so neither dimension exceeds this (aspect ratio kept).
  var MAX_DIMENSION = 1920;
  // JPEG/WebP quality (0–1). Applied only to the re-encoded output.
  var QUALITY = 0.82;

  var COMPRESSED_FLAG = '__matroCompressed';

  function isCompressibleImage(file) {
    if (!file || !file.type) return false;
    // Skip SVG (vector, compressing raster-style makes no sense) and GIF (would break animation).
    return /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function (err) {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  function compressFile(file) {
    return loadImage(file).then(function (img) {
      var w = img.naturalWidth, h = img.naturalHeight;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        if (w >= h) { h = Math.round(h * (MAX_DIMENSION / w)); w = MAX_DIMENSION; }
        else { w = Math.round(w * (MAX_DIMENSION / h)); h = MAX_DIMENSION; }
      }
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      // PNGs with real transparency stay PNG (JPEG has no alpha channel);
      // everything else becomes JPEG, which compresses photos far better.
      var outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('canvas.toBlob returned null')); return; }
          if (blob.size >= file.size) {
            // Compression didn't actually help (already optimized) — keep original.
            resolve(file);
            return;
          }
          var newName = outType === 'image/jpeg'
            ? file.name.replace(/\.(png|jpe?g|webp)$/i, '.jpg')
            : file.name;
          var compressed = new File([blob], newName, { type: outType, lastModified: Date.now() });
          try { compressed[COMPRESSED_FLAG] = true; } catch (e) { /* ignore */ }
          resolve(compressed);
        }, outType, QUALITY);
      });
    });
  }

  function shouldProcess(file) {
    return file && !file[COMPRESSED_FLAG] && isCompressibleImage(file) && file.size > SIZE_THRESHOLD;
  }

  function processFileList(files) {
    var list = Array.prototype.slice.call(files);
    return Promise.all(list.map(function (f) {
      if (!shouldProcess(f)) return f;
      return compressFile(f).catch(function () { return f; }); // any failure -> fall back to original
    }));
  }

  function buildDataTransfer(files) {
    var dt = new DataTransfer();
    files.forEach(function (f) { dt.items.add(f); });
    return dt;
  }

  function notify(originalTotal, newTotal, count) {
    if (newTotal >= originalTotal || count === 0) return;
    var pct = Math.round((1 - newTotal / originalTotal) * 100);
    var toast = document.createElement('div');
    toast.textContent = 'Image' + (count > 1 ? 's' : '') + ' compressed \u2013 ' +
      (originalTotal / 1024 / 1024).toFixed(1) + 'MB \u2192 ' +
      (newTotal / 1024 / 1024).toFixed(1) + 'MB (\u2212' + pct + '%)';
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;' +
      'background:#1a1a1a;color:#d4af50;border:1px solid rgba(212,175,80,.4);' +
      'padding:12px 18px;border-radius:6px;font:13px/1.4 sans-serif;' +
      'box-shadow:0 4px 20px rgba(0,0,0,.3);transition:opacity .4s;';
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 400);
    }, 3500);
  }

  // ── Intercept native file inputs (the "Upload" button in the media picker) ──
  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || input.tagName !== 'INPUT' || input.type !== 'file') return;
    if (!input.files || input.files.length === 0) return;
    if (!Array.prototype.some.call(input.files, shouldProcess)) return; // nothing to do

    e.stopImmediatePropagation();
    e.preventDefault();

    var originalTotal = Array.prototype.reduce.call(input.files, function (s, f) { return s + f.size; }, 0);

    processFileList(input.files).then(function (newFiles) {
      var newTotal = newFiles.reduce(function (s, f) { return s + f.size; }, 0);
      input.files = buildDataTransfer(newFiles).files;
      notify(originalTotal, newTotal, newFiles.length);
      // Re-dispatch so Decap CMS's own listener runs against the (now compressed) files.
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }, true);

  // ── Intercept drag-and-drop onto the media picker's drop zone ──
  document.addEventListener('drop', function (e) {
    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    if (!Array.prototype.some.call(e.dataTransfer.files, shouldProcess)) return;

    e.stopImmediatePropagation();
    e.preventDefault();

    var originalTotal = Array.prototype.reduce.call(e.dataTransfer.files, function (s, f) { return s + f.size; }, 0);
    var target = e.target;
    var dropX = e.clientX, dropY = e.clientY;

    processFileList(e.dataTransfer.files).then(function (newFiles) {
      var newTotal = newFiles.reduce(function (s, f) { return s + f.size; }, 0);
      var dt = buildDataTransfer(newFiles);
      notify(originalTotal, newTotal, newFiles.length);
      var newEvent = new DragEvent('drop', {
        bubbles: true, cancelable: true, clientX: dropX, clientY: dropY, dataTransfer: dt
      });
      target.dispatchEvent(newEvent);
    });
  }, true);
})();
