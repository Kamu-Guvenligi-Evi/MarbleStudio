import assert from 'node:assert/strict';
import { mkdir, stat } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 710 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/__arrow-test', route => route.fulfill({ contentType: 'text/html', body: '<body style="margin:0;background:#263326"><canvas></canvas></body>' }));
  await page.goto('http://127.0.0.1:5173/__arrow-test');
  const result = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const { createArrow, advanceArrow, drawProjectile, projectilePose } = await import('/src/crown-battle-projectiles.js');
    const canvas = document.querySelector('canvas'), checks = [];
    for (const style of ['arrow', 'dart', 'bolt', 'sling']) for (const desktop of [false, true]) for (const zoom of [.8, 1.6]) for (const reverse of [false, true]) {
      const b = new Battle({ armies: [{ archer: 1, sword: 0, pike: 0, cavalry: 0 }, { sword: 1, archer: 0, pike: 0, cavalry: 0 }] });
      const [a, z] = b.units;
      Object.assign(a, { x: reverse ? 390 : 230, y: 450, face: reverse ? -1 : 1 });
      Object.assign(z, { x: reverse ? 230 : 390, y: 450 });
      const r = new BattleRenderer(canvas, b); r.resize(900, 500, desktop, 1);
      r.view = { x: 300, y: 450, zoom };
      r.render();
      const ctx = canvas.getContext('2d'), before = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const p = createArrow(a, z, 10, 13, 13, 8, style); advanceArrow(p, p.duration * .5);
      b.projectiles = [p]; r.render();
      const after = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let changed = 0; for (let i = 0; i < before.length; i += 4) if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) changed++;
      checks.push(changed > 5 && changed < 1500);
      const pose = projectilePose(p, r.spriteScaleX, r.spriteScaleY);
      checks.push(Math.sign(Math.cos(pose.angle)) === (reverse ? -1 : 1));
      // Rendering must not leak alpha, transform or style into later units.
      const transform = ctx.getTransform().toString(), alpha = ctx.globalAlpha;
      drawProjectile(ctx, p, r.spriteScaleX, r.spriteScaleY);
      checks.push(ctx.getTransform().toString() === transform && ctx.globalAlpha === alpha);
    }
    // Final artifact: production battlefield plus enlarged flight samples.
    const b = new Battle({ armies: [{ archer: 6, sword: 0, pike: 0, cavalry: 0 }, { sword: 6, archer: 0, pike: 0, cavalry: 0 }] });
    const archers = b.units.filter(u => !u.team), targets = b.units.filter(u => u.team);
    const r = new BattleRenderer(canvas, b); r.resize(900, 500, true, 1);
    r.view = { x: 300, y: 450, zoom: 1.6 };
    for (let i = 0; i < 6; i++) {
      const a = archers[i], z = targets[i];
      Object.assign(a, { x: 220, y: 315 + i * 55, face: 1, attack: .08 });
      Object.assign(z, { x: 380, y: 315 + i * 55, face: -1 });
      const p = createArrow(a, z, 10); advanceArrow(p, p.duration * (.1 + i * .15)); b.projectiles.push(p);
    }
    r.render();
    const sheet = document.createElement('canvas'); sheet.width = 900; sheet.height = 210;
    document.body.append(sheet); const g = sheet.getContext('2d');
    g.fillStyle = '#263326'; g.fillRect(0, 0, 900, 210);
    g.fillStyle = '#e2d9bd'; g.font = '15px sans-serif';
    g.fillText('Yakın görünüm · çıkış / yükseliş / alçalış · sağa ve sola atış', 22, 25);
    for (const [row, face] of [[0, 1], [1, -1]]) for (let col = 0; col < 5; col++) {
      const p = createArrow({ x: 0, y: 0, team: 0, face }, { x: face * 190, y: 0 }, 10);
      advanceArrow(p, p.duration * col / 4);
      const pose = projectilePose(p);
      g.save(); g.translate(100 + col * 175, 85 + row * 80); g.scale(3, 3);
      g.translate(-pose.x, -pose.y); drawProjectile(g, p); g.restore();
    }
    return { checks: checks.length, failures: checks.filter(x => !x).length };
  });
  assert.equal(result.failures, 0); assert.deepEqual(errors, []);
  await mkdir('artifacts/crown-battle', { recursive: true });
  const path = 'artifacts/crown-battle/arrows-revision.png';
  await page.screenshot({ path });
  console.log(`PASS arrows browser: ${result.checks} PC/portrait, zoom, direction, visible pixels and canvas-state checks; preview ${Math.round((await stat(path)).size / 1024)} KiB`);
} finally { await browser.close(); }
