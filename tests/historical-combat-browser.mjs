import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import catalogue from '../src/historical-catalogue.js';
import {chromium} from 'playwright';
import {populateClassic} from './crown-battle-fixture.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir('artifacts/historical-combat',{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});const errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:5173')&&!r.url().startsWith('blob:'))external.push(r.url());});
 await page.goto('http://127.0.0.1:5173/historical-armies.html');
 await page.locator('#clear').click();await page.locator('#launch-battle').click();assert.match(await page.locator('#save-note').textContent(),/en az bir/);
 for(const [id,team,n] of [['timur',0,3],['kipchak',0,20],['janissary',0,25],['samurai',0,35],['spartan',1,65],['hussar',1,18],['roman',1,30],['landsknecht',1,25]]) await page.locator(`input[data-id="${id}"][data-team="${team}"]`).fill(String(n));
 await page.locator('#launch-battle').click();await page.waitForURL('**/crown-battle.html?historical=1');
 assert.equal(await page.locator('#north-count').textContent(),'83');assert.equal(await page.locator('#red-count').textContent(),'138');assert.equal(await page.locator('[data-roster]').count(),catalogue.length*2);
 assert.ok(await page.locator('#size').isHidden());assert.equal(await page.locator('[data-unit]').count(),catalogue.length);
 assert.equal(await page.locator('[data-unit]:visible').count(),4);assert.ok(await page.locator('.controls > section').first().evaluate(e=>e.classList.contains('armies')));
 await page.locator('[data-unit="timur"]').click();assert.match(await page.locator('#selection-note').textContent(),/3 asker/);
 const box=await page.locator('#battle').boundingBox();await page.mouse.click(box.x+box.width*.48,box.y+box.height*.4,{button:'right'});assert.match(await page.locator('#events').textContent(),/intikal/);await page.locator('#charge').click();
 await page.locator('#battle').focus();await page.keyboard.press('a');assert.match(await page.locator('#selection-note').textContent(),/83 asker/);await page.keyboard.press('h');assert.match(await page.locator('#events').textContent(),/serbest hücum/);
 await page.locator('#menu-setup').click();await page.locator('#preset').selectOption('flank');await page.locator('#apply').click();assert.equal(await page.locator('#north-count').textContent(),'83');
 await page.locator('#north-kipchak').fill('21');await page.locator('#apply').click();assert.equal(await page.locator('#north-count').textContent(),'84');
 await page.reload();assert.equal(await page.locator('#north-kipchak').inputValue(),'21');assert.equal(await page.locator('#north-count').textContent(),'84');
 await page.locator('#menu-setup').click();await page.locator('#north-timur').fill('-1');await page.locator('#apply').click();assert.equal(await page.locator('#north-count').textContent(),'84');await page.locator('#north-timur').fill('3');
 await page.locator('[data-speed="4"]').click();await page.locator('#play').click();await page.waitForFunction(()=>document.querySelector('#clock').textContent>='00:08');await page.locator('#play').click();
 const clock=await page.locator('#clock').textContent();await page.waitForTimeout(300);assert.equal(await page.locator('#clock').textContent(),clock);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/historical-combat/desktop.jpg',quality:75});
 await page.locator('#restart').click();assert.equal(await page.locator('#north-count').textContent(),'84');
 if(process.env.TEST_RECORD==='1') {
  await page.locator('#menu-recording').click();await page.locator('[data-speed="1"]').click();await page.locator('#record').click();assert.ok(await page.locator('#north-timur').isDisabled());await page.waitForTimeout(4500);
  const [downloaded]=await Promise.all([page.waitForEvent('download',{timeout:90000}),page.locator('#record').click()]);await downloaded.saveAs('artifacts/historical-combat/sample.webm');assert.ok(await page.locator('#north-timur').isEnabled());
 }
 await page.locator('#menu-command').click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/historical-combat/mobile.jpg',quality:70});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('[data-unit="timur"]').click();await page.locator('#battle').click({position:{x:150,y:200}});assert.match(await page.locator('#events').textContent(),/intikal/);
 await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=demo');assert.equal(await page.locator('#north-count').textContent(),'83');
 // Draw a compact sprite sheet for visual inspection, without any network images.
 await page.evaluate(async()=>{
  const {SpriteLibrary}=await import('/src/crown-battle-art.js');const {HISTORICAL_TYPES}=await import('/src/historical-combat.js');const s=new SpriteLibrary();
  const c=document.createElement('canvas');c.id='sprite-sheet';c.width=840;c.height=Math.ceil(Object.keys(HISTORICAL_TYPES).length/7)*180;const g=c.getContext('2d');g.fillStyle='#28382e';g.fillRect(0,0,c.width,c.height);
  Object.entries(HISTORICAL_TYPES).forEach(([id,cfg],i)=>{const x=i%7*120,y=Math.floor(i/7)*180;g.drawImage(s.get(id,0,2,'walk',0),x,y,120,114);g.font='12px sans-serif';g.fillStyle='#eddfb8';g.fillText(cfg.name,x+4,y+138,115);});c.style.cssText='position:fixed;inset:0;z-index:9999;width:840px;height:auto;max-width:none;max-height:none';document.body.append(c);
 });
 await page.locator('#sprite-sheet').screenshot({path:'artifacts/historical-combat/sprites.jpg',type:'jpeg',quality:80});
 await page.goto('http://127.0.0.1:5173/crown-battle.html');assert.equal(await page.locator('#north-count').textContent(),'0');await populateClassic(page);await page.locator('[data-unit="cavalry"]').click();assert.match(await page.locator('#selection-note').textContent(),/16 asker/);await page.locator('#play').click();await page.waitForFunction(()=>document.querySelector('#clock').textContent>='00:01');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS: workshop transfer, catalogue types, active unit controls, keyboard/touch orders, exact counts, validation, persistence, scenario/restart, play/pause, mobile, classic mode, offline assets. Recording is optional via TEST_RECORD=1.');
} finally {await browser.close();}
