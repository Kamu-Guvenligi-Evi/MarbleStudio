import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/clarity-check', route => route.fulfill({
    contentType: 'text/html', body: '<body style="margin:0"><canvas></canvas></body>',
  }));
  await page.goto('http://127.0.0.1:5173/clarity-check');
  const result = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const battle = new Battle({ historicalArmies: [{ roman: 160 }, { viking: 160 }], seed: 1066 });
    const renderer = new BattleRenderer(document.querySelector('canvas'), battle);
    renderer.resize(1100, 700, true, 2);
    const retina = [renderer.canvas.width, renderer.canvas.height];
    for (let i = 0; i < 30; i++) renderer.adaptPerformance(16);
    const healthyRatio = renderer.pixelRatio;
    for (let i = 0; i < 30; i++) renderer.adaptPerformance(60);
    const slowRatio = renderer.pixelRatio;
    renderer.performanceRatio = undefined;
    renderer.resize(1100, 700, true, 1);
    // Keep a soldier visible in both views and exercise the real render queue:
    // a retained overview pose must be replaced after camera magnification.
    const unit = battle.units[0]; unit.x = 300; unit.y = 480;
    const settle = async () => {
      for (let i = 0; i < 45; i++) { renderer.render(); await new Promise(requestAnimationFrame); }
    };
    await settle();
    const overview = renderer.cachedSprite(unit);
    renderer.zoomAt(3);
    await settle();
    const closeup = renderer.cachedSprite(unit);
    const native = renderer.sprites.get(unit.type, unit.team, 0, 'idle', 0).width / 80;
    const revision = renderer.spriteCache.pageRevision;
    for (let i = 0; i < 3; i++) {
      renderer.zoomAt(1 / 3); await settle();
      renderer.zoomAt(3); await settle();
    }
    const stablePages = renderer.spriteCache.pageRevision === revision;
    const pages = renderer.spriteCache.pages.length;
    const batchFrames = renderer.spriteBatch?.frames || 0;
    const glError = renderer.spriteBatch?.gl?.getError();
    // Fixed recording dimensions remain independent of screen pixel density.
    renderer.resize(400, 700, false, 2);
    const portrait = [renderer.canvas.width, renderer.canvas.height];
    const crowded = new Battle({ historicalArmies: [{ roman: 500 }, { viking: 500 }] });
    renderer.reset(crowded); renderer.resize(1100, 700, true, 2);
    return { retina, healthyRatio, slowRatio, overview: overview.resolution,
      closeup: closeup.resolution, native, stablePages, pages, batchFrames, glError,
      portrait, crowdedRatio: renderer.pixelRatio };
  });
  assert.deepEqual(result.retina, [2200, 1400], 'Normal armies preserve HiDPI screen detail');
  assert.equal(result.healthyRatio, 2, 'Smooth rendering must retain screen resolution');
  assert.equal(result.slowRatio, 1.5, 'Slow frames still trigger the performance fallback');
  assert.ok(result.closeup > result.overview, 'Zoom must upgrade already retained blurry poses');
  assert.equal(result.closeup, result.native, 'Close-ups use all available soldier detail');
  assert.ok(result.stablePages, 'Repeated zooming must reuse the sharper cached poses');
  assert.ok(result.pages <= 16, 'Atlas memory stays bounded');
  assert.ok(result.batchFrames > 0, 'Clarity also works with GPU-batched armies');
  assert.equal(result.glError, 0);
  assert.deepEqual(result.portrait, [1080, 1920]);
  assert.equal(result.crowdedRatio, 1, 'Very large armies keep their performance safeguard');
  assert.deepEqual(errors, []);
  console.log('PASS soldier close-up clarity, HiDPI, zoom reuse, GPU rendering and performance fallback:', JSON.stringify(result));
} finally { await browser.close(); }
