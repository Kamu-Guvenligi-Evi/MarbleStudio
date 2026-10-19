import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

// Compare renderer work independently of simulation timing, using identical
// moving/hit/fallen soldiers and the real layered desktop composition.
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const baseline of process.env.COMPARE ? [true, false] : [false]) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.routeWebSocket('**/*', socket => socket.close());
    if (baseline) await page.route('**/src/crown-battle-renderer.js*', route => route.fulfill({
      contentType: 'text/javascript', body: readFileSync('artifacts/stutter-fix/crown-battle-renderer.js', 'utf8'),
    }));
    await page.route('**/stutter-check', route => route.fulfill({ contentType: 'text/html',
      body: '<body style="margin:0"><div style="position:relative;width:1100px;height:700px"><canvas style="position:absolute;width:100%;height:100%"></canvas></div></body>',
    }));
    await page.goto('http://127.0.0.1:5173/stutter-check');
    const result = await page.evaluate(async baseline => {
      const { Battle } = await import('/src/crown-battle.js');
      const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
      const { BattleFeedback } = await import('/src/crown-battle-feedback.js');
      const battle = new Battle({ historicalArmies: [{ roman: 60 }, { viking: 60 }], seed: 1066 });
      const renderer = new BattleRenderer(document.querySelector('canvas'), battle);
      renderer.enableLayers(); renderer.resize(1100, 700, true, 1);
      const feedback = new BattleFeedback(battle, { play() {} }, () => renderer.view);
      for (const u of battle.units) {
        u.x = 160 + (u.id % 20) * 14; u.y = 400 + Math.floor(u.id / 20) * 27;
        u.moving = true; u.face = u.team ? -1 : 1;
      }
      const stats = values => {
        values.sort((a, b) => a - b);
        return { median: +values[Math.floor(values.length * .5)].toFixed(2),
          p95: +values[Math.floor(values.length * .95)].toFixed(2) };
      };
      const stages = [];
      for (const zoom of [1, 3, 1]) {
        renderer.zoomAt(zoom / renderer.view.zoom);
        const draws = [], intervals = []; let last;
        for (let i = 0; i < 100; i++) {
          const now = await new Promise(requestAnimationFrame);
          if (last && i >= 30) intervals.push(now - last); last = now;
          battle.time += 1 / 30;
          for (const u of battle.units) { u.flash = u.id % 7 === 0 ? .1 : 0; }
          feedback.update();
          const start = performance.now(); renderer.render({ running: true });
          if (i >= 30) draws.push(performance.now() - start);
        }
        stages.push({ zoom, draw: stats(draws), frame: stats(intervals),
          density: renderer.spriteDensity(), pages: renderer.spriteCache.pages.length,
          batchFrames: renderer.spriteBatch?.frames || 0 });
      }
      const unit = battle.units[0], overview = renderer.cachedSprite(unit).resolution;
      renderer.zoomAt(3);
      for (let i = 0; i < 40; i++) { renderer.render(); await new Promise(requestAnimationFrame); }
      const closeup = renderer.cachedSprite(unit).resolution;
      // Warm-up must finish without evicting the live atlas just to prepare
      // speculative animation poses. A full atlas is represented without GPU allocation.
      const pages = renderer.spriteCache.pages;
      renderer.spriteCache.pages = Array.from({ length: 12 }, () => ({}));
      battle.time = 0;
      const get = renderer.sprites.get.bind(renderer.sprites);
      let prepared = 0;
      renderer.sprites.get = (...args) => { prepared++; return get(...args); };
      if (!baseline) renderer.prepareBattle();
      const warmComplete = !baseline && renderer.warmIndex === renderer.warmJobs.length;
      renderer.spriteCache.pages = pages;
      return { stages, overview, closeup, prepared, warmComplete,
        glError: renderer.spriteBatch?.gl?.getError() || 0, effects: feedback.effects.length };
    }, baseline);
    assert.deepEqual(errors, []); assert.equal(result.glError, 0);
    assert(result.effects <= 96);
    if (!baseline) {
      assert(result.stages.every(stage => stage.batchFrames > 0), 'Small armies and close-ups keep GPU batching');
      assert.equal(result.stages[0].density, 1.5, 'Overview tiles match their screen size');
      assert(result.closeup >= 3, 'Native soldier detail survives magnification');
      assert.equal(result.prepared, 0, 'Warm-up must not churn a crowded atlas');
      assert(result.warmComplete, 'Capped warm-up must release the start button');
    }
    results.push({ baseline, ...result });
    await page.close();
  }
  writeFileSync('artifacts/stutter-fix/render-comparison.json', JSON.stringify(results, null, 2));
  console.log('PASS small armies, zoom, effects and bounded warm-up:', JSON.stringify(results));
} finally { await browser.close(); }
