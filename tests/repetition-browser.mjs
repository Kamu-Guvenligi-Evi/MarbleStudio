import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();let protectedService=0,queued=0;
 await page.route('http://127.0.0.1:5180/api/**',async route=>{
  const capabilities=['studio-workbench','automatic-diversity',...(protectedService>=1?['long-term-repetition']:[]),...(protectedService>=2?['episode-formats']:[])];
  if(route.request().method()==='POST')queued++;
  await route.fulfill({json:route.request().method()==='POST'?{ok:true}:{apiVersion:3,capabilities,jobs:[],summary:{done:0,pending:0},total:0},headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:5173','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
 });
 await page.goto('http://127.0.0.1:5173');await page.locator('#automatic-create').click();
 await page.waitForFunction(()=>!document.querySelector('#automatic-create').disabled&&document.querySelector('#automatic-status').textContent);
 assert.equal(queued,0);assert.match(await page.locator('#automatic-status').textContent(),/yeniden başlat/);
 protectedService=1;await page.locator('#automatic-create').click();await page.waitForFunction(()=>!document.querySelector('#automatic-create').disabled);assert.equal(queued,0);
 protectedService=2;await page.locator('#automatic-create').click();await page.waitForFunction(()=>document.querySelector('#videos-dialog').open);
 assert.equal(queued,1);console.log('PASS: old services cannot silently bypass long-term protection; updated services accept one-click production.');
}finally{await browser.close();}
