// Local before/after measurement; baseline snapshots live in artifacts/crowd-motion.
// Counts submitted GPU draws separately from costly scene refreshes. These
// are not a measurement of physical monitor presentation or GPU completion.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
const speed=Number(process.env.SPEED)||1;
const artifactDir=process.env.ARTIFACT_DIR||'artifacts/crowd-motion';
try {
  for(const count of process.env.COUNT?[+process.env.COUNT]:[3000,10000]) for(const baseline of process.env.CURRENT?[false]:[true,false]) {
    const page=await browser.newPage({viewport:{width:1100,height:600}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.routeWebSocket('**/*',socket=>socket.close());
    await page.route('**/motion-benchmark',r=>r.fulfill({contentType:'text/html',body:'<div style="position:relative;width:1100px;height:500px"><canvas></canvas></div>'}));
    if(baseline)for(const file of process.env.ENGINE_ONLY ? ['crown-battle.js'] : [...(process.env.INCLUDE_ENGINE ? ['crown-battle.js'] : []),'crown-battle-renderer.js','crown-battle-sprite-batch.js','crown-battle-timing.js'])
      await page.route(`**/src/${file}*`,r=>r.fulfill({contentType:'text/javascript',body:readFileSync(`${artifactDir}/${file}`,'utf8')}));
    await page.goto('http://127.0.0.1:5173/motion-benchmark');
    const result=await page.evaluate(async({count,baseline,speed})=>{
      const {Battle}=await import('/src/crown-battle.js');
      const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
      const {advanceBattleFrame}=await import('/src/crown-battle-timing.js');
      const army={sword:count/8,pike:count/8,archer:count/8,cavalry:count/8};
      const b=new Battle({seed:1066,armies:[army,army]}),r=new BattleRenderer(document.querySelector('canvas'),b);
      r.resize(1100,500,true,1);r.enableLayers();
      for(const u of b.units){const i=u.id%(count/2);u.x=70+i%100*5;u.y=440+u.team*90+Math.floor(i/100)*3;}
      r.render();
      for(let i=0;i<1500;i++) {await new Promise(requestAnimationFrame);r.prepareBattle();if(r.warmIndex>=r.warmJobs.length||r.spriteCache.pages.length>=12)break;}
      let completedTime=0;
      const advance=b.advanceFrame.bind(b);b.advanceFrame=(...args)=>{const done=advance(...args);if(done)completedTime=b.time;return done;};
      let accumulator=0,last=performance.now(),start=last,sampleStart=0,initialTime=0,lastPresentation=0;
      let presentations=0,refreshes=0;
      const gaps=[],costs=[],refreshCosts=[],replayCosts=[],frameIntervals=[],simulationCosts=[];
      while(performance.now()-start<18000) {
        const now=await new Promise(requestAnimationFrame),elapsed=(now-last)/1000;last=now;
        if(!sampleStart&&now-start>=5000){sampleStart=now;initialTime=completedTime;}
        const workStart=performance.now();
        accumulator=advanceBattleFrame(b,accumulator,elapsed,speed);
        if(sampleStart){frameIntervals.push(elapsed*1000);simulationCosts.push(performance.now()-workStart);}
        const frames=r.spriteBatch?.frames||0,draws=r.drawCount,t=performance.now();
        r.renderIfNeeded({running:true});const end=performance.now(),cost=end-t;
        if(sampleStart){
          costs.push(cost);
          if(r.drawCount>draws){refreshes++;refreshCosts.push(cost);}else replayCosts.push(cost);
          if((r.spriteBatch?.frames||0)>frames){presentations++;if(lastPresentation)gaps.push(end-lastPresentation);lastPresentation=end;}
        }
      }
      const wall=(performance.now()-sampleStart)/1000;
      const stats=a=>{a.sort((x,y)=>x-y);return {median:+(a[Math.floor(a.length*.5)]||0).toFixed(2),p95:+(a[Math.floor(a.length*.95)]||0).toFixed(2),max:+(a.at(-1)||0).toFixed(2)};};
      return {count,speed,baseline,wall,frameInterval:stats(frameIntervals),simulationCost:stats(simulationCosts),simulationSeconds:completedTime-initialTime,simulationRate:(completedTime-initialTime)/wall,
        presentedFps:presentations/wall,sceneRefreshFps:refreshes/wall,presentationGap:stats(gaps),draw:stats(costs),refresh:stats(refreshCosts),replay:stats(replayCosts),soldiers:b.units.length,glError:r.spriteBatch?.gl.getError()};
    },{count,baseline,speed});
    assert.equal(result.soldiers,count);assert.deepEqual(errors,[]);assert.equal(result.glError,0);
    results.push(result);console.log(JSON.stringify(result));
    writeFileSync(`${artifactDir}/browser.json`,JSON.stringify(results,null,2));
    await page.close();
  }
}finally{await browser.close();}
