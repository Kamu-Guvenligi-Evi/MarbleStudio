import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const dir='artifacts/merge-evolution';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1540,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/merge-evolution.html');await page.waitForFunction(()=>window.mergeStudio?.state().time>.3);
 assert.equal(await page.locator('.theme-card').count(),25);assert.equal(await page.locator('[aria-current="page"][href="/merge-evolution.html"]').count(),1);
 await page.locator('#pause').click();const state=await page.evaluate(()=>window.mergeStudio.state());await page.waitForTimeout(100);assert.deepEqual(await page.evaluate(()=>window.mergeStudio.state()),state);
 await page.locator('#theme-search').fill('neptun');assert.equal(await page.locator('.theme-card').count(),1);await page.locator('[data-theme="planets"]').click();assert.equal(await page.locator('#evolution-chain li').count(),6);
 await page.locator('#theme-search').fill('impossible theme');assert.equal(await page.locator('.empty').count(),1);await page.locator('#theme-search').fill('');
 await page.locator('#speed').selectOption('2');await page.reload();await page.waitForFunction(()=>window.mergeStudio);assert.equal(await page.locator('#speed').inputValue(),'2');assert.equal(await page.evaluate(()=>window.mergeStudio.snapshot().theme),'planets');
 await page.locator('#studio-export').click();await page.waitForFunction(()=>document.querySelector('#video-dialog')?.open);assert.equal(await page.locator('#video-source-name').innerText(),'Evrim Arenası');await page.locator('#video-dialog [data-wb-close]').click();
 await page.screenshot({path:dir+'/desktop.jpg',type:'jpeg',quality:65});await page.setViewportSize({width:390,height:844});await page.screenshot({path:dir+'/mobile.jpg',type:'jpeg',quality:65});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
 const result=await page.evaluate(async()=>{const {normalizeMerge}=await import('/src/merge-evolution.js');const recipe={...normalizeMerge({theme:'fruit',speed:2}),mode:'merge-evolution'},analysis=window.factoryRenderer.probe(recipe);await window.factoryRenderer.begin({recipe,analysis,speed:1,intro:0,fps:30,width:540,height:960,template:'minimal',copy:{hook:'Merge'},channel:'LastBallStand'});window.factoryRenderer.frame(Math.ceil((analysis.simulationSeconds+1)*30));return {analysis,result:window.factoryRenderer.result(),audio:window.factoryRenderer.audio()};});assert.equal(result.result.complete,true);assert.equal(result.result.outcome,result.analysis.outcome);assert.ok(result.audio.effects.length>0);assert.ok(result.audio.effects.every(e=>e.time<=result.analysis.simulationSeconds));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({desktop:true,mobile:true,search:true,persistence:true,pause:true,exportDialog:true,renderResult:result.result,audioCues:result.audio.effects.length,browserErrors:errors}));
}finally{await browser.close();}
