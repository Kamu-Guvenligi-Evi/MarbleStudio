import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({channel:'chrome',headless:true});
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],assets=new Set();
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{const url=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(url.hostname)||!url.protocol.startsWith('http')?route.continue():route.abort();});
  page.on('request',req=>{if(/\/catalog\/.*\.(webp|png|svg|jpg)/.test(req.url()))assets.add(req.url());});
  await page.goto(origin+'/index.html?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  await page.route('**/catalog/manifest.json',route=>route.fulfill({status:200,contentType:'application/json',body:'{"items":[{}] }'}));
  await page.locator('#open-balls').click();await page.locator('[data-library="2"]').click();
  await page.locator('#catalog-retry').waitFor({state:'visible'});
  assert.match(await page.locator('#catalog-grid').innerText(),/yüklenemedi/);
  await page.unroute('**/catalog/manifest.json');await page.locator('#catalog-retry').click();
  await page.locator('[data-category="all"]').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('#catalog-grid img')].some(img=>img.naturalWidth>0));
  const cards=await page.locator('[data-catalog-item]').count();
  assert.ok(cards>300);assert.ok(assets.size<cards/2,`${assets.size}/${cards} images loaded eagerly`);
  await page.locator('#catalog-search').fill('turkiye');assert.equal(await page.locator('[data-catalog-item]').count(),1);
  await page.locator('[data-catalog-item]').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
  assert.equal(await page.locator('#catalog-target').inputValue(),'3');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));
  assert.equal(draft.ballNames[2],'Turkey');assert.match(draft.ballImages[2],/^data:image\/webp/);
  assert.deepEqual(errors,[]);
  console.log(`PASS: malformed catalog retry, ${cards} available images with visible previews only, search and image assignment.`);
}finally{await browser.close();}
