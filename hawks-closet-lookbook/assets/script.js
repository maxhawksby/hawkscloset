/* ═══════════════════════════════════════
   LOOKBOOK SCRIPT
   No cart, no checkout, no search.
   Browse + PDP overlay + drawer + about.
═══════════════════════════════════════ */

var currentProduct = null;

function get(id) { return document.getElementById(id); }

function showToast(msg) {
  var t = get('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(function() { t.classList.remove('on'); }, 2400);
}

/* ═══════════════════════════════════════
   DRAWER
═══════════════════════════════════════ */
function openDrawer() {
  get('drawer').classList.add('on');
  get('drawerBackdrop').classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  get('drawer').classList.remove('on');
  get('drawerBackdrop').classList.remove('on');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════
   OVERLAYS
═══════════════════════════════════════ */
function openOverlay(id) {
  document.querySelectorAll('.overlay').forEach(function(o) { o.classList.remove('on'); });
  var el = get(id);
  el.classList.add('on');
  var scrollable = el.querySelector('.overlay-inner') || el.querySelector('.pd-layout') ||
                   el.querySelector('.about-layout') || el;
  try { scrollable.scrollTop = 0; } catch(e) {}
  document.body.style.overflow = 'hidden';
}
function closeOverlay(id) {
  get(id).classList.remove('on');
  document.body.style.overflow = '';
}
function openAbout() { openOverlay('overlayAbout'); }

/* ═══════════════════════════════════════
   LOAD MORE (Shopify AJAX pagination)
═══════════════════════════════════════ */
function shopifyLoadMore(btn) {
  var url = btn.dataset.nextUrl;
  if (!url) return;

  btn.textContent = 'Loading...';
  btn.disabled = true;

  fetch(url)
    .then(function(r) { return r.text(); })
    .then(function(html) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');

      var grid = get('productGrid');
      var newCards = doc.querySelectorAll('.grid-cell');
      newCards.forEach(function(card) {
        grid.appendChild(document.importNode(card, true));
      });

      /* Reapply any active size filter to newly appended cards */
      applyFilter();

      var nextUrlEl = doc.getElementById('nextPageUrl');
      var wrap = get('loadMoreWrap');

      if (nextUrlEl && nextUrlEl.dataset.url) {
        btn.dataset.nextUrl = nextUrlEl.dataset.url;
        btn.disabled = false;
        btn.textContent = 'Load More';
      } else {
        if (wrap) wrap.style.display = 'none';
      }
    })
    .catch(function() {
      btn.textContent = 'Load More';
      btn.disabled = false;
    });
}

/* ═══════════════════════════════════════
   SIZE FILTER
   Toggleable drawer mirroring the menu pattern.
   Pills are multi-select; state syncs to URL
   (?size=L,XL). Hides .grid-cell whose data-size
   isn't in the active set. Reapplied after Load More.
═══════════════════════════════════════ */
function openFilter() {
  var d = get('filterDrawer');
  var b = get('filterBackdrop');
  if (!d || !b) return;
  d.classList.add('on');
  d.setAttribute('aria-hidden', 'false');
  b.classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeFilter() {
  var d = get('filterDrawer');
  var b = get('filterBackdrop');
  if (!d || !b) return;
  d.classList.remove('on');
  d.setAttribute('aria-hidden', 'true');
  b.classList.remove('on');
  if (!document.querySelector('.overlay.on')) {
    document.body.style.overflow = '';
  }
}

function getActiveSizeFilter() {
  var pills = document.querySelectorAll('#filterPillsSize .filter-pill[aria-pressed="true"]');
  if (!pills.length) return null;
  var set = {};
  pills.forEach(function(p) { set[(p.dataset.size || '').toUpperCase()] = true; });
  return set;
}

function applyFilter() {
  var active = getActiveSizeFilter();
  var cells = document.querySelectorAll('#productGrid .grid-cell');
  var visible = 0;
  cells.forEach(function(cell) {
    if (!active) {
      cell.classList.remove('filter-hidden');
      visible++;
      return;
    }
    var sz = (cell.dataset.size || '').toUpperCase();
    if (sz && active[sz]) {
      cell.classList.remove('filter-hidden');
      visible++;
    } else {
      cell.classList.add('filter-hidden');
    }
  });
  var chip = get('filterCount');
  if (chip) {
    var n = active ? Object.keys(active).length : 0;
    chip.textContent = n > 0 ? n : '';
    chip.classList.toggle('on', n > 0);
  }
  var ac = get('filterApplyCount');
  if (ac) ac.textContent = visible;
}

function syncFilterToUrl() {
  var active = getActiveSizeFilter();
  var url = new URL(window.location.href);
  if (active) {
    url.searchParams.set('size', Object.keys(active).join(','));
  } else {
    url.searchParams.delete('size');
  }
  window.history.replaceState({}, '', url.toString());
}

function syncFilterFromUrl() {
  var params = new URLSearchParams(window.location.search);
  var raw = params.get('size') || '';
  var wanted = {};
  raw.split(',').forEach(function(s) {
    var v = s.trim().toUpperCase();
    if (v) wanted[v] = true;
  });
  var pills = document.querySelectorAll('#filterPillsSize .filter-pill');
  pills.forEach(function(p) {
    var v = (p.dataset.size || '').toUpperCase();
    p.setAttribute('aria-pressed', wanted[v] ? 'true' : 'false');
  });
}

function clearFilter() {
  var pills = document.querySelectorAll('#filterPillsSize .filter-pill');
  pills.forEach(function(p) { p.setAttribute('aria-pressed', 'false'); });
  syncFilterToUrl();
  applyFilter();
}

function initFilter() {
  var pills = document.querySelectorAll('#filterPillsSize .filter-pill');
  if (!pills.length) return;
  pills.forEach(function(p) {
    p.addEventListener('click', function() {
      var pressed = this.getAttribute('aria-pressed') === 'true';
      this.setAttribute('aria-pressed', pressed ? 'false' : 'true');
      syncFilterToUrl();
      applyFilter();
    });
  });
  syncFilterFromUrl();
  applyFilter();
}

/* ═══════════════════════════════════════
   COUNTDOWN — hero on homepage.
   Target time comes from data-target attr
   (settings.drop_datetime, ISO 8601 with TZ).
   Hides itself once the drop window arrives.
═══════════════════════════════════════ */
function initCountdown() {
  var host = get('lbCountdown');
  if (!host) return;
  var raw = host.dataset.target;
  if (!raw) return;
  var target = new Date(raw).getTime();
  if (isNaN(target)) return;

  var dEl = get('lbCdDays');
  var hEl = get('lbCdHours');
  var mEl = get('lbCdMins');
  var sEl = get('lbCdSecs');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    var diff = target - Date.now();
    if (diff <= 0) {
      /* Drop window arrived — hide the countdown. Maxwell will swap the
         live theme back to the shoppable one; if this lookbook somehow
         stays published, at least the countdown won't show 00:00:00. */
      host.style.display = 'none';
      return;
    }
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    if (dEl) dEl.textContent = pad(d);
    if (hEl) hEl.textContent = pad(h);
    if (mEl) mEl.textContent = pad(m);
    if (sEl) sEl.textContent = pad(s);
  }
  tick();
  setInterval(tick, 1000);
}

/* ═══════════════════════════════════════
   PRODUCT DETAIL OVERLAY
═══════════════════════════════════════ */
function renderGallery(host, imgs, alt) {
  if (!imgs.length) {
    host.innerHTML = '<div class="ph"><svg width="48" height="48" viewBox="0 0 36 36" fill="none"><rect x="4" y="8" width="28" height="22" rx="2" stroke="#ccc" stroke-width="1.5"/><path d="M4 14h28" stroke="#ccc" stroke-width="1.5"/><circle cx="18" cy="23" r="4" stroke="#ccc" stroke-width="1.5"/></svg></div>';
    return;
  }
  var safeAlt = (alt || '').replace(/"/g, '&quot;');
  var slides = imgs.map(function(src, i) {
    return '<img class="pd-slide' + (i === 0 ? ' on' : '') + '" src="' + src + '" alt="' + safeAlt + '">';
  }).join('');
  var dots = imgs.length > 1
    ? '<div class="pd-dots">' + imgs.map(function(_, i) {
        return '<button class="pd-dot' + (i === 0 ? ' on' : '') + '" data-i="' + i + '" aria-label="Slide ' + (i + 1) + '"></button>';
      }).join('') + '</div>'
    : '';
  var arrows = imgs.length > 1
    ? '<button class="pd-arrow pd-prev" aria-label="Previous">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
      '</button>' +
      '<button class="pd-arrow pd-next" aria-label="Next">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</button>'
    : '';
  host.innerHTML = '<div class="pd-slider"><div class="pd-stage"><div class="pd-slides">' + slides + '</div>' + arrows + '</div>' + dots + '</div>';

  if (imgs.length <= 1) return;

  var idx = 0;
  var slideEls = host.querySelectorAll('.pd-slide');
  var dotEls = host.querySelectorAll('.pd-dot');
  function go(n) {
    idx = (n + imgs.length) % imgs.length;
    slideEls.forEach(function(s, i) { s.classList.toggle('on', i === idx); });
    dotEls.forEach(function(dt, i) { dt.classList.toggle('on', i === idx); });
  }
  host.querySelector('.pd-prev').addEventListener('click', function(e) { e.stopPropagation(); go(idx - 1); });
  host.querySelector('.pd-next').addEventListener('click', function(e) { e.stopPropagation(); go(idx + 1); });
  dotEls.forEach(function(dt) {
    dt.addEventListener('click', function(e) { e.stopPropagation(); go(parseInt(this.dataset.i, 10)); });
  });
}

function openProduct(el) {
  var d = el.dataset;
  currentProduct = d;

  get('pdName').textContent = d.name;
  get('pdMeas').textContent = d.meas || '';
  get('pdDesc').innerHTML = d.desc;

  var specs = get('pdSpecs');
  specs.innerHTML = [
    ['Condition', d.cond],
    ['Size',      d.size],
    ['Era',       d.era]
  ].filter(function(r) { return r[1]; })
   .map(function(r) {
     return '<div class="pd-spec"><span class="pd-spec-label">' + r[0] + '</span><span class="pd-spec-val">' + r[1] + '</span></div>';
   }).join('');

  var gallery = get('pdGallery');
  var imgs = [];
  try { imgs = JSON.parse(d.imgs || '[]'); } catch(e) { imgs = []; }
  if (!imgs.length && d.img) imgs = [d.img];
  renderGallery(gallery, imgs, d.name);

  openOverlay('overlayProduct');
}

/* ═══════════════════════════════════════
   ESC KEY
═══════════════════════════════════════ */
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  var open = document.querySelector('.overlay.on');
  if (open) { open.classList.remove('on'); document.body.style.overflow = ''; return; }
  var fd = get('filterDrawer');
  if (fd && fd.classList.contains('on')) { closeFilter(); return; }
  if (get('drawer').classList.contains('on')) { closeDrawer(); }
});

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
function preloadAllGalleryImages() {
  document.querySelectorAll('.grid-cell').forEach(function(cell) {
    var raw = cell.dataset.imgs || '[]';
    try {
      JSON.parse(raw).forEach(function(src) {
        if (src) { var i = new Image(); i.src = src; }
      });
    } catch(e) {}
  });
}

document.addEventListener('DOMContentLoaded', function() {
  preloadAllGalleryImages();
  initFilter();
  initCountdown();
});
