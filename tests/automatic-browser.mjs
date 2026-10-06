import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {validateBatch} from '../src/factory-recipes.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');
 await page.waitForFunction(()=>document.body.classList.contains('automatic-home'));
 assert.equal(await page.locator('main').isVisible(),false);
 assert.equal(await page.locator('.view-tabs').isVisible(),false);
 await page.screenshot({path:'artifacts/automatic-home-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'artifacts/automatic-home-mobile.png'});
 const options=await page.evaluate(async()=>{const {automaticOptions}=await import('/src/automatic-home.js');return Promise.all(['auto','track','arena','territory','spiral','statistics'].map(automaticOptions));});
 for(const option of options){assert.equal(validateBatch(option).count,1);assert.equal(option.resolution,1080);assert.equal(option.automatic,true);assert.equal(option.source,undefined);}
 await page.locator('#automatic-edit').click();assert.equal(await page.locator('#watch-view').isVisible(),true);
 await page.locator('#automatic-back').click();assert.equal(await page.locator('main').isVisible(),false);
 const origin=process.env.TEST_FACTORY_ORIGIN;assert.ok(origin);
 await page.evaluate(origin=>document.querySelector('.factory-link').href=origin+'/factory.html',origin);
 let requests=[];
 await page.route(origin+'/api/queue',async route=>{requests.push(route.request().postDataJSON());await new Promise(resolve=>setTimeout(resolve,250));await route.fulfill({json:{ok:true},headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:5173'}});});
 await page.locator('#automatic-create').click();
 assert.equal(await page.locator('#automatic-create').isDisabled(),true);
 await page.waitForFunction(()=>document.querySelector('#videos-dialog').open);
 assert.equal(requests.length,1);validateBatch(requests[0]);assert.equal(await page.locator('#video-dialog').isVisible(),false);
 await page.locator('#videos-dialog [data-wb-close]').click();
 await page.locator('[name=kind][value=statistics]').check();await page.locator('#automatic-create').click();
 await page.waitForFunction(()=>document.querySelector('#videos-dialog').open);
 assert.equal(requests[1].automaticMode,'statistics');assert.equal(requests[1].automatic,true);
 await page.locator('#videos-dialog [data-wb-close]').click();
 await page.unroute(origin+'/api/queue');
 await page.route(origin+'/api/factory?limit=1',route=>route.abort());
 await page.locator('#automatic-create').click();await page.waitForFunction(()=>!document.querySelector('#automatic-create').disabled);
 assert.ok(await page.locator('#automatic-status').textContent());assert.equal(requests.length,2);
 assert.deepEqual(errors,[]);console.log('PASS: simple home, mobile, editor return, all automatic recipes, one-click queue, duplicate prevention, statistics provenance and service error recovery.');
}finally{await browser.close();}
