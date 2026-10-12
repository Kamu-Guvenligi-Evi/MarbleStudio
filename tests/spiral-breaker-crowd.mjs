import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install();
  await page.goto((process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5174')+'/spiral-breaker.html');
  await page.clock.runFor(30000);
  const early=await page.evaluate(()=>window.spiralBreaker.getState());
  assert.equal(early.broken,0);assert.equal(early.balls,1);assert.equal(early.falling.length,0);
  await page.clock.runFor(6000);
  const released=await page.evaluate(()=>window.spiralBreaker.getState());
  assert.ok(released.broken>0&&released.armed===1&&released.falling.length>0);
  await page.clock.runFor(1000);
  const later=await page.evaluate(()=>window.spiralBreaker.getState());
  assert.ok(later.falling.find(b=>b.id===released.falling[0].id).y>released.falling[0].y,'Buff must fall downward.');
  await page.clock.runFor(43000);
  const state=await page.evaluate(()=>window.spiralBreaker.getState());
  assert.equal(state.balls,0,'Missed balls must leave the field instead of accumulating at the floor.');
  assert.equal(state.state,'lost');
  assert.ok(state.broken>0);assert.ok(state.bonuses>0);assert.deepEqual(errors,[]);
  await page.locator('.game-shell').screenshot({path:'artifacts/spiral-breaker-crowd.png'});
  console.log(`PASS: browser at ${state.time.toFixed(1)}s: ${state.balls} balls, ${state.broken} bricks, ${state.bonuses} bonuses.`);
}finally{await browser.close();}
