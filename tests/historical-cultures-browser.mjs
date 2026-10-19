import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { CULTURE_GROUPS, civilizationMatches, civilizationSearchTerms } from '../src/historical-culture-groups.js';
import { CIVILIZATIONS } from '../src/historical-combat.js';

const names = CULTURE_GROUPS.flatMap(group => group.countries.map(country => country.name));
assert.equal(new Set(names).size, names.length, 'every country belongs to one navigation group');
assert.deepEqual(names.slice().sort(), CIVILIZATIONS.map(country => country.name).sort());
assert.ok(civilizationMatches('culture:turkic', 'Osmanlı Devleti'));
assert.ok(!civilizationMatches('culture:ancient', 'Osmanlı Devleti'));
for (const name of ['Roma Cumhuriyeti', 'Atina', 'Yeni Krallık Mısır', 'Kartaca', 'Ahameniş İmparatorluğu', 'Qin Hanedanı']) {
  assert.ok(civilizationMatches('culture:ancient', name), name);
}
for (const name of ['Moche', 'Mixtec şehir devletleri', 'Meksika / Mexica (Aztek)', 'Maya şehir devletleri', 'İnka İmparatorluğu']) {
  assert.ok(civilizationMatches('culture:americas', name), name);
}
assert.ok(!civilizationMatches('culture:ancient', 'Bizans İmparatorluğu'));
assert.ok(!civilizationMatches('culture:ancient', 'Eyyûbîler'));
assert.ok(!civilizationMatches('culture:ancient', 'Milano Dükalığı'));
assert.ok(civilizationSearchTerms('Ahameniş İmparatorluğu').includes('Farslar'));
for (const name of ['Nubya', 'Benin Krallığı', 'Eyyûbîler', 'Memlük Sultanlığı', 'Eyyûbîler / Memlük Sultanlığı']) {
  assert.ok(civilizationMatches('culture:africa', name), name);
}
for (const name of ['Aotearoa / Māori toplulukları', 'Hawaiʻi şeflikleri']) {
  assert.ok(civilizationMatches('culture:oceania', name), name);
}
assert.ok(civilizationSearchTerms('Aotearoa / Māori toplulukları').includes('Māoriler'));
assert.ok(civilizationSearchTerms('Hawaiʻi şeflikleri').includes('Hawaiililer'));
for (const id of ['egyptian', 'nubian', 'benin', 'maori', 'hawaiian']) {
  assert.ok(!CULTURE_GROUPS.some(group => group.id === id), `${id} is now a subtab`);
}
for (const id of ['mexica', 'maya', 'inca', 'moche', 'mixtec', 'carthaginian', 'persian', 'assyrian']) {
  assert.ok(!CULTURE_GROUPS.some(group => group.id === id), `${id} no longer clutters the top level`);
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1366, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 600, hasTouch: width < 600 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.routeWebSocket('**/*', socket => socket.close());
    await page.goto('http://127.0.0.1:5173/historical-armies.html');
    const culture = id => page.locator(`[data-culture="${id ? `culture:${id}` : ''}"]`);
    const country = name => page.locator(`[data-country="${name}"]`);
    // Exercise the real controls; every existing country remains reachable.
    for (const group of CULTURE_GROUPS) {
      await culture(group.id).click();
      assert.equal(await page.locator('.civilization-group:visible').count(), group.countries.length);
      for (const item of group.countries) {
        await country(item.name).click();
        assert.equal(await page.locator('.unit-card:visible').count(), item.ids.length);
        assert.equal(await page.locator('.country-tabs [aria-pressed=true]').count(), 1);
      }
    }
    await culture('').click();
    await page.locator('#search').fill('Farslar');
    assert.equal(await page.locator('.civilization-group:visible').count(), 3);
    await page.locator('#search').fill('');
    await culture('turkic').click();
    await country('Osmanlı Devleti').click();
    await page.locator('input[data-id=janissary][data-team="0"]').fill('7');
    await page.locator('input[data-id=ottoman_solak][data-team="1"]').fill('9');
    await culture('americas').click();
    await culture('ancient').click();
    await page.locator('input[data-id=roman][data-team="1"]').fill('4');
    await culture('turkic').click();
    assert.equal(await page.locator('input[data-id=janissary][data-team="0"]').inputValue(), '7');
    assert.equal(await page.locator('#total-1').textContent(), '13');
    await page.locator('#search').fill('Yeniçeri');
    assert.ok(await page.locator('.unit-card:visible').count() > 0);
    assert.ok(await page.locator('input[data-id=janissary][data-team="0"]').isVisible());
    assert.equal(await page.locator('input[data-id=roman][data-team="1"]').isVisible(), false);
    await page.locator('#search').fill('');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('#launch-battle').click();
    await page.waitForURL('**/crown-battle.html?historical=1');
    await page.locator('#menu-setup').click();
    // The battle roster must expose the same countries and units as the catalogue.
    for (const group of CULTURE_GROUPS) {
      await culture(group.id).click();
      assert.equal(await page.locator('.roster-civilization:not([hidden])').count(), group.countries.length);
      for (const item of group.countries) {
        await country(item.name).click();
        assert.equal(await page.locator('.roster-row:visible').count(), item.ids.length);
      }
    }
    await culture('turkic').click();
    assert.equal(await page.locator('.roster-civilization:not([hidden])').count(), CULTURE_GROUPS.find(group => group.id === 'turkic').countries.length);
    await country('Osmanlı Devleti').click();
    assert.equal(await page.locator('.roster-row:visible').count(), CIVILIZATIONS.find(country => country.name === 'Osmanlı Devleti').ids.length);
    await page.locator('#red-ottoman_solak').fill('11');
    await culture('eastern-europe').click();
    assert.equal(await page.locator('.roster-civilization:not([hidden])').count(), CULTURE_GROUPS.find(group => group.id === 'eastern-europe').countries.length);
    await culture('turkic').click();
    await page.locator('#roster-search').fill('tufek');
    assert.ok(await page.locator('.roster-row:visible').count() > 0);
    assert.equal(await page.locator('#roster-civilization').inputValue(), '', 'search spans all countries');
    await page.locator('#roster-search').fill('');
    assert.equal(await page.locator('#red-ottoman_solak').inputValue(), '11');
    await culture('').click();
    assert.equal(await page.locator('.roster-civilization:not([hidden])').count(), CIVILIZATIONS.length);
    await page.locator('#roster-search').fill('fars');
    assert.equal(await page.locator('.roster-civilization:not([hidden])').count(), 3);
    await page.locator('#roster-search').fill('');
    // Enter activates country buttons as well as pointer/touch input.
    await culture('turkic').focus(); await page.keyboard.press('Enter');
    await country('Osmanlı Devleti').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('.roster-row:visible').count(), CIVILIZATIONS.find(country => country.name === 'Osmanlı Devleti').ids.length);
    await page.locator('#apply').click();
    assert.equal(await page.locator('#red-count').textContent(), '15');
    assert.equal(await page.locator('#north-count').textContent(), '7');
    await page.reload();
    assert.equal(await page.locator('#red-ottoman_solak').inputValue(), '11');
    assert.equal(await page.locator('#north-janissary').inputValue(), '7');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: ${CULTURE_GROUPS.length} cultures / ${names.length} countries, real subtab clicks, search, keyboard, both armies, transfer, save/reload, no overflow/errors`);
    await page.close();
  }
} finally { await browser.close(); }
