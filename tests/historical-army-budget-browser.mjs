import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createBudgetArmy } from '../src/historical-army-budget.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';
import commanders from '../src/historical-commanders.json' with { type: 'json' };

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.routeWebSocket('**/*', socket => socket.close());
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=new');
    if (await page.locator('#recruitment').evaluate(el => el.open)) await page.locator('.recruit-close').click();
    await page.locator('#menu-command').click();
    await page.locator('.alliance-live .alliance-open').click();
    const planner = page.locator('#alliance-planner');
    const card = team => planner.locator(`[data-army-id="army-${team}"]`);
    const choose = async (team, id) => {
      await card(team).locator('.alliance-choose-leader').click();
      await page.locator('.leader-picker input').fill(commanders.find(c => c.id === id).name);
      await page.locator(`.leader-picker [data-leader="${id}"]`).click();
      if (!await card(team).locator('details').evaluate(el => el.open)) await card(team).locator('details > summary').click();
    };
    const readTeam = team => page.locator(`[data-roster="${team}"]`).evaluateAll(inputs => Object.fromEntries(inputs.filter(i => Number(i.value)).map(i => [i.dataset.type, Number(i.value)])));
    await choose(0, 'mehmed_ii');
    await page.fill('#commander-army-size-army-0', '97');
    await card(0).locator('[data-army-mode="budget"]').click();
    assert.equal(await page.locator('#commander-army-size-army-0').isVisible(), false);
    for (const bad of ['', '0', '-1', '100001', '2000.5']) {
      await page.fill('#commander-army-budget-army-0', bad);
      assert.ok(await card(0).locator('.commander-auto-create').isDisabled());
    }
    await page.fill('#commander-army-budget-army-0', '2000');
    await card(0).locator('.commander-auto-create').click();
    assert.deepEqual(await readTeam(0), createBudgetArmy('mehmed_ii', 2000));
    await card(0).locator('[data-army-mode="count"]').click();
    assert.equal(await page.inputValue('#commander-army-size-army-0'), '97', 'Budget creation preserves count preference');
    await card(0).locator('.commander-auto-create').click();
    assert.deepEqual(await readTeam(0), createCommanderArmy('mehmed_ii', 97));
    await card(0).locator('[data-army-mode="budget"]').click();
    assert.equal(await page.inputValue('#commander-army-budget-army-0'), '2000');
    await card(0).locator('.commander-auto-create').click();
    await choose(1, 'timur');
    assert.equal(await card(1).locator('[data-army-mode="count"]').getAttribute('aria-pressed'), 'true', 'Each army has independent preferences');
    await page.fill('#commander-army-size-army-1', '96');
    assert.ok(await card(1).locator('.commander-capacity-help').isVisible());
    assert.match(await card(1).locator('.commander-auto-points').textContent(), /69 birlik.*96 kapasite/);
    await card(1).locator('.commander-auto-create').click();
    assert.deepEqual(await readTeam(1), createCommanderArmy('timur', 96));
    await card(1).locator('[data-army-mode="budget"]').click();
    assert.equal(await card(1).locator('.commander-capacity-help').isVisible(), false);
    await page.fill('#commander-army-budget-army-1', '2000');
    await card(1).locator('.commander-auto-create').click();
    assert.deepEqual(await readTeam(1), createBudgetArmy('timur', 2000));
    assert.deepEqual(await readTeam(0), createBudgetArmy('mehmed_ii', 2000), 'Opponent unchanged');
    await card(1).locator('.commander-budget-help button').click();
    assert.ok(await card(1).locator('.commander-budget-help p').isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await planner.locator('[data-apply]').click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('marble-historical-armies-v1')));
    assert.deepEqual(saved, [createBudgetArmy('mehmed_ii', 2000), createBudgetArmy('timur', 2000)]);
    await page.reload();
    if (await page.locator('#recruitment').evaluate(el => el.open)) await page.locator('.recruit-close').click();
    await page.locator('#menu-command').click();
    await page.locator('.alliance-live .alliance-open').click();
    await choose(0, 'alp_arslan');
    assert.equal(await card(0).locator('[data-army-mode="budget"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.inputValue('#commander-army-budget-army-0'), '2000', 'Budget persists across commander change and reload');
    await card(0).locator('.commander-auto-create').click();
    assert.deepEqual(await readTeam(0), createBudgetArmy('alp_arslan', 2000));
    assert.deepEqual(await readTeam(1), createBudgetArmy('timur', 2000));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${width}px budget mode: validation, count preferences, team isolation, create/apply/save/reload, commander change`);
  }
} finally { await browser.close(); }
