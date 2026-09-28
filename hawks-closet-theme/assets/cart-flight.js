(function () {
  'use strict';
  async function animateProductToCart(source, button) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !source || !source.isConnected || !source.complete || !source.naturalWidth || !Element.prototype.animate) return;
    var target = document.querySelector('#overlayProduct.on .nav-cart') || document.querySelector('.nav .nav-cart');
    if (!target) return;
    var start = source.getBoundingClientRect();
    var finish = target.getBoundingClientRect();
    // On phones the image can be above the viewport when the shopper reaches the button.
    if (start.bottom <= 0 || start.top >= innerHeight || !start.width || !start.height) {
      if (!button) return;
      var origin = button.getBoundingClientRect();
      start = { left: origin.left + origin.width / 2 - 44, top: origin.top - 80, width: 88, height: 88 };
    }
    var card = document.createElement('div');
    card.className = 'cart-flight';
    card.setAttribute('aria-hidden', 'true');
    Object.assign(card.style, { left: start.left + 'px', top: start.top + 'px', width: start.width + 'px', height: start.height + 'px' });
    var image = document.createElement('img');
    image.src = source.currentSrc || source.src;
    image.alt = '';
    card.appendChild(image);
    document.body.appendChild(card);
    var dx = finish.left + finish.width / 2 - start.left - start.width / 2;
    var dy = finish.top + finish.height / 2 - start.top - start.height / 2;
    var scale = Math.min(36 / start.width, 36 / start.height);
    var deadline;
    try {
      var flight = card.animate([
        { transform: 'perspective(900px) translate3d(0, 0, 0) rotateY(0deg) rotateZ(0deg) scale(1)', opacity: .95 },
        { offset: .42, transform: 'perspective(900px) translate3d(' + dx * .3 + 'px, ' + (dy * .55 - 35) + 'px, 60px) rotateY(-22deg) rotateZ(-7deg) scale(.55)', opacity: 1 },
        { transform: 'perspective(900px) translate3d(' + dx + 'px, ' + dy + 'px, 0) rotateY(12deg) rotateZ(5deg) scale(' + scale + ')', opacity: .15 }
      ], { duration: 700, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });
      await Promise.race([flight.finished, new Promise(function (resolve) { deadline = setTimeout(resolve, 1000); })]);
      target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 240 });
    } catch (_) {
      // A canceled visual must never prevent access to the successfully updated cart.
    } finally {
      clearTimeout(deadline);
      card.remove();
    }
  }

  // Keep both existing product views and their cart callbacks intact.
  var originalAddToCart = window.addToCart;
  if (typeof originalAddToCart !== 'function') return;
  window.addToCart = function (variantId, name, onDone) {
    var overlay = document.querySelector('#overlayProduct.on');
    var source = document.querySelector(overlay ? '#pdGallery .pd-slide.on' : '#pdPageGallery .pd-slide.on');
    var button = document.getElementById(overlay ? 'pdAddBtn' : 'pdPageAddBtn');
    return originalAddToCart(variantId, name, function (success) {
      if (!success) {
        if (onDone) onDone(false);
        return;
      }
      Promise.resolve().then(function () {
        return animateProductToCart(source, button);
      }).catch(function () {
        // Visual feedback must not interrupt the original successful cart flow.
      }).then(function () {
        if (onDone) onDone(true);
      });
    });
  };
})();
