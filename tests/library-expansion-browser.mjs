import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const manifest=JSON.parse(fs.readFileSync('public/catalog/manifest.json','utf8'));
const added=manifest.items.filter(x=>x.collectionBatch==='library-2026-10-28');
assert.ok(added.length>=65);
assert.equal(new Set(manifest.items.map(x=>x.id)).size,manifest.items.length);
for(const x of added){
 assert.ok(!/[?\uFFFD]/.test(x.name+' '+x.historicalNote),x.name);
 assert.ok(x.source&&x.credit&&x.license&&x.identitySource,x.name);
 assert.ok(fs.existsSync('public'+x.src),x.name);
 assert.deepEqual(JSON.parse(fs.readFileSync('public/catalog/'+x.id+'.json','utf8')),x);
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/matches?**',r=>r.fulfill({json:{events:[],stale:false,updatedAt:new Date().toISOString()}}));
 await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
 await page.evaluate(async()=>{
  const {prepareCatalogImage}=await import('/src/image-catalog.js');
  const {items}=await(await fetch('/catalog/manifest.json')).json();
  const groups=Object.groupBy(items.filter(x=>x.collectionBatch==='library-2026-10-28'),x=>x.category);
  for(const [category,list]of Object.entries(groups)){
   const canvas=document.createElement('canvas');canvas.width=720;canvas.height=Math.ceil(list.length/6)*120;canvas.id='sheet-'+category;
   const c=canvas.getContext('2d');c.fillStyle='#172239';c.fillRect(0,0,canvas.width,canvas.height);
   for(let i=0;i<list.length;i++){
    const img=new Image();img.src=await prepareCatalogImage(list[i]);await img.decode();
    const x=i%6*120,y=Math.floor(i/6)*120;
    c.save();c.beginPath();c.arc(x+60,y+48,42,0,7);c.clip();c.drawImage(img,x+18,y+6,84,84);c.restore();
    c.fillStyle='white';c.font='10px sans-serif';c.textAlign='center';c.fillText(list[i].name,x+60,y+108,118);
   }
   document.body.append(canvas);
  }
 });
 for(const category of new Set(added.map(x=>x.category)))await page.locator('#sheet-'+category).screenshot({path:'artifacts/library-'+category+'.png'});
 await page.locator('#open-balls').click();await page.locator('#open-catalog').click();
 for(const category of new Set(added.map(x=>x.category))){
  await page.locator('#catalog-search').fill('');await page.locator(`[data-category="${category}"]`).click();
  assert.equal(await page.locator('[data-catalog-item]').count(),manifest.items.filter(x=>x.category===category).length);
  const sample=added.find(x=>x.category===category);await page.locator('#catalog-search').fill(sample.name);
  assert.equal(await page.locator('[data-catalog-item]').count(),1,sample.name);
  await page.locator('#catalog-target').selectOption('0');await page.locator('[data-catalog-item]').click();
  await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
 }
 const images=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballImages);
 await page.reload();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballImages),images);
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${added.length} additions, unique IDs, source metadata, decoding, category counts, search, selection and persistence.`);
}finally{await browser.close();}
