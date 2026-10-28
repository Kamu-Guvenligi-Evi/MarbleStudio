import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('public/catalog/manifest.json','utf8'));
const empires=catalog.items.filter(x=>x.category==='empires');
assert.equal(empires.length,40);
for(const item of empires){
 assert.equal(item.fit,'flag');assert.ok(item.historicalNote);assert.ok(item.credit);assert.ok(item.license);
 assert.deepEqual(item,JSON.parse(fs.readFileSync('public/catalog/'+item.id+'.json','utf8')));
 assert.ok(!/map|projection|expansion|Joppen|Timurid_State|Trajan_117/i.test(item.source),item.name);
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!/^http:\/\/127\.0\.0\.1:(5173|5180)\//.test(r.url()))external.push(r.url());});
 await page.route('**/api/matches?**',route=>route.fulfill({json:{events:[],updatedAt:new Date().toISOString(),stale:false}}));
 await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
 const result=await page.evaluate(async()=>{
  const {prepareCatalogImage}=await import('/src/image-catalog.js');
  const items=(await(await fetch('/catalog/manifest.json')).json()).items.filter(x=>x.category==='empires');
  const sheet=document.createElement('canvas');sheet.width=800;sheet.height=Math.ceil(items.length/6)*150;const c=sheet.getContext('2d');c.fillStyle='#172239';c.fillRect(0,0,sheet.width,sheet.height);
  for(let i=0;i<items.length;i++){const img=new Image();img.src=await prepareCatalogImage(items[i]);await img.decode();const x=(i%6)*133,y=Math.floor(i/6)*150;c.save();c.beginPath();c.arc(x+66,y+55,47,0,7);c.clip();c.drawImage(img,x+19,y+8,94,94);c.restore();c.fillStyle='white';c.font='10px sans-serif';c.textAlign='center';c.fillText(items[i].name,x+66,y+122,129);}
  sheet.id='empire-test-sheet';document.body.append(sheet);
  // Both edge stripes must survive preparation; the previous square crop removed them.
  const src=document.createElement('canvas');src.width=300;src.height=150;const s=src.getContext('2d');s.fillStyle='red';s.fillRect(0,0,300,150);s.fillStyle='#00ff00';s.fillRect(0,0,30,150);s.fillStyle='#0000ff';s.fillRect(270,0,30,150);
  const img=new Image();img.src=await prepareCatalogImage({id:'flag-edges-test',src:src.toDataURL(),fit:'flag'});await img.decode();const p=document.createElement('canvas');p.width=p.height=128;const pc=p.getContext('2d');pc.drawImage(img,0,0);
  return {left:[...pc.getImageData(15,64,1,1).data],right:[...pc.getImageData(112,64,1,1).data]};
 });
 assert.ok(result.left[1]>200&&result.left[0]<50);assert.ok(result.right[2]>200&&result.right[0]<50);
 await page.locator('#empire-test-sheet').screenshot({path:'artifacts/empires-contact-sheet.png'});
 await page.locator('#open-balls').click();await page.locator('#open-catalog').click();await page.locator('[data-category="empires"]').click();
 assert.equal(await page.locator('[data-catalog-item]').count(),40);assert.equal(await page.locator('.catalog-history').count(),40);
 await page.locator('#catalog-search').fill('Brezilya');assert.equal(await page.locator('[data-catalog-item]').count(),1);
 await page.locator('#catalog-target').selectOption('0');await page.locator('[data-catalog-item]').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballNames[0]),'Empire of Brazil');
 await page.locator('#catalog-search').fill('');await page.locator('#catalog-fill').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('Kadron hazır'));
 const roster=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));assert.equal(new Set(roster.ballNames.slice(0,12)).size,12);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.querySelector('#catalog-dialog').scrollWidth<=innerWidth));
 await page.reload();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballImages),roster.ballImages);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS: 40 empires/states, local decoding, complete flag edges, notes, search, selection, roster, persistence and mobile layout.');
}finally{await browser.close();}
