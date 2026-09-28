const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch();
  try {
    for (const [name, viewport, reducedMotion] of [
      ['desktop', { width: 1440, height: 1000 }, 'no-preference'],
      ['mobile', { width: 390, height: 844 }, 'no-preference'],
      ['reduced-motion', { width: 390, height: 844 }, 'reduce']
    ]) {
      const page = await browser.newPage({ viewport, reducedMotion });
      page.setDefaultTimeout(8000);
      let status = 200;
      let cart = { item_count: 0, total_price: 0, items: [] };
      let adds = 0;
      await page.route('**/cart.js', r => r.fulfill({ json: cart }));
      await page.route('**/cart/add.js', r => {
        adds++;
        if (status !== 200) return r.fulfill({ status, json: { description: 'Request failed' } });
        cart = { item_count: 1, total_price: 45000, items: [{ title: 'Test piece', key: 'test', final_price: 45000, quantity: 1 }] };
        return r.fulfill({ json: cart.items[0] });
      });
      for (const standalone of [false, true]) {
        await page.goto('http://127.0.0.1:4180/' + (standalone ? 'preview/gallery/product.html' : ''), { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('.exhibition-header').count(), 0);
        assert.equal(await page.locator('link[href*="gallery.css"]').count(), 0);
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor), 'rgb(255, 255, 255)');
        if (!standalone) await page.locator('.grid-cell[data-sold="false"]').first().click();
        const imageSelector = standalone ? '#pdPageGallery .pd-slide.on' : '#pdGallery .pd-slide.on';
        await page.waitForFunction(selector => { const image = document.querySelector(selector); return image && image.complete && image.naturalWidth > 0; }, imageSelector);
        const button = page.locator(standalone ? '#pdPageAddBtn' : '#pdAddBtn');
        const previous = adds;
        await button.dblclick();
        if (reducedMotion !== 'reduce') await page.locator('.cart-flight').waitFor({ state: 'attached' });
        await page.locator('#cartPanel.on').waitFor();
        if (!standalone) assert.equal(await page.locator('#overlayProduct.on').count(), 1, 'The item screen must stay open beneath checkout');
        assert.equal(adds - previous, 1);
        assert.equal(await page.locator('.cart-flight').count(), 0);
        assert.equal(await page.locator('#cartBadge').textContent(), '1');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.locator('#cartFoot .btn-black').click({ trial: true });
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#cartPanel.on').count(), 0);
        if (!standalone) assert.equal(await page.locator('#overlayProduct.on').count(), 1, 'Closing the cart returns to the same item');
        assert.equal(await button.textContent(), 'Add to Cart');
      }
      status = 500;
      await page.goto('http://127.0.0.1:4180/preview/gallery/product.html');
      await page.locator('#pdPageAddBtn').click();
      await page.waitForFunction(() => !document.getElementById('pdPageAddBtn').classList.contains('loading'));
      assert.equal(await page.locator('.cart-flight').count(), 0);
      assert.equal(await page.locator('#cartPanel.on').count(), 0);
      await page.close();
      console.log(`${name}: original UI, both product views, animation/cart handoff, duplicate-click protection, and failed-request check passed.`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
