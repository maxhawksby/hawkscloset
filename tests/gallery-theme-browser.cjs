// End-to-end checks of the gallery rebuild against the brief's acceptance criteria.
// Needs `npm run gallery` (preview server on :4181, simulated cart, no Shopify writes).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.BASE || 'http://localhost:4181';

async function noOverflow(page, label) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(wide <= 0, `${label}: page scrolls sideways by ${wide}px`);
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const [name, width, height, reducedMotion] of [
    ['desktop', 1440, 960, 'no-preference'], ['mobile', 390, 844, 'no-preference'], ['reduced-motion', 390, 844, 'reduce']
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion, hasTouch: name !== 'desktop' });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const step = (label) => { results.push(`${name}: ${label}`); if (process.env.VERBOSE) console.log('ok ', name, label); };

    // Home wall
    await page.goto(base + '/');
    const total = await page.locator('[data-piece]').count();
    assert.ok(total > 20, 'home wall shows pieces');
    await noOverflow(page, 'home');
    step(`home wall shows ${total} pieces, no sideways scroll`);

    // Search by part of a name, live on the wall
    await page.fill('[data-search-input]', 'bulls');
    const visible = page.locator('[data-piece]:not([hidden])');
    assert.equal(await visible.count(), 1);
    assert.match(await visible.first().innerText(), /Chicago Bulls/);
    assert.match(await page.locator('[data-count]').innerText(), /^1 of /);
    await page.fill('[data-search-input]', 'zzzz');
    assert.equal(await page.locator('[data-empty]').isVisible(), true, 'empty state shows');
    await page.click('[data-clear]');
    assert.equal(await visible.count(), total);
    step('search "bulls" finds the piece live; no match shows the empty state; Clear filters restores');

    // Forgiving search: typos on the wall, and whole-shop suggestions (sold pieces included)
    await page.fill('[data-search-input]', 'metalica');
    assert.ok(await visible.count() >= 1, 'typo still filters the wall');
    assert.ok((await visible.allInnerTexts()).every(t => /Metallica/.test(t)));
    await page.waitForSelector('[data-suggest]:not([hidden]) .suggest-item');
    assert.match(await page.locator('.suggest-item').first().innerText(), /Metallica/);
    await page.fill('[data-search-input]', 'goosbumps');
    await page.waitForFunction(() => /Goosebumps/.test(document.querySelector('[data-suggest]').innerText));
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/products\/90s-goosebumps/);
    step('typo search: "metalica" filters the wall, "goosbumps" suggests Goosebumps and Enter opens it');

    // Size and measurements on the label and in the sidebar
    assert.match(await page.locator('.placard-facts').innerText(), /Size\s+XL[\s\S]*Price[\s\S]*Measurements\s+\d+(\.\d+)?\/\d+/i);
    assert.equal(await page.locator('.placard-facts').getByText('Edition').count(), 0);
    await page.goto(base + '/');
    assert.match(await page.locator('.label-size').first().innerText(), /^[A-Z0-9]+ \| \d+(\.\d+)?\/\d+(\.\d+)?$/);
    step('labels read "XL | 23/30"; the sidebar shows Size, Price, Measurements');

    // Whole-shop search on Enter
    await page.fill('[data-search-input]', 'goosebumps');
    await page.press('[data-search-input]', 'Enter');
    await page.waitForURL(/\/search\?q=goosebumps/);
    assert.equal(await page.locator('[data-piece]:not([hidden])').count(), 1);
    step('Enter searches the whole shop (results page)');

    // Available pieces in one size: two taps
    await page.goto(base + '/');
    await page.click('[data-filter-available]');
    await page.click('[data-chips="size"] .chip[data-value="L"]');
    const states = await page.locator('[data-piece]:not([hidden])').evaluateAll(n => n.map(x => x.dataset.state + ':' + x.dataset.size));
    assert.ok(states.length > 0 && states.every(s => s === 'available:L'), 'two taps: only available L');
    assert.match(page.url(), /available=1/);
    step(`two taps: Available + L shows ${states.length} pieces, all available in L`);

    // Quick add from the grid, arrives in the drawer
    const first = page.locator('[data-piece]:not([hidden]) [data-add]').first();
    const pieceName = await first.getAttribute('aria-label');
    await first.click();
    await page.waitForSelector('#cartDrawer.is-open');
    assert.equal(await page.locator('.cart-line').count(), 1);
    assert.equal(await page.locator('[data-cart-count]').innerText(), '1');
    assert.equal(await first.innerText(), 'IN CART');
    step(`quick add (${pieceName.replace(/^Add | to cart$/g, '')}) lands in the cart drawer`);
    await page.keyboard.press('Escape');
    await page.waitForSelector('#cartDrawer:not(.is-open)', { state: 'attached' });
    step('Escape closes the drawer');

    // Sold pieces: marked, not addable
    await page.click('[data-filter-available]');
    const sold = page.locator('[data-piece][data-state="sold"]:not([hidden])').first();
    assert.equal(await sold.locator('[data-add]').count(), 0);
    assert.match(await sold.innerText(), /Sold/);
    await sold.locator('a').click();
    await page.waitForURL(/\/products\//);
    assert.equal(await page.locator('[data-buy]').count(), 0);
    assert.match(await page.locator('.sold-line').innerText(), /Sold/);
    step('sold pieces show a red dot and Sold, and cannot be added');

    // Wall to piece zoom transition (off when the visitor asks for reduced motion)
    await page.goto(base + '/');
    await page.locator('.piece-link').nth(2).click();
    await page.waitForURL(/\/products\//);
    const zoomed = await page.evaluate(() => document.documentElement.classList.contains('vt-in'));
    assert.equal(zoomed, reducedMotion !== 'reduce');
    step(reducedMotion === 'reduce' ? 'no page zoom with reduced motion' : 'opening a piece plays the zoom transition');

    // Piece page: acquire, zoom
    await page.goto(base + '/products/90s-goosebumps');
    await page.click('[data-zoom]');
    assert.equal(await page.locator('[data-zoom-layer]').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-zoom-layer]').isVisible(), false);
    await page.click('[data-buy-button]');
    await page.waitForSelector('#cartDrawer.is-open');
    assert.equal(await page.locator('.cart-line').count(), 2);
    await noOverflow(page, 'piece page');
    step('piece page: zoom opens and closes; Acquire adds to the cart');

    // Checkout path and remove
    assert.equal(await page.locator('[data-checkout]').getAttribute('href'), '/checkout');
    await page.locator('.cart-line button').first().click();
    await page.waitForFunction(() => document.querySelectorAll('.cart-line').length === 1);
    await page.locator('.cart-line button').first().click();
    await page.waitForSelector('text=Your cart is empty');
    step('remove works; checkout goes straight to /checkout; empty cart message shows');
    await page.keyboard.press('Escape');

    // Failed add shows an error and leaves the cart alone
    await page.route('**/cart/add.js', route => route.fulfill({ status: 422, json: { description: 'Sold out' } }));
    await page.click('[data-buy-button]');
    await page.waitForSelector('[data-buy-error]:not([hidden])');
    assert.equal(await page.locator('#cartDrawer.is-open').count(), 0);
    await page.unroute('**/cart/add.js');
    step('a failed add shows an error message and does not open the cart');

    // Archive by drop and decade
    await page.goto(base + '/collections/archive');
    assert.ok(await page.locator('[data-chips="drop"] .chip').count() >= 2);
    await page.click('[data-chips="decade"] .chip[data-value="1980s"]');
    const decades = await page.locator('[data-piece]:not([hidden])').evaluateAll(n => n.map(x => x.dataset.decade + ':' + x.dataset.state));
    assert.ok(decades.length > 0 && decades.every(d => d === '1980s:sold'));
    await noOverflow(page, 'archive');
    step(`archive filters by drop and decade (1980s: ${decades.length} pieces)`);

    // Coming soon, notify me
    await page.goto(base + '/collections/states-upcoming');
    await page.click('[data-piece][data-state="upcoming"] [data-notify]');
    assert.equal(await page.locator('#notifyDialog').isVisible(), true);
    await page.click('#smsSubmit');
    assert.match(await page.locator('#smsMsg').innerText(), /valid phone/);
    await page.click('[data-notify-close]');
    step('coming-soon pieces open the Notify me signup (validation checked, nothing sent)');

    // Empty wall, 404, about
    await page.goto(base + '/collections/states-empty');
    assert.match(await page.locator('.empty-wall').innerText(), /being hung/);
    await page.goto(base + '/nope');
    assert.match(await page.locator('h1').innerText(), /empty/);
    await page.goto(base + '/pages/about');
    assert.match(await page.locator('h1').innerText(), /One person/);
    step('empty wall, 404 and About pages render');

    // Launch screen and password page count down to October 16, noon New York
    for (const route of ['/launch', '/password']) {
      await page.goto(base + route);
      assert.equal(await page.locator('[data-drop-countdown]').getAttribute('data-drop-at'), '2026-10-16T12:00:00-04:00');
      await page.waitForFunction(() => document.querySelector('[data-unit="days"]').textContent !== '--');
      assert.match(await page.locator('[data-drop-date]').innerText(), /October 16, 2026 at 12:00 PM EDT/i);
      await noOverflow(page, route);
    }
    step('launch screen and password page count down to October 16, 12:00 PM EDT');

    assert.deepEqual(errors, [], 'no JavaScript errors');
    step('no JavaScript errors');
    await context.close();
  }
  await browser.close();
  console.log(results.map(r => 'ok  ' + r).join('\n'));
})().catch(error => { console.error('FAIL', error.message); process.exitCode = 1; });
