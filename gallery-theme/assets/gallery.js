(function () {
  'use strict';

  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  var SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL', 'OS'];

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

  function money(cents) {
    var whole = cents % 100 === 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: whole ? 0 : 2 }).format(cents / 100);
  }

  var toastTimer;
  function toast(text, isError) {
    var node = $('#toast');
    if (!node) return;
    node.textContent = text;
    node.classList.toggle('is-error', !!isError);
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.hidden = true; }, isError ? 6000 : 3200);
  }

  async function request(url, body) {
    var response = await fetch(url, body ? {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    } : { headers: { Accept: 'application/json' } });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      var error = new Error(data.description || data.message || 'Something went wrong. Please try again.');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  /* ---------- Cart ---------- */

  var drawer = $('#cartDrawer');
  var scrim = $('.drawer-scrim');
  var cart = { items: [], item_count: 0, total_price: 0 };
  var lastFocus = null;

  function renderCart() {
    $$('[data-cart-count]').forEach(function (node) {
      node.textContent = cart.item_count;
      node.classList.toggle('is-full', cart.item_count > 0);
    });
    var inCart = {};
    cart.items.forEach(function (item) { inCart[String(item.variant_id || item.id)] = true; });
    $$('[data-add]').forEach(function (button) {
      var added = !!inCart[button.dataset.add];
      button.classList.toggle('is-added', added);
      button.textContent = added ? 'In cart' : 'Add';
      if (!button.dataset.label) button.dataset.label = button.getAttribute('aria-label') || '';
      button.setAttribute('aria-label', added ? button.dataset.label.replace(/^Add (.*) to cart$/, '$1 is in your cart. Open cart') : button.dataset.label);
      if (added) button.setAttribute('aria-disabled', 'true'); else button.removeAttribute('aria-disabled');
    });
    var buyButton = $('[data-buy-button]');
    var buyInput = $('[data-buy] input[name="id"]');
    if (buyButton && buyInput && buyInput.type === 'hidden') {
      var owned = !!inCart[buyInput.value];
      buyButton.textContent = owned ? 'In your cart. View cart' : 'Acquire';
      buyButton.dataset.owned = owned ? 'true' : '';
    }
    if (!drawer) return;
    var body = $('[data-cart-body]', drawer);
    var foot = $('[data-cart-foot]', drawer);
    if (!cart.items.length) {
      body.innerHTML = '<p class="drawer-note">Your cart is empty. Every piece here is one of one, so when it is gone, it is gone.</p>';
      foot.hidden = true;
      return;
    }
    var list = document.createElement('ul');
    list.className = 'cart-lines';
    cart.items.forEach(function (item) {
      var line = document.createElement('li');
      line.className = 'cart-line';
      var image = item.image ? '<img src="' + encodeURI(item.image) + '" alt="" width="72" height="72">' : '<span></span>';
      line.innerHTML = image + '<div><a></a><p class="mono"></p><button type="button" class="text-button">Remove</button></div>';
      var link = $('a', line);
      link.href = item.url || '#';
      link.textContent = item.product_title || item.title;
      var size = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title + ' · ' : '';
      $('p', line).textContent = size + money(item.final_line_price);
      var remove = $('button', line);
      remove.setAttribute('aria-label', 'Remove ' + (item.product_title || item.title));
      remove.addEventListener('click', function () { removeLine(item.key, remove); });
      list.appendChild(line);
    });
    body.innerHTML = '';
    body.appendChild(list);
    $('[data-cart-total]', drawer).textContent = money(cart.total_price);
    foot.hidden = false;
  }

  async function refreshCart() {
    try {
      cart = await request('/cart.js');
      renderCart();
    } catch (error) {
      if (drawer) $('[data-cart-body]', drawer).innerHTML = '<p class="drawer-note">We could not load your cart. Refresh the page to try again.</p>';
    }
  }

  function trapFocus(event) {
    if (event.key === 'Escape') { closeCart(); return; }
    if (event.key !== 'Tab') return;
    var focusable = $$('a[href], button:not([disabled]), input, [tabindex="0"]', drawer).filter(function (node) { return node.offsetParent !== null; });
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function openCart() {
    if (!drawer || drawer.classList.contains('is-open')) return;
    lastFocus = document.activeElement;
    scrim.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      scrim.classList.add('is-open');
      drawer.classList.add('is-open');
      drawer.focus();
    });
    document.addEventListener('keydown', trapFocus);
    document.documentElement.style.overflow = 'hidden';
  }

  function closeCart() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', trapFocus);
    document.documentElement.style.overflow = '';
    setTimeout(function () { scrim.hidden = true; }, 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  async function removeLine(key, button) {
    button.disabled = true;
    button.textContent = 'Removing…';
    try {
      cart = await request('/cart/change.js', { id: key, quantity: 0 });
      renderCart();
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Remove';
      toast(error.message, true);
    }
  }

  function flyToCart(source) {
    var target = $('.cart-count');
    if (reduceMotion.matches || !source || !target || !source.complete || !source.naturalWidth || !Element.prototype.animate) return Promise.resolve();
    var start = source.getBoundingClientRect();
    if (start.bottom <= 0 || start.top >= innerHeight || !start.width) return Promise.resolve();
    var end = target.getBoundingClientRect();
    var card = document.createElement('div');
    card.className = 'cart-flight';
    card.setAttribute('aria-hidden', 'true');
    Object.assign(card.style, { left: start.left + 'px', top: start.top + 'px', width: start.width + 'px', height: start.height + 'px' });
    var image = document.createElement('img');
    image.src = source.currentSrc || source.src;
    image.alt = '';
    card.appendChild(image);
    document.body.appendChild(card);
    var dx = end.left + end.width / 2 - start.left - start.width / 2;
    var dy = end.top + end.height / 2 - start.top - start.height / 2;
    var scale = Math.min(28 / start.width, 28 / start.height);
    source.style.opacity = '.25';
    var flight = card.animate([
      { transform: 'translate3d(0,0,0) rotate(0deg) scale(1)', opacity: 1 },
      { offset: .45, transform: 'translate3d(' + dx * .35 + 'px,' + (dy * .5 - 40) + 'px,0) rotate(-6deg) scale(.6)', opacity: 1 },
      { transform: 'translate3d(' + dx + 'px,' + dy + 'px,0) rotate(4deg) scale(' + scale + ')', opacity: .2 }
    ], { duration: 720, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });
    var deadline = new Promise(function (resolve) { setTimeout(resolve, 1000); });
    return Promise.race([flight.finished, deadline]).catch(function () {}).then(function () {
      card.remove();
      source.style.opacity = '';
      target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 260 });
    });
  }

  async function addToCart(variantId, button, source, errorNode) {
    if (button.getAttribute('aria-busy') === 'true') return;
    var label = button.textContent;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Adding…';
    if (errorNode) errorNode.hidden = true;
    try {
      await request('/cart/add.js', { id: Number(variantId) || variantId, quantity: 1 });
      await flyToCart(source);
      await refreshCart();
      openCart();
    } catch (error) {
      button.textContent = label;
      var message = error.status === 422 ? 'This piece is already in your cart or was just acquired by someone else.' : error.message;
      if (errorNode) { errorNode.textContent = message; errorNode.hidden = false; }
      toast(message, true);
    } finally {
      button.removeAttribute('aria-busy');
    }
  }

  document.addEventListener('click', function (event) {
    var open = event.target.closest('[data-cart-open]');
    if (open) { event.preventDefault(); openCart(); return; }
    if (event.target.closest('[data-cart-close]')) { closeCart(); return; }
    var add = event.target.closest('[data-add]');
    if (add) {
      event.preventDefault();
      if (add.getAttribute('aria-disabled') === 'true') { openCart(); return; }
      var piece = add.closest('[data-piece]');
      addToCart(add.dataset.add, add, piece && $('.piece-img', piece));
      return;
    }
    var notify = event.target.closest('[data-notify]');
    if (notify) { event.preventDefault(); openNotify(notify.dataset.notify); }
  });

  var buyForm = $('[data-buy]');
  if (buyForm) {
    buyForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var button = $('[data-buy-button]', buyForm);
      if (button.dataset.owned) { openCart(); return; }
      var choice = $('input[name="id"]:checked', buyForm) || $('input[name="id"]', buyForm);
      addToCart(choice.value, button, $('[data-stage-img]'), $('[data-buy-error]', buyForm));
    });
    $$('input[type="radio"][name="id"]', buyForm).forEach(function (radio) {
      radio.addEventListener('change', function () {
        var price = $('[data-price]');
        if (price && radio.dataset.variantPrice) price.textContent = radio.dataset.variantPrice;
      });
    });
  }

  /* ---------- Notify me ---------- */

  var notifyDialog = $('#notifyDialog');
  function openNotify(piece) {
    if (!notifyDialog || !notifyDialog.showModal) { location.href = 'https://instagram.com/hawks.vtg'; return; }
    var label = $('[data-notify-piece]', notifyDialog);
    if (label) label.textContent = piece && piece !== 'New pieces' ? 'Coming soon · ' + piece : 'New pieces';
    notifyDialog.showModal();
  }
  if (notifyDialog) {
    $('[data-notify-close]', notifyDialog).addEventListener('click', function () { notifyDialog.close(); });
    notifyDialog.addEventListener('click', function (event) { if (event.target === notifyDialog) notifyDialog.close(); });
  }

  /* ---------- The wall: search, filters, sort ---------- */

  var wall = $('[data-wall]');
  var grid = wall && $('[data-grid]', wall);
  var searchInput = $('[data-search-input]');

  function markImages(root) {
    $$('.piece-img', root).forEach(function (img) {
      if (img.complete && img.naturalWidth) return;
      img.classList.add('is-loading');
      var done = function () { img.classList.remove('is-loading'); };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

  if (grid) {
    markImages(grid);
    setTimeout(function () { grid.classList.add('is-settled'); }, reduceMotion.matches ? 0 : 1800);

    var pieces = $$('[data-piece]', grid);
    pieces.forEach(function (piece, index) { piece.dataset.order = index; });
    var isArchive = wall.hasAttribute('data-archive');
    var isSearch = wall.hasAttribute('data-search-results');
    var toolbar = $('[data-toolbar]', wall);
    var countNode = $('[data-count]', wall);
    var emptyNode = $('[data-empty]', wall);
    var params = new URLSearchParams(location.search);
    var state = {
      available: params.get('available') === '1',
      size: params.get('size') || '',
      drop: params.get('drop') || '',
      decade: params.get('decade') || '',
      sort: params.get('sort') || 'featured',
      q: isSearch && window.__PREVIEW_SEARCH ? (params.get('q') || '') : ''
    };

    function unique(key) {
      var seen = {};
      pieces.forEach(function (piece) { if (piece.dataset[key]) seen[piece.dataset[key]] = true; });
      return Object.keys(seen);
    }
    function buildChips(key, values, format) {
      var group = toolbar && $('[data-chips="' + key + '"]', toolbar);
      if (!group || values.length < 2) return;
      values.forEach(function (value) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.dataset.value = value;
        chip.textContent = format ? format(value) : value;
        chip.setAttribute('aria-pressed', String(state[key] === value));
        chip.addEventListener('click', function () {
          state[key] = state[key] === value ? '' : value;
          $$('.chip', group).forEach(function (other) { other.setAttribute('aria-pressed', String(state[key] === other.dataset.value)); });
          apply(true);
        });
        group.appendChild(chip);
      });
    }

    if (toolbar) {
      buildChips('size', unique('size').sort(function (a, b) {
        var ia = SIZE_ORDER.indexOf(a.toUpperCase()), ib = SIZE_ORDER.indexOf(b.toUpperCase());
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
      }));
      if (isArchive) {
        buildChips('drop', unique('drop').sort(), function (value) { return value.replace(/^drop-/, 'Drop '); });
        buildChips('decade', unique('decade').sort());
      }
      var availableToggle = $('[data-filter-available]', toolbar);
      if (availableToggle) {
        availableToggle.setAttribute('aria-pressed', String(state.available));
        availableToggle.addEventListener('click', function () {
          state.available = !state.available;
          availableToggle.setAttribute('aria-pressed', String(state.available));
          apply(true);
        });
      }
      var sortSelect = $('[data-sort]', toolbar);
      sortSelect.value = state.sort;
      sortSelect.addEventListener('change', function () { state.sort = sortSelect.value; apply(true); });
      toolbar.hidden = false;
    }

    function yearOf(piece) {
      var decade = parseInt(piece.dataset.decade, 10);
      var exact = /(\d{4})/.exec(piece.dataset.title || '');
      return exact ? Number(exact[1]) : decade || 0;
    }
    var sorters = {
      featured: function (a, b) { return a.dataset.order - b.dataset.order; },
      'price-asc': function (a, b) { return a.dataset.price - b.dataset.price; },
      'price-desc': function (a, b) { return b.dataset.price - a.dataset.price; },
      'year-asc': function (a, b) { return yearOf(a) - yearOf(b); },
      'year-desc': function (a, b) { return yearOf(b) - yearOf(a); }
    };

    function apply(userAction) {
      var q = state.q.trim().toLowerCase();
      var shown = 0;
      pieces.forEach(function (piece) {
        var d = piece.dataset;
        var match = (!state.available || d.state === 'available') &&
          (!state.size || d.size === state.size) &&
          (!state.drop || d.drop === state.drop) &&
          (!state.decade || d.decade === state.decade) &&
          (!q || d.title.indexOf(q) !== -1);
        piece.hidden = !match;
        if (match) shown++;
      });
      pieces.slice().sort(sorters[state.sort] || sorters.featured).forEach(function (piece) { grid.appendChild(piece); });

      var filtered = state.available || state.size || state.drop || state.decade || q;
      if (countNode) {
        var noun = shown === 1 ? 'piece' : 'pieces';
        countNode.textContent = filtered ? shown + ' of ' + pieces.length + ' ' + (pieces.length === 1 ? 'piece' : 'pieces')
          : isArchive ? pieces.length + ' ' + noun + ', all sold' : shown + ' ' + noun;
      }
      if (emptyNode) {
        emptyNode.hidden = shown > 0;
        var detail = $('[data-empty-detail]', emptyNode);
        if (detail) {
          var parts = [];
          if (q) parts.push('“' + state.q.trim() + '”');
          if (state.size) parts.push('size ' + state.size);
          if (state.available) parts.push('available now');
          if (state.drop) parts.push(state.drop.replace(/^drop-/, 'Drop '));
          if (state.decade) parts.push('the ' + state.decade);
          detail.textContent = parts.length ? 'Nothing for ' + parts.join(', ') + '. Try the archive search, or clear the filters.' : '';
        }
      }
      if (userAction && !isSearch) {
        var next = new URLSearchParams();
        if (state.available) next.set('available', '1');
        if (state.size) next.set('size', state.size);
        if (state.drop) next.set('drop', state.drop);
        if (state.decade) next.set('decade', state.decade);
        if (state.sort !== 'featured') next.set('sort', state.sort);
        history.replaceState(null, '', location.pathname + (next.toString() ? '?' + next : ''));
      }
    }

    var clear = emptyNode && $('[data-clear]', emptyNode);
    if (clear) clear.addEventListener('click', function () {
      state.available = false; state.size = state.drop = state.decade = state.q = '';
      if (searchInput) searchInput.value = '';
      $$('[aria-pressed]', toolbar || wall).forEach(function (chip) { chip.setAttribute('aria-pressed', 'false'); });
      apply(true);
    });

    // Typing in the header search filters this wall live; Enter searches the whole shop.
    if (searchInput && !isSearch) {
      searchInput.addEventListener('input', function () { state.q = searchInput.value; apply(false); });
    }
    apply(false);
  }

  /* ---------- Piece page: views, zoom, back ---------- */

  var stageImg = $('[data-stage-img]');
  $$('[data-view]').forEach(function (button) {
    button.addEventListener('click', function () {
      $$('[data-view]').forEach(function (other) { other.classList.remove('is-current'); other.removeAttribute('aria-current'); });
      button.classList.add('is-current');
      button.setAttribute('aria-current', 'true');
      stageImg.removeAttribute('srcset');
      stageImg.src = button.dataset.view;
      stageImg.dataset.large = button.dataset.viewLarge;
    });
  });

  var zoomLayer = $('[data-zoom-layer]');
  var zoomButton = $('[data-zoom]');
  if (zoomLayer && zoomButton && stageImg) {
    var zoomImg = $('[data-zoom-img]', zoomLayer);
    var closeZoom = function () {
      zoomLayer.hidden = true;
      zoomLayer.classList.remove('is-panning');
      document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', zoomKeys);
      zoomButton.focus();
    };
    var zoomKeys = function (event) { if (event.key === 'Escape') closeZoom(); };
    zoomButton.addEventListener('click', function () {
      zoomImg.src = stageImg.dataset.large || stageImg.currentSrc || stageImg.src;
      zoomLayer.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      document.addEventListener('keydown', zoomKeys);
      $('[data-zoom-close]', zoomLayer).focus();
    });
    $('[data-zoom-close]', zoomLayer).addEventListener('click', closeZoom);
    zoomImg.addEventListener('click', function (event) {
      if (matchMedia('(hover: hover)').matches && !zoomLayer.classList.contains('is-panning')) {
        zoomLayer.classList.add('is-panning');
        pan(event);
      } else {
        closeZoom();
      }
    });
    var pan = function (event) {
      var box = zoomImg.getBoundingClientRect();
      zoomImg.style.transformOrigin = ((event.clientX - box.left) / box.width * 100) + '% ' + ((event.clientY - box.top) / box.height * 100) + '%';
    };
    zoomLayer.addEventListener('mousemove', function (event) { if (zoomLayer.classList.contains('is-panning')) pan(event); });
  }

  var back = $('[data-back]');
  if (back && document.referrer) {
    try {
      if (new URL(document.referrer).origin === location.origin) {
        back.addEventListener('click', function (event) { event.preventDefault(); history.back(); });
      }
    } catch (_) { /* keep the plain link */ }
  }

  refreshCart();
})();
