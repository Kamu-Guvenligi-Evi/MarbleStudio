import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {SpiralBreaker} from '../src/spiral-breaker.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5173';
try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install();
  await page.goto(origin+'/spiral-breaker.html');
  let released;
  for(let i=0;i<50;i++){
    await page.clock.runFor(500);
    released=await page.evaluate(()=>window.spiralBreaker.getState());
    if(released.broken)break;
  }
  assert.ok(released.broken>0&&released.falling.length>0);
  await page.clock.runFor(200);
  const later=await page.evaluate(()=>window.spiralBreaker.getState());
  assert.ok(later.falling.find(b=>b.id===released.falling[0].id).y>released.falling[0].y);
  await page.clock.runFor(30000);
  const state=await page.evaluate(()=>window.spiralBreaker.getState());
  assert.ok(state.balls>1);assert.equal(state.state,'running');
  assert.ok(state.broken>100);assert.ok(state.bonuses>0);assert.deepEqual(errors,[]);
  await page.locator('.game-shell').screenshot({path:'artifacts/spiral-breaker-crowd.png'});
  console.log('PASS browser: '+state.time.toFixed(1)+'s, '+state.balls+' balls, '+state.broken+' tiles, '+state.bonuses+' buffs.');
  await page.goto(origin+'/spiral-breaker.html?video-render=1&render-width=540');
  await page.waitForFunction(()=>window.breakerVideo);
  const video=await page.evaluate(()=>{
    let impacts=0;window.breakerVideo.reset({mapId:'spiral',playbackSpeed:1},()=>impacts++,'');
    for(let i=0;i<3600;i++)window.breakerVideo.step(1/120);
    const canvas=window.breakerVideo.draw();
    return {state:window.spiralBreaker.getState(),width:canvas.width,height:canvas.height,impacts};
  });
  const expected=new SpiralBreaker();for(let i=0;i<3600;i++)expected.step(1/120);
  assert.equal(video.state.broken,expected.broken);assert.equal(video.state.balls,expected.balls.length);
  assert.deepEqual(video.state.ball,expected.ball);assert.equal(video.state.paddleWidth,expected.paddle.width);
  assert.equal(video.width,540);assert.equal(video.height,960);assert.ok(video.impacts>0);assert.deepEqual(errors,[]);
  console.log('PASS video canvas: identical physics, destruction and paddle at 30 seconds.');
}finally{await browser.close();}
