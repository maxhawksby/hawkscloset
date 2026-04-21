/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
var currentProduct = null;

/* ═══════════════════════════════════════
   UTILITIES
═══════════════════════════════════════ */
function get(id) { return document.getElementById(id); }

function showToast(msg) {
  var t = get('toast');
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(function() { t.classList.remove('on'); }, 2400);
}

function scrollToShop() {
  var el = get('shopSection');
  if (el) { el.scrollIntoView({ behavior: 'smooth' }); }
  else { window.location.href = '/#shopSection'; }
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
  /* scroll inner content to top — critical on mobile */
  var scrollable = el.querySelector('.overlay-inner') || el.querySelector('.pd-layout') ||
                   el.querySelector('.co-layout') || el.querySelector('.about-layout') || el;
  try { scrollable.scrollTop = 0; } catch(e) {}
  document.body.style.overflow = 'hidden';
}
function closeOverlay(id) {
  get(id).classList.remove('on');
  document.body.style.overflow = '';
}
function openAbout() { openOverlay('overlayAbout'); }

/* ═══════════════════════════════════════
   SHOPIFY CART API
   All cart state lives in Shopify — no
   local array. Fetch /cart.js to sync UI.
═══════════════════════════════════════ */
function fetchCart() {
  fetch('/cart.js')
    .then(function(r) { return r.json(); })
    .then(function(cart) { renderCart(cart); });
}

function addToCart(variantId, name, onDone) {
  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: variantId, quantity: 1 })
  })
  .then(function(r) {
    if (r.status === 422) {
      /* 422 = sold out / unavailable — Shopify returns this during high-traffic drops */
      return r.json().then(function(err) {
        showToast(err.description || name + ' is no longer available');
        /* mark the product tile sold out in the grid immediately */
        var cell = document.querySelector('.grid-cell[data-variant-id="' + variantId + '"]');
        if (cell) { cell.classList.add('sold'); cell.dataset.sold = 'true'; }
        if (onDone) onDone(false);
      });
    }
    return r.json().then(function() {
      showToast(name + ' added to cart');
      fetchCart();
      if (onDone) onDone(true);
    });
  })
  .catch(function() {
    showToast('Could not add to cart — try again');
    if (onDone) onDone(false);
  });
}

function removeFromCart(key) {
  fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: key, quantity: 0 })
  })
  .then(function(r) { return r.json(); })
  .then(function(cart) { renderCart(cart); });
}

/* ═══════════════════════════════════════
   CART PANEL
═══════════════════════════════════════ */
function openCart() {
  get('cartPanel').classList.add('on');
  get('cartBackdrop').classList.add('on');
  document.body.style.overflow = 'hidden';
  var body = get('cartBody');
  if (body) body.scrollTop = 0;
}
function closeCart() {
  get('cartPanel').classList.remove('on');
  get('cartBackdrop').classList.remove('on');
  if (!document.querySelector('.overlay.on')) {
    document.body.style.overflow = '';
  }
}

function renderCart(cart) {
  var body    = get('cartBody');
  var empty   = get('cartEmpty');
  var foot    = get('cartFoot');
  var badge   = get('cartBadge');
  var pdBadge = get('pdBadge');
  var total   = get('cartTotal');

  var count = cart.item_count || 0;
  var totalCents = cart.total_price || 0;

  badge.textContent = count;
  badge.classList.toggle('on', count > 0);
  if (pdBadge) { pdBadge.textContent = count; pdBadge.classList.toggle('on', count > 0); }
  if (total) total.textContent = '$' + Math.round(totalCents / 100);

  if (count === 0) {
    empty.style.display = 'flex';
    foot.style.display = 'none';
  } else {
    empty.style.display = 'none';
    foot.style.display = 'flex';
  }

  body.querySelectorAll('.cart-row').forEach(function(r) { r.remove(); });

  (cart.items || []).forEach(function(item) {
    var row = document.createElement('div');
    row.className = 'cart-row';

    var thumbHtml = item.image
      ? '<img src="' + item.image + '" alt="' + item.title + '">'
      : '<svg width="20" height="20" viewBox="0 0 36 36" fill="none"><rect x="4" y="8" width="28" height="22" rx="2" stroke="#ccc" stroke-width="1.5"/><path d="M4 14h28" stroke="#ccc" stroke-width="1.5"/><circle cx="18" cy="23" r="4" stroke="#ccc" stroke-width="1.5"/></svg>';

    var meta = [item.variant_title].filter(Boolean).join(' \u2022 ');

    row.innerHTML =
      '<div class="cart-row-thumb">' + thumbHtml + '</div>' +
      '<div class="cart-row-info">' +
        '<p class="cart-row-name">' + item.title + '</p>' +
        (meta ? '<p class="cart-row-meta">' + meta + '</p>' : '') +
        '<p class="cart-row-price">$' + Math.round(item.final_price / 100) + '</p>' +
        '<button class="cart-row-rm" data-key="' + item.key + '">Remove</button>' +
      '</div>';

    body.insertBefore(row, empty);
  });

  body.querySelectorAll('.cart-row-rm').forEach(function(btn) {
    btn.addEventListener('click', function() {
      removeFromCart(this.dataset.key);
    });
  });
}

function goCheckout() {
  closeCart();
  window.location.href = '/checkout';
}

/* ═══════════════════════════════════════
   SORT — re-orders DOM nodes
   (products are server-rendered by Liquid)
   Note: sorts only loaded cards. Full
   sort requires a page reload with
   Shopify sort_by param — wired below.
═══════════════════════════════════════ */
function doSort() {
  var v = get('sortSel').value;
  window.location.href = v ? '/collections/all?sort_by=' + v : '/collections/all';
}

/* ═══════════════════════════════════════
   LOAD MORE (Shopify AJAX pagination)
   Fetches next page as ?view=grid,
   appends cards to the grid, updates
   or hides the Load More button.
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

      // Append new product cards to the grid
      var grid = get('productGrid');
      var newCards = doc.querySelectorAll('.grid-cell');
      newCards.forEach(function(card) {
        grid.appendChild(document.importNode(card, true));
      });

      // Check if there's another page
      var nextUrlEl = doc.getElementById('nextPageUrl');
      var wrap = get('loadMoreWrap');

      if (nextUrlEl && nextUrlEl.dataset.url) {
        btn.dataset.nextUrl = nextUrlEl.dataset.url;
        btn.disabled = false;
        // Update remaining count from button text if available
        btn.textContent = 'Load More';
      } else {
        // No more pages — hide the button
        if (wrap) wrap.style.display = 'none';
      }
    })
    .catch(function() {
      btn.textContent = 'Load More';
      btn.disabled = false;
    });
}

/* ═══════════════════════════════════════
   PRODUCT DETAIL OVERLAY
═══════════════════════════════════════ */
function openProduct(el) {
  var d = el.dataset;
  currentProduct = d;
  var sold = d.sold === 'true';

  get('pdName').textContent = d.name;
  get('pdPrice').textContent = '$' + d.price;
  get('pdDesc').textContent = d.desc;

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
  gallery.innerHTML = d.img
    ? '<img src="' + d.img + '" alt="' + d.name + '" style="max-width:100%;max-height:70vh;object-fit:contain;">'
    : '<div class="ph" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--white);"><svg width="48" height="48" viewBox="0 0 36 36" fill="none"><rect x="4" y="8" width="28" height="22" rx="2" stroke="#ccc" stroke-width="1.5"/><path d="M4 14h28" stroke="#ccc" stroke-width="1.5"/><circle cx="18" cy="23" r="4" stroke="#ccc" stroke-width="1.5"/></svg></div>';

  var addBtn = get('pdAddBtn');
  var buyBtn = get('pdBuyBtn');
  if (sold) {
    addBtn.textContent = 'Sold Out';
    addBtn.className = 'pd-add disabled';
    buyBtn.style.display = 'none';
  } else {
    addBtn.textContent = 'Add to Cart';
    addBtn.className = 'pd-add primary';
    buyBtn.style.display = '';
  }

  openOverlay('overlayProduct');
}

function pdAddToCart() {
  if (!currentProduct || currentProduct.sold === 'true') return;
  var btn = get('pdAddBtn');
  /* prevent double-tap race — common on mobile drop day */
  if (btn.classList.contains('loading') || btn.classList.contains('disabled')) return;

  var variantId = parseInt(currentProduct.variantId);
  var name = currentProduct.name;

  btn.classList.add('loading');
  btn.textContent = 'Adding\u2026';

  addToCart(variantId, name, function(success) {
    if (success) {
      closeOverlay('overlayProduct');
      setTimeout(openCart, 350);
    } else {
      /* sold out during high-traffic — update overlay button */
      btn.textContent = 'Sold Out';
      btn.className = 'pd-add disabled';
      get('pdBuyBtn').style.display = 'none';
      currentProduct.sold = 'true';
    }
  });
}

function pdBuyNow() {
  if (!currentProduct || currentProduct.sold === 'true') return;
  var btn = get('pdBuyBtn');
  if (btn.disabled) return;
  btn.disabled = true;

  var variantId = parseInt(currentProduct.variantId);
  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: variantId, quantity: 1 })
  })
  .then(function(r) {
    if (r.status === 422) {
      return r.json().then(function(err) {
        showToast(err.description || 'Item no longer available');
        btn.disabled = false;
        /* update overlay to sold state */
        get('pdAddBtn').textContent = 'Sold Out';
        get('pdAddBtn').className = 'pd-add disabled';
        btn.style.display = 'none';
        currentProduct.sold = 'true';
      });
    }
    window.location.href = '/checkout';
  })
  .catch(function() {
    showToast('Could not proceed — try again');
    btn.disabled = false;
  });
}

/* ═══════════════════════════════════════
   ESC KEY
═══════════════════════════════════════ */
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  var open = document.querySelector('.overlay.on');
  if (open) { open.classList.remove('on'); document.body.style.overflow = ''; return; }
  if (get('cartPanel').classList.contains('on')) { closeCart(); return; }
  if (get('drawer').classList.contains('on')) { closeDrawer(); }
});

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  fetchCart();
});
