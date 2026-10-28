import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { CIVILIZATIONS } from '../src/historical-combat.js';

await mkdir('artifacts/recruitment', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 700, hasTouch: width < 700 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=1');
    await page.locator('#menu-setup').click();
    assert.equal(await page.locator('#recruitment').evaluate(el => el.open), true);
    await page.locator('[data-culture="culture:turkic"]').click();
    await page.locator('[data-country="Osmanlı Devleti"]').click();
    assert.equal(await page.locator('.roster-row:visible').count(), CIVILIZATIONS.find(c => c.name === 'Osmanlı Devleti').ids.length);
    await page.locator('#north-janissary').fill('25');
    await page.locator('#red-janissary').fill('17');
    await page.locator('#red-ottoman_solak').fill('11');
    if (width < 700) await page.locator('[data-recruit-view="armies"]').click();
    const removeRed = page.locator('.recruit-army[data-team="1"] li[data-type="janissary"] .recruit-remove-unit');
    await removeRed.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#red-janissary').inputValue(), '0');
    assert.equal(await page.locator('#north-janissary').inputValue(), '25');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'recruit-undo', 'removed row hands keyboard focus to undo');
    await page.keyboard.press('Control+z');
    assert.equal(await page.locator('#red-janissary').inputValue(), '17');
    assert.equal(await removeRed.evaluate(el => el === document.activeElement), true, 'undo returns focus to the restored row');
    await page.locator('[data-clear-team="1"]').click();
    assert.equal(await page.locator('#red-ottoman_solak').inputValue(), '0');
    assert.equal(await page.locator('#north-janissary').inputValue(), '25');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'recruit-undo', 'disabled clear button hands focus to undo');
    await page.locator('#recruit-undo').click();
    assert.equal(await page.locator('#red-ottoman_solak').inputValue(), '11');
    assert.equal(await page.locator('[data-clear-team="1"]').evaluate(el => el === document.activeElement), true);
    if (width < 700) {
      await page.screenshot({ path: `artifacts/recruitment/armies-${width}.jpg`, type: 'jpeg', quality: 70 });
      await page.locator('[data-recruit-view="units"]').click();
    }
    await page.locator('#red-janissary').locator('..').locator('[data-roster-action="0"]').click();
    assert.equal(await page.locator('#red-janissary').inputValue(), '0');
    assert.equal(await page.locator('#recruit-undo').isVisible(), true, 'card removal can be undone without switching views');
    await page.locator('#roster-search').fill('yeniceri');
    await page.keyboard.press('Control+z');
    assert.equal(await page.locator('#red-janissary').inputValue(), '0', 'text undo does not restore removed units');
    assert.equal(await page.locator('#recruit-undo').isEnabled(), true);
    await page.locator('#roster-search').fill('');
    await page.locator('#recruit-undo').click();
    assert.equal(await page.locator('#red-janissary').inputValue(), '17');
    await page.locator('[data-culture="culture:eastern-europe"]').click();
    if (width < 700) await page.locator('[data-recruit-view="armies"]').click();
    const editRed = page.locator('.recruit-army[data-team="1"] li[data-type="janissary"] .recruit-edit-unit');
    await editRed.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#recruitment').getAttribute('data-view'), 'units');
    assert.equal(await page.locator('#red-janissary').isVisible(), true, 'summary opens a card hidden by filters');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'red-janissary', 'edit focuses the correct team');
    assert.equal(await page.locator('#red-janissary').inputValue(), '17');
    await page.locator('.recruit-reset').click();
    if (width < 700) {
      const position = await page.locator('.recruit-workspace').evaluate(el => { el.scrollTop = 650; return el.scrollTop; });
      assert.ok(position > 300);
      await page.locator('[data-recruit-view="armies"]').click();
      await page.locator('[data-recruit-view="units"]').click();
      assert.ok(Math.abs(await page.locator('.recruit-workspace').evaluate(el => el.scrollTop) - position) < 2, 'return to the previous catalogue position');
    } else {
      await page.locator('.recruit-cards').evaluate(el => { el.scrollTop = 650; });
      await page.locator('#recruit-role').selectOption('cavalry');
      assert.equal(await page.locator('.recruit-cards').evaluate(el => el.scrollTop), 0, 'new filters show their first results');
      await page.locator('.recruit-reset').click();
    }
    await page.locator('#roster-search').fill('janissary');
    await page.locator('#roster-search').fill('');
    await page.locator('#north-janissary').fill('30');
    assert.equal(await page.locator('#recruit-undo').isDisabled(), true);
    await page.locator('#roster-search').fill('legolas');
    assert.equal(await page.locator('#roster-civilization').inputValue(), '');
    assert.equal(await page.locator('.roster-row:visible').count(), 1);
    await page.locator('.recruit-reset').click();
    await page.locator('#recruit-role').selectOption('cavalry');
    const cavalryCount = await page.locator('.roster-row:visible').count();
    assert.ok(cavalryCount > 0);
    await page.locator('#roster-active-only').check();
    assert.equal(await page.locator('.roster-row:visible').count(), 0);
    await page.locator('.recruit-reset').click();
    await page.locator('#roster-active-only').check();
    assert.equal(await page.locator('.roster-row:visible').count(), 2);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#recruitment').evaluate(el => el.open), false);
    await page.locator('#menu-setup').click();
    assert.equal(await page.locator('#north-janissary').inputValue(), '30');
    await page.locator('#apply').click();
    assert.equal(await page.locator('#recruitment').evaluate(el => el.open), false);
    assert.equal(await page.locator('#north-count').textContent(), '30');
    assert.equal(await page.locator('#red-count').textContent(), '28');
    await page.reload();
    await page.locator('#menu-setup').click();
    assert.equal(await page.locator('#north-janissary').inputValue(), '30');
    assert.equal(await page.locator('#red-janissary').inputValue(), '17');
    await page.locator('[data-culture="culture:turkic"]').click();
    await page.screenshot({ path: `artifacts/recruitment/menu-${width}.jpg`, type: 'jpeg', quality: 75 });
    assert.ok(await page.evaluate(() => {
      const dialog = document.getElementById('recruitment');
      return document.documentElement.scrollWidth <= innerWidth + 1 && dialog.scrollWidth <= dialog.clientWidth + 1;
    }), 'no horizontal page/dialog overflow');
    await page.getByRole('button', { name: 'Harita ve ayarlar', exact: true }).click();
    assert.equal(await page.locator('#recruitment').evaluate(el => el.open), false);
    await page.locator('.recruit-open-button').click();
    assert.equal(await page.locator('#recruitment').evaluate(el => el.open), true);
    if (width < 700) await page.locator('[data-recruit-view="armies"]').click();
    await removeRed.click();
    await page.getByRole('button', { name: 'Harita ve ayarlar', exact: true }).click();
    await page.locator('.recruit-open-button').click();
    assert.equal(await page.locator('#recruit-undo').isEnabled(), true, 'unchanged draft keeps undo across reopening');
    await page.getByRole('button', { name: 'Harita ve ayarlar', exact: true }).click();
    // Reproduce writes by presets/battlefield tools, which do not emit input events.
    await page.locator('#north-janissary').evaluate(el => { el.value = '40'; });
    await page.locator('.recruit-open-button').click();
    assert.equal(await page.locator('#recruit-undo').isDisabled(), true, 'external draft changes invalidate removal undo');
    assert.equal(await page.locator('#north-janissary').inputValue(), '40');
    assert.equal(await page.locator('#red-janissary').inputValue(), '0');
    if (width < 700) await page.locator('[data-recruit-view="units"]').click();
    await page.locator('.recruit-reset').click();
    await page.locator('#roster-active-only').check();
    const removeSolak = page.locator('#red-ottoman_solak').locator('..').locator('[data-roster-action="0"]');
    await removeSolak.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#red-ottoman_solak').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'recruit-undo', 'last selected count hiding a card retains keyboard focus');
    await page.keyboard.press('Meta+z');
    assert.equal(await page.locator('#red-ottoman_solak').inputValue(), '11');
    assert.equal(await removeSolak.evaluate(el => el === document.activeElement), true);
    await removeSolak.click();
    await page.locator('#red-ottoman_solak').evaluate(el => { el.value = '21'; });
    await page.locator('#recruit-undo').click();
    assert.equal(await page.locator('#red-ottoman_solak').inputValue(), '21', 'undo rechecks external writes even while open');
    assert.equal(await page.locator('#recruit-undo').isDisabled(), true);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: countries, search/roles, independent removal, undo focus/shortcuts, native text undo, stale snapshot protection, hidden-card focus, scroll restoration, draft, save/reload, no errors/overflow`);
    await page.close();
  }
  for (const [width, height] of [[844, 390], [1024, 768], [390, 640]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=1');
    await page.locator('#menu-setup').click();
    await page.locator('#roster-search').fill('yeniceri');
    await page.locator('#north-janissary').fill('25');
    await page.locator('#red-janissary').fill('17');
    await page.locator('#apply').click();
    await page.locator('#menu-setup').click();
    for (const value of ['-1', '0.5', '']) {
      await page.locator('#red-janissary').fill(value);
      await page.locator('#roster-search').fill('legolas');
      if (width < 700) await page.locator('[data-recruit-view="armies"]').click();
      await page.locator('#apply').click();
      assert.equal(await page.locator('#recruitment').evaluate(el => el.open), true, 'invalid draft does not rebuild the battle');
      assert.equal(await page.locator('#red-count').textContent(), '17');
      assert.equal(await page.locator('#red-janissary').isVisible(), true, 'invalid field is revealed through filters and tabs');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'red-janissary');
      await page.locator('#red-janissary').fill('17');
    }
    if (height < 650 && width > 700) {
      await page.locator('.recruit-reset').click();
      await page.locator('.recruit-library').evaluate(el => { el.scrollTop = 700; });
      assert.ok(await page.locator('.recruit-library').evaluate(el => el.scrollTop > 300), 'short-screen library can scroll past filters');
      await page.locator('#roster-search').fill('yeniceri');
      assert.equal(await page.locator('.recruit-library').evaluate(el => el.scrollTop), 0);
      await page.locator('#red-janissary').locator('..').locator('[data-roster-action="10"]').click();
      assert.equal(await page.locator('#red-janissary').inputValue(), '27', 'short-screen card controls are reachable');
      await page.screenshot({ path: 'artifacts/recruitment/landscape-844.jpg', type: 'jpeg', quality: 65 });
    }
    assert.ok(await page.locator('#apply').evaluate(el => {
      const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight;
    }), 'apply stays inside the viewport');
    await page.locator('#apply').click();
    assert.equal(await page.locator('#recruitment').evaluate(el => el.open), false, 'corrected draft applies normally');
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}x${height}: invalid hidden drafts, unchanged battle on error, corrected apply, short-screen controls`);
    await page.close();
  }
} finally { await browser.close(); }

