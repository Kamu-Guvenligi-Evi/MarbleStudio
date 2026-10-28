import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await browser.newPage({viewport:{width:1366,height:768}});
  await page.routeWebSocket('**/*',socket=>socket.close());
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.route(/\/src\/crown-battle-app\.js(?:\?.*)?$/,async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+`
      window.startProbe={get battle(){return battle},get running(){return running},get starting(){return starting},renderer,battleAudio};`});
  });
  await page.addInitScript(()=>localStorage.setItem('marble-historical-armies-v1',JSON.stringify([{samurai:40,hussar:40},{samurai:40,hussar:40}])));
  await page.goto('http://127.0.0.1:5173/crown-battle.html');
  await page.waitForFunction(()=>window.startProbe);
  // Delay audio readiness to ensure pending/cancel/rebuild cannot start combat.
  await page.evaluate(()=>{
    const p=window.startProbe; p.battleAudio.unlock=()=>new Promise(resolve=>window.releaseAudio=resolve);
    document.getElementById('play').click();
  });
  await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(()=>({starting:startProbe.starting,running:startProbe.running,time:startProbe.battle.time})),{starting:true,running:false,time:0});
  await page.evaluate(()=>{document.getElementById('play').click();window.releaseAudio(true);});
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>startProbe.running||startProbe.starting),false);
  await page.evaluate(()=>document.getElementById('play').click());
  await page.evaluate(()=>{document.getElementById('restart').click();window.releaseAudio(true);});
  await page.waitForTimeout(100);
  assert.deepEqual(await page.evaluate(()=>({starting:startProbe.starting,running:startProbe.running,time:startProbe.battle.time})),{starting:false,running:false,time:0});
  await page.evaluate(()=>{startProbe.battleAudio.unlock=async()=>true;document.getElementById('play').click();});
  await page.waitForFunction(()=>startProbe.running&&startProbe.battle.time>0,null,{timeout:30000});
  assert(await page.evaluate(()=>startProbe.renderer.warmIndex>=startProbe.renderer.warmJobs.length),'All battle poses prepared before advancing time');
  await page.evaluate(()=>document.getElementById('play').click());
  const paused=await page.evaluate(()=>startProbe.battle.time);
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>startProbe.battle.time),paused);
  assert.deepEqual(errors,[]);
  console.log('PASS startup: no simulation during preparation; cancel/rebuild discard pending start; prepared start and pause work');
} finally {await browser.close();}
