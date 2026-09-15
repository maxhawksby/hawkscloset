// Run with Playwright installed locally, or HAWKS_PLAYWRIGHT_MODULE pointing to it.
const { chromium } = require(process.env.HAWKS_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-15T15:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-15T16:00:00Z'));
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844], ['small', 320, 568]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${process.env.HAWKS_PREVIEW_URL || 'http://127.0.0.1:4174'}/preview/`);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('[data-unit="days"]').textContent(), '11');
    assert.match(await page.locator('[data-drop-date]').textContent(), /September 26, 2026 at 12:00 PM EDT/);
    assert.equal(await page.locator('.countdown-art').count(), 0);
    assert.equal(await page.locator('.countdown-num').count(), 4);
    for (const digit of await page.locator('.countdown-num').all()) {
      const box = await digit.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width, 'Digits stay inside the viewport');
    }
    assert.equal(await page.locator('.bg').evaluate(el => getComputedStyle(el).backgroundImage.includes('password-background.webp')), true);
    await page.screenshot({ path: `/tmp/hawkscloset-floating-${name}.png`, fullPage: true });
  }

  await page.locator('#smsSubmit').click();
  assert.match(await page.locator('#smsMsg').textContent(), /valid phone number/);
  await page.locator('#smsPhone').fill('2015550100');
  await page.locator('#smsSubmit').click();
  assert.match(await page.locator('#smsMsg').textContent(), /agree to receive texts/);
  await page.locator('#smsConsent').check();
  await page.locator('#smsPhone').fill('123');
  await page.locator('#smsSubmit').click();
  assert.match(await page.locator('#smsMsg').textContent(), /10-digit US number/);
  await page.locator('#smsPhone').fill('2015550100');
  // Local preview blocks real requests. Verify retry behavior first.
  await page.locator('#smsSubmit').click();
  assert.match(await page.locator('#smsMsg').textContent(), /couldn’t save/);
  assert.equal(await page.locator('#smsSubmit').isEnabled(), true);
  await page.evaluate(() => {
    window.fetch = async (url, options) => {
      window.capturedSignup = { url, options };
      return { ok: true, status: 202 };
    };
  });
  await page.locator('#smsPhone').press('Enter');
  await page.waitForFunction(() => document.getElementById('smsSubmit').textContent === 'Request received');
  assert.match(await page.locator('#smsMsg').textContent(), /confirmation text/);
  const captured = await page.evaluate(() => window.capturedSignup);
  assert.equal(JSON.parse(captured.options.body).data.attributes.profile.data.attributes.phone_number, '+12015550100');
  assert.equal(await page.locator('#smsSubmit').isDisabled(), true);

  await page.clock.setSystemTime(new Date('2026-09-26T15:59:59Z'));
  await page.reload();
  assert.equal(await page.locator('[data-unit="seconds"]').textContent(), '01');
  await page.clock.fastForward(1500);
  assert.equal(await page.locator('[data-drop-countdown]').getAttribute('data-state'), 'elapsed');
  assert.equal(await page.locator('[data-unit="seconds"]').textContent(), '00');
  assert.match(await page.locator('[data-drop-status]').textContent(), /drop updates/);

  // Exercise the actual DOM initializer with an unset date.
  const html = fs.readFileSync('preview/index.html', 'utf8').replace('data-drop-at="2026-09-26T12:00:00-04:00"', 'data-drop-at=""');
  await page.route('**/preview/', route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.goto(`${process.env.HAWKS_PREVIEW_URL || 'http://127.0.0.1:4174'}/preview/`);
  assert.equal(await page.locator('[data-drop-countdown]').getAttribute('data-state'), 'unscheduled');
  assert.equal(await page.locator('[data-unit="days"]').textContent(), '--');
  assert.equal(await page.locator('[data-drop-date]').isVisible(), false);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('Passed: desktop/mobile/small layouts, countdown date and expiry, unset date, SMS validation, retry, and mocked success. No real SMS submissions.');
})().catch(error => { console.error(error); process.exit(1); });
