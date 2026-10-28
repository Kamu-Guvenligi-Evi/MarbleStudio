import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await browser.newPage({viewport:{width:1366,height:768}});
  await page.route('**/perf-empty',r=>r.fulfill({contentType:'text/html',body:'<canvas></canvas>'}));
  await page.goto('http://127.0.0.1:5173/perf-empty');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.start');
  const results = await page.evaluate(async()=>{
    const {Battle}=await import('/src/crown-battle.js'), {BattleRenderer}=await import('/src/crown-battle-renderer.js');
    const results=[];
    for(const batch of [true]) {
      const army={samurai:100,janissary:80,kipchak:70,hussar:70,timur:20,spartan:100,mongol:70,mamluk:70,viking:100,roman:100,persian:100,knight:20};
      const b=new Battle({seed:1066,historicalArmies:[army,army]});
      const canvas=document.createElement('canvas');document.body.append(canvas);
      const r=new BattleRenderer(canvas,b);r.spriteBatchEnabled=batch;r.resize(1100,500,true,1);
      for(const u of b.units){u.x=70+u.id%70*6.5;u.y=440+u.team*90+Math.floor(u.id/70)%14*3;}
      const timings={step:[],draw:[]}, methods={};
      for(const [object,key] of [[r,'cachedSprite'],[b,'chooseTarget'],[b,'walk'],[b,'updateUnits']]){
        const orig=object[key]; methods[key]=0;
        object[key]=function(...args){const t=performance.now();const out=orig.apply(this,args);methods[key]+=performance.now()-t;return out;};
      }
      for(let i=0;i<120;i++){
        await new Promise(requestAnimationFrame);
        let t=performance.now();b.step(1/30);timings.step.push(performance.now()-t);
        t=performance.now();r.render({running:true});timings.draw.push(performance.now()-t);
      }
      const stats=a=>{a.sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)};};
      results.push({batch,step:stats(timings.step),draw:stats(timings.draw),methods,pages:r.spriteCache.pages.length,sources:r.sprites.cache?.size});
      canvas.remove();
    }
    return results;
  });
  const {profile}=await cdp.send('Profiler.stop');
  writeFileSync('artifacts/fps-2026-10-15/current.cpuprofile',JSON.stringify(profile));
  const samples=new Map(); for(const id of profile.samples||[])samples.set(id,(samples.get(id)||0)+1);
  const hot=profile.nodes.map(n=>({fn:n.callFrame.functionName,url:n.callFrame.url.split('/').at(-1),line:n.callFrame.lineNumber+1,samples:samples.get(n.id)||0})).sort((a,b)=>b.samples-a.samples).slice(0,22);
  console.log(JSON.stringify({results,hot}));
}finally{await browser.close();}
