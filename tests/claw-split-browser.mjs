import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const dir='artifacts/claw-split';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url());return !u.protocol.startsWith('http')||['localhost','127.0.0.1'].includes(u.hostname)?r.continue():r.abort();});
 await page.goto('http://127.0.0.1:5173/claw-split.html');await page.waitForFunction(()=>window.clawStudio?.state().time>.1);
 await page.evaluate(()=>localStorage.setItem('marble-studio-claw-split-v1',JSON.stringify({count:1,limit:6000,sizeVersion:2})));
 await page.reload();await page.waitForFunction(()=>window.clawStudio);
 assert.equal(await page.evaluate(()=>window.clawStudio.snapshot().count),1);assert.equal(await page.evaluate(()=>window.clawStudio.snapshot().limit),20000);
 assert.equal(await page.locator('[aria-current="page"][href="/claw-split.html"]').count(),1);
 await page.locator('#pause').click();const paused=await page.evaluate(()=>window.clawStudio.state());await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>window.clawStudio.state()),paused);
 await page.locator('#ball-size').evaluate(el=>{el.value='18';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await page.evaluate(()=>window.clawStudio.snapshot().radius),9);assert.deepEqual(await page.evaluate(()=>window.clawStudio.state()),paused);
 await page.reload();await page.waitForFunction(()=>window.clawStudio);assert.equal(await page.locator('#ball-size').inputValue(),'18');await page.locator('#reference').click();assert.equal(await page.locator('#ball-size').inputValue(),'10');
 await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
 await page.locator('#record').click();await page.waitForTimeout(1800);assert.ok(await page.locator('#ball-size').isDisabled());await page.locator('#record').click();await page.waitForFunction(()=>!document.querySelector('#download').hidden);
 assert.deepEqual(errors,[]);const recording=await page.evaluate(async()=>{const url=document.querySelector('#download').href,blob=await fetch(url).then(r=>r.blob()),v=document.createElement('video');v.muted=true;v.src=url;await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=()=>reject(new Error(`Video error ${v.error?.code}: ${v.error?.message}; ${blob.size} bytes`));});return {bytes:blob.size,width:v.videoWidth,height:v.videoHeight};});assert.ok(recording.bytes>1000);assert.equal(recording.width,540);assert.equal(recording.height,960);assert.equal(await page.locator('#ball-size').isDisabled(),false);
 await page.screenshot({path:dir+'/desktop.jpg',type:'jpeg',quality:65});
 const simulation=await page.evaluate(async()=>{const {ClawSplit,renderClaw}=await import('/src/claw-split.js');const game=new ClawSplit();for(let i=0;i<120*120&&game.state==='running';i++)game.step();game.state='running';const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;const ctx=canvas.getContext('2d'),start=performance.now();for(let i=0;i<15;i++){game.step();game.step();renderClaw(ctx,game);}return {balls:game.balls.length,ms:(performance.now()-start)/15,image:canvas.toDataURL('image/jpeg',.65)};});await fs.writeFile(dir+'/finale.jpg',Buffer.from(simulation.image.split(',')[1],'base64'));delete simulation.image;
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:dir+'/mobile.jpg',type:'jpeg',quality:60});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);console.log(JSON.stringify({pause:true,liveSize:true,persistence:true,navigation:true,mobile:true,recording,simulation,errors}));
}finally{await browser.close();}
