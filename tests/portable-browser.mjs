import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {productionBrowserOptions} from '../scripts/browser-runtime.mjs';
import {selectTestChannel} from './browser-channel.mjs';

const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5173';
const browser=await chromium.launch(productionBrowserOptions());
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
  page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(30000);
  await selectTestChannel(page);
  console.log('Opening packaged Studio');
  await page.goto(origin);await page.waitForFunction(()=>window.marbleStudio);
  console.log('Checking local images');
  const assets=await page.evaluate(async()=>{
    const catalog=await (await fetch('/catalog/manifest.json')).json();
    const samples=catalog.categories.flatMap(category=>catalog.items.filter(i=>i.category===category.id).slice(0,2));
    await Promise.all(samples.map(async item=>{const img=new Image();img.src=item.src;await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error(item.src)),15000))]);}));
    return {count:catalog.items.length,checked:samples.length};
  });
  assert.ok(assets.count>300);assert.ok(assets.checked>20);
  console.log('Checking catalog recovery');
  await page.route('**/catalog/manifest.json',route=>route.abort());
  await page.locator('#open-balls').click();await page.locator('[data-library="0"]').click();
  await page.waitForFunction(()=>!document.querySelector('#catalog-retry').hidden);
  assert.match(await page.locator('#catalog-status').textContent(),/Baslat.cmd/);
  await page.unroute('**/catalog/manifest.json');await page.locator('#catalog-retry').click();
  await page.waitForFunction(()=>document.querySelectorAll('[data-catalog-item]').length>20);
  await page.locator('#catalog-search').fill('turkiye');await page.locator('[data-catalog-item]').click();
  await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  // Snapshot creation must not decode or fetch leader music in the browser.
  console.log('Checking video recovery');
  await page.route('**/music/**',route=>route.abort());
  await page.route('**/api/factory?*',route=>route.abort());
  await page.locator('#studio-export').click();
  await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Tekrar dene');
  assert.equal(await page.locator('#video-submit').isEnabled(),true);
  assert.match(await page.locator('#video-message').textContent(),/Baslat.cmd/);
  await page.unroute('**/api/factory?*');await page.locator('#video-submit').click();
  await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');
  assert.equal(await page.locator('[name=duration]').count(),0);
  await page.selectOption('[name=strategy]','variations');assert.equal(await page.locator('[name=duration]').count(),0);
  await page.locator('#video-dialog [data-wb-close]').click();
  await page.unroute('**/music/**');
  for(const game of ['spiral-breaker','glass-breaker','ball-duel']){
    console.log('Opening '+game);
    await page.goto(origin);await page.locator(`a[href="/${game}.html"]`).click();
    await page.waitForURL(`**/${game}.html`);
    await page.locator('#video-dialog').waitFor({state:'attached'});
    assert.equal(new URL(page.url()).origin,origin);
    await page.locator('#studio-export').click();
    await page.waitForFunction(()=>document.querySelector('#video-submit')?.textContent==='Videoyu hazırla');
    assert.equal(await page.locator('[name=duration]').count(),0);
  }
  await page.goto(origin+'/factory.html');
  await page.waitForFunction(()=>document.querySelector('#output').textContent.startsWith('Çıktı klasörü:'));
  assert.equal(await page.locator('[name=duration]').count(),0);
  await page.locator('header a').click();await page.waitForFunction(()=>window.marbleStudio);
  assert.equal(new URL(page.url()).origin,origin);
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${assets.count}-item catalog, ${assets.checked} decoded category samples, catalog retry, video retry without browser audio downloads, all three game links, workshop return, no target duration (${origin}).`);
}finally{await browser.close();}
