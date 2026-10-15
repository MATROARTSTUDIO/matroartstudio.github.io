/* Matro Art Studio — shared mobile navigation. Add to every page with:
   <link rel="stylesheet" href="/nav-mobile.css">
   <script src="/nav-mobile.js" defer></script> */
(function () {
  /* 1. Upgrade the hamburger into a labelled MENU button */
  var b = document.getElementById('hbg');
  if (b) {
    b.innerHTML = '<div class="hbg-wrap"><i></i><i></i><i></i></div><b class="hbg-label">Menu</b>';
    b.setAttribute('aria-label', 'Open menu');
    b.setAttribute('aria-expanded', 'false');
  }

  /* 2. Menu toggle (overrides any older toggleMob on the page) */
  window.toggleMob = function (force) {
    var btn = document.getElementById('hbg'), m = document.getElementById('mobMenu');
    if (!btn || !m) return;
    var open = (typeof force === 'boolean') ? force : !m.classList.contains('open');
    btn.classList.toggle('open', open);
    m.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    var l = btn.querySelector('.hbg-label'); if (l) l.textContent = open ? 'Close' : 'Menu';
  };
  document.addEventListener('click', function (e) {
    var m = document.getElementById('mobMenu');
    if (!m || !m.classList.contains('open')) return;
    if (e.target.closest('#mobMenu a') || !e.target.closest('#mobMenu, #hbg')) window.toggleMob(false);
  });

  /* 3. Bottom tab bar (added only if the page doesn't already have one) */
  if (!document.querySelector('.mob-bar')) {
    var bar = document.createElement('nav');
    bar.className = 'mob-bar';
    bar.setAttribute('aria-label', 'Quick navigation');
    bar.innerHTML =
      '<a href="/" data-p=""><svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Home</a>' +
      '<a href="/services/" data-p="services"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Services</a>' +
      '<a href="/events/" data-p="events"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Events</a>' +
      '<a href="/gallery/" data-p="gallery"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>Gallery</a>' +
      '<a href="/contact/" data-p="contact" class="cta"><svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>Contact</a>';
    document.body.appendChild(bar);
  }

  /* 4. Highlight current page */
  var seg = location.pathname.split('/').filter(Boolean).filter(function (x) { return !/\.html?$/.test(x); });
  var cur = seg.length ? seg[0] : '';
  document.querySelectorAll('.mob-bar a').forEach(function (a) {
    if (a.dataset.p === cur && !a.classList.contains('cta')) a.classList.add('active');
  });
})();
