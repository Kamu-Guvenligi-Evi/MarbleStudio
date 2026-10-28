import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1366, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: width < 900, hasTouch: width < 900 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/crown-battle.html?mode=classic');
    await page.locator('#menu-setup').click();
    for (const [id, count] of Object.entries({ 'north-sword': 10, 'north-archer': 3, 'red-sword': 7, 'red-pike': 5 })) await page.locator(`#${id}`).fill(String(count));
    await page.locator('#apply').click();
    await page.evaluate(async () => {
      const source = await (await fetch('/src/crown-battle-app.js')).text();
      const { Battle } = await import(source.match(/from ['"]([^'"]*crown-battle\.js[^'"]*)['"]/)[1]);
      const select = Battle.prototype.select;
      Battle.prototype.select = function(...args) { window.teamTestBattle = this; return select.apply(this, args); };
    });
    await page.locator('#menu-command').click();
    await page.locator('[data-unit=sword]').click();
    assert.match(await page.locator('#selection-note').textContent(), /10 asker seçili/);
    await page.locator('#command-team').selectOption('1');
    assert.ok(await page.locator('#remove-selected').isDisabled(), 'Changing team clears selection');
    await page.locator('[data-unit=sword]').click();
    assert.match(await page.locator('#selection-note').textContent(), /7 asker seçili/);
    assert.deepEqual(await page.evaluate(() => [...window.teamTestBattle.selected].map(id => window.teamTestBattle.units[id].team)), Array(7).fill(1));

    await page.locator('#clear-selection').click();
    await page.locator('#select-blue-army').click();
    assert.match(await page.locator('#selection-note').textContent(), /13 asker seçili/);
    if (width < 900) await page.locator('#return-to-field').click();
    await page.locator('#battle').scrollIntoViewIfNeeded();
    let box = await page.locator('#battle').boundingBox();
    const red = await page.evaluate(() => { const u = window.teamTestBattle.units.find(u => u.team === 1 && u.type === 'sword'); return { x: u.x, y: u.y }; });
    const redX = box.x + box.width * red.x / 600, redY = box.y + box.height * red.y / 960;
    if (width < 900) await page.touchscreen.tap(redX, redY); else await page.mouse.click(redX, redY);
    assert.match(await page.locator('#selection-note').textContent(), /7 asker seçili/, 'Red soldiers can also be selected on the field');
    assert.equal(await page.locator('#command-team').inputValue(), '1', 'Clicking red switches from the selected blue army');
    assert.equal(await page.evaluate(()=>window.teamTestBattle.units.some(u=>u.order)), false, 'Selecting the other army never issues an attack');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
    assert.equal(await page.evaluate(() => window.teamTestBattle.units.filter(u => u.team === 1 && u.order?.kind === 'move').length), 7);
    await page.locator('#stop').click();
    assert.equal(await page.evaluate(() => window.teamTestBattle.units.filter(u => u.team === 1 && u.order?.kind === 'hold').length), 7);
    await page.locator('#target-attack').click();
    await page.locator('#battle').scrollIntoViewIfNeeded();
    box = await page.locator('#battle').boundingBox();
    const target = await page.evaluate(() => { const u = window.teamTestBattle.units.find(u => u.team === 0 && u.hp > 0); return { x: u.x, y: u.y }; });
    const x = box.x + box.width * target.x / 600, y = box.y + box.height * target.y / 960;
    if (width < 900) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
    assert.equal(await page.evaluate(() => window.teamTestBattle.units.filter(u => u.team === 1 && u.order?.kind === 'attack' && window.teamTestBattle.units[u.order.targetId].team === 0).length), 7);
    assert.equal(await page.evaluate(() => window.teamTestBattle.units.filter(u => u.team === 0 && u.order).length), 0, 'Red commands leave blue orders untouched');

    await page.locator('#remove-selected').click();
    assert.equal(await page.locator('#red-count').textContent(), '5');
    assert.equal(await page.locator('#north-count').textContent(), '13');
    assert.equal(await page.locator('#red-sword').inputValue(), '0');
    await page.locator('#select-blue-army').click();
    await page.locator('#select-red-army').click();
    assert.match(await page.locator('#selection-note').textContent(), /5 asker seçili/);
    await page.locator('#remove-selected').click();
    assert.equal(await page.locator('#red-count').textContent(), '0');
    assert.equal(await page.locator('#north-count').textContent(), '13');
    await page.locator('#restart').click();
    assert.equal(await page.locator('#red-count').textContent(), '0', 'Removed red army stays removed on rebuild');
    await page.locator('#menu-command').click(); await page.locator('#command-team').selectOption('0');
    await page.locator('[data-unit=archer]').click(); await page.locator('#remove-selected').click();
    assert.equal(await page.locator('#north-count').textContent(), '10');

    // Removing one army after the battle starts must not lock removal of the survivor.
    await page.locator('#menu-setup').click(); await page.locator('#red-sword').fill('2');
    await page.locator('#apply').click(); await page.locator('#play').click();
    await page.waitForTimeout(120); await page.locator('#play').click();
    await page.locator('#select-blue-army').click(); await page.locator('#remove-selected').click();
    assert.equal(await page.locator('#stage-state').textContent(), 'MUHAREBE TAMAMLANDI');
    await page.locator('#select-red-army').click();
    assert.ok(await page.locator('#target-attack').isDisabled(), 'Combat commands remain disabled after the result');
    await page.locator('#remove-selected').click();
    assert.equal(await page.locator('#red-count').textContent(), '0', 'Remaining red army can be removed after blue removal ends the battle');
    await page.locator('#restart').click();
    assert.equal(await page.locator('#red-count').textContent(), '0');
    assert.equal(await page.locator('#north-count').textContent(), '0');

    await page.evaluate(() => {
      localStorage.setItem('marble-historical-armies-v1', JSON.stringify([{ samurai: 2 }, { roman: 3 }]));
      localStorage.setItem('marble-historical-commanders-v1', JSON.stringify([null, 'timur']));
    });
    await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=1');
    await page.locator('#menu-command').click();
    assert.ok(await page.locator('[data-unit=roman]').isHidden(), 'Red-only historical type is absent from blue list');
    await page.locator('#command-team').selectOption('1');
    assert.ok(await page.locator('[data-unit=samurai]').isHidden());
    await page.locator('[data-unit=roman]').click();
    assert.match(await page.locator('#selection-note').textContent(), /3 asker seçili/);
    await page.locator('#remove-selected').click();
    assert.equal(await page.locator('#red-count').textContent(), '1');
    assert.equal(await page.locator('#north-count').textContent(), '2');
    await page.locator('#command-team').selectOption('0');
    await page.locator('#commander-details > summary').click();
    await page.locator('[data-commander-team="1"] .commander-select-unit').click();
    assert.equal(await page.locator('#command-team').inputValue(), '1', 'Red commander card switches the active team');
    assert.match(await page.locator('#selection-note').textContent(), /1 asker seçili/);
    await page.locator('#remove-selected').click();
    assert.equal(await page.locator('#commander-1').inputValue(), '');
    await page.reload();
    assert.equal(await page.locator('#red-count').textContent(), '0');
    assert.equal(await page.locator('#north-count').textContent(), '2');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${width}px: direct opposite-team selection, army buttons, red orders/removal, removal after victory, historical type/commander and saved removal`);
  }
} finally { await browser.close(); }
