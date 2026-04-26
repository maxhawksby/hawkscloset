/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
var cart = [];
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

function cartTotal() {
  return cart.reduce(function(s, i) { return s + i.price; }, 0);
}

function scrollToShop() {
  get('shopSection').scrollIntoView({ behavior: 'smooth' });
}

/* ═══════════════════════════════════════
   DRAWER MENU — uses global functions
   called via onclick attributes so
   no addEventListener race conditions
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
  document.querySelectorAll('.overlay').forEach(function(o) {
    o.classList.remove('on');
  });
  var el = get(id);
  el.classList.add('on');
  /* scroll inner content to top — critical on mobile after returning to a product */
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
   CART
═══════════════════════════════════════ */
function openCart() {
  get('cartPanel').classList.add('on');
  get('cartBackdrop').classList.add('on');
  document.body.style.overflow = 'hidden';
  var body = get('cartBody');
  if (body) body.scrollTop = 0;
  renderCart();
}
function closeCart() {
  get('cartPanel').classList.remove('on');
  get('cartBackdrop').classList.remove('on');
  if (!document.querySelector('.overlay.on')) {
    document.body.style.overflow = '';
  }
}

function renderCart() {
  var body = get('cartBody');
  var empty = get('cartEmpty');
  var foot = get('cartFoot');
  var badge = get('cartBadge');
  var pdBadge = get('pdBadge');
  var total = get('cartTotal');

  badge.textContent = cart.length;
  badge.classList.toggle('on', cart.length > 0);
  if (pdBadge) { pdBadge.textContent = cart.length; pdBadge.classList.toggle('on', cart.length > 0); }
  if (total) total.textContent = '$' + cartTotal();

  if (cart.length === 0) {
    empty.style.display = 'flex';
    foot.style.display = 'none';
  } else {
    empty.style.display = 'none';
    foot.style.display = 'flex';
  }

  body.querySelectorAll('.cart-row').forEach(function(r) { r.remove(); });

  cart.forEach(function(item, idx) {
    var row = document.createElement('div');
    row.className = 'cart-row';
    var thumbHtml = item.img
      ? '<img src="' + item.img + '" alt="' + item.name + '">'
      : '<svg width="20" height="20" viewBox="0 0 36 36" fill="none"><rect x="4" y="8" width="28" height="22" rx="2" stroke="#ccc" stroke-width="1.5"/><path d="M4 14h28" stroke="#ccc" stroke-width="1.5"/><circle cx="18" cy="23" r="4" stroke="#ccc" stroke-width="1.5"/></svg>';
    row.innerHTML =
      '<div class="cart-row-thumb">' + thumbHtml + '</div>' +
      '<div class="cart-row-info">' +
      '<p class="cart-row-name">' + item.name + '</p>' +
      '<p class="cart-row-meta">' + item.size + ' &bull; ' + item.era + ' &bull; ' + item.cond + '</p>' +
      '<p class="cart-row-price">$' + item.price + '</p>' +
      '<button class="cart-row-rm" data-idx="' + idx + '">Remove</button>' +
      '</div>';
    body.insertBefore(row, empty);
  });

  body.querySelectorAll('.cart-row-rm').forEach(function(btn) {
    btn.addEventListener('click', function() {
      cart.splice(parseInt(this.dataset.idx), 1);
      renderCart();
    });
  });
}

function addToCart(d) {
  cart.push({
    name: d.name,
    price: parseInt(d.price),
    size: d.size,
    era: d.era,
    cond: d.cond,
    id: d.id,
    img: d.img || null
  });
  renderCart();
  showToast(d.name + ' added to cart');
}

function goCheckout() {
  closeCart();
  get('coSuccess').classList.remove('on');
  get('coContent').style.display = '';
  var items = get('coSummaryItems');
  items.innerHTML = '';
  cart.forEach(function(item) {
    var r = document.createElement('div');
    r.className = 'co-sum-row';
    r.innerHTML = '<span class="co-sum-name">' + item.name + '</span><span class="co-sum-price">$' + item.price + '</span>';
    items.appendChild(r);
  });
  get('coTotal').textContent = '$' + cartTotal();
  openOverlay('overlayCheckout');
}

/* ═══════════════════════════════════════
   SEARCH + SORT — compose into a single view
   doSearch and doSort both call applyView,
   which filters by query then sorts then renders.
═══════════════════════════════════════ */
var _searchQuery = '';

function doSearch() {
  var input = get('searchInput');
  _searchQuery = ((input && input.value) || '').trim().toLowerCase();
  applyView();
}

function doSort() { applyView(); }

function applyView() {
  var list = PRODUCTS.slice();

  if (_searchQuery) {
    var tokens = _searchQuery.split(/\s+/);
    list = list.filter(function(p) {
      var hay = (p.name + ' ' + p.desc).toLowerCase();
      return tokens.every(function(t) { return hay.indexOf(t) !== -1; });
    });
  }

  var sortEl = get('sortSel');
  var v = sortEl ? sortEl.value : '';
  if (v === 'lh') list.sort(function(a, b) { return a.price - b.price; });
  if (v === 'hl') list.sort(function(a, b) { return b.price - a.price; });
  if (v === 'az') list.sort(function(a, b) { return a.name.localeCompare(b.name); });
  if (v === 'za') list.sort(function(a, b) { return b.name.localeCompare(a.name); });

  renderProducts(list);
  updateProductCount(list.length);
}

/* ═══════════════════════════════════════
   PRODUCT COUNT — shows (n of total) when filtered
═══════════════════════════════════════ */
function updateProductCount(visible) {
  var el = get('productCount'); if (!el) return;
  var total = PRODUCTS.length;
  var n = (typeof visible === 'number') ? visible : total;
  el.textContent = (n === total) ? '(' + total + ')' : '(' + n + ' of ' + total + ')';
}

/* ═══════════════════════════════════════
   PRODUCT DETAIL
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
    ['Size', d.size],
    ['Era', d.era]
  ].map(function(r) {
    return '<div class="pd-spec"><span class="pd-spec-label">' + r[0] + '</span><span class="pd-spec-val">' + r[1] + '</span></div>';
  }).join('');

  var gallery = get('pdGallery');
  gallery.innerHTML = d.img
    ? '<img src="' + d.img + '" alt="' + d.name + '" style="max-width:100%;max-height:70vh;object-fit:contain;">'
    : '<div class="ph" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--white);">' +
      '<svg width="48" height="48" viewBox="0 0 36 36" fill="none"><rect x="4" y="8" width="28" height="22" rx="2" stroke="#ccc" stroke-width="1.5"/><path d="M4 14h28" stroke="#ccc" stroke-width="1.5"/><circle cx="18" cy="23" r="4" stroke="#ccc" stroke-width="1.5"/></svg></div>';

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
  /* prevent double-tap race on mobile */
  if (btn.classList.contains('loading') || btn.classList.contains('disabled')) return;
  btn.classList.add('loading');
  addToCart(currentProduct);
  closeOverlay('overlayProduct');
  setTimeout(openCart, 300);
}

function pdBuyNow() {
  if (!currentProduct || currentProduct.sold === 'true') return;
  var btn = get('pdBuyBtn');
  if (btn.disabled) return;
  btn.disabled = true;
  addToCart(currentProduct);
  closeOverlay('overlayProduct');
  setTimeout(function() { btn.disabled = false; goCheckout(); }, 300);
}

/* ═══════════════════════════════════════
   CHECKOUT
═══════════════════════════════════════ */
function fmtCard(el) {
  var v = el.value.replace(/\D/g, '').slice(0, 16);
  el.value = v.match(/.{1,4}/g) ? v.match(/.{1,4}/g).join(' ') : v;
}
function fmtExp(el) {
  var v = el.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
  el.value = v;
}

function submitOrder() {
  var fields = ['coEmail','coFirst','coLast','coAddr','coCity','coState','coZip','coCard','coExp','coCvv'];
  var ok = true;
  fields.forEach(function(id) {
    var el = get(id);
    if (!el) return;
    el.classList.remove('err');
    if (!el.value.trim()) { el.classList.add('err'); ok = false; }
  });
  if (!ok) { showToast('Please fill in all fields'); return; }
  get('coContent').style.display = 'none';
  get('coSuccess').classList.add('on');
  cart = [];
  renderCart();
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
  renderProducts();
  updateProductCount();
});
