import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {englishRosterName} from '../src/output-language.js';

const catalog=JSON.parse(readFileSync('public/catalog/manifest.json','utf8'));
const seed=JSON.parse(readFileSync('scripts/catalog-seed.json','utf8').replace(/^\uFEFF/,''));
const groups=[['teams',48,'goztepe','Göztepe'],['nba',30,'miami heat','Miami Heat'],['nfl',32,'kansas city','Kansas City Chiefs']];
assert.equal(new Set(catalog.items.map(i=>i.id)).size,catalog.items.length);
for(const [category,count] of groups){
  const items=catalog.items.filter(i=>i.category===category);
  assert.equal(items.length,count);assert.equal(new Set(items.map(i=>i.name)).size,count);
  assert.equal(seed.find(g=>g.id===category).items.length,count);
  for(const item of items){assert.ok(existsSync('public'+item.src),item.name);assert.ok(item.source&&item.credit&&item.license,item.name);}
}
for(const name of ['Los Angeles Lakers','Chicago Bulls','Boston Celtics','Golden State Warriors']){
  const id='teams-'+createHash('sha1').update(name).digest('hex').slice(0,10);
  assert.equal(catalog.items.find(i=>i.id===id)?.category,'nba','Legacy NBA image IDs must survive regrouping');
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:\/\//,route=>{
    if(new URL(route.request().url()).hostname==='127.0.0.1')return route.continue();
    external.push(route.request().url());return route.abort();
  });
  // Keep live fixture requests separate from the catalog's offline asset check.
  await page.route('**/api/matches?**',route=>{
    const query=new URL(route.request().url()).searchParams;
    return route.fulfill({json:{league:query.get('league'),date:query.get('date'),updatedAt:new Date().toISOString(),stale:false,events:[]}});
  });
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  const failed=await page.evaluate(async()=>{
    const {prepareCatalogImage}=await import('/src/image-catalog.js');
    const catalog=await(await fetch('/catalog/manifest.json')).json(),failed=[];
    for(const item of catalog.items.filter(i=>['teams','nba','nfl'].includes(i.category))){
      try{const src=await prepareCatalogImage(item);const image=new Image();image.src=src;await image.decode();if(image.naturalWidth<128)throw Error('Small raster');}
      catch(error){failed.push(item.name+': '+error.message);}
    }
    return failed;
  });
  assert.deepEqual(failed,[]);
  for(const [category,count,query,name] of groups){
    await page.locator('#open-balls').click();await page.locator('#open-catalog').click();
    await page.locator(`[data-category="${category}"]`).click();
    assert.equal(await page.locator('[data-catalog-item]').count(),count);
    await page.locator('#catalog-search').fill(query);assert.equal(await page.locator('[data-catalog-item]').count(),1);
    await page.locator('#catalog-target').selectOption('0');await page.locator('[data-catalog-item]').click();
    await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballNames[0]),name);
    await page.locator('#catalog-search').fill('');await page.locator('#catalog-fill').click();
    await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('Kadron hazır'));
    const roster=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));
    const names=roster.ballNames.slice(0,roster.count),allowed=catalog.items.filter(i=>i.category===category).map(i=>englishRosterName(i.name));
    assert.equal(new Set(names).size,roster.count);assert.ok(names.every(name=>allowed.includes(name)));
    assert.ok(roster.ballImages.slice(0,roster.count).every(src=>src.startsWith('data:image/webp')));
    await page.screenshot({path:`artifacts/catalog-${category}-expanded.png`});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.querySelector('#catalog-dialog').scrollWidth<=innerWidth));
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.reload();
    await page.waitForFunction(()=>window.marbleStudio);
    const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));
    assert.deepEqual(restored.ballImages,roster.ballImages);assert.deepEqual(restored.ballNames,roster.ballNames);
    await page.setViewportSize({width:1280,height:1000});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('PASS: 48 football, 30 NBA and 32 NFL logos; offline decode, search, roster fill, local persistence, legacy IDs and mobile layout.');
}finally{await browser.close();}
