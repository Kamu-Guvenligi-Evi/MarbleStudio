import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
 await page.locator('#nav-arena').click();await page.locator('#arena-game').selectOption('territory');
 assert.equal(await page.locator('#watch-title').innerText(),'Alan Savaşı');assert.ok(await page.locator('#arena-shape').isVisible());
 await page.locator('#arena-shape').selectOption('star');await page.locator('#territory-duration').selectOption('30');
 await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-arena').click();
 assert.equal(await page.locator('#arena-game').inputValue(),'territory');assert.equal(await page.locator('#arena-shape').inputValue(),'star');assert.equal(await page.locator('#territory-duration').inputValue(),'30');
 assert.match(await page.locator('#ranking').innerText(),/% alan/);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/territory-mobile.png',fullPage:true});
 await page.locator('#arena-game').selectOption('links');assert.ok(await page.locator('#arena-shape').isHidden());assert.equal(await page.locator('#watch-title').innerText(),'Küre arenası');
 await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
 const report=await page.evaluate(async()=>{
  const catalog=await (await fetch('/catalog/manifest.json')).json(),items=catalog.items.filter(i=>i.category==='teams').slice(0,6);
  const ballImages=await window.factoryRenderer.prepareRoster(items);
  const recipe={mode:'arena',arenaGame:'territory',arenaShape:'triangle',territoryDuration:30,seed:2048,count:6,ballNames:items.map(i=>i.name),ballImages,language:'tr'};
  const analysis=window.factoryRenderer.probe(recipe);await window.factoryRenderer.begin({recipe,analysis,intro:0,speed:1,fps:30,width:1080,height:1920,template:'minimal',copy:{language:'tr',title:'Alan Savaşı',hook:'Kim kazanacak?'}});
  window.factoryRenderer.frame(450);return {analysis,names:recipe.ballNames};
 });
 assert.ok(report.analysis.complete);assert.ok(report.analysis.finite);assert.equal(report.analysis.simulationSeconds,30);assert.ok(report.analysis.hits>0);assert.ok(report.names.length===6);
 await page.locator('#render').screenshot({path:'artifacts/territory-triangle.png'});
 await page.evaluate(()=>window.factoryRenderer.frame(900));await page.locator('#render').screenshot({path:'artifacts/territory-winner.png'});
 assert.deepEqual(errors,[]);console.log('PASS: shape/duration persistence, live percentages, mobile layout, original arena, team roster, production probe, territory and winner rendering.');
}finally{await browser.close();}
