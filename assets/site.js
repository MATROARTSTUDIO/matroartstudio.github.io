/* ═══════════════════════════════════════════════════════════════
   ██████  EVENTS DATA — NOW LOADED FROM data/events.json  ██████
   ═══════════════════════════════════════════════════════════════
   This file used to contain the event list directly. It no longer
   does — all events now live in data/events.json, which is edited
   either through the /admin CMS panel (upload a photo + fill in
   text, click Publish) or by hand on GitHub.

   RECENT_EVENTS below is populated automatically by loadEvents()
   as soon as the page loads, and is then used to render:
     - the home page "Recent Events" preview (3 latest)
     - the full Events page

   Do not edit RECENT_EVENTS directly — edit data/events.json.
   ═══════════════════════════════════════════════════════════════ */
let RECENT_EVENTS = [];
let _eventsLoaded = false;

async function loadEvents() {
  try {
    const res = await fetch('/data/events.json', { cache: 'no-store' });
    const data = await res.json();
    RECENT_EVENTS = data.events || [];
  } catch (err) {
    console.error('Could not load data/events.json', err);
    RECENT_EVENTS = [];
  }
  _eventsLoaded = true;
  renderRecentEvents();
  renderFullEvents();
}
loadEvents();

/* ═══════════════════════════════════════════════════════════════
   ██████  CLIENTS DATA — LOADED FROM data/clients.json  ██████
   ═══════════════════════════════════════════════════════════════
   Same pattern as Events/Gallery/About above. Powers the "Our
   Clients / Trusted by the Government of India" marquee on the
   home page. Edit through the /admin CMS panel, or by hand on
   GitHub, editing data/clients.json.

   Expected shape of data/clients.json:
   { "clients": [
       { "abbr": "MoF", "name": "Ministry of Finance", "tag": "Govt. of India" },
       ...
   ] }

   Do not edit CLIENTS_DATA directly — edit data/clients.json.
   ═══════════════════════════════════════════════════════════════ */
let CLIENTS_DATA = [];

async function loadClients() {
  try {
    const res = await fetch('/data/clients.json', { cache: 'no-store' });
    const data = await res.json();
    CLIENTS_DATA = data.clients || [];
  } catch (err) {
    console.error('Could not load data/clients.json', err);
    CLIENTS_DATA = [];
  }
  renderClients();
}
loadClients();

/* ═══════════════════════════════════════════════════════════════
   renderClients()
   Reads CLIENTS_DATA and injects the marquee cards into
   #clientsTrack on the home page. The list is duplicated once so
   the CSS marquee animation loops seamlessly.
   ═══════════════════════════════════════════════════════════════ */
function renderClients() {
  const container = document.getElementById('clientsTrack');
  if (!container) return;
  if (!CLIENTS_DATA.length) return;

  const cardHTML = (c) => `
    <div class="c-card"><div class="c-abbr">${c.abbr}</div><div class="c-name">${c.name}</div><div class="c-tag">${c.tag}</div></div>
  `;

  /* Duplicate the list once for a seamless CSS marquee loop */
  container.innerHTML = CLIENTS_DATA.map(cardHTML).join('') + CLIENTS_DATA.map(cardHTML).join('');
}

/* ═══════════════════════════════════════════════════════════════
   renderRecentEvents()
   Reads RECENT_EVENTS array, takes the first 3 (latest),
   and injects them into #homeRecentEvents on the home page.
   Called automatically once data/events.json has loaded.
   ═══════════════════════════════════════════════════════════════ */
function renderRecentEvents() {
  const container = document.getElementById('homeRecentEvents');
  if (!container) return;
  const toShow = RECENT_EVENTS.slice(0, 3); /* shows 3 latest */

  container.innerHTML = toShow.map((ev, i) => `
    <div class="re-card" onclick="window.location.href='/events/'" title="View all events"
      style="opacity:0;transform:translateY(32px);transition:opacity .7s ease ${i * 0.15}s, transform .7s ease ${i * 0.15}s;">
      <div class="re-card-img-wrap">
        <img class="re-card-img" src="${(ev.photos && ev.photos[0]) || ''}" alt="${ev.title}" loading="lazy"
          onerror="this.src='/images/DSC_8558.JPG'">
        <div class="re-card-badge">${ev.badge}</div>
      </div>
      <div class="re-card-body">
        <div class="re-card-ministry">${ev.ministry}</div>
        <div class="re-card-title">${ev.title}</div>
        <div class="re-card-venue">📍 ${ev.venue}</div>
        <div class="re-card-link">View All Events <span>→</span></div>
      </div>
    </div>
  `).join('');

  /* Re-run the reveal-on-scroll observer since these cards are new */
  setTimeout(initReveal, 50);

  /* Trigger animation on next frame — bypasses IntersectionObserver timing issue */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.querySelectorAll('.re-card').forEach(card => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   renderFullEvents()
   Reads the full RECENT_EVENTS array (every event, not just the
   latest 3) and injects a complete gallery card for each one into
   #fullEventsList on the Events page — including ALL of its photos,
   however many were uploaded (not just 3).
   ═══════════════════════════════════════════════════════════════ */
function renderFullEvents() {
  const container = document.getElementById('fullEventsList');
  if (!container) return;

  container.innerHTML = RECENT_EVENTS.map(ev => `
    <div class="ev-card rv">
      <div class="ev-hdr">
        <div>
          <div class="ev-title">${ev.title}</div>
          <div class="ev-ministry">${ev.ministry}</div>
        </div>
        <div class="ev-venue">📍 ${ev.venue}</div>
      </div>
      <div class="ev-gallery">
        ${(ev.photos || []).map((src, i) => `
          <img src="${src}" alt="${ev.title} photo ${i + 1}" onclick="openLB(this)" loading="lazy">
        `).join('')}
      </div>
    </div>
  `).join('');

  setTimeout(initReveal, 50);
}

/* ═══════════════════════════════════════════════════════════════
   ██████  GALLERY DATA — LOADED FROM data/gallery.json  ██████
   ═══════════════════════════════════════════════════════════════
   Same pattern as the Events data above. Matches the CMS schema in
   admin/config.yml, which defines TWO separate lists inside
   data/gallery.json:
     - "slider": curated photos for the top featured slider
                 (each: src, alt, caption)
     - "grid":   every photo shown in the full grid below
                 (each: src, alt)

   Photos are added either through the /admin CMS panel (click
   "Gallery Page", add to "Top Slider" and/or "Photo Grid", click
   Publish) or by hand on GitHub, editing data/gallery.json.

   Do not edit GALLERY_DATA directly — edit data/gallery.json.

   NOTE: data/gallery.json currently ships with empty slider/grid
   arrays — no photos yet. Both sections gracefully show an empty
   state until photos are added via the CMS.
   ═══════════════════════════════════════════════════════════════ */
let GALLERY_DATA = { slider: [], grid: [] };
let galSlIdx = 0, galSlTotal = 0, galSlTimer = null;
const GAL_SL_DUR = 5000;

async function loadGallery() {
  try {
    const res = await fetch('/data/gallery.json', { cache: 'no-store' });
    const data = await res.json();
    GALLERY_DATA = { slider: data.slider || [], grid: data.grid || [] };
  } catch (err) {
    console.error('Could not load data/gallery.json', err);
    GALLERY_DATA = { slider: [], grid: [] };
  }
  renderGallerySlider();
  renderGalleryGrid();
}
loadGallery();

/* ═══ GALLERY GRID ═══ */
function renderGalleryGrid() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const items = GALLERY_DATA.grid;

  if (!items.length) {
    grid.innerHTML = `
      <div class="gal-empty">
        <div style="font-size:32px;margin-bottom:16px;">&#128247;</div>
        <p style="font-family:'Playfair Display',serif;font-size:20px;color:var(--cream);margin-bottom:10px;">Gallery photos coming soon</p>
        <p style="font-size:13px;color:rgba(240,234,214,.55);max-width:420px;margin:0 auto;">Photos added via the /admin CMS panel will appear here automatically — no code changes needed.</p>
      </div>`;
    return;
  }

  grid.innerHTML = `<div class="gal-grid">
    ${items.map(img => `
      <img src="${img.src}" alt="${img.alt || 'Matro Art Studio event photo'}" onclick="openLB(this)" loading="lazy">
    `).join('')}
  </div>`;

  setTimeout(initReveal, 50);
}

/* ═══ GALLERY SLIDER ═══ */
function renderGallerySlider() {
  const track = document.getElementById('galSlTrack');
  const dots = document.getElementById('galSlDots');
  const slider = document.getElementById('galSlider');
  if (!track || !slider) return;

  clearInterval(galSlTimer);

  const slides = GALLERY_DATA.slider;

  if (!slides.length) {
    slider.style.display = 'none';
    return;
  }
  slider.style.display = '';

  track.innerHTML = slides.map((img, i) => `
    <div class="gal-sl-slide${i === 0 ? ' active' : ''}">
      <img src="${img.src}" alt="${img.alt || 'Matro Art Studio event photo'}" loading="${i === 0 ? 'eager' : 'lazy'}">
      ${img.caption ? `<div class="gal-sl-caption">${img.caption}</div>` : ''}
    </div>
  `).join('');

  dots.innerHTML = '';
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'gal-sl-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    d.onclick = () => { goGalSlide(i); resetGalSl(); };
    dots.appendChild(d);
  });

  galSlTotal = slides.length;
  galSlIdx = 0;
  goGalSlide(0);
  if (galSlTotal > 1) startGalSl();
}

function goGalSlide(idx) {
  const slides = document.querySelectorAll('#galSlTrack .gal-sl-slide');
  const dots = document.querySelectorAll('#galSlDots .gal-sl-dot');
  if (!slides.length) return;
  slides[galSlIdx].classList.remove('active');
  galSlIdx = (idx + galSlTotal) % galSlTotal;
  slides[galSlIdx].classList.add('active');
  dots.forEach((d, i) => d.classList.toggle('active', i === galSlIdx));
  const bar = document.getElementById('galSlProg');
  if (bar) {
    bar.style.transition = 'none'; bar.style.width = '0%';
    setTimeout(() => { bar.style.transition = `width ${GAL_SL_DUR}ms linear`; bar.style.width = '100%'; }, 50);
  }
}
function galSlNav(d) { goGalSlide(galSlIdx + d); resetGalSl(); }
function startGalSl() { clearInterval(galSlTimer); galSlTimer = setInterval(() => galSlNav(1), GAL_SL_DUR); }
function resetGalSl() { startGalSl(); }

/* Touch/swipe support for gallery slider */
(function(){
  const sl = document.getElementById('galSlider');
  if (!sl) return;
  let tx = 0;
  sl.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  sl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40 && galSlTotal > 1) { galSlNav(dx < 0 ? 1 : -1); }
  }, { passive: true });
})();


/* ═══════════════════════════════════════════════════════════════
   ██████  ABOUT DATA — LOADED FROM data/about.json  ██████
   ═══════════════════════════════════════════════════════════════
   Same pattern as Events and Gallery above. All About page copy —
   headline, story paragraphs, timeline, and photo — is edited
   either through the /admin CMS panel (click "About", edit the
   fields, click Publish) or by hand on GitHub, editing
   data/about.json.

   Do not edit the About page HTML directly — edit data/about.json.
   ═══════════════════════════════════════════════════════════════ */
let ABOUT_DATA = null;

async function loadAbout() {
  try {
    const res = await fetch('/data/about.json', { cache: 'no-store' });
    ABOUT_DATA = await res.json();
  } catch (err) {
    console.error('Could not load data/about.json', err);
    ABOUT_DATA = null;
  }
  renderAbout();
}
loadAbout();

function renderAbout() {
  const page = document.getElementById('page-about');
  if (!page || !ABOUT_DATA) return;

  const d = ABOUT_DATA;

  const setHTML = (id, html) => { const el = document.getElementById(id); if (el && html != null) el.innerHTML = html; };
  const setText = (id, txt) => { const el = document.getElementById(id); if (el && txt != null) el.textContent = txt; };

  setText('aboutPgLabel', d.label);
  setHTML('aboutPgTitle', d.titleHtml);
  setText('aboutSecLabel', d.sectionLabel);
  setHTML('aboutHeading', d.headingHtml);
  setText('aboutBadgeNum', d.badgeNumber);
  setText('aboutBadgeLbl', d.badgeLabel);
  setText('aboutImgCaption', d.imageCaption);

  const img = document.getElementById('aboutImg');
  if (img && d.photo) img.src = d.photo;

  const paraWrap = document.getElementById('aboutParagraphs');
  if (paraWrap && Array.isArray(d.paragraphs)) {
    paraWrap.innerHTML = d.paragraphs.map((p, i) => `<p class="sec-p rv d${Math.min(i + 1, 4)}">${p}</p>`).join('');
  }

  const tlWrap = document.getElementById('aboutTimeline');
  if (tlWrap && Array.isArray(d.timeline)) {
    tlWrap.innerHTML = d.timeline.map(t => `
      <div class="tl-item">
        <div class="tl-dot">${t.dot || ''}</div>
        <div>
          <div class="tl-yr">${t.year || ''}</div>
          <div class="tl-desc">${t.desc || ''}</div>
        </div>
      </div>
    `).join('');
  }

  setTimeout(initReveal, 50);
}

/* ═══ CURSOR ═══ */
const cur = document.getElementById('cur');
const ring = document.getElementById('cur-ring');
if (cur && ring) {
  let _cx = 0, _cy = 0, _curTick = false;
  document.addEventListener('mousemove', e => {
    _cx = e.clientX; _cy = e.clientY;
    if (_curTick) return;
    _curTick = true;
    requestAnimationFrame(() => {
      cur.style.left = _cx + 'px'; cur.style.top = _cy + 'px';
      ring.style.left = _cx + 'px'; ring.style.top = _cy + 'px';
      _curTick = false;
    });
  }, { passive: true });
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a,button,[onclick]')) { cur.classList.add('big'); ring.classList.add('big'); }
    else { cur.classList.remove('big'); ring.classList.remove('big'); }
  }, { passive: true });
}

/* ═══ LOADER ═══ */
/* Lock scroll immediately — before anything loads */
document.body.classList.add('loading');
window.scrollTo({ top: 0, behavior: 'instant' });

/* Dismiss loader on DOMContentLoaded (don't wait for all images) */
function dismissLoader() {
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const loader = document.getElementById('loader');
  loader.classList.add('out');
  /* Re-enable scroll only after loader fully fades (matches .25s transition) */
  setTimeout(() => {
    document.body.classList.remove('loading');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, 280);
  initParticles();
  initReveal();
  renderRecentEvents();
  initHeroSlider();
}
/* Use DOMContentLoaded so loader clears before images finish downloading */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(dismissLoader, 3000));
} else {
  setTimeout(dismissLoader, 3000);
}

/* ═══ HERO BACKGROUND SLIDER ═══ */
let heroSlIdx = 0, heroSlTotal = 0, heroSlTimer = null;
const HERO_SL_DUR = 5000;

function initHeroSlider() {
  const slides = document.querySelectorAll('#heroSliderBg .hero-sl-slide');
  heroSlTotal = slides.length;
  if (!heroSlTotal) return;
  const dots = document.getElementById('heroSlDots');
  if (dots && !dots.children.length) {
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'hero-sl-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Go to slide ' + (i+1));
      d.onclick = () => { goHeroSlide(i); resetHeroSl(); };
      dots.appendChild(d);
    });
  }
  goHeroSlide(0);
  startHeroSl();
}

function goHeroSlide(idx) {
  const slides = document.querySelectorAll('#heroSliderBg .hero-sl-slide');
  const dots = document.querySelectorAll('#heroSlDots .hero-sl-dot');
  slides[heroSlIdx].classList.remove('active');
  heroSlIdx = (idx + heroSlTotal) % heroSlTotal;
  slides[heroSlIdx].classList.add('active');
  dots.forEach((d, i) => d.classList.toggle('active', i === heroSlIdx));
  const bar = document.getElementById('heroSlProg');
  if (bar) {
    bar.style.transition = 'none'; bar.style.width = '0%';
    setTimeout(() => { bar.style.transition = `width ${HERO_SL_DUR}ms linear`; bar.style.width = '100%'; }, 50);
  }
}
function heroSlNav(d) { goHeroSlide(heroSlIdx + d); resetHeroSl(); }
function startHeroSl() { clearInterval(heroSlTimer); heroSlTimer = setInterval(() => heroSlNav(1), HERO_SL_DUR); }
function resetHeroSl() { startHeroSl(); }

/* Touch/swipe support for hero slider */
(function(){
  const hero = document.querySelector('.hero');
  if (!hero) return;
  let tx = 0;
  hero.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) { heroSlNav(dx < 0 ? 1 : -1); }
  }, { passive: true });
})();

/* ═══ PARTICLES ═══ */
function initParticles() {
  const c = document.getElementById('heroParticles');
  if (!c) return;
  const isMobile = window.innerWidth < 768;
  const count = isMobile ? 8 : 16;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'pt';
    const sz = Math.random() * 2.5 + 1;
    s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;animation-duration:${Math.random()*14+10}s;animation-delay:${Math.random()*12}s;opacity:${Math.random()*0.4+0.1};`;
    c.appendChild(s);
  }
}

/* ═══ NAV ═══ */
let _navTicking = false;
const _nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (_navTicking) return;
  _navTicking = true;
  requestAnimationFrame(() => {
    _nav.classList.toggle('scrolled', window.scrollY > 40);
    _navTicking = false;
  });
}, { passive: true });

/* ═══ PAGE NAV ═══
   This is now a real multi-page site — each nav link/button is a
   normal URL (location.href='/services/' etc.), set automatically
   by the build. No client-side page switching is needed any more. */
/* ═══ MOBILE MENU ═══ */
function toggleMob() {
  document.getElementById('hbg').classList.toggle('open');
  document.getElementById('mobMenu').classList.toggle('open');
}

/* ═══ REVEAL ═══ */
let _revealObs = null;
function initReveal() {
  if (_revealObs) _revealObs.disconnect();
  _revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        _revealObs.unobserve(e.target); /* stop watching once revealed */
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
  document.querySelectorAll('.page.active .rv').forEach(el => _revealObs.observe(el));
}

/* ═══ SERVICE DROPDOWNS ═══ */
function toggleDD(btn) {
  btn.classList.toggle('open');
  const dd = btn.closest('.svc-body').nextElementSibling;
  if (dd) dd.classList.toggle('open');
}

/* ═══ LIGHTBOX ═══ */
let lbImgs = [], lbIdx = 0;
function openLB(img) {
  const page = document.querySelector('.page.active');
  /* Collect all clickable images: those with onclick attr OR inside gl-item */
  lbImgs = Array.from(page.querySelectorAll('img[onclick]'));
  /* Deduplicate by src */
  const seen = new Set();
  lbImgs = lbImgs.filter(el => { const k = el.src; if (seen.has(k)) return false; seen.add(k); return true; });
  lbIdx = lbImgs.indexOf(img);
  if (lbIdx === -1) lbIdx = 0;
  document.getElementById('lb-img').src = img.src;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLB(e) {
  if (!e || e.target.id === 'lightbox') {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }
}
function lbNav(dir) {
  lbIdx = (lbIdx + dir + lbImgs.length) % lbImgs.length;
  const img = document.getElementById('lb-img');
  img.style.opacity = '0';
  setTimeout(() => { img.src = lbImgs[lbIdx].src; img.style.opacity = '1'; img.style.transition = 'opacity .25s'; }, 150);
}
document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').classList.contains('open')) {
    if (e.key === 'Escape') closeLB({});
    if (e.key === 'ArrowRight') lbNav(1);
    if (e.key === 'ArrowLeft') lbNav(-1);
  }
});

/* ═══ CONTACT FORM ═══ */
document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (this.action.includes('YOUR_FORM_ID')) {
    document.getElementById('formSuccess').classList.add('show');
    this.reset(); return;
  }
  try {
    const res = await fetch(this.action, { method: 'POST', body: new FormData(this), headers: { Accept: 'application/json' }});
    if (res.ok) { document.getElementById('formSuccess').classList.add('show'); this.reset(); }
  } catch(err) {
    alert('Something went wrong. Please email us at matroartstudio@gmail.com');
  }
});

/* ═══ IMAGE PROTECTION ═══ */
document.addEventListener('contextmenu', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });

/* ═══ INIT ═══ */
initReveal();