import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url())&&!/^http:\/\/127\.0\.0\.1:(5173|5180)\//.test(r.url()))external.push(r.url());});
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#open-balls').click();await page.locator('[data-library="2"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('[data-catalog-item]').length>20);
  assert.equal(await page.locator('#catalog-target').inputValue(),'2');
  await page.locator('#catalog-search').fill('turkiye');
  assert.equal(await page.locator('[data-catalog-item]').count(),1);
  await page.locator('[data-catalog-item]').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
  assert.equal(await page.locator('#catalog-target').inputValue(),'3');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));
  assert.equal(draft.ballNames[2],'Turkey');assert.match(draft.ballImages[2],/^data:image\/webp/);
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
  assert.deepEqual(verification.failures,[]);assert.equal(verification.categories,JSON.parse(fs.readFileSync('scripts/catalog-seed.json','utf8').replace(/^\uFEFF/,'')).length);
  assert.ok(verification.counts.every(count=>count>=10),'Every category has a usable selection');
  // Each mythology supplies a full default roster and persists its local portraits.
  await page.setViewportSize({width:1280,height:1000});
  for(const [category,name,query] of [['egyptian','Isis','isis'],['greek','Aphrodite','afrodit'],['norse','Thor','thor']]) {
    await page.locator('#open-balls').click();await page.locator('#open-catalog').click();
    await page.locator(`[data-category="${category}"]`).click();
    assert.equal(await page.locator('[data-catalog-item]').count(),12);
    await page.locator('#catalog-search').fill(query);
    assert.equal(await page.locator('[data-catalog-item]').count(),1);
    await page.locator('#catalog-target').selectOption('0');
    await page.locator('[data-catalog-item]').click();
    await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballNames[0]),name);
    await page.locator('#catalog-search').fill('');await page.locator('#catalog-fill').click();
    await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('Kadron hazır'));
    const mythologyRoster=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));
    const expectedNames=await page.evaluate(async category=>(await(await fetch('/catalog/manifest.json')).json()).items.filter(i=>i.category===category).map(i=>i.name).sort(),category);
    assert.deepEqual(mythologyRoster.ballNames.slice(0,12).sort(),expectedNames);
    assert.ok(mythologyRoster.ballImages.slice(0,12).every(src=>/^data:image\/webp/.test(src)));
    await page.screenshot({path:`artifacts/catalog-${category}.png`});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.querySelector('#catalog-dialog').scrollWidth<=innerWidth));
    await page.screenshot({path:`artifacts/catalog-${category}-mobile.png`});
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.reload();
    await page.waitForFunction(()=>window.marbleStudio);
    const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));
    assert.deepEqual(restored.ballImages,mythologyRoster.ballImages);
    assert.deepEqual(restored.ballNames.slice(0,12).sort(),expectedNames);
    await page.setViewportSize({width:1280,height:1000});
  }
  await page.setViewportSize({width:1280,height:1000});await page.locator('#nav-track').click();
  const download=page.waitForEvent('download');await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await page.locator('#channel-choice select').selectOption('LastBallStand');await page.locator('#channel-choice button[type=submit]').click();await page.waitForFunction(()=>window.marbleStudio.getState().time>1);await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await(await download).saveAs('artifacts/catalog-race.webm');
  assert.ok(fs.statSync('artifacts/catalog-race.webm').size>10000);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log(`PASS: ${verification.count} local assets decode and rasterize; three mythology rosters, bilingual search, single assignment, names, persistence, mobile, empty search and recorded video.`);
}finally{await browser.close();}
