import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { createCommanderArmy } from '../src/historical-army-presets.js';

const id = 'harald_hardrada';
const expected = createCommanderArmy(id, 96);
assert.deepEqual(expected, { norse_hird_swordsman: 32, norse_spearman: 32, norse_dane_axeman: 16, norse_longbowman: 16 });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.routeWebSocket('**/*', socket => socket.close());
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=new');
    if (await page.locator('#recruitment').evaluate(el => el.open)) await page.locator('.recruit-close').click();
    await page.locator('#menu-command').click();
    await page.locator('.alliance-live .alliance-open').click();
    const planner = page.locator('#alliance-planner');
    const card = planner.locator('[data-army-id="army-0"]');
    await card.locator('.alliance-choose-leader').click();
    await page.locator('.leader-picker input').fill('Viking');
    const leader = page.locator(`.leader-picker [data-leader="${id}"]`);
    assert.equal(await leader.count(), 1);
    assert.ok(await leader.locator('canvas').isVisible());
    if (width === 1440) {
      await fs.mkdir('artifacts/historical-commanders', { recursive: true });
      await leader.screenshot({ path: 'artifacts/historical-commanders/harald-picker.png' });
    }
    await leader.click();
    if (!await card.locator('details').evaluate(el => el.open)) await card.locator('details > summary').click();
    await page.fill('#commander-army-size-army-0', '96');
    await card.locator('.commander-auto-create').click();
    const readRoster = () => page.locator('[data-roster="0"]').evaluateAll(inputs => Object.fromEntries(inputs.filter(i => Number(i.value)).map(i => [i.dataset.type, Number(i.value)])));
    assert.deepEqual(await readRoster(), expected);
    await planner.locator('[data-apply]').click();
    await page.reload();
    assert.deepEqual(await readRoster(), expected);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('marble-battle-alliances-v1')));
    assert.equal(saved.find(a => a.id === 'army-0').commanderId, id);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: Harald Viking search, portrait, 96-soldier roster, applied army and commander persistence at desktop/mobile sizes.');
} finally { await browser.close(); }
