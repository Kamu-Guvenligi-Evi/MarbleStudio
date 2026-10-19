import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=new', { waitUntil: 'networkidle' });
    assert.ok(await page.locator('canvas').count());
    await page.route('**/mounted-empty', route => route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
    await page.goto('http://127.0.0.1:5173/mounted-empty');
    const result = await page.evaluate(async ({ width, height }) => {
      const { Battle } = await import('/src/crown-battle.js');
      const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
      const b = new Battle({ seed: 1427, historicalArmies: [{ mongol: 4 }, { roman: 4 }] });
      b.units.forEach((u, i) => Object.assign(u, { x: u.team ? 350 : 300, y: 400 + (i % 4) * 30, hp: 10000, cooldown: u.team ? 1000 : 0 }));
      const canvas = document.createElement('canvas'); document.body.replaceChildren(canvas);
      const renderer = new BattleRenderer(canvas, b); renderer.resize(width, height, true, 1);
      let movingShots = 0;
      const resolve = b.resolveAttack.bind(b);
      b.resolveAttack = (u, target, projectile) => {
        const arrows = b.stats.arrows; resolve(u, target, projectile);
        if (u.team === 0 && u.moving && b.stats.arrows > arrows) movingShots++;
      };
      for (let i = 0; i < 600; i++) { b.step(1 / 30); renderer.render({ running: true }); }
      return { movingShots, finite: b.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y)),
        mobileRiders: b.units.filter(u => u.team === 0 && u.evadeSpent > 300).length };
    }, viewport);
    assert.ok(result.movingShots > 10, JSON.stringify(result));
    assert.equal(result.mobileRiders, 4); assert.equal(result.finite, true);
    assert.deepEqual(errors, []);
    console.log('PASS mounted browser', JSON.stringify({ viewport, ...result }));
    await page.close();
  }
} finally { await browser.close(); }
