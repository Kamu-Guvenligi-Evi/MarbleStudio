import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('public/catalog/manifest.json','utf8'));
const items=catalog.items.filter(x=>x.category==='history');
assert.ok(items.length>=96);assert.equal(new Set(items.map(x=>x.id)).size,items.length);
for(const item of items){
 assert.ok(fs.existsSync('public'+item.src),item.name);
 if(item.curated){assert.ok(item.credit&&item.license&&item.identitySource);assert.deepEqual(item,JSON.parse(fs.readFileSync('public/catalog/'+item.id+'.json','utf8')));}
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!/^http:\/\/127\.0\.0\.1:(5173|5180)\//.test(r.url()))external.push(r.url());});
 await page.route('**/api/matches?**',route=>route.fulfill({json:{events:[],updatedAt:new Date().toISOString(),stale:false}}));
 await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
 await page.evaluate(async()=>{
  const {prepareCatalogImage}=await import('/src/image-catalog.js');
  const items=(await(await fetch('/catalog/manifest.json')).json()).items.filter(x=>x.category==='history');
  for(let batch=0;batch<2;batch++){
   const sheet=document.createElement('canvas');sheet.width=960;sheet.height=720;const c=sheet.getContext('2d');c.fillStyle='#172239';c.fillRect(0,0,960,720);
   for(let i=0;i<48;i++){const item=items[batch*48+i],img=new Image();img.src=await prepareCatalogImage(item);await img.decode();const x=(i%8)*120,y=Math.floor(i/8)*120;c.save();c.beginPath();c.arc(x+60,y+48,42,0,7);c.clip();c.drawImage(img,x+18,y+6,84,84);c.restore();c.fillStyle='white';c.font='10px sans-serif';c.textAlign='center';c.fillText(item.name,x+60,y+108,116);}
   sheet.id='history-sheet-'+batch;document.body.append(sheet);
  }
 });
 for(let i=0;i<2;i++)await page.locator('#history-sheet-'+i).screenshot({path:'artifacts/history-contact-'+i+'.png'});
 await page.locator('#open-balls').click();await page.locator('#open-catalog').click();await page.locator('[data-category="history"]').click();
 assert.equal(await page.locator('[data-catalog-item]').count(),items.length);
 await page.locator('#catalog-search').fill('matematikçi');assert.ok(await page.locator('[data-catalog-item]').count()>=5);
 await page.locator('#catalog-search').fill('Mimar Sinan');assert.equal(await page.locator('[data-catalog-item]').count(),1);
 await page.locator('#catalog-target').selectOption('0');await page.locator('[data-catalog-item]').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballNames[0]),'Mimar Sinan');
 await page.locator('#catalog-search').fill('');await page.locator('#catalog-fill').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('Kadron hazır'));
 const roster=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));assert.equal(new Set(roster.ballNames.slice(0,12)).size,12);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.querySelector('#catalog-dialog').scrollWidth<=innerWidth));
 await page.reload();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballImages),roster.ballImages);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS: expanded history, assets, credits, field search, selection, roster, persistence, mobile; no external image requests.');
}finally{await browser.close();}
