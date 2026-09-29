// Records a walkthrough video of the gallery preview. Needs `npm run gallery` running on :4181.
const { chromium } = require('playwright');
const fs = require('node:fs');
const base = process.env.BASE || 'http://localhost:4181';
const dir = 'docs/previews/gallery';
const pause = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  for (const [name, width, height, touch] of [['desktop', 1440, 900, false], ['mobile', 390, 844, true]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, recordVideo: { dir: dir + '/tmp', size: { width, height } } });
    const page = await context.newPage();
    await page.goto(base + '/'); await pause(2200);
    await page.mouse.move(width * .3, 560); await pause(900);
    await page.mouse.wheel(0, 500); await pause(1000); await page.mouse.wheel(0, -500); await pause(600);
    await page.click('[data-search-input]'); await page.keyboard.type('bulls', { delay: 120 }); await pause(1400);
    await page.fill('[data-search-input]', ''); await page.dispatchEvent('[data-search-input]', 'input'); await pause(700);
    await page.click('[data-filter-available]'); await pause(700);
    await page.click('[data-chips="size"] .chip[data-value="XL"]'); await pause(1300);
    await page.locator('[data-piece]:not([hidden])').first().hover(); await pause(700);
    await page.locator('[data-piece]:not([hidden]) [data-add]').first().click();
    await page.waitForSelector('#cartDrawer.is-open'); await pause(1800);
    await page.keyboard.press('Escape'); await pause(700);
    await page.locator('[data-piece]:not([hidden]) .piece-link').nth(1).click(); await pause(2000);
    await page.click('[data-zoom]'); await pause(1200); await page.keyboard.press('Escape'); await pause(500);
    await page.click('[data-buy-button]'); await page.waitForSelector('#cartDrawer.is-open'); await pause(1800);
    await page.keyboard.press('Escape');
    await page.goto(base + '/collections/archive'); await pause(1800);
    await page.click('[data-chips="decade"] .chip[data-value="1980s"]'); await pause(1500);
    await page.goto(base + '/pages/about'); await pause(1600);
    await page.goto(base + '/launch'); await pause(2600);
    const video = page.video();
    await context.close();
    fs.renameSync(await video.path(), `${dir}/demo-${name}.webm`);
  }
  fs.rmSync(dir + '/tmp', { recursive: true, force: true });
  await browser.close();
  console.log('recorded demo-desktop.webm and demo-mobile.webm');
})();
