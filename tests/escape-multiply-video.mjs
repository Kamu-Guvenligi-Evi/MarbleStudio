import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {validateBatch,sourceRecipe} from '../src/factory-recipes.js';
const source=normalizeSnapshot({mode:'escape-multiply',project:{seed:49,speed:3,radius:16,count:50}});
assert.equal(source.mode,'escape-multiply');assert.equal(source.project.sound,true);
const options=validateBatch({source,strategy:'exact',count:1,fps:60,audio:'effects',resolution:720});assert.equal(options.fps,60);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/escape-multiply.html');await page.locator('#studio-export').click();
 await page.waitForFunction(()=>document.querySelector('#video-source-name')?.textContent.includes('Ka'));
 assert.equal(await page.locator('#video-dialog [name="fps"]').inputValue(),'60');
 assert.equal(await page.locator('#video-dialog [name="audio"]').inputValue(),'effects');
 assert.equal(await page.locator('#record').count(),0);
 await page.locator('#video-dialog [data-wb-close]').click();await page.locator('#studio-videos').click();assert.equal(await page.locator('#videos-dialog').isVisible(),true);
 await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
 const recipe=sourceRecipe(source,49);
 const analysis=await page.evaluate(r=>window.factoryRenderer.probe(r),recipe);assert.equal(analysis.complete,true);
 const result=await page.evaluate(async({recipe,analysis})=>{
  const duration=Math.ceil(analysis.simulationSeconds+2);
  await window.factoryRenderer.begin({recipe,analysis,speed:1,intro:0,duration,fps:60,width:720,height:1280,template:'minimal',copy:{hook:''}});
  window.factoryRenderer.frame(0);window.factoryRenderer.frame((duration-1)*60);
  const data=await window.factoryRenderer.escapeAudio(duration,'effects');
  const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);let peak=0;for(let i=44;i<bytes.length;i+=2)peak=Math.max(peak,Math.abs(view.getInt16(i,true)));
  return {result:window.factoryRenderer.result(),duration,bytes:bytes.length,peak,muted:await window.factoryRenderer.escapeAudio(duration,'none')};
 },{recipe,analysis});
 assert.equal(result.result.complete,true);assert.ok(result.peak>100);assert.equal(result.muted,null);assert.equal(result.bytes,44+result.duration*48000*4);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({workbench:true,fps:60,audio:'collision melody',...result,errors}));
}finally{await browser.close();}
