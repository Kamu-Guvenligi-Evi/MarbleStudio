import { armyCapacity } from '../src/historical-army-capacity.js';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createCommanderArmy } from '../src/historical-army-presets.js';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.setDefaultTimeout(10000);
    await page.routeWebSocket('**/*', socket => socket.close());
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=new');
    if (await page.locator('#recruitment').evaluate(el => el.open)) await page.locator('.recruit-close').click();
    await page.locator('#menu-command').click();
    await page.locator('.alliance-live .alliance-open').click();
    const planner = page.locator('#alliance-planner');
    const readTeam = team => page.locator(`[data-roster="${team}"]`).evaluateAll(inputs => Object.fromEntries(inputs.filter(i => Number(i.value)).map(i => [i.dataset.type, Number(i.value)])));
    const sizes = [200, 97];
    for (const team of [0, 1]) {
      const card = planner.locator(`[data-army-id="army-${team}"]`);
      const otherBefore = await readTeam(1 - team);
      await card.locator('.alliance-choose-leader').click();
      await page.locator('.leader-picker input').fill('Timur');
      await page.locator('.leader-picker [data-leader="timur"]').click();
      await card.locator('details > summary').click();
      assert.match(await card.locator('.commander-auto-name').textContent(), /Timur/);
      await card.locator('input[id^=commander-army-size-]').fill(String(sizes[team]));
      assert.match(await card.locator('.commander-auto-points').textContent(), new RegExp(`${sizes[team]} kapasite`));
      assert.match(await card.locator('.commander-capacity-help').textContent(), /1 fil = 5 kapasite/);
      await card.locator('.commander-auto-create').click();
      assert.deepEqual(await readTeam(team), createCommanderArmy('timur', sizes[team]));
      assert.deepEqual(await readTeam(1 - team), otherBefore, 'Other army remains intact');
    }
    await planner.locator('[data-apply]').click();
    const expected = sizes.map(size => createCommanderArmy('timur', size));
    for (const team of [0, 1]) {
      const models = Object.values(expected[team]).reduce((sum, n) => sum + n, 0);
      assert.equal(armyCapacity(expected[team]), sizes[team]);
      assert.ok(models < sizes[team]);
      assert.equal(await page.locator(team ? '#red-count' : '#north-count').textContent(), String(models + 1));
    }
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('marble-historical-armies-v1'))), expected);
    await page.reload();
    assert.deepEqual(await readTeam(0), expected[0]);
    assert.deepEqual(await readTeam(1), expected[1]);
    if (!await page.locator('#recruitment').evaluate(el => el.open)) await page.locator('#menu-setup').click();
    if (width < 700) await page.locator('[data-recruit-view="armies"]').click();
    for (const team of [0, 1]) {
      const summary = page.locator(`.recruit-army[data-team="${team}"]`);
      assert.equal(await summary.locator('strong').textContent(), String(Object.values(expected[team]).reduce((s, n) => s + n, 0)));
      assert.equal(await summary.locator('.recruit-capacity').isVisible(), true);
      assert.match(await summary.locator('.recruit-capacity').textContent(), new RegExp(`^${sizes[team]} kapasite`));
    }
    const redSummary = page.locator('.recruit-army[data-team="1"]');
    await redSummary.locator('li[data-type="timur"] .recruit-remove-unit').click();
    assert.equal(await page.locator('#red-timur').inputValue(), '0');
    assert.equal(await redSummary.locator('.recruit-capacity').isVisible(), false);
    assert.deepEqual(await readTeam(0), expected[0], 'Removing red elephants leaves blue army intact');
    await page.locator('#recruit-undo').click();
    assert.deepEqual(await readTeam(1), expected[1]);
    assert.match(await redSummary.locator('.recruit-capacity').textContent(), /^97 kapasite/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS Timur ${width}px: both teams, weighted capacity/real counts, isolation, save/reload, manual summary, red elephant removal/undo`);
  }
} finally { await browser.close(); }
