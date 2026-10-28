import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import units, { RETIRED_HISTORICAL_IDS } from '../src/historical-catalogue.js';
import { HISTORICAL_TYPES, CIVILIZATIONS, createHistoricalTypes, groupCivilizations } from '../src/historical-combat.js';
const fixture = createHistoricalTypes([
  { id: 'new_archer', name: 'Test', faction: 'Test medeniyeti', kind: 'cavalry', role: 'Atlı okçu' },
  { id: 'new_elephant', name: 'Test', faction: 'Test medeniyeti', kind: 'elephant' },
]);
assert.equal(fixture.new_archer.skirmish, true);
assert.equal(fixture.new_elephant.splash, 32);
assert.deepEqual(groupCivilizations(fixture)[0].ids, ['new_archer', 'new_elephant']);
assert.equal(HISTORICAL_TYPES.ottoman_solak.role, 'archer');
assert.equal(HISTORICAL_TYPES.japan_mounted_samurai.skirmish, true);
assert.equal(HISTORICAL_TYPES.macedon_hypaspists.role, 'pike');
assert.deepEqual(CIVILIZATIONS.find(group => group.name === 'Osmanlı Devleti').ids.slice().sort(), ['janissary', 'ottoman_akinci', 'ottoman_azap_archer', 'ottoman_deli', 'ottoman_sipah', 'ottoman_solak']);
for (const [id, role] of Object.entries({ mexica_jaguar: 'sword', carthage_sacred_band: 'pike', egypt_sherden: 'sword', gaelic_gallowglass: 'sword' })) {
  assert.equal(HISTORICAL_TYPES[id]?.role, role);
}
// Actual sprites, including creatures drawn outside historical profiles, are checked in the browser below.
for (const id of RETIRED_HISTORICAL_IDS) {
  assert.ok(!HISTORICAL_TYPES[id]);
  assert.ok(!units.some(unit => unit.id === id));
}
assert.ok(!HISTORICAL_TYPES.byzantine_varangian && !HISTORICAL_TYPES.achaemenid_immortals);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.routeWebSocket('**/*', socket => socket.close());
  const choose = async (id, culture, country) => {
    const picker = page.locator(`#${id}`).locator('..');
    await picker.locator(`[data-culture="culture:${culture}"]`).click();
    // Recruitment places country tabs in the toolbar, outside the culture picker.
    await page.locator(`[data-country="${country}"]`).click();
  };
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const bad = []; page.on('response', response => { if (response.status() >= 400) bad.push(response.url()); });
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  assert.equal(await page.locator('.civilization-group').count(), CIVILIZATIONS.length);
  await choose('civilization', 'turkic', 'Osmanlı Devleti');
  assert.equal(await page.locator('.civilization-group:visible').count(), 1);
  await page.locator('input[data-id="ottoman_sipah"][data-team="0"]').fill('70');
  await page.locator('input[data-id="ottoman_solak"][data-team="0"]').fill('30');
  await page.click('[data-filter="ranged"]');
  assert.equal(await page.locator('.unit-card:visible').count(), 3);
  await choose('civilization', 'italian', 'Roma İmparatorluğu');
  assert.equal(await page.locator('.unit-card:visible').count(), 1);
  assert.ok(await page.locator('.unit-card[data-id="roman_syrian_archer"]').isVisible());
  await page.click('[data-filter="all"]');
  await page.locator('input[data-id="rome_praetorian"][data-team="1"]').fill('100');
  assert.equal(await page.locator('#total-0').textContent(), '100');
  await choose('civilization', 'turkic', 'Osmanlı Devleti');
  assert.equal(await page.locator('input[data-id="ottoman_sipah"][data-team="0"]').inputValue(), '70');
  await page.click('#launch-battle'); await page.waitForURL('**/crown-battle.html?historical=1');
  assert.equal(await page.locator('#north-count').textContent(), '100');
  assert.equal(await page.locator('.command-civilization:visible').count(), 1);
  await page.click('[data-unit="ottoman_solak"]');
  assert.match(await page.locator('#selection-note').textContent(), /30 asker/);
  await page.click('#menu-setup');
  await choose('roster-civilization', 'italian', 'Roma İmparatorluğu');
  assert.equal(await page.locator('.roster-civilization:visible').count(), 1);
  await page.locator('#red-rome_praetorian').fill('120');
  await page.click('#apply');
  assert.equal(await page.locator('#red-count').textContent(), '120');
  assert.equal(await page.locator('#north-count').textContent(), '100');
  await page.reload(); assert.equal(await page.locator('#north-ottoman_sipah').inputValue(), '70');
  // Every new type must produce a nonempty sprite, including both mounted and foot archers.
  assert.equal(await page.evaluate(async () => {
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const { HISTORICAL_TYPES } = await import('/src/historical-combat.js');
    const sprites = new SpriteLibrary();
    return Object.keys(HISTORICAL_TYPES).every(id => { const c = sprites.get(id, 0, 2, 'walk', 0); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0); });
  }), true);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  await choose('civilization', 'turkic', 'Osmanlı Devleti');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(errors, []); assert.deepEqual(bad, []);
  console.log(`PASS: ${units.length} units, ${CIVILIZATIONS.length} groups, new troops, filters preserve hidden counts, transfer, persistence, portraits and mobile.`);
} finally { await browser.close(); }
