import assert from 'node:assert/strict';
import { Battle, UNIT_TYPES } from '../src/crown-battle.js';
import { chromium } from 'playwright';
const mounts=['nazgul','rohirrim','gondor_cavalry','dwarf_ram_rider','elf_stag_rider','azog_warg','theoden','eomer','thranduil','dain'].map(id=>`me_${id}`);
const ids=['me_elrond','me_ent','me_boromir','me_faramir','me_saruman','me_haldir','me_shelob','me_mumakil',...mounts];
function pair(type,enemy='roman') {
  const b=new Battle({seed:1427,historicalArmies:[{[type]:1},{[enemy]:1}]});
  const [a,z]=b.units;
  Object.assign(a,{x:150,y:450,cooldown:0,chargeCooldown:0});
  Object.assign(z,{x:300,y:450,cooldown:1000,chargeCooldown:1000,order:{kind:'hold'},hp:10000});
  return {b,a,z};
}
function run(b,seconds){for(let i=0;i<Math.round(seconds*30)&&b.winner===null;i++)b.step(1/30);}
for(const type of mounts){
  assert.equal(UNIT_TYPES[type].role,'cavalry',type);
  const {b}=pair(type);run(b,.4);assert.equal(b.stats.charges,0,type);run(b,6);
  assert.ok(b.stats.chargeHits>=1,`${type} run-up charge`);
  const contact=pair(type);contact.a.x=281;run(contact.b,12);assert.equal(contact.b.stats.charges,0,`${type} no contact recharge`);
  const impacts=[];
  for(const angle of [Math.PI,Math.PI/2,0]){
    const {b,a,z}=pair(type,'me_gondor_spearman');a.x=270;
    Object.assign(z,{headingX:Math.cos(angle),headingY:Math.sin(angle)});
    b.startCharge(a,z);b.step(1/30);impacts.push({damage:10000-z.hp,counters:b.stats.pikeCounters});
  }
  assert.deepEqual(impacts.map(v=>v.counters),[1,0,0],type);
  assert.ok(impacts[0].damage<impacts[1].damage,`${type} frontal spear defense`);
  const order=pair(type);order.b.select();order.b.startCharge(order.a,order.z);order.b.moveSelected(170,530);run(order.b,8);
  assert.equal(order.a.order.kind,'hold');assert.equal(order.z.hp,10000,`${type} move suppresses autoattack`);
}
console.log('PASS ten mounts: cavalry role, run-up charge, no contact bonus, directional spear defense, movement orders.');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  await page.locator('#clear').click();
  for(const id of ids)for(const team of [0,1])await page.locator(`input[data-id="${id}"][data-team="${team}"]`).fill('1');
  await page.reload();
  for(const id of ids)for(const team of [0,1])assert.equal(await page.locator(`input[data-id="${id}"][data-team="${team}"]`).inputValue(),'1');
  for(const id of ids)await page.locator(`input[data-id="${id}"][data-team="1"]`).fill('0');
  await page.reload();
  for(const id of ids){
    assert.equal(await page.locator(`input[data-id="${id}"][data-team="1"]`).inputValue(),'0');
    assert.equal(await page.locator(`input[data-id="${id}"][data-team="0"]`).inputValue(),'1');
  }
  const caches=await page.evaluate(async(ids)=>{
    await (await import('/src/middle-earth-painted-art.js')).middleEarthArtReady;
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');const lib=new SpriteLibrary();
    return ids.every(id=>lib.get(id,0,0,'idle',0)===lib.get(id,0,0,'idle',7));
  },ids);assert.ok(caches,'Mounted art must reuse one variant cache');
  await page.route('**/warrior-sprites/middle-earth/*.webp',r=>r.abort());
  await page.reload();
  const fallback=await page.evaluate(async(ids)=>{
    const loaded=await (await import('/src/middle-earth-painted-art.js')).middleEarthArtReady;
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');const lib=new SpriteLibrary();
    return {loaded:loaded.filter(Boolean).length,visible:ids.every(id=>{
      const c=lib.get(id,0,0,'idle',0),p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      return p.some((v,i)=>i%4===3&&v>128);
    })};
  },ids);assert.equal(fallback.loaded,0);assert.ok(fallback.visible);assert.deepEqual(errors,[]);
  console.log('PASS eighteen additions: both-team save/reload, red-only removal, shared variant cache, blocked-image fallback.');
}finally{await browser.close();}
