import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const dir = 'artifacts/battle-feedback'; mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.routeWebSocket('**/*', s => s.close());
  await page.route('**/__combat-feedback', r => r.fulfill({ contentType: 'text/html', body: '<body style="margin:0"><canvas></canvas></body>' }));
  await page.goto('http://127.0.0.1:5173/__combat-feedback');
  const result = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const { BattleFeedback } = await import('/src/crown-battle-feedback.js');
    const { BattleAudio } = await import('/src/crown-battle-audio.js');
    const { MIDDLE_EARTH_UNITS } = await import('/src/middle-earth-units.js');
    const army = { samurai: 80, roman: 80, janissary: 50, mongol: 50, timur: 8,
      ...Object.fromEntries(MIDDLE_EARTH_UNITS.map(u => [u.id, 3])) };
    const b = new Battle({ seed: 1066, historicalArmies: [army, army] });
    const r = new BattleRenderer(document.querySelector('canvas'), b); r.resize(960, 600, true, 1);
    const audio = new BattleAudio(); audio.configure(true, .55); const ready = await audio.unlock();
    const f = new BattleFeedback(b, audio, () => r.view);
    let events = 0, played = 0;
    const play = audio.play.bind(audio); audio.play = (...args) => { const accepted = play(...args); played += Number(accepted); return accepted; };
    b.onCombatEvent = event => { events++; f.onEvent(event); };
    for (const u of b.units) { u.x = 90 + u.id % 60 * 7; u.y = 440 + u.team * 45 + Math.floor(u.id / 60) % 8 * 3; }
    const feedbackMs = [], drawMs = []; let maxEffects = 0, maxEngineEffects = 0, maxVoices = 0;
    for (let i = 0; i < 180; i++) {
      await new Promise(requestAnimationFrame); b.step(1 / 30);
      const t = performance.now(); f.update(); const s = performance.now(); r.render({ running: true }); const end = performance.now();
      maxEffects = Math.max(maxEffects, f.effects.length); maxEngineEffects = Math.max(maxEngineEffects, b.effects.length); maxVoices = Math.max(maxVoices, audio.voices.size);
      if (i >= 30) { feedbackMs.push(s - t); drawMs.push(end - s); }
    }
    const stats = values => { values.sort((a, z) => a - z); return { median: +values[Math.floor(values.length / 2)].toFixed(3), p95: +values[Math.floor(values.length * .95)].toFixed(3) }; };
    audio.stop(); await audio.context.close();
    return { count: b.units.length, events, played, ready, maxEffects, maxEngineEffects, maxVoices, feedbackUpdateMs: stats(feedbackMs), drawMs: stats(drawMs), glError: r.spriteBatch?.gl?.getError() || 0 };
  });
  assert(result.ready && result.events > 500 && result.played > 10, JSON.stringify(result));
  assert(result.maxEffects <= 96 && result.maxEngineEffects <= 96 && result.maxVoices <= 8);
  assert.equal(result.glError, 0); assert.deepEqual(errors, []);
  writeFileSync(`${dir}/load.json`, JSON.stringify(result, null, 2));
  await page.evaluate(async () => {
    const { drawCombatEffect } = await import('/src/crown-battle-feedback.js');
    const canvas = document.querySelector('canvas'); canvas.width = 720; canvas.height = 360; canvas.style.cssText = 'width:720px;height:360px';
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#414b38'; ctx.fillRect(0, 0, 720, 360);
    const kinds = ['sparks', 'body-hit', 'armor-hit', 'slash', 'muzzle', 'smoke'];
    for (let col = 0; col < kinds.length; col++) {
      ctx.fillStyle = '#e1ddca'; ctx.font = '12px sans-serif'; ctx.fillText(kinds[col], col * 120 + 14, 24);
      for (let row = 0; row < 3; row++) {
        ctx.save(); ctx.translate(col * 120 + 46, 100 + row * 100); ctx.scale(2, 2);
        drawCombatEffect(ctx, { kind: kinds[col], born: 0, life: 1, angle: 0, variant: 2 }, .05 + row * .3); ctx.restore();
      }
    }
  });
  await page.locator('canvas').screenshot({ path: `${dir}/effects.png` });
  console.log('PASS crowded battle + effect preview:', JSON.stringify(result));
} finally { await browser.close(); }
