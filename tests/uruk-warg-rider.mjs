import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { Battle, UNIT_TYPES } from '../src/crown-battle.js';

const id='me_uruk_warg_rider', dir='artifacts/uruk-warg';
await fs.mkdir(dir,{recursive:true});
assert.equal(UNIT_TYPES[id].role,'cavalry');
const battle=new Battle({seed:1427,historicalArmies:[{[id]:1},{roman:1}]});
const [rider,target]=battle.units;
Object.assign(rider,{x:150,y:450,cooldown:0,chargeCooldown:0});
Object.assign(target,{x:300,y:450,cooldown:1000,order:{kind:'hold'},hp:10000});
for(let i=0;i<200;i++)battle.step(1/30);
assert.ok(battle.stats.chargeHits>=1,'mounted charge hits');
assert.ok(target.hp<10000,'deals damage');

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:720,height:350}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.routeWebSocket('**/*',socket=>socket.close());
 await page.route('**/__warg-preview',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#29342c;color:#eee;font:18px sans-serif"><main style="display:flex"></main></body>'}));
 await page.goto('http://127.0.0.1:5173/__warg-preview');
 const art=await page.evaluate(async id=>{
  const {SpriteLibrary}=await import('/src/crown-battle-art.js');
  const lib=new SpriteLibrary(),faults=[],hashes=[];let frames=0;
  for(const type of [id,'me_azog_warg'])for(const team of [0,1])for(const action of ['idle','walk','attack','charge','charge-ready'])for(let f=0;f<8;f++){
   const c=lib.get(type,team,f,action,0),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   let n=0,edge=false;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>20){n++;edge||=!x||!y||x===c.width-1||y===c.height-1;}
   if(!n||edge)faults.push(`${type}/${team}/${action}/${f}: ${n}, edge=${edge}`);
   frames++;
  }
  const portraits={};
  for(const [type,label] of [[id,'Isengard: Uruk-hai Warg'],['me_azog_warg','Azog: beyaz Warg']]){
   const c=lib.get(type,0,0,'idle',0),g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height).data;
   const alpha=Uint8Array.from({length:c.width*c.height},(_,i)=>d[i*4+3]>=128?1:0);
   hashes.push(Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',alpha))).join(','));
   portraits[type]=c.toDataURL('image/webp',.94);
   const section=document.createElement('section');section.style.cssText='width:360px;text-align:center';
   const p=document.createElement('p');p.textContent=label;section.append(p);
   const display=document.createElement('canvas');display.width=360;display.height=290;
   display.getContext('2d').drawImage(c,10,0,310,294.5);section.append(display);document.querySelector('main').append(section);
  }
  return {frames,faults,distinct:hashes[0]!==hashes[1],portraits};
 },id);
 assert.deepEqual(art.faults,[]);assert.equal(art.distinct,true);
 await fs.mkdir('public/warrior-sprites/middle-earth',{recursive:true});
 for(const [type,file] of [[id,'uruk-warg-rider'],['me_azog_warg','azog-warg']])await fs.writeFile(`public/warrior-sprites/middle-earth/${file}-portrait.webp`,Buffer.from(art.portraits[type].split(',')[1],'base64'));
 delete art.portraits;
 await page.screenshot({path:`${dir}/warg-comparison.jpg`,type:'jpeg',quality:82});
 await page.goto('http://127.0.0.1:5173/historical-armies.html');
 await page.locator('[data-culture="culture:middle-earth"]').click();
 await page.locator('[data-country="Isengard"]').click();
 const input=page.locator(`input[data-id="${id}"][data-team="0"]`);
 assert.ok(await input.isVisible());await input.fill('1');
 await page.locator('[data-art-view="reference"]').click();
 const ref=page.locator(`.unit-card[data-id="${id}"] .reference-art img`);
 await ref.scrollIntoViewIfNeeded();
 assert.ok(await ref.evaluate(async img=>{await img.decode();return img.naturalWidth>0;}));
 await page.locator('[data-art-view="game"]').click();
 await page.locator('[data-culture="culture:italian"]').click();
 await page.locator('input[data-id="roman"][data-team="1"]').fill('1');
 await page.locator('#launch-battle').click();await page.waitForURL('**/crown-battle.html?historical=1');
 await page.waitForSelector(`#north-${id}`,{state:'attached'});await page.reload();
 assert.equal(await page.locator(`#north-${id}`).inputValue(),'1');
 assert.deepEqual(errors,[]);
 await fs.writeFile(`${dir}/checks.json`,JSON.stringify({...art,chargeHits:battle.stats.chargeHits,menuAndReload:true,errors},null,2));
 console.log(`PASS: Warg charge/damage, ${art.frames} animation frames, distinct silhouette, portrait, Isengard menu and saved battle roster.`);
}finally{await browser.close();}
