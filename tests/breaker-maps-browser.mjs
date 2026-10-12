import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {BREAKER_MAPS} from '../src/breaker-maps.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1360,height:1080}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let engineUrl;
  page.on('request',request=>{
    if(new URL(request.url()).pathname==='/src/spiral-breaker.js')engineUrl=request.url();
  });
  await page.clock.install();
  const url=(process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5174')+'/spiral-breaker.html';
  await page.goto(url);const state=()=>page.evaluate(()=>window.spiralBreaker.getState());
  assert.equal(await page.locator('.map-card').count(),6);
  for(const map of BREAKER_MAPS){
    await page.getByRole('button',{name:map.name,exact:true}).click();
    const s=await state();assert.equal(s.mapId,map.id);assert.equal(s.balls,1);assert.equal(s.broken,0);
    assert.equal(await page.locator(`[data-map="${map.id}"]`).getAttribute('aria-pressed'),'true');
    assert.equal(new URL(page.url()).searchParams.get('map'),map.id);
  }
  await page.reload();assert.equal((await state()).mapId,'coil');
  await page.locator('#next-map').click();assert.equal((await state()).mapId,'spiral');
  await page.locator('#watch-tour').click();assert.equal((await state()).mapId,'stairs');assert.equal((await state()).speed,1.5);
  await page.clock.runFor(14000);assert.ok((await state()).broken>0,'Tour reaches destruction quickly');
  await page.locator('#pause').click();const paused=await state();await page.clock.runFor(1000);assert.equal((await state()).time,paused.time);
  await page.locator('#resume').click();await page.locator('#speed').selectOption('2');
  await page.locator('#cinema').click();assert.equal(await page.locator('.game-info').isVisible(),false);
  await page.locator('#cinema').click();assert.equal(await page.locator('.game-info').isVisible(),true);
  await page.screenshot({path:'artifacts/breaker-maps-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('button',{name:'Yılan Yolu',exact:true}).click();
  await page.locator('#game').scrollIntoViewIfNeeded();
  await page.screenshot({path:'artifacts/breaker-maps-mobile.png'});
  await page.locator('#watch-tour').click();await page.locator('#speed').selectOption('2');
  console.log('PASS: gallery, URL, controls, speed, focus mode and mobile; checking win transitions.');
  // Losing balls means automatic play is no longer guaranteed to win.
  // Use a completed-field fixture to test the UI transition independently.
  const completeField=async()=>{
    assert.ok(engineUrl,'Engine module request captured');
    await page.evaluate(async(engineUrl)=>{
      const {SpiralBreaker}=await import(engineUrl);
      const original=SpiralBreaker.prototype.step;
      SpiralBreaker.prototype.step=function(){
        SpiralBreaker.prototype.step=original;
        for(let i=0;i<this.cells.length;i++)if(this.cells[i])this.breakCell(i);
      };
    },engineUrl);
    await page.clock.runFor(50);
  };
  await completeField();assert.equal((await state()).state,'won');
  await page.clock.runFor(3000);assert.equal((await state()).mapId,'stairs');
  await page.clock.runFor(1100);
  assert.equal((await state()).mapId,'hook');
  console.log('PASS: completed Basamak and advanced to Kanca.');
  await page.locator('#sequence').uncheck();
  await completeField();
  const finished=await state();
  assert.equal(finished.mapId,'hook');assert.equal(finished.state,'won',JSON.stringify({time:finished.time,broken:finished.broken,balls:finished.balls}));
  await page.clock.runFor(6000);assert.equal((await state()).mapId,'hook');assert.equal((await state()).state,'won');
  assert.deepEqual(errors,[]);
  console.log('PASS: six map selections, URL restore, next map, tour, speed, pause, focus mode, mobile, win auto transition and opt-out.');
}finally{await browser.close();}
