import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { ARMY_PRESETS, createCommanderArmy, presetMinimum } from '../src/historical-army-presets.js';
import { ARMY_HISTORY } from '../src/historical-army-history.js';

assert.deepEqual(Object.keys(ARMY_HISTORY).sort(), Object.keys(ARMY_PRESETS).sort());
assert.deepEqual(createCommanderArmy('timur', presetMinimum(ARMY_PRESETS.timur)), {
  timurid_horse_archer: 8, timurid_armored_lancer: 7, timurid_guard_cavalry: 4, timur_aq_qoyunlu_cavalry: 2, timur_kara_tatar_archer: 2, timur: 1,
});
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.route('**/__army-history-test', route => route.fulfill({ contentType: 'text/html', body: '<main id="card"></main>' }));
  await page.goto('http://127.0.0.1:5173/__army-history-test');
  await page.evaluate(async () => {
    const { mountArmyPreset } = await import('/src/historical-army-preset-ui.js');
    window.panel = mountArmyPreset(document.querySelector('#card'), 'test', (team, army) => { window.created = army; });
  });
  for (const [id, preset] of Object.entries(ARMY_PRESETS)) {
    await page.evaluate(id => window.panel.render(id), id);
    assert.equal(await page.locator('.commander-auto-period').textContent(), preset.history.period);
    assert.equal(await page.locator('.commander-auto-history-toggle').getAttribute('aria-expanded'), 'false');
    await page.locator('.commander-auto-history-toggle').click();
    assert.equal(await page.locator('.commander-auto-scope').textContent(), preset.history.scope);
    const links = await page.locator('.commander-auto-sources a').evaluateAll(anchors => anchors.map(a => a.href));
    assert.ok(links.length > 0, `${id}: equipment sources available`);
    assert.equal(new Set(links).size, links.length);
    assert.ok(links.every(url => /^https?:\/\//.test(url)));
    await page.locator('.commander-auto-create').click();
    const count = Number(await page.locator('#commander-army-size-test').inputValue());
    assert.deepEqual(await page.evaluate(() => window.created), createCommanderArmy(id, count));
  }
  await page.evaluate(() => window.panel.render(null));
  assert.equal(await page.locator('.commander-auto-army').isVisible(), false);
  console.log(`PASS: ${Object.keys(ARMY_PRESETS).length} period/scope/source panels, source deduplication, toggle reset, actual army creation; Timurid-specific roster.`);
} finally { await browser.close(); }
