import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
  const middleEarth=process.argv.includes('--middle-earth');
  for(const mapId of (middleEarth?['classic']:['classic','steppe'])) for(const count of (process.env.LOAD_COUNT?[Number(process.env.LOAD_COUNT)]:[400,2000])) {
    const page=await browser.newPage({viewport:{width:1366,height:768}});
    await page.routeWebSocket('**/*',socket=>socket.close());
    if(process.env.LAG_BASELINE) {
      await page.route('**/src/crown-battle-sprite-cache.js*',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('artifacts/battle-playability/sprite-cache-before-lag.js','utf8')}));
      await page.route('**/src/crown-battle-pc-scene.js*',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('src/crown-battle-pc-scene.js','utf8').replace("getContext('2d', { willReadFrequently: true })","getContext('2d')")}));
    }
    await page.route('**/load-empty',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
    await page.goto('http://127.0.0.1:5173/load-empty');
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.start');
    const result=await page.evaluate(async({mapId,count,middleEarth,warm})=>{
      const {Battle}=await import('/src/crown-battle.js');
      const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
      const {MIDDLE_EARTH_UNITS}=await import('/src/middle-earth-units.js');
      const army=middleEarth?Object.fromEntries(MIDDLE_EARTH_UNITS.map(u=>[u.id,Math.max(1,Math.floor(count/2/MIDDLE_EARTH_UNITS.length))])):{samurai:count*.3,hussar:count*.1,janissary:count*.1};
      const battle=new Battle({seed:1066,historicalArmies:[army,army],expandedMap:true,mapId});
      const canvas=document.createElement('canvas');document.body.append(canvas);
      const renderer=new BattleRenderer(canvas,battle,{mapId});renderer.resize(1200,650,true,1);renderer.fitMap();
      let warmMs=0;
      if(warm) {
        const warmStarted=performance.now();
        const host=document.createElement('div');host.style.position='relative';document.body.append(host);host.append(canvas);renderer.enableLayers();
        renderer.render();
        do {renderer.prepareBattle();} while(renderer.warmIndex<renderer.warmJobs.length);
        warmMs=+(performance.now()-warmStarted).toFixed(2);
      }
      if(middleEarth) for(const u of battle.units) { u.x=70+(u.id%60)*7;u.y=440+u.team*65+Math.floor(u.id/60)%12*4; }
      const steps=[],draws=[],intervals=[];let prev;
      for(let i=0;i<180;i++) {
        const now=await new Promise(requestAnimationFrame);
        const t=performance.now();battle.step(1/30);const s=performance.now();renderer.render({running:true});const d=performance.now();
        if(i>=30){steps.push(s-t);draws.push(d-s);intervals.push(now-prev);}prev=now;
      }
      const stats=a=>{a.sort((a,b)=>a-b);return {median:+a[Math.floor(a.length*.5)].toFixed(2),p95:+a[Math.floor(a.length*.95)].toFixed(2),max:+a.at(-1).toFixed(2)};};
      return {mapId,count,actualCount:battle.units.length,middleEarth,warm,warmMs,stepMs:stats(steps),drawMs:stats(draws),frameMs:stats(intervals),atlasPages:renderer.spriteCache?.pages.length,glError:renderer.spriteBatch?.gl?.getError()};
    },{mapId,count,middleEarth,warm:!!process.env.WARM});
    const {profile}=await cdp.send('Profiler.stop');
    const hits=new Map();for(const n of profile.nodes){const key=n.callFrame.functionName+' '+n.callFrame.url.split('/').at(-1);hits.set(key,(hits.get(key)||0)+(n.hitCount||0));}
    result.cpu=Array.from(hits).sort((a,b)=>b[1]-a[1]).slice(0,9);
    if(result.glError)throw new Error(`WebGL error ${result.glError}`);
    results.push(result);console.log(JSON.stringify(result));await page.close();
  }
  if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(results,null,2));
}finally{await browser.close();}
