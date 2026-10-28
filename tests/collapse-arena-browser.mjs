import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173',dir='artifacts/collapse-arena';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1365,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/collapse-arena.html');await page.waitForFunction(()=>window.collapseArena?.getState().time>.2);
 await page.locator('#pause').click();const paused=await page.evaluate(()=>window.collapseArena.getState());await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>window.collapseArena.getState()),paused);
 await page.locator('#growth').selectOption('10');await page.locator('#pause').click();assert.equal(await page.evaluate(()=>window.collapseArena.snapshot().growth),10);
 await page.locator('#playbackSpeed').selectOption('3');await page.reload();await page.waitForFunction(()=>window.collapseArena);assert.equal(await page.locator('#playbackSpeed').inputValue(),'3');await page.locator('#pause').click();
 assert.ok(await page.locator('a[href="/collapse-arena.html"]').count());
 await page.screenshot({path:dir+'/desktop.jpg',type:'jpeg',quality:65});
 await page.locator('#studio-export').click();await page.waitForFunction(()=>document.querySelector('#video-dialog')?.open);assert.equal(await page.locator('#video-source-name').innerText(),'Çöken Arena');
 await page.locator('#video-dialog [data-wb-close]').click();
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile overflow');await page.screenshot({path:dir+'/mobile.jpg',type:'jpeg',quality:65});
 await page.goto(origin+'/collapse-arena.html?video-render=1&render-width=360');await page.waitForFunction(()=>window.breakerVideo);
 await page.evaluate(()=>{const v=window.breakerVideo;v.reset({seed:42,growth:5,fragments:16},()=>{},'');for(let i=0;i<120*30;i++)v.step(1/120);v.draw();});
 await page.locator('#game').screenshot({path:dir+'/middle.jpg',type:'jpeg',quality:70});
 const render=await page.evaluate(()=>{const v=window.breakerVideo;let events=0;v.reset({seed:42,growth:10,fragments:8},()=>events++,'');let steps=0;while(v.state()==='running'&&steps<120*240){v.step(1/120);steps++;}const c=v.draw();return {state:v.state(),width:c.width,events,steps};});
 assert.equal(render.state,'won');assert.equal(render.width,360);assert.ok(render.events>0);await page.locator('#game').screenshot({path:dir+'/ending.jpg',type:'jpeg',quality:70});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:'passed',render,artifacts:dir}));
}finally{await browser.close();}
