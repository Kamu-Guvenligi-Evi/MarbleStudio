import { chromium } from 'playwright';
import {readFileSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const timer=setTimeout(()=>browser.close(),180000);
try{
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  await page.routeWebSocket('**/*',s=>s.close());
  if(process.env.CROWD_BASELINE) for(const file of ['crown-battle.js','crown-battle-renderer.js']) await page.route(`**/src/${file}*`,r=>r.fulfill({contentType:'text/javascript',body:readFileSync(`artifacts/crowd-stutter/${file}`,'utf8')}));
  if(process.env.FPS_BASELINE) for(const file of ['crown-battle.js','crown-battle-art.js','crown-battle-renderer.js','crown-battle-sprite-cache.js','crown-battle-sprite-batch.js']) await page.route(`**/src/${file}*`,r=>r.fulfill({contentType:'text/javascript',body:readFileSync(`artifacts/fps-2026-10-15/${file}`,'utf8')}));
  await page.route('**/perf-empty',r=>r.fulfill({contentType:'text/html',body:'<html><body style="margin:0"><div style="position:relative;width:1100px;height:500px"><canvas id="battle" style="position:absolute;inset:0;width:100%;height:100%"></canvas></div></body></html>'}));
  if(process.env.BASELINE)await page.route('**/src/crown-battle-renderer.js',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('artifacts/crown-battle/renderer-round2-before.js','utf8')}));
  if(process.env.BASELINE)await page.route('**/src/crown-battle-sprite-cache.js',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('artifacts/crown-battle/cache-round2-before.js','utf8')}));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.env.POSE_BASELINE) await page.route('**/src/crown-battle-renderer.js',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('src/crown-battle-renderer.js','utf8').replace('const retained = this.readyPoses?.get(key);','const retained = null;')}));
  await page.goto('http://127.0.0.1:5173/perf-empty');
  const profiler = process.env.PROFILE ? await page.context().newCDPSession(page) : null;
  if (profiler) { await profiler.send('Profiler.enable'); await profiler.send('Profiler.start'); }
  const result=await page.evaluate(async({layered,warm,count,sliced})=>{
    const {Battle}=await import('/src/crown-battle.js'),{BattleRenderer}=await import('/src/crown-battle-renderer.js');
    const army={samurai:100,janissary:80,kipchak:70,hussar:70,timur:20,spartan:100,mongol:70,mamluk:70,viking:100,roman:100,persian:100,knight:20};
    const largeArmy={sword:count/8,pike:count/8,archer:count/8,cavalry:count/8};
    const b=new Battle({seed:1066,...(count?{armies:[largeArmy,largeArmy]}:{historicalArmies:[army,army]})}),r=new BattleRenderer(document.querySelector('canvas'),b);
    r.resize(1100,500,true,1);
    if(layered) r.enableLayers();
    for(const u of b.units){const index=u.id%(b.units.length/2);u.x=70+index%100*5;u.y=440+u.team*90+Math.floor(index/100)*3;}
    let preparation=0;
    if(warm) {
      const start=performance.now();r.render();
      for(let i=0;i<1500;i++){
        await new Promise(requestAnimationFrame);r.prepareBattle();
        if(r.warmIndex>=r.warmJobs.length || r.spriteCache.pages.length>=12)break;
      }
      preparation=performance.now()-start;
    }
    // Sliced mode measures input/render opportunities; report completed ticks
    // separately because it deliberately trades simulation speed for responsiveness.
    const intervals=[],steps=[],draws=[],steady=[];let last;
    let fallbackDraws=0, generatedPoses=0, pageChanges=0, completedTicks=0;
    const soldier=r.soldier.bind(r);r.soldier=u=>{fallbackDraws++;return soldier(u);};
    for(let i=0;i<180;i++){
      const now=await new Promise(requestAnimationFrame);if(last)intervals.push(now-last);last=now;
      const start=performance.now();
      if(sliced) { if(b.advanceFrame(1/30,6)) completedTicks++; }
      else { b.step(1/30); completedTicks++; }
      steps.push(performance.now()-start);
      const revision=r.spriteCache?.pageRevision||0;
      const t=performance.now();r.render({running:true});const d=performance.now()-t;draws.push(d);if(i>=90)steady.push(d);
      generatedPoses+=r.sprites.generated;pageChanges+=(r.spriteCache?.pageRevision||0)-revision;
      if(i===60)r.zoomAt(1.9);if(i===120)r.fitMap();
    }
    const stats=a=>{a.sort((a,b)=>a-b);return {median:+a[Math.floor(a.length*.5)].toFixed(2),p95:+a[Math.floor(a.length*.95)].toFixed(2),max:+a.at(-1).toFixed(2),over100:a.filter(v=>v>100).length};};
    return{count:b.units.length,alive:b.counts(),time:b.time,sliced,completedTicks,preparation,fallbackDraws,generatedPoses,pageChanges,sourcePoses:r.sprites.cache.size,pages:r.spriteCache?.pages.length,canvas:[r.canvas.width,r.canvas.height],batchFrames:r.spriteBatch?.frames||0,glError:r.spriteBatch?.gl?.getError(),step:stats(steps),draw:stats(draws),steadyDraw:stats(steady),frame:stats(intervals)};
  },{layered:!!process.env.LAYERED,warm:!!process.env.WARM,count:Number(process.env.CROWD_COUNT)||0,sliced:!!process.env.CROWD_SLICED});
  result.errors=errors;if(errors.length||result.glError)throw new Error(JSON.stringify(result));
  if (profiler) {
    const {profile} = await profiler.send('Profiler.stop');
    writeFileSync('artifacts/alliance-simulation/renderer.cpuprofile', JSON.stringify(profile));
    const totals = new Map(), nodes = new Map(profile.nodes.map(n => [n.id, n.callFrame]));
    profile.samples.forEach((id,i) => { const f=nodes.get(id), key=`${f.functionName} ${f.url.split('/').at(-1)}:${f.lineNumber+1}`; totals.set(key,(totals.get(key)||0)+profile.timeDeltas[i]); });
    console.log(JSON.stringify([...totals].sort((a,b)=>b[1]-a[1]).slice(0,18)));
  }
  if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
}finally{clearTimeout(timer);await browser.close();}
