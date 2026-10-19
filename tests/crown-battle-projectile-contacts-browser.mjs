import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { stat } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 360 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/projectile-contacts-check', route => route.fulfill({ contentType: 'text/html', body: '<body style="margin:0"><canvas></canvas></body>' }));
  await page.goto('http://127.0.0.1:5173/projectile-contacts-check');
  const result = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleFeedback, drawCombatEffect } = await import('/src/crown-battle-feedback.js');
    const battle = new Battle({ historicalArmies: [{ janissary: 1 }, { roman: 1 }] });
    const feedback = new BattleFeedback(battle), [shooter, target] = battle.units;
    Object.assign(shooter, { x: 200, y: 300 }); Object.assign(target, { x: 300, y: 300, hp: 10000 });
    const effects = [];
    for (const projectile of ['arrow', 'bullet']) for (const type of ['archer', 'roman']) {
      target.type = type; battle.time += .3;
      battle.hit(target, 1, shooter, shooter, projectile);
      effects.push({ ...feedback.effects.at(-1) });
    }
    const probe = document.createElement('canvas'); probe.width = probe.height = 100;
    const pc = probe.getContext('2d', { willReadFrequently: true });
    function pixels(effect, age) {
      pc.clearRect(0, 0, 100, 100); pc.save(); pc.translate(50, 64);
      drawCombatEffect(pc, effect, effect.born + effect.life * age); pc.restore();
      return pc.getImageData(0, 0, 100, 100).data;
    }
    const identical = (a, b) => a.every((value, i) => value === b[i]);
    const before = JSON.stringify(effects);
    const unique = effects.map(e => {
      const first = pixels(e, .3);
      return {
        visible: first.some((v, i) => i % 4 === 3 && v > 0),
        paused: identical(first, pixels(e, .3)),
        different: !identical(first, pixels({ ...e, projectileKind: null }, .3)),
        expired: pixels(e, 1.01).every(v => v === 0),
        future: pixels(e, -.1).every(v => v === 0),
      };
    });
    const bullet = effects.at(-1), left = pixels(bullet, .3), right = pixels({ ...bullet, angle: Math.PI }, .3);
    function brightCenter(data) {
      let sum = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) if (data[i] > 220 && data[i + 1] > 150 && data[i + 3] > 0) {
        sum += (i / 4) % 100 - 50; count++;
      }
      return sum / count;
    }
    const canvas = document.querySelector('canvas'); canvas.width = 800; canvas.height = 360;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#414b38'; ctx.fillRect(0, 0, 800, 360);
    const labels = ['Ok / kumaş', 'Ok / zırh', 'Mermi / kumaş', 'Mermi / zırh'];
    effects.forEach((e, col) => {
      ctx.fillStyle = '#e6dfcb'; ctx.font = '15px sans-serif'; ctx.fillText(labels[col], col * 200 + 30, 28);
      for (let row = 0; row < 3; row++) {
        ctx.save(); ctx.translate(col * 200 + 100, 110 + row * 100); ctx.scale(3, 3);
        drawCombatEffect(ctx, e, e.born + e.life * (.1 + row * .25)); ctx.restore();
      }
    });
    return { unique, unchanged: before === JSON.stringify(effects), left: brightCenter(left), right: brightCenter(right) };
  });
  assert(result.unique.every(e => Object.values(e).every(Boolean)), 'All contact variants render distinctly, freeze, and respect lifetime');
  assert(result.unchanged, 'Drawing does not mutate effects');
  assert(result.left < -1 && result.right > 1, 'Metal flecks rebound toward incoming projectile from both sides');
  assert.deepEqual(errors, []);
  const path = 'artifacts/projectile-contacts-preview.jpg';
  await page.locator('canvas').screenshot({ path, type: 'jpeg', quality: 82 });
  console.log('PASS four projectile/material contacts, direction, pause, expiry, no mutation; preview bytes:', (await stat(path)).size);
} finally { await browser.close(); }
