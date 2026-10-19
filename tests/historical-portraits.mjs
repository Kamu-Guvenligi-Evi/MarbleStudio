import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [], external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173/')) external.push(request.url()); });
  await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=demo');
  const catalogue = await page.evaluate(async () => (await import('/src/historical-catalogue.js')).default);
  const references = catalogue.filter(unit => unit.image);
  for (const unit of references) {
    await page.waitForFunction(id => [...document.querySelectorAll(`img[data-reference-portrait="${id}"]`)].filter(img => img.complete && img.naturalWidth > 0).length === 2, unit.id);
    assert.equal(await page.locator(`.roster-row img[data-reference-portrait="${unit.id}"]`).getAttribute('src'), unit.image);
  }
  const pending = catalogue.find(unit => !unit.image);
  if (pending) assert.equal(await page.locator(`canvas[data-portrait="${pending.id}"]`).count(), 2);
  await page.click('[data-unit="samurai"]');
  assert.match(await page.locator('#selection-note').textContent(), /35 asker/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));

  // An unavailable delivered image must leave the usable canvas portrait in place.
  const first = references[0];
  await page.route(`**${first.image}`, route => route.abort());
  await page.reload();
  await page.waitForLoadState('networkidle');
  assert.equal(await page.locator(`canvas[data-portrait="${first.id}"]`).count(), 2);
  assert.equal(await page.locator(`img[data-reference-portrait="${first.id}"]`).count(), 0);
  await page.goto('http://127.0.0.1:5173/crown-battle.html');
  assert.equal(await page.locator('img[data-reference-portrait]').count(), 0);
  assert.equal(await page.locator('.unit-grid canvas[data-portrait]').count(), 4);
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  console.log(`PASS: ${references.length} reference portraits in roster and command buttons; selection, mobile, failed-image fallback and classic mode.`);
} finally { await browser.close(); }
