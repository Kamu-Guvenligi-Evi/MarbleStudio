import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=demo');
  const results = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const battle = new Battle({ seed: 1066 });
    const canvas = document.createElement('canvas');
    const renderer = new BattleRenderer(canvas, battle);
    const hash = target => {
      const pixels = target.getContext('2d').getImageData(0, 0, target.width, target.height).data;
      let value = 2166136261;
      for (let i = 0; i < pixels.length; i++) value = Math.imul(value ^ pixels[i], 16777619);
      return value >>> 0;
    };
    renderer.resize(390, 600, false); renderer.render(); const portraitBefore = hash(canvas);
    renderer.resize(1536, 800, true, 2); renderer.render();
    const desktop = { width: canvas.width, height: canvas.height, sceneWidth: renderer.pcScene.width, sceneHeight: renderer.pcScene.height };
    const scene = renderer.pcScene, firstGround = hash(scene);
    renderer.zoomAt(2); renderer.render(); const reusedOnZoom = renderer.pcScene === scene;
    renderer.pan(.1, 0); renderer.render(); const reusedOnPan = renderer.pcScene === scene;
    renderer.resetView(); renderer.resize(1536, 800, true, 2); renderer.render();
    const deterministic = hash(renderer.pcScene) === firstGround;
    renderer.reset(new Battle({ seed: 2000, preset: 'flank' })); renderer.render();
    const newField = hash(renderer.pcScene) !== firstGround;
    renderer.reset(battle); renderer.resize(390, 600, false); renderer.render();
    const portraitAfter = hash(canvas);
    const army = { sword: 500, pike: 500, archer: 500, cavalry: 500 };
    renderer.reset(new Battle({ armies: [army, army] })); renderer.resize(1280, 720, true);
    renderer.render(); // Warm sprites and the static field before measuring rendering alone.
    const samples = [];
    for (let i = 0; i < 16; i++) { const start = performance.now(); renderer.render(); samples.push(performance.now() - start); }
    samples.sort((a, b) => a - b);
    const crowded = { units: renderer.battle.units.length, medianMs: +samples[8].toFixed(1), maxMs: +samples[15].toFixed(1) };
    return { desktop, reusedOnZoom, reusedOnPan, deterministic, newField, portraitBefore, portraitAfter, crowded };
  });
  assert.deepEqual(results.desktop, { width: 3072, height: 1600, sceneWidth: 2560, sceneHeight: 1600 });
  assert.ok(results.reusedOnZoom && results.reusedOnPan, 'Camera changes must reuse baked scenery');
  assert.ok(results.deterministic, 'Same seed and dimensions must reproduce scenery');
  assert.ok(results.newField, 'Army/field reset must invalidate old scenery');
  assert.equal(results.portraitBefore, results.portraitAfter, 'PC rendering must not leak into phone/export rendering');
  assert.equal(results.crowded.units, 4000);
  await page.screenshot({ path: 'artifacts/crown-battle/pc-visuals-1920.jpg', type: 'jpeg', quality: 65, scale: 'css' });
  assert.deepEqual(errors, []);
  console.log('PASS PC DPR2: native resolution, bounded scene memory, cache reuse, deterministic scenery, preset reset, identical portrait before/after, no browser errors');
  console.log('4000 soldiers, warmed render CPU only (not FPS):', JSON.stringify(results.crowded));
} finally { await browser.close(); }
