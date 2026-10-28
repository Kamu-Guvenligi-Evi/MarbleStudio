import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { stat } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 420 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/ground-effects-check', route => route.fulfill({ contentType: 'text/html', body: '<body style="margin:0"><canvas></canvas></body>' }));
  await page.goto('http://127.0.0.1:5173/ground-effects-check');
  const result = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const { drawCombatEffect } = await import('/src/crown-battle-feedback.js');
    const canvas = document.querySelector('canvas');
    const battle = new Battle({ historicalArmies: [{ roman: 1 }, { hussar: 1 }] });
    battle.time = .15;
    battle.effects.push(...['charge-impact', 'impact'].map(kind => ({ kind, x: 300, y: 480, life: .5, ttl: .35, angle: 0 })));
    const renderer = new BattleRenderer(canvas, battle);
    renderer.enableLayers(); renderer.resize(800, 420, true, 1); renderer.render();
    const counts = { ground: 0, overlay: 0 };
    for (const [key, ctx] of [['ground', renderer.underCanvas.getContext('2d')], ['overlay', renderer.ctx]]) {
      const original = ctx.fillRect.bind(ctx);
      ctx.fillRect = (...args) => {
        if (ctx.fillStyle === '#7b694c' || ctx.fillStyle === '#d4c29c') counts[key]++;
        original(...args);
      };
    }
    renderer.render();
    const layerCounts = { ...counts };
    const probe = document.createElement('canvas'); probe.width = probe.height = 120;
    const c = probe.getContext('2d', { willReadFrequently: true });
    const pixels = (angle, time, hoof = false) => {
      c.clearRect(0, 0, 120, 120); c.save(); c.translate(60, 60);
      drawCombatEffect(c, { kind: hoof ? 'step-dust' : 'charge-impact', hoof, face: angle ? -1 : 1, angle, born: 0, life: 1, variant: 2, step: 1 }, time); c.restore();
      return Array.from(c.getImageData(0, 0, 120, 120).data);
    };
    const center = data => {
      let weight = 0, x = 0;
      for (let i = 3; i < data.length; i += 4) { weight += data[i]; x += ((i - 3) / 4 % 120 - 60) * data[i]; }
      return x / weight;
    };
    const right = pixels(0, .35), left = pixels(Math.PI, .35);
    const deterministic = JSON.stringify(right) === JSON.stringify(pixels(0, .35));
    const expired = pixels(0, 1).every(v => v === 0);
    const hoofRight = pixels(0, .3, true), hoofLeft = pixels(Math.PI, .3, true);
    const hoof = { right: center(hoofRight), left: center(hoofLeft),
      paused: JSON.stringify(hoofRight) === JSON.stringify(pixels(0, .3, true)),
      expired: pixels(0, 1, true).every(v => v === 0),
      maxAlpha: Math.max(...hoofRight.filter((_, i) => i % 4 === 3)) };
    // Compact local review sheet: three stages, with direction comparisons.
    for (const element of [...document.querySelectorAll('canvas')]) if (element !== canvas) element.remove();
    canvas.width = 800; canvas.height = 420;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#414b38'; ctx.fillRect(0, 0, 800, 420);
    const kinds = ['charge-impact', 'charge-impact', 'impact', 'step-dust'];
    const labels = ['Hücum →', '← Hücum', 'Ağır darbe', 'Nal tozu'];
    for (let col = 0; col < 4; col++) {
      ctx.fillStyle = '#e6dfcb'; ctx.font = '15px sans-serif'; ctx.fillText(labels[col], col * 200 + 35, 28);
      for (let row = 0; row < 3; row++) {
        ctx.save(); ctx.translate(col * 200 + 100, 95 + row * 130); ctx.scale(2.4, 2.4);
        drawCombatEffect(ctx, { kind: kinds[col], angle: col === 1 ? Math.PI : 0, born: 0, life: 1, mounted: true, hoof: col === 3, face: 1, variant: 2, step: row }, .12 + row * .28); ctx.restore();
      }
    }
    return { counts: layerCounts, right: center(right), left: center(left), deterministic, expired, hoof };
  });
  assert.equal(result.counts.ground, 10, 'All dirt flecks are below the soldier layer');
  assert.equal(result.counts.overlay, 0, 'No duplicate impact above soldiers');
  assert(result.right > 5 && result.left < -5, 'Dust follows both charge directions');
  assert(result.deterministic && result.expired, 'Pause is stable and effects disappear');
  assert(result.hoof.right < -8 && result.hoof.left > 8, 'Hoof dust trails both facing directions');
  assert(result.hoof.maxAlpha > 0 && result.hoof.maxAlpha < 150, 'Dust remains translucent');
  assert(result.hoof.paused && result.hoof.expired, 'Hoof dust freezes and expires');
  assert.deepEqual(errors, []);
  const path = 'artifacts/ground-effects-preview.jpg';
  await page.locator('canvas').screenshot({ path, type: 'jpeg', quality: 82 });
  console.log('PASS ground layers, direction, pause and expiry:', JSON.stringify(result), 'preview bytes:', (await stat(path)).size);
} finally { await browser.close(); }
