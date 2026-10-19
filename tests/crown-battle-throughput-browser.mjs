import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const results=[];
try {
  for(const count of process.env.COUNT?[Number(process.env.COUNT)]:[3000,10000]) for(const baseline of process.env.CURRENT?[false]:[true,false]) {
    const page=await browser.newPage({viewport:{width:1366,height:768}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.routeWebSocket('**/*',s=>s.close());
    await page.route('**/crowd-benchmark',r=>r.fulfill({contentType:'text/html',body:'<div style="position:relative"><canvas></canvas></div>'}));
    if(baseline)for(const file of ['crown-battle.js','crown-battle-renderer.js'])await page.route(`**/src/${file}*`,r=>r.fulfill({contentType:'text/javascript',body:readFileSync(`artifacts/crowd-throughput/${file}`,'utf8')}));
    await page.goto('http://127.0.0.1:5173/crowd-benchmark');
    const session=process.env.PROFILE?await page.context().newCDPSession(page):null;
    if(session){await session.send('Profiler.enable');await session.send('Profiler.start');}
    const result=await page.evaluate(async({count,baseline})=>{
      const {Battle}=await import('/src/crown-battle.js');
      const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
      const {advanceBattleFrame}=await import('/src/crown-battle-timing.js');
      const a={sword:count/8,pike:count/8,archer:count/8,cavalry:count/8};
      const b=new Battle({seed:1066,armies:[a,a]}),r=new BattleRenderer(document.querySelector('canvas'),b);
      r.resize(1100,500,true,1);r.enableLayers();
      for(const u of b.units){const i=u.id%(count/2);u.x=70+i%100*5;u.y=440+u.team*90+Math.floor(i/100)*3;}
      r.render();
      for(let i=0;i<1500;i++) { await new Promise(requestAnimationFrame);r.prepareBattle();if(r.warmIndex>=r.warmJobs.length||r.spriteCache.pages.length>=12)break; }
      let completedTime=0,completedTicks=0;
      const advance=b.advanceFrame.bind(b);b.advanceFrame=(...args)=>{const done=advance(...args);if(done){completedTime=b.time;completedTicks++;}return done;};
      let accumulator=0,last=performance.now(),start=last,sampleStart=0,initialTime=0,initialTicks=0;
      const frames=[],work=[],draw=[];
      while(performance.now()-start<18000) {
        const now=await new Promise(requestAnimationFrame),elapsed=Math.min(.1,(now-last)/1000),interval=now-last;last=now;
        if(!sampleStart&&now-start>=5000){sampleStart=now;initialTime=completedTime;initialTicks=completedTicks;}
        const t=performance.now();
        if(baseline) {
          accumulator+=elapsed;
          if(b.pendingStep||accumulator>=1/30){if(!b.pendingStep)accumulator-=1/30;b.advanceFrame(1/30,6);}
          accumulator=Math.min(accumulator,1/30);
        } else accumulator=advanceBattleFrame(b,accumulator,elapsed,1);
        const afterWork=performance.now();r.renderIfNeeded({running:true});
        if(sampleStart){frames.push(interval);work.push(afterWork-t);draw.push(performance.now()-afterWork);}
      }
      const wallSeconds=(performance.now()-sampleStart)/1000,simulationSeconds=completedTime-initialTime;
      const stats=a=>{a.sort((x,y)=>x-y);return {median:+a[Math.floor(a.length*.5)].toFixed(2),p95:+a[Math.floor(a.length*.95)].toFixed(2),max:+a.at(-1).toFixed(2)};};
      return {count,baseline,wallSeconds,simulationSeconds,simulationRate:simulationSeconds/wallSeconds,completedTicks:completedTicks-initialTicks,frame:stats(frames),work:stats(work),draw:stats(draw),soldiers:b.units.length,glError:r.spriteBatch?.gl.getError()};
    },{count,baseline});
    if(session){const {profile}=await session.send('Profiler.stop');writeFileSync(`artifacts/crowd-throughput/browser-${count}-${baseline}.cpuprofile`,JSON.stringify(profile));}
    assert.equal(result.soldiers,count);assert.deepEqual(errors,[]);assert(!result.glError);
    results.push(result);console.log(JSON.stringify(result));
    writeFileSync(process.argv[2]||'artifacts/crowd-throughput/browser.json',JSON.stringify(results,null,2));
    await page.close();
  }
}finally {await browser.close();}
