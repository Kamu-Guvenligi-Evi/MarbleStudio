import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1366,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Other work in the shared checkout must not hot-reload the test mid-battle.
  await page.routeWebSocket('**/*',socket=>socket.close());
  // Observe the real app loop without adding production debug globals.
  await page.route('**/src/crown-battle-app.js*',route=>route.fulfill({contentType:'text/javascript',
    body:readFileSync('src/crown-battle-app.js','utf8')+'\nwindow.crowdTest={get battle(){return battle},get running(){return running},get renderer(){return renderer}};'}));
  await page.goto('http://127.0.0.1:5173/crown-battle.html?mode=classic');
  await page.locator('#menu-setup').click();
  for(const side of ['north','red'])for(const type of ['sword','pike','archer','cavalry'])
    await page.locator(`#${side}-${type}`).fill('1250');
  await page.locator('#apply').click();
  assert.equal(await page.evaluate(()=>crowdTest.battle.units.length),10000);
  await page.locator('#menu-command').click();
  await page.locator('[data-speed="4"]').click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>crowdTest.running&&crowdTest.battle.pendingStep,{},{timeout:60000});
  const initialZoom=await page.evaluate(()=>crowdTest.renderer.view.zoom);
  await page.locator('#zoom-in').click();
  assert(await page.evaluate(()=>crowdTest.renderer.view.zoom)>initialZoom);
  const draws=await page.evaluate(()=>({full:crowdTest.renderer.drawCount,gpu:crowdTest.renderer.spriteBatch?.frames||0}));
  await page.waitForFunction(before=>{
    const r=crowdTest.renderer;
    return r.spriteBatch?.smoothActive && r.spriteBatch.frames-before.gpu > r.drawCount-before.full+2;
  },draws,{timeout:60000}).catch(async error=>{
    console.log('Motion failure',await page.evaluate(()=>{const r=crowdTest.renderer;return {running:crowdTest.running,time:crowdTest.battle.time,pending:!!r.pendingRender,draws:r.drawCount,gpu:r.spriteBatch?.frames,smooth:r.spriteBatch?.smoothActive,interval:r.motionInterval,layers:r.layersActive,view:r.view,lastView:r.lastViewKey};}),errors);
    throw error;
  });
  // Periodic counter refreshes must preserve prepared frames and interpolation.
  const renderRevision=await page.evaluate(()=>crowdTest.renderer.revision);
  await page.waitForTimeout(450);
  assert.equal(await page.evaluate(()=>crowdTest.renderer.revision),renderRevision);
  // Pause specifically between chunks, then verify no hidden simulation work.
  await page.waitForFunction(()=>{
    if(!crowdTest.battle.pendingStep)return false;
    document.querySelector('#play').click();return !crowdTest.running;
  });
  const snapshot=()=>({time:crowdTest.battle.time,revision:crowdTest.battle.simulationRevision,
    pending:!!crowdTest.battle.pendingStep,positions:crowdTest.battle.units.slice(0,40).map(u=>[u.x,u.y,u.hp])});
  const paused=await page.evaluate(snapshot);
  assert(paused.pending);
  await page.waitForFunction(()=>!crowdTest.renderer.spriteBatch.smoothActive);
  await page.waitForTimeout(350);
  assert.deepEqual(await page.evaluate(snapshot),paused);
  await page.locator('#play').click();
  await page.waitForFunction(time=>crowdTest.battle.time>time,paused.time,{timeout:30000});
  await page.locator('#restart').click();
  await page.waitForFunction(()=>!crowdTest.running&&crowdTest.battle.time===0&&!crowdTest.battle.pendingStep);
  assert.equal(await page.evaluate(()=>crowdTest.battle.units.length),10000);
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>crowdTest.battle.time),0);
  assert.deepEqual(errors,[]);
  console.log('PASS 10000 soldiers: real app draws GPU intermediate frames, camera responds, partial tick and animation pause/resume, restart discards pending work; no browser errors');
}finally{await browser.close();}
