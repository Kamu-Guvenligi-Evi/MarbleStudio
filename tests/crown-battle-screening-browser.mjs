import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=new', { waitUntil: 'networkidle' });
  assert.ok(await page.locator('canvas').count(), 'Actual game opens with a canvas');
  await page.route('**/screening-empty', route => route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
  await page.goto('http://127.0.0.1:5173/screening-empty');
  const result = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const b = new Battle({ seed: 42, historicalArmies: [{ german_pavise_crossbowman: 6, roman: 6 }, { roman: 6 }] });
    const bows = b.units.filter(u => u.team === 0 && u.combatProfile.ranged);
    const guards = b.units.filter(u => u.team === 0 && !u.combatProfile.ranged);
    bows.forEach((u, i) => Object.assign(u, { x: 300, y: 410 + i * 15, cooldown: 1000 }));
    guards.forEach((u, i) => Object.assign(u, { x: 250, y: 410 + i * 15, cooldown: 1000 }));
    b.units.filter(u => u.team === 1).forEach((u, i) => Object.assign(u, { x: 380, y: 410 + i * 15, cooldown: 1000 }));
    const canvas = document.createElement('canvas'); document.body.replaceChildren(canvas);
    const renderer = new BattleRenderer(canvas, b); renderer.resize(1000, 700, true, 1);
    for (let i = 0; i < 180; i++) { b.step(1 / 30); renderer.render({ running: true }); }
    const mean = list => list.reduce((sum, u) => sum + u.x, 0) / list.length;
    return { rearGap: mean(guards) - mean(bows), aliveBows: bows.filter(u => u.hp > 0).length,
      finite: b.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y)) };
  });
  assert.ok(result.rearGap > 16, JSON.stringify(result));
  assert.equal(result.aliveBows, 6); assert.equal(result.finite, true);
  assert.deepEqual(errors, []);
  console.log('PASS live game loads; crossbow rank exchange renders without browser errors:', JSON.stringify(result));
} finally { await browser.close(); }
