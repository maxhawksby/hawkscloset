const { chromium } = require(process.env.HAWKS_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.HAWKS_PREVIEW_URL || 'http://127.0.0.1:4174';
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${base}/preview/`);
    for (const [x, y] of [[1250, 250], [200, 700]]) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(100);
      for (const selector of ['.bg', '.scene-light', '.countdown-grid']) {
        assert.equal(await page.locator(selector).evaluate(el => getComputedStyle(el).transform), 'none');
      }
    }
    const bg = await page.locator('.bg').boundingBox();
    assert.ok(bg.x < 0 && bg.y < 0 && bg.x + bg.width > 1440 && bg.y + bg.height > 1000, 'Background covers every viewport edge');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.mouse.move(200, 700);
    for (const selector of ['.bg', '.scene-light', '.countdown-grid']) {
      assert.equal(await page.locator(selector).evaluate(el => getComputedStyle(el).transform), 'none');
    }
    // Half-width CSS viewport approximates desktop layout at 200% browser zoom.
    await page.setViewportSize({ width: 720, height: 500 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.pw-input').evaluate(el => el === document.activeElement), true);
    assert.notEqual(await page.locator('.pw-input').evaluate(el => getComputedStyle(el).outlineStyle), 'none');
    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const phone = await touch.newPage();
    await phone.goto(`${base}/preview/`);
    await phone.locator('.screen').dispatchEvent('pointermove', { pointerType: 'touch', clientX: 350, clientY: 250 });
    assert.equal(await phone.locator('.screen').evaluate(el => el.style.getPropertyValue('--scene-x')), '');
    console.log('Passed: motionless scene with pointer movement, photo edge coverage, live reduced-motion preference, zoom layout, keyboard focus, and still touch layout.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
