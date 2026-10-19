import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { ARMY_PRESETS, createCommanderArmy, presetMinimum } from '../src/historical-army-presets.js';
import commanders from '../src/historical-commanders.json' with { type: 'json' };

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.setDefaultTimeout(10000);
    await page.routeWebSocket('**/*', socket => socket.close());
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=new');
    if (await page.locator('#recruitment').evaluate(el => el.open)) await page.locator('.recruit-close').click();
    await page.locator('#menu-command').click();
    await page.locator('.alliance-live .alliance-open').click();
    const planner = page.locator('#alliance-planner');
    const choose = async (team, id) => {
      await planner.locator(`[data-army-id="army-${team}"] .alliance-choose-leader`).click();
      if (id) await page.locator('.leader-picker input').fill(commanders.find(c => c.id === id).name);
      await page.locator(`.leader-picker [data-leader="${id}"]`).click();
      const details = planner.locator(`[data-army-id="army-${team}"] details`);
      if (!await details.evaluate(el => el.open)) await details.locator('summary').click();
    };
    assert.equal(await page.locator('.commander-auto-create:visible').count(), 0);
    const card = planner.locator('[data-army-id="army-0"]');
    const readTeam = team => page.locator(`[data-roster="${team}"]`).evaluateAll(inputs => Object.fromEntries(inputs.filter(i => Number(i.value)).map(i => [i.dataset.type, Number(i.value)])));
    let preferredSize = 0;
    for (const [id, preset] of Object.entries(ARMY_PRESETS)) {
      await choose(0, id);
      const minimum = presetMinimum(preset);
      assert.equal(await page.inputValue('#commander-army-size-army-0'), String(Math.max(minimum, preferredSize)), `${id}: chosen army size is retained`);
      await page.fill('#commander-army-size-army-0', String(minimum));
      const enemyBefore = await readTeam(1);
      await card.locator('[data-army-size="plus"]').click();
      assert.equal(await page.inputValue('#commander-army-size-army-0'), String(minimum * 2));
      await card.locator('.commander-auto-create').click();
      assert.deepEqual(await readTeam(0), createCommanderArmy(id, minimum * 2));
      assert.deepEqual(await readTeam(1), enemyBefore);
      preferredSize = minimum * 2;
    }
    await choose(0, 'alp_arslan');
    await page.fill('#commander-army-size-army-0', '97');
    await card.locator('.commander-auto-create').click();
    assert.deepEqual(await readTeam(0), createCommanderArmy('alp_arslan', 97));
    if (!await card.locator('details').evaluate(el => el.open)) await card.locator('details > summary').click();
    for (const invalid of ['', '0', '-1', '25.5']) {
      await page.fill('#commander-army-size-army-0', invalid);
      assert.equal(await card.locator('.commander-auto-create').isDisabled(), true);
    }
    await choose(1, 'mehmed_ii');
    await planner.locator('[data-army-id="army-1"] .commander-auto-create').click();
    assert.deepEqual(await readTeam(1), createCommanderArmy('mehmed_ii', 24));
    assert.deepEqual(await readTeam(0), createCommanderArmy('alp_arslan', 97));
    await planner.locator('[data-apply]').click();
    assert.equal(await page.locator('#north-count').textContent(), '98');
    assert.equal(await page.locator('#red-count').textContent(), '25');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('marble-historical-armies-v1')));
    assert.deepEqual(saved[0], createCommanderArmy('alp_arslan', 97));
    await page.locator('.alliance-live .alliance-open').click();
    await choose(0, 'attila');
    assert.equal(await card.locator('.commander-auto-create').isVisible(), true);
    await choose(0, '');
    assert.equal(await card.locator('.commander-auto-army').isVisible(), false);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px page fits`);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${width}px: commander selection, all presets, scaling, validation, team isolation, apply and save`);
  }
  const page = await browser.newPage();
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  await page.selectOption('#commander-0', 'qi_jiguang');
  await page.fill('#commander-army-size-0', '80');
  await page.locator('[data-commander-team="0"] .commander-auto-create').click();
  assert.equal(await page.locator('#total-0').textContent(), '80');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('marble-historical-armies-v1'))[0]), createCommanderArmy('qi_jiguang', 80));
  await page.close();
  console.log('PASS historical army workshop: creation, totals and persistence');
} finally { await browser.close(); }
