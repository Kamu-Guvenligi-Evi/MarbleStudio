import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('public/catalog/manifest.json','utf8'));
const empires=catalog.items.filter(x=>x.category==='empires');
assert.ok(empires.length>=92);
for(const item of empires){
 assert.ok(['flag','contain'].includes(item.fit));assert.ok(item.historicalNote);assert.ok(item.credit);assert.ok(item.license);
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
  const edges={left:[...pc.getImageData(5,64,1,1).data],right:[...pc.getImageData(122,64,1,1).data],top:[...pc.getImageData(64,5,1,1).data],corner:[...pc.getImageData(0,0,1,1).data]};
  s.fillStyle='white';s.fillRect(0,0,300,150);s.fillStyle='red';s.beginPath();s.arc(150,75,40,0,Math.PI*2);s.fill();
  img.src=await prepareCatalogImage({id:'flag-disc-test',src:src.toDataURL(),fit:'flag'});await img.decode();pc.clearRect(0,0,128,128);pc.drawImage(img,0,0);
  const pixels=pc.getImageData(0,0,128,128).data;let left=128,right=0,top=128,bottom=0;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(pixels[i]>200&&pixels[i+1]<70&&pixels[i+3]>200){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
  const original=new Image();original.src=items[0].src;await original.decode();
  const legacy=document.createElement('canvas');legacy.width=legacy.height=128;const lc=legacy.getContext('2d');lc.fillStyle='#f4f6fb';lc.fillRect(0,0,128,128);const scale=128*.94/Math.hypot(original.naturalWidth,original.naturalHeight),w=original.naturalWidth*scale,h=original.naturalHeight*scale;
  lc.drawImage(original,(128-w)/2,(128-h)/2,w,h);const old=legacy.toDataURL('image/webp',.9);
  const {upgradeCatalogImages}=await import('/src/image-catalog.js');const migrated=await upgradeCatalogImages([old,src.toDataURL()]);
  return {...edges,discDifference:Math.abs((right-left)-(bottom-top)),migrated:migrated[0]===await prepareCatalogImage(items[0]),uploadPreserved:migrated[1]===src.toDataURL()};
 });
 assert.ok(result.left[1]>200&&result.left[0]<50);assert.ok(result.right[2]>200&&result.right[0]<50);assert.ok(result.top[0]>200&&result.top[1]<50,'No white padding');assert.equal(result.corner[3],0,'Transparent round corners');
 assert.ok(result.discDifference<=1,'Circular emblems keep their proportions');assert.ok(result.migrated,'Old selected flag upgrades');assert.ok(result.uploadPreserved,'Personal uploads stay untouched');
 await page.locator('#empire-test-sheet').screenshot({path:'artifacts/empires-contact-sheet.png'});
 await page.locator('#open-balls').click();await page.locator('#open-catalog').click();await page.locator('[data-category="empires"]').click();
 assert.equal(await page.locator('[data-catalog-item]').count(),empires.length);assert.equal(await page.locator('.catalog-history').count(),empires.length);
 await page.locator('#catalog-search').fill('Brezilya');assert.equal(await page.locator('[data-catalog-item]').count(),1);
 await page.locator('#catalog-target').selectOption('0');await page.locator('[data-catalog-item]').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballNames[0]),'Empire of Brazil');
 await page.locator('#catalog-search').fill('');await page.locator('#catalog-fill').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('Kadron hazır'));
 const roster=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));assert.equal(new Set(roster.ballNames.slice(0,12)).size,12);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.querySelector('#catalog-dialog').scrollWidth<=innerWidth));
 await page.reload();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballImages),roster.ballImages);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS: expanded empires/states, local decoding, complete flag edges, notes, search, selection, roster, persistence and mobile layout.');
}finally{await browser.close();}
