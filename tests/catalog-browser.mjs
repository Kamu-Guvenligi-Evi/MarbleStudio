import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:5173/'))external.push(r.url());});
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#open-balls').click();await page.locator('[data-library="2"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('[data-catalog-item]').length>20);
  assert.equal(await page.locator('#catalog-target').inputValue(),'2');
  await page.locator('#catalog-search').fill('turkiye');
  assert.equal(await page.locator('[data-catalog-item]').count(),1);
  await page.locator('[data-catalog-item]').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
  assert.equal(await page.locator('#catalog-target').inputValue(),'3');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));
  assert.equal(draft.ballNames[2],'Türkiye');assert.match(draft.ballImages[2],/^data:image\/webp/);
  await page.locator('#catalog-search').fill('');await page.locator('[data-category="teams"]').click();
  await page.locator('#catalog-fill').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('Kadron hazır'));
  const roster=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));
  assert.equal(new Set(roster.ballNames.slice(0,12)).size,12);assert.ok(roster.ballImages.slice(0,12).every(Boolean));
  await page.screenshot({path:'artifacts/catalog-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/catalog-mobile.png'});
  assert.ok(await page.evaluate(()=>document.querySelector('#catalog-dialog').scrollWidth<=innerWidth));
  await page.locator('#catalog-search').fill('not-existing-zzz');assert.equal(await page.locator('[data-catalog-item]').count(),0);assert.ok(await page.locator('#catalog-fill').isDisabled());
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.reload();
  const reloaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));assert.deepEqual(reloaded.ballImages,roster.ballImages);assert.deepEqual(reloaded.ballNames,roster.ballNames);
  // Decode and rasterize every local asset, including SVG logos; no external request needed.
  const verification=await page.evaluate(async()=>{
    const catalog=await(await fetch('/catalog/manifest.json')).json();const {prepareCatalogImage}=await import('/src/image-catalog.js');
    const failures=[];for(const item of catalog.items){try{await prepareCatalogImage(item);}catch(e){failures.push(item.name+': '+e.message);}}
    return {failures,count:catalog.items.length,categories:catalog.categories.length,counts:catalog.categories.map(g=>catalog.items.filter(i=>i.category===g.id).length)};
  });
  assert.deepEqual(verification.failures,[]);assert.equal(verification.categories,10);
  assert.ok(verification.counts.every(count=>count>=10),'Every category has a usable selection');
  await page.setViewportSize({width:1280,height:1000});await page.locator('#nav-track').click();
  const download=page.waitForEvent('download');await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await page.waitForFunction(()=>window.marbleStudio.getState().time>1);await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await(await download).saveAs('artifacts/catalog-race.webm');
  assert.ok(fs.statSync('artifacts/catalog-race.webm').size>10000);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log(`PASS: ${verification.count} local assets decode and rasterize; search, single assignment, unique category roster, names, persistence, mobile, empty search and recorded video.`);
}finally{await browser.close();}
