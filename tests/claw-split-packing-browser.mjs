import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:600,height:980}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.goto('http://127.0.0.1:5173/claw-split.html');
 await page.waitForFunction(()=>window.clawStudio?.state().time>.1);
 await page.locator('#pause').click();
 const result=await page.evaluate(async()=>{
  const {ClawSplit,renderClaw}=await import('/src/claw-split.js');
  const g=new ClawSplit(),c=document.createElement('canvas');
  c.width=540;c.height=960;c.id='packing-test';c.style='position:fixed;inset:0;z-index:9999;width:540px;height:960px';document.body.append(c);
  const ctx=c.getContext('2d');while(g.time<180&&g.state!=='finished')g.step();
  const result={time:g.time,count:g.balls.length,fill:g.fill,state:g.state,radius:g.radius};
  renderClaw(ctx,g);window.packingGame=g;
  g.state='running';const start=performance.now();for(let i=0;i<60;i++){g.step();g.step();renderClaw(ctx,g);}result.frameMs=(performance.now()-start)/60;
  g.state='finished';renderClaw(ctx,g);return result;
 });
 assert.equal(result.state,'finished');assert.ok(result.fill>=.9,JSON.stringify(result));assert.equal(result.radius,5);assert.ok(result.count>1500);assert.deepEqual(errors,[]);
 await page.locator('#packing-test').screenshot({path:'artifacts/claw-split/physical-packing.png'});
 console.log(JSON.stringify(result));
} finally {await browser.close();}
