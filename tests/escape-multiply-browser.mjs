import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const dir='artifacts/escape-multiply';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{const u=new URL(route.request().url());return !u.protocol.startsWith('http')||['127.0.0.1','localhost'].includes(u.hostname)?route.continue():route.abort();});
  await page.goto('http://127.0.0.1:5173/escape-multiply.html');await page.waitForFunction(()=>window.escapeStudio?.state().time>.1);
  assert.equal(await page.locator('[aria-current="page"][href="/escape-multiply.html"]').count(),1);
  await page.locator('#pause').click();const paused=await page.evaluate(()=>window.escapeStudio.state());await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>window.escapeStudio.state()),paused);
  assert.equal(await page.locator('#ball-size').inputValue(),'10');
  await page.locator('#ball-size').evaluate(el=>{el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>window.escapeStudio.snapshot().radius),10);
  assert.equal(await page.locator('#ball-size-value').textContent(),'20 px');
  assert.deepEqual(await page.evaluate(()=>window.escapeStudio.state()),paused,'resizing must preserve progress and pause');
  await page.locator('#addition').fill('5');await page.locator('#addition').dispatchEvent('change');await page.reload();await page.waitForFunction(()=>window.escapeStudio);assert.equal(await page.locator('#addition').inputValue(),'5');
  assert.equal(await page.locator('#ball-size').inputValue(),'20');
  await page.evaluate(()=>localStorage.setItem('marble-studio-escape-multiply-v1',JSON.stringify({radius:2.5})));await page.reload();await page.waitForFunction(()=>window.escapeStudio);
  assert.equal(await page.locator('#ball-size').inputValue(),'10','upgrade old tiny default');
  await page.locator('#ball-size').evaluate(el=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.reload();await page.waitForFunction(()=>window.escapeStudio);
  assert.equal(await page.locator('#ball-size').inputValue(),'5','preserve newly chosen small sizes');
  await page.locator('#reference').click();assert.equal(await page.locator('#addition').inputValue(),'3');
  await page.screenshot({path:dir+'/desktop.jpg',type:'jpeg',quality:60});
  const simulation=await page.evaluate(async()=>{const {EscapeMultiply,renderEscape}=await import('/src/escape-multiply.js');const g=new EscapeMultiply();while(!g.finalizing&&g.time<180)g.step();if(!g.finalizing)throw new Error("Ring did not fill");document.querySelector('#pause').click();const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;const ctx=canvas.getContext('2d');const start=performance.now();for(let i=0;i<15;i++){g.step();g.step();renderEscape(ctx,g);}return {count:g.created,millisecondsPerFrame:(performance.now()-start)/15,image:canvas.toDataURL('image/jpeg',.65)};});
  await fs.writeFile(dir+'/finale.jpg',Buffer.from(simulation.image.split(',')[1],'base64'));delete simulation.image;
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:dir+'/mobile.jpg',type:'jpeg',quality:60});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({pause:true,persistence:true,navigation:true,mobile:true,simulation,errors}));
}finally{await browser.close();}
