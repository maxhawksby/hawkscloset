// Screenshots of the gallery preview for review. Needs `npm run gallery` running on :4181.
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://localhost:4181';
const out = process.env.OUT || 'docs/previews/gallery';
const shots = (process.argv[2] || '/:home').split(',').map(x => x.split(':'));
(async () => {
  const browser = await chromium.launch();
  for (const [name, width, height] of [['desktop', 1440, 960], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => m.type() === 'error' && errors.push(m.text()));
    for (const [route, label] of shots) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1900);
      await page.screenshot({ path: `${out}/${label}-${name}.png`, fullPage: process.env.FULL === '1' });
    }
    if (errors.length) console.log(name, 'errors:', errors);
    await page.close();
  }
  await browser.close();
  console.log('saved', shots.length * 2, 'screenshots');
})();
