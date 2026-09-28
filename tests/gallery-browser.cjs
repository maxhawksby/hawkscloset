const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch();
  for (const [name, width, height, reducedMotion] of [
    ['desktop', 1440, 1000, 'no-preference'], ['mobile', 390, 844, 'no-preference'], ['reduced-motion', 390, 844, 'reduce']
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    let responseStatus = 200;
    let addCount = 0;
    let cart = { item_count: 0, total_price: 0, items: [] };
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/cart.js', route => route.fulfill({ json: cart }));
    await page.route('**/cart/add.js', async route => {
      addCount++;
      const payload = route.request().postDataJSON();
      if (responseStatus !== 200) return route.fulfill({ status: responseStatus, json: { description: responseStatus === 422 ? 'All available units are already in your cart.' : 'Please try again.' } });
      const item = { id: payload.id, key: 'test-cart-key', title: 'Preview piece', variant_title: 'L', final_price: 45050, final_line_price: 45050, image: '', quantity: 1 };
      cart = { item_count: 1, total_price: 45050, items: [item] };
      return route.fulfill({ json: item });
    });
    await page.route('**/cart/change.js', route => { cart = { item_count: 0, total_price: 0, items: [] }; return route.fulfill({ json: cart }); });
    await page.goto('http://127.0.0.1:4173/preview/gallery/');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.grid-img img').evaluateAll(imgs => Promise.race([
      Promise.all(imgs.slice(0, innerWidth > 600 ? 3 : 2).map(i => i.decode())),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Visible product photos timed out')), 10000))
    ]));
    console.log(name + ': images loaded');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `/tmp/hawkscloset-gallery-${name}.png` });
    // Filters preserve their existing behavior.
    await page.locator('.toolbar-filter').click();
    await page.locator('#filterInStockToggle').check();
    assert.equal(await page.locator('#productGrid .grid-cell.sold:visible').count(), 0);
    await page.locator('.filter-clear').click();
    await page.locator('.filter-apply').click();
    console.log(name + ': filters checked');
    // Product cards are real links and activate with the keyboard.
    const piece = page.locator('#productGrid .grid-cell[data-sold="false"]').first();
    await piece.focus();
    await piece.press('Enter');
    await page.locator('#overlayProduct.on').waitFor();
    await page.locator('#pdGallery .pd-slide.on').evaluate(i => i.decode());
    await page.screenshot({ path: `/tmp/hawkscloset-product-${name}.png` });
    const button = page.locator('#pdAddBtn');
    // Server failures and inventory rejections must not produce an animation or success.
    for (const status of [500, 422]) {
      responseStatus = status;
      await button.click();
      await page.waitForFunction(() => !document.getElementById('pdAddBtn').disabled);
      assert.equal(await page.locator('.cart-flight').count(), 0);
      assert.equal(await page.locator('#cartPanel.on').count(), 0);
      assert.equal(await button.textContent(), 'Add to cart');
      assert.equal(await page.locator('.grid-cell.sold').count(), await page.locator('.grid-cell[data-sold="true"]').count());
    }
    responseStatus = 200;
    const countBefore = addCount;
    await button.dblclick();
    if (reducedMotion === 'no-preference') {
      await page.locator('.cart-flight').waitFor({ state: 'attached' });
      await page.screenshot({ path: `/tmp/hawkscloset-cart-flight-${name}.png` });
    }
    await page.locator('#cartPanel.on').waitFor();
    assert.equal(addCount - countBefore, 1, 'double taps must not duplicate cart requests');
    assert.equal(await page.locator('.cart-flight').count(), 0);
    assert.equal(await page.locator('#cartBadge').textContent(), '1');
    assert.equal(await page.locator('#cartTotal').textContent(), '$450.50');
    await page.screenshot({ path: `/tmp/hawkscloset-cart-${name}.png` });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#cartPanel.on').count(), 0);
    assert.equal(await page.locator('#overlayProduct.on').count(), 1);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#overlayProduct.on').count(), 0);
    // Standalone product page uses the same feedback and cart logic.
    await page.goto('http://127.0.0.1:4173/preview/gallery/product.html');
    await page.locator('#pdPageGallery .pd-slide.on').evaluate(i => i.decode());
    await page.locator('#pdPageAddBtn').click();
    await page.locator('#cartPanel.on').waitFor();
    await page.locator('.cart-row-rm').click();
    await page.waitForFunction(() => document.getElementById('cartBadge').textContent === '0');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`${name}: layouts, filters, product keyboard access, failure/422, duplicate prevention, animation, cents, cart removal, and standalone page passed.`);
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
