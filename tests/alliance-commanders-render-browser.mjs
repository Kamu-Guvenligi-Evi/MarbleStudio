import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.routeWebSocket('**/*', s => s.close());
  await page.route('**/*', r => r.request().url().startsWith('http://127.0.0.1:5173/') ? r.continue() : r.abort());
  await page.route('**/alliance-render-fixture', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body style="margin:0"><div style="position:relative;width:1366px;height:768px"><canvas id="battle" style="position:absolute;inset:0"></canvas></div></body></html>' }));
  const results = [];
  for (const config of [{ armies: 4, size: 96 }, { armies: 8, size: 240 }]) {
    await page.goto('http://127.0.0.1:5173/alliance-render-fixture');
    results.push(await page.evaluate(async ({ armies, size }) => {
      const { Battle } = await import('/src/crown-battle.js');
      const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
      const { createCommanderArmy } = await import('/src/historical-army-presets.js');
      const leaders = ['alp_arslan', 'mehmed_ii', 'qi_jiguang', 'georg_frundsberg'];
      const b = new Battle({ seed: 1427, expandedMap: true, armyConfigs: Array.from({ length: armies }, (_, i) => ({
        id: `army-${i}`, team: i % 2, commanderId: leaders[i % 4], roster: createCommanderArmy(leaders[i % 4], size),
      })) });
      const renderer = new BattleRenderer(document.querySelector('#battle'), b);
      renderer.resize(1366, 768, true, 1); renderer.enableLayers(); renderer.fitMap();
      for (let i = 0; i < 300; i++) b.step(1 / 30);
      const frameMs = [], renderMs = [], stepMs = []; let last = null;
      for (let i = 0; i < 420; i++) {
        const now = await new Promise(resolve => requestAnimationFrame(resolve));
        const t = performance.now(); b.step(1 / 30); const stepped = performance.now();
        renderer.render({ running: true }); const rendered = performance.now();
        if (i >= 60) { frameMs.push(now - last); stepMs.push(stepped - t); renderMs.push(rendered - stepped); }
        last = now;
      }
      const stats = values => { values.sort((a,b) => a-b); return { p50: values[Math.floor(values.length*.5)], p95: values[Math.floor(values.length*.95)], max: values.at(-1) }; };
      return { armies, soldiers: armies * size, simulatedSeconds: b.time, layered: renderer.layersActive, frameMs: stats(frameMs), stepMs: stats(stepMs), renderMs: stats(renderMs), finite: b.units.every(u => Number.isFinite(u.x + u.y + u.hp)) };
    }, config));
    console.log(JSON.stringify(results.at(-1)));
  }
  mkdirSync('artifacts/alliance-simulation', { recursive: true });
  writeFileSync('artifacts/alliance-simulation/browser.json', JSON.stringify({ viewport: [1366, 768], headless: true, audio: false, fixedStepsPerFrame: 1, errors, results }, null, 2));
  if (errors.length || results.some(r => !r.finite || !r.layered)) throw new Error(JSON.stringify({ errors, results }));
} finally { await browser.close(); }
