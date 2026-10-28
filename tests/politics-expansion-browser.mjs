import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const m=JSON.parse(fs.readFileSync('public/catalog/manifest.json','utf8'));
const politicians=m.items.filter(x=>x.category==='politicians');assert.ok(politicians.length>=52);
assert.equal(new Set(m.items.map(x=>x.id)).size,m.items.length);
const nazi=m.items.find(x=>x.englishName==='Nazi Germany');assert.ok(nazi.censored&&nazi.name.includes('sansürlü'));
const svg=fs.readFileSync('public'+nazi.src,'utf8');assert.ok(svg.includes('SANSÜRLÜ'));assert.ok(!/<image|<path|href=|卐|卍/.test(svg));
for(const x of politicians){assert.ok(fs.existsSync('public'+x.src));assert.ok(x.source&&x.credit&&x.license);}
const b=await chromium.launch({channel:'chrome',headless:true});
try{const p=await b.newPage({viewport:{width:1100,height:900}}),errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&!/^http:\/\/127\.0\.0\.1:(5173|5180)\//.test(r.url()))external.push(r.url());});
await p.route('**/api/matches?**',r=>r.fulfill({json:{events:[],stale:false,updatedAt:new Date().toISOString()}}));await p.goto('http://127.0.0.1:5173?edit=1');await p.waitForFunction(()=>window.marbleStudio);
await p.evaluate(async()=>{const {prepareCatalogImage}=await import('/src/image-catalog.js'),m=await(await fetch('/catalog/manifest.json')).json(),items=m.items.filter(x=>(x.category==='politicians'&&x.curated)||x.censored);const s=document.createElement('canvas');s.width=800;s.height=600;const c=s.getContext('2d');c.fillStyle='#172239';c.fillRect(0,0,800,600);
for(let i=0;i<items.length;i++){const im=new Image();im.src=await prepareCatalogImage(items[i]);await im.decode();const x=i%6*133,y=Math.floor(i/6)*120;c.save();c.beginPath();c.arc(x+66,y+48,42,0,7);c.clip();c.drawImage(im,x+24,y+6,84,84);c.restore();c.fillStyle='white';c.font='10px sans-serif';c.textAlign='center';c.fillText(items[i].name,x+66,y+108,130);}s.id='new-politicians';document.body.append(s);});
await p.locator('#new-politicians').screenshot({path:'artifacts/new-politicians.png'});
await p.locator('#open-balls').click();await p.locator('#open-catalog').click();await p.locator('[data-category="politicians"]').click();assert.equal(await p.locator('[data-catalog-item]').count(),politicians.length);
await p.locator('#catalog-search').fill('Türkiye');assert.ok(await p.locator('[data-catalog-item]').count()>=13);
await p.locator('#catalog-search').fill('İsmet İnönü');assert.equal(await p.locator('[data-catalog-item]').count(),1);await p.locator('#catalog-target').selectOption('0');await p.locator('[data-catalog-item]').click();await p.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
await p.locator('#catalog-search').fill('');await p.locator('[data-category="empires"]').click();await p.locator('#catalog-search').fill('Nazi');assert.equal(await p.locator('[data-catalog-item]').count(),1);await p.locator('#catalog-target').selectOption('1');await p.locator('[data-catalog-item]').click();await p.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
const roster=await p.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')));assert.equal(roster.ballNames[1],'Nazi Germany');assert.ok(roster.ballImages[1]);await p.reload();assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballImages),roster.ballImages);
assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS: expanded politicians, censored state asset, local images, region search, both selections and persistence.');
}finally{await b.close();}
