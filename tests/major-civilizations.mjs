import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { MAJOR_CIVILIZATION_UNITS } from '../src/major-civilization-units.js';
import { ADDITIONAL_HISTORICAL_UNITS } from '../src/additional-historical-units.js';
import catalogue from '../src/historical-catalogue.js';
import { CULTURE_GROUPS, cultureForCivilization } from '../src/historical-culture-groups.js';
import { Battle } from '../src/crown-battle.js';
import { HISTORICAL_ART_PROFILES } from '../src/historical-art-profiles.js';
import { HISTORICAL_TYPES } from '../src/historical-combat.js';

const additional=process.argv.includes('--additional');
const units=additional?ADDITIONAL_HISTORICAL_UNITS:MAJOR_CIVILIZATION_UNITS;
const dir=additional?'artifacts/additional-historical':'artifacts/major-civilizations';
await fs.mkdir(dir,{recursive:true});
const expected=additional?['japanese','polish','greek','greek','khmer','gaelic']:['persian','assyrian','inca','carthaginian','swiss','english','mongol','chinese','korean','spanish','italian','egyptian','arab','khmer'];
assert.equal(units.length,expected.length);
assert.equal(new Set(catalogue.map(u=>u.id)).size,catalogue.length);
for(const [i,u] of units.entries()){
  assert.equal(cultureForCivilization(u.faction)?.id,expected[i]);
  assert.equal(catalogue.filter(c=>c.id===u.id).length,1);
  assert.ok(HISTORICAL_ART_PROFILES[u.id]&&HISTORICAL_TYPES[u.id]);
  const battle=new Battle({historicalArmies:[{[u.id]:1},{roman:1}],seed:18});
  const [a,b]=battle.units;
  a.x=250;a.y=400;a.cooldown=0;a.chargeCooldown=100;
  b.x=u.kind==='ranged'?360:272;b.y=400;b.cooldown=100;
  const styles=new Set();
  for(let i=0;i<150;i++){
    battle.step(1/30);for(const p of battle.projectiles)styles.add(p.style);
  }
  if(u.kind==='ranged')assert.ok(styles.has(u.combat.projectile||'arrow'),`${u.id}: projectile`);
  else assert.equal(HISTORICAL_TYPES[u.id].ranged,undefined,`${u.id}: melee role`);
  assert.ok(b.hp<b.maxHp,`${u.id}: damage`);
  assert.ok(battle.units.every(v=>[v.x,v.y,v.hp].every(Number.isFinite)));
}
// Keep the audit of every historical navigation family, including unfilled roles.
const added=new Set(units.map(u=>u.id));
const audit=CULTURE_GROUPS.filter(g=>!['mythology','middle-earth'].includes(g.id)).map(g=>{
  const roster=catalogue.filter(u=>cultureForCivilization(u.faction)?.id===g.id);
  const before=roster.filter(u=>!added.has(u.id));
  return {id:g.id,name:g.name,before:before.length,after:roster.length,
    additions:roster.filter(u=>added.has(u.id)).map(u=>u.id),
    roles:Object.fromEntries(['sword','spear','ranged','cavalry','elephant'].map(k=>[k,roster.filter(u=>u.kind===k).length])),
    roster:roster.map(u=>({id:u.id,name:u.name,kind:u.kind,faction:u.faction})),
  };
});
await fs.writeFile(`${dir}/civilization-audit.json`,JSON.stringify(audit,null,2));
console.log(`PASS: ${units.length} additions, ${audit.length} historical families audited, live damage and projectiles.`);
if(process.argv.includes('--node-only'))process.exit(0);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1120,height:additional?460:920}}),errors=[];
  await page.routeWebSocket('**/*',socket=>socket.close());
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__major-preview',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#1b2823;color:#eee;font:14px sans-serif"><main style="display:grid;grid-template-columns:repeat(4,280px)"></main></body>'}));
  await page.goto('http://127.0.0.1:5173/__major-preview');
  const art=await page.evaluate(async(additional)=>{
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');
    const units=additional?(await import('/src/additional-historical-units.js')).ADDITIONAL_HISTORICAL_UNITS:(await import('/src/major-civilization-units.js')).MAJOR_CIVILIZATION_UNITS;
    const lib=new SpriteLibrary(),faults=[],hashes=new Set();let frames=0;
    for(const u of units){
      for(const team of [0,1])for(const action of ['idle','walk','attack','charge','charge-ready'])for(let f=0;f<8;f++){
        const c=lib.get(u.id,team,f,action,0),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let n=0,edge=false;
        for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>20){n++;edge||=!x||!y||x===c.width-1||y===c.height-1;}
        if(!n||edge)faults.push(`${u.id}/${team}/${action}/${f}: ${n}, edge=${edge}`);
        if(!team&&action==='idle'&&!f){
          const alpha=Uint8Array.from({length:c.width*c.height},(_,i)=>d[i*4+3]>=128?1:0);
          const h=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',alpha))).join(',');
          if(hashes.has(h))faults.push(`duplicate silhouette: ${u.id}`);hashes.add(h);
        }
        frames++;
      }
      const card=document.createElement('section');card.style.cssText='height:230px;text-align:center;box-sizing:border-box;border:1px solid #506050';
      const p=document.createElement('p');p.textContent=u.name;p.style.margin='7px';card.append(p);
      const canvas=document.createElement('canvas');canvas.width=278;canvas.height=192;
      const g=canvas.getContext('2d');g.drawImage(lib.get(u.id,0,0,'idle',0),2,-1,200,190);g.drawImage(lib.get(u.id,1,3,'attack',0),194,105,80,76);
      card.append(canvas);document.querySelector('main').append(card);lib.cache.clear();
    }
    return {frames,faults,uniqueSilhouettes:hashes.size};
  },additional);
  await page.screenshot({path:`${dir}/${additional?'six':'fourteen'}-warriors.jpg`,type:'jpeg',quality:80});
  await fs.writeFile(`${dir}/art-checks.json`,JSON.stringify(art,null,2));
  assert.deepEqual(art.faults,[]);
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  for(const u of units){
    await page.locator(`[data-culture="culture:${cultureForCivilization(u.faction).id}"]`).click();
    await page.locator(`[data-country="${u.faction}"]`).click();
    const input=page.locator(`input[data-id="${u.id}"][data-team="0"]`);
    assert.ok(await input.isVisible(),`${u.id}: country menu`);await input.fill('1');
    if(u.image){
      await page.locator('[data-art-view="reference"]').click();
      const ref=page.locator(`.unit-card[data-id="${u.id}"] .reference-art img`);
      await ref.scrollIntoViewIfNeeded();
      assert.ok(await ref.evaluate(async img=>{await img.decode();return img.naturalWidth>0;}),`${u.id}: reference photo`);
      await page.locator('[data-art-view="game"]').click();
    }
  }
  await page.locator('[data-culture="culture:italian"]').click();
  await page.locator('[data-country="Roma İmparatorluğu"]').click();
  await page.locator('input[data-id="roman"][data-team="1"]').fill(String(units.length));
  await page.locator('#launch-battle').click();await page.waitForURL('**/crown-battle.html?historical=1');
  await page.waitForFunction(n=>document.querySelector('#north-count')?.textContent.trim()===String(n),units.length);
  await page.reload();
  for(const u of units)assert.equal(await page.locator(`#north-${u.id}`).inputValue(),'1');
  assert.deepEqual(errors,[]);
  await fs.writeFile(`${dir}/checks.json`,JSON.stringify({...art,units:units.map(u=>u.id),menuAndReload:true,errors},null,2));
  console.log(`PASS: ${art.frames} sprite frames, ${art.uniqueSilhouettes} distinct silhouettes, menus, battle launch and saved roster.`);
}finally{await browser.close();}
