import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { MEDIEVAL_SPECIALIST_UNITS } from '../src/medieval-specialist-units.js';
import catalogue from '../src/historical-catalogue.js';
import { cultureForCivilization } from '../src/historical-culture-groups.js';
import { Battle } from '../src/crown-battle.js';
import { HISTORICAL_ART_PROFILES } from '../src/historical-art-profiles.js';
import { HISTORICAL_TYPES } from '../src/historical-combat.js';

const units=MEDIEVAL_SPECIALIST_UNITS;

for (const u of units) assert.equal(cultureForCivilization(u.faction).id, ({norse_berserker:'norse',aragon_almogavar:'spanish',japan_sohei:'japanese'})[u.id]);
assert.equal(units.length, 3);
for (const [culture, count] of [['german', 5], ['rus', 2]]) {
  const existing = catalogue.filter(u => cultureForCivilization(u.faction)?.id === culture);
  assert.equal(existing.length, count, `${culture}: existing roster preserved`);
  for (const u of existing) assert.ok(HISTORICAL_ART_PROFILES[u.id] && HISTORICAL_TYPES[u.id]);
}
assert.equal(HISTORICAL_ART_PROFILES.rus_druzhina.weapon, 'lance', 'Druzhina artwork matches its documented in-game role');
for (const u of units) {
  assert.equal(catalogue.filter(c => c.id === u.id).length, 1);
  assert.notEqual(cultureForCivilization(u.faction)?.id, 'other');
  assert.ok(cultureForCivilization(u.faction));
  const battle = new Battle({ historicalArmies: [{ [u.id]: 1 }, { roman: 1 }], seed: 18 });
  const [a,b] = battle.units;
  a.x=250; a.y=400; a.cooldown=0; a.chargeCooldown=100;
  b.x=u.kind==='ranged'||u.id==='karakhanid_hassa'?360:272; b.y=400; b.cooldown=100;
  for(let i=0;i<120;i++){
    battle.step(1/30);
  }
  assert.ok(b.hp < b.maxHp, `${u.id}: deals damage`);
  assert.ok(battle.units.every(v=>[v.x,v.y,v.hp].every(Number.isFinite)));
}
console.log('PASS: 3 unique units, civilization membership and live combat damage.');
if(process.argv.includes('--node-only'))process.exit(0);

const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:900,height:260}}), errors=[];
  // Other workspace edits must not reload the page during a roster assertion.
  await page.routeWebSocket('**/*', socket => socket.close());
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__medieval-specialists-preview',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#1b2823;color:#eee;font:15px sans-serif"><main style="display:grid;grid-template-columns:repeat(3,300px)"></main></body>'}));
  await page.goto('http://127.0.0.1:5173/__medieval-specialists-preview');
  const art=await page.evaluate(async()=>{
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');
    const {default: catalogue}=await import('/src/historical-catalogue.js');
    const {MEDIEVAL_SPECIALIST_UNITS}=await import('/src/medieval-specialist-units.js');
    const units=MEDIEVAL_SPECIALIST_UNITS;
    const lib=new SpriteLibrary(), faults=[], hashes=new Set();let frames=0;
    for(const u of units){
      for(const team of [0,1])for(const action of ['idle','walk','attack','charge','charge-ready'])for(let f=0;f<8;f++){
        const c=lib.get(u.id,team,f,action,0),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let n=0,edge=false;
        for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>20){n++;edge ||= !x||!y||x===c.width-1||y===c.height-1;}
        if(!n||edge)faults.push(`${u.id}/${team}/${action}/${f}: ${n}, edge=${edge}`);
        if(!team&&action==='idle'&&!f){
          const alpha=Uint8Array.from({length:c.width*c.height},(_,i)=>d[i*4+3]>=128?1:0);
          const h=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',alpha))).join(',');
          if(hashes.has(h))faults.push(`duplicate silhouette: ${u.id}`);hashes.add(h);
        }
        frames++;
      }
      const card=document.createElement('section');card.style.cssText='height:260px;text-align:center;box-sizing:border-box;border:1px solid #506050';
      const p=document.createElement('p');p.textContent=u.name;p.style.margin='8px';card.append(p);
      const preview=document.createElement('canvas');preview.width=298;preview.height=220;
      const g=preview.getContext('2d');g.drawImage(lib.get(u.id,0,0,'idle',0),0,-5,240,228);g.drawImage(lib.get(u.id,1,3,'attack',0),210,118,80,76);
      card.append(preview);document.querySelector('main').append(card);lib.cache.clear();
    }
    return {frames,faults,uniqueSilhouettes:hashes.size};
  });
  await fs.mkdir('artifacts/medieval-specialists',{recursive:true});
  await page.screenshot({path:'artifacts/medieval-specialists/three-warriors.jpg',type:'jpeg',quality:78});
  assert.deepEqual(art.faults,[]);
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  for(const u of units){
    const group=cultureForCivilization(u.faction);
    await page.locator(`[data-culture="culture:${group.id}"]`).click();
    await page.locator(`[data-country="${u.faction}"]`).click();
    const input=page.locator(`input[data-id="${u.id}"][data-team="0"]`);
    assert.ok(await input.isVisible(),`${u.name} reachable in its country`);await input.fill('1');
  }
  await page.locator('[data-culture="culture:italian"]').click();
  await page.locator('[data-country="Roma İmparatorluğu"]').click();
  await page.locator('input[data-id="roman"][data-team="1"]').fill('3');
  await page.locator('#launch-battle').click();await page.waitForURL('**/crown-battle.html?historical=1');
  await page.waitForFunction(() => document.querySelector('#north-count')?.textContent.trim() === '3');
  assert.equal((await page.locator('#north-count').textContent()).trim(),'3');
  await page.reload();
  for(const u of units)assert.equal(await page.locator(`#north-${u.id}`).inputValue(),'1');
  assert.deepEqual(errors,[]);
  await fs.writeFile('artifacts/medieval-specialists/checks.json',JSON.stringify({...art,units:units.map(u=>u.id),menuAndReload:true,errors},null,2));
  console.log(`PASS: ${art.frames} sprite frames, 3 distinct silhouettes, no clipping; country menus, battle launch and saved roster reload.`);
} finally {await browser.close();}
