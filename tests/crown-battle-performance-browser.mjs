import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const result = [];
  for (const count of [320, 2000, 4000]) {
  // Release each scenario's textures and module state before the next density.
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.route('**/performance-empty', route => route.fulfill({ contentType:'text/html', body:'<!doctype html><html><body></body></html>' }));
  await page.goto('http://127.0.0.1:5173/performance-empty', { waitUntil: 'domcontentloaded' });
  const sample = await page.evaluate(async ({expandedMap,count}) => {
    // Isolated document: no app RAF competing with the measured renderer.
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const canvas = document.createElement('canvas'); document.body.replaceChildren(canvas);
    canvas.style.cssText = 'width:1000px;height:540px';
    const median = a => +[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)].toFixed(2);
      const army = { sword: count/8, pike: count/8, archer: count/8, cavalry: count/8 };
      const battle = new Battle({ seed: 1066, armies: [army, army], expandedMap });
      const renderer = new BattleRenderer(canvas, battle); renderer.resize(1000,540,true,1);
      const intervals=[], steps=[], draws=[]; let previous;
      for (let i=0;i<80;i++) {
        const now = await new Promise(requestAnimationFrame);
        if (i>=20) intervals.push(now-previous);
        previous=now;
        const start=performance.now(); battle.step(1/30); const stepped=performance.now();
        renderer.render({running:true}); const drawn=performance.now();
        if(i>=20) { steps.push(stepped-start); draws.push(drawn-stepped); }
      }
      return { units:count, medianFrameMs:median(intervals), medianStepMs:median(steps), medianDrawMs:median(draws), elapsedFps:+(60000/intervals.reduce((a,b)=>a+b,0)).toFixed(1) };
  }, {expandedMap:process.argv.includes('--expanded'),count});
  result.push(sample); await page.close();
  }
  console.log(JSON.stringify(result));
  if(process.argv[2]) writeFileSync(process.argv[2],JSON.stringify(result,null,2));
} finally { await browser.close(); }
