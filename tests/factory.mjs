const origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5180';
import assert from 'node:assert/strict';
import {recipe,identity,structure,copyFor,validateBatch} from '../src/factory-recipes.js';
import {normalizeSequence} from '../src/section-settings.js';
import {chromium} from 'playwright';
assert.throws(()=>validateBatch({count:0}));assert.throws(()=>validateBatch({duration:Infinity}));assert.throws(()=>validateBatch({modes:[]}));assert.throws(()=>validateBatch({modes:['unknown']}));assert.throws(()=>validateBatch({language:'x'}));
const seen=new Set(),shapes=new Set();
for(let seed=1;seed<=100;seed++){
  const r=recipe(seed,'track');assert.deepEqual(r,recipe(seed,'track'));normalizeSequence(r.sequence);
  seen.add(identity(r));shapes.add(structure(r));assert.ok(copyFor(r,'en').title.length<100);
}
assert.equal(seen.size,100);assert.ok(shapes.size>90);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/factory.html');await page.waitForFunction(()=>document.querySelector('#output').textContent.startsWith('Çıktı klasörü:'));
  await page.screenshot({path:'artifacts/factory-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.goto(origin+'/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  for(const mode of ['arena','spiral','track']){
    const r=recipe(2048,mode);const analysis=await page.evaluate(r=>window.factoryRenderer.probe(r),r);
    assert.ok(analysis.finite);assert.ok(analysis.hits>0);assert.ok(analysis.simulationSeconds>0);
    console.log(mode,JSON.stringify(analysis));
  }
  const unauthorized=await fetch(origin+'/api/queue',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(unauthorized.status,403);
  const invalid=await fetch(origin+'/api/queue',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({count:31})});assert.equal(invalid.status,400);
  const traversal=await fetch(origin+'/output/factory.json');assert.equal(traversal.status,404);
  assert.deepEqual(errors,[]);console.log('PASS: deterministic variation, validation, render probing, desktop/mobile panel and local API guards.');
}finally{await browser.close();}
