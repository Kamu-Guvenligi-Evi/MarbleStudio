import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 860, height: 580 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/__impact-test', route => route.fulfill({ contentType: 'text/html', body: '<canvas></canvas>' }));
  await page.goto('http://127.0.0.1:5173/__impact-test');
  const result = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const checks = [], canvas = document.querySelector('canvas');
    for (const desktop of [false, true]) for (const type of ['samurai', 'janissary', 'timur', 'hussar', 'mongol']) {
      const b = new Battle({ historicalArmies: [{ [type]: 1 }, { roman: 1 }] });
      const [a, z] = b.units, ranged = ['janissary', 'mongol'].includes(type);
      Object.assign(a, { x: 250, y: 400, cooldown: 0, chargeCooldown: 100, order: { kind: 'hold' } });
      Object.assign(z, { x: ranged ? 350 : 262, y: 400, cooldown: 100, order: { kind: 'hold' } });
      const r = new BattleRenderer(canvas, b); r.resize(800, 500, desktop, 1);
      const frames = [], get = r.sprites.get.bind(r.sprites);
      r.sprites.get = (type, team, frame, action, variant) => {
        if (team === 0 && action === 'attack') frames.push(frame);
        return get(type, team, frame, action, variant);
      };
      b.step(1 / 60); r.render();
      checks.push({ type, desktop, condition: 'windup', pass: frames.includes(0) && z.hp === z.maxHp && b.projectiles.length === 0 });
      for (let i = 0; i < 15; i++) {
        const before = ranged ? b.stats.shots + b.stats.arrows : z.maxHp - z.hp;
        b.step(1 / 60); frames.length = 0; r.render();
        const after = ranged ? b.stats.shots + b.stats.arrows : z.maxHp - z.hp;
        if (after > before) checks.push({ type, desktop, condition: 'contact', pass: frames.includes(4) });
      }
      checks.push({ type, desktop, condition: 'resolved', pass: ranged ? b.stats.shots + b.stats.arrows === 1 : z.hp < z.maxHp });
    }
    for (const desktop of [false, true]) {
      const b = new Battle(), r = new BattleRenderer(canvas, b);
      r.resize(800, 500, desktop, 1);
      const u = b.units[0]; b.hit(u, 10000);
      const rotations = [], rotate = r.ctx.rotate.bind(r.ctx);
      r.ctx.rotate = angle => { rotations.push(angle); rotate(angle); };
      for (const time of [0, .15, .3, .3]) { b.time = time; r.soldier(u); }
      checks.push({ desktop, condition: 'fall-and-pause', pass: rotations[0] === 0 && rotations[1] < 0 && rotations[1] > rotations[2] && rotations[2] === rotations[3] });
      b.time = 0; b.winner = 1; r.soldier(u);
      checks.push({ desktop, condition: 'final-fall', pass: rotations.at(-1) === rotations[2] });
    }
    // A compact local contact sheet, using the production sprite library.
    const b = new Battle(), r = new BattleRenderer(canvas, b);
    canvas.width = 820; canvas.height = 535;
    const g = canvas.getContext('2d'); g.fillStyle = '#1b2426'; g.fillRect(0, 0, 820, 535);
    g.font = '16px sans-serif'; g.fillStyle = '#e8dec4';
    g.fillText('Saldırı kareleri: hazırlık → temas → toparlanma', 20, 25);
    const types = ['samurai', 'janissary', 'timur', 'hussar'];
    for (let row = 0; row < types.length; row++) {
      g.fillStyle = '#e8dec4'; g.fillText(types[row], 20, 90 + row * 110);
      for (const [col, frame] of [0, 3, 4, 7].entries()) {
        g.drawImage(r.sprites.get(types[row], 0, frame, 'attack', 0), 170 + col * 155, 42 + row * 110, 115, 109);
        g.fillText(String(frame), 215 + col * 155, 165 + row * 110);
      }
    }
    canvas.style.cssText = 'width:820px;height:535px';
    return checks;
  });
  assert.equal(result.length, 34);
  assert.deepEqual(result.filter(x => !x.pass), []);
  assert.deepEqual(errors, []);
  await mkdir('artifacts/crown-battle', { recursive: true });
  await page.locator('canvas').screenshot({ path: 'artifacts/crown-battle/attack-contact-sheet.png' });
  console.log('PASS: 34 production-renderer checks, 5 unit classes, PC/portrait contact frames, gradual death, paused death and final battle pose');
} finally { await browser.close(); }
