import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/matches?**',route=>route.fulfill({json:{events:[],updatedAt:new Date().toISOString(),stale:false}}));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#nav-spiral').click();assert.ok(await page.locator('#spiral-randomize').isVisible());
  const gates=()=>page.evaluate(()=>window.marbleStudio.getState().spiralGates);
  const original=await gates();assert.ok(original.length>=4&&original.length<=6);
  await page.locator('#reset').click();assert.deepEqual(await gates(),original);
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-spiral').click();assert.deepEqual(await gates(),original);
  await page.locator('#spiral-randomize').click();const next=await gates();assert.notDeepEqual(next,original);
  assert.equal(await page.evaluate(()=>window.marbleStudio.getState().state),'ready');
  await page.locator('#new-race').click();await page.waitForFunction(()=>window.marbleStudio.getState().countdown>0||window.marbleStudio.getState().state==='running');
  const fresh=await gates();assert.notDeepEqual(fresh,next);await page.locator('#reset').click();
  await page.screenshot({path:'artifacts/spiral-random-multipliers.png',fullPage:true});
  const snapshot=await page.evaluate(()=>({mode:'spiral',project:JSON.parse(localStorage.getItem('marble-studio-spiral-v1'))}));
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'artifacts/spiral-random-multipliers-mobile.png',fullPage:true});
  await page.locator('#nav-track').click();assert.ok(await page.locator('#spiral-randomize').isHidden());
  await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  const exported=await page.evaluate(async snapshot=>{
    const {sourceRecipe}=await import('/src/factory-recipes.js'),{Spiral}=await import('/src/spiral.js');
    const recipe=sourceRecipe(snapshot,snapshot.project.seed),race=new Spiral(recipe);
    const gates=race.multipliers.map(g=>({id:g.id,value:g.value,distance:g.distance,point:g.point,hits:g.hits}));
    const analysis=window.factoryRenderer.probe(recipe);
    await window.factoryRenderer.begin({recipe,analysis,speed:1,fps:30,width:720,height:1280,copy:{hook:'Spiral multipliers'},channel:'LastBallStand'});
    window.factoryRenderer.frame(0);return {gates,complete:analysis.complete,finite:analysis.finite};
  },snapshot);
  assert.deepEqual(exported.gates,fresh);assert.ok(exported.complete);assert.ok(exported.finite);assert.deepEqual(errors,[]);
  console.log('PASS: visible spiral multipliers, reset/reload reproducibility, manual randomization, new-race variation, mobile layout and identical production-render layout.');
}finally{await browser.close();}
