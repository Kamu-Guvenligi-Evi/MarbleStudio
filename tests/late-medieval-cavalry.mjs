import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import catalogue from '../src/historical-catalogue.js';
import { cultureForCivilization } from '../src/historical-culture-groups.js';
import { Battle } from '../src/crown-battle.js';

const ids=['italian_condotta_lancer','imperial_gothic_knight','teutonic_knight','milan_ducal_cavalry'];
const units=ids.map(id=>catalogue.find(u=>u.id===id));
for(const u of units){
  assert.ok(u);assert.equal(catalogue.filter(v=>v.id===u.id).length,1);
  assert.ok(cultureForCivilization(u.faction));
  const battle=new Battle({historicalArmies:[{[u.id]:1},{roman:1}],seed:18});
  const [a,b]=battle.units;
  a.x=250;a.y=400;a.cooldown=0;a.chargeCooldown=100;
  b.x=272;b.y=400;b.cooldown=100;
  for(let i=0;i<120;i++)battle.step(1/30);
  assert.ok(b.hp<b.maxHp,`${u.id}: deals damage`);
  assert.ok(battle.units.every(v=>[v.x,v.y,v.hp].every(Number.isFinite)));
}
const dir='artifacts/late-medieval-cavalry';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1040,height:370}}),errors=[];
  await page.routeWebSocket('**/*',s=>s.close());
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__late-cavalry-preview',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#202a27;color:#eee;font:14px sans-serif"><main style="display:flex"></main></body>'}));
  await page.goto('http://127.0.0.1:5173/__late-cavalry-preview');
  const art=await page.evaluate(async ids=>{
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');
    const {default:catalogue}=await import('/src/historical-catalogue.js');
    const lib=new SpriteLibrary(),faults=[],hashes=new Set();let frames=0;
    for(const id of ids){
      const u=catalogue.find(v=>v.id===id);
      for(const team of [0,1])for(const action of ['idle','walk','attack','charge'])for(let frame=0;frame<8;frame++){
        const c=lib.get(id,team,frame,action,0),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let count=0,edge=false;
        for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>20){count++;edge ||= !x||!y||x===c.width-1||y===c.height-1;}
        if(!count||edge)faults.push(`${id}/${team}/${action}/${frame}: empty or clipped`);
        if(!team&&!frame&&action==='idle'){
          const alpha=Uint8Array.from({length:c.width*c.height},(_,i)=>data[i*4+3]>=128?1:0);
          const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',alpha))).join(',');
          if(hashes.has(hash))faults.push(`${id}: duplicate silhouette`);hashes.add(hash);
        }
        frames++;
      }
      const card=document.createElement('section');card.style.cssText='width:260px;text-align:center;border:1px solid #526559;box-sizing:border-box';
      const title=document.createElement('p');title.textContent=u.name;title.style.height='36px';card.append(title);
      const preview=document.createElement('canvas');preview.width=258;preview.height=290;
      const g=preview.getContext('2d');g.drawImage(lib.get(id,0,0,'idle',0),0,0);g.drawImage(lib.get(id,1,3,'charge',0),150,200,100,95);
      card.append(preview);document.querySelector('main').append(card);lib.cache.clear();
    }
    for(const id of ids.slice(0,2)){
      const img=new Image();img.src=catalogue.find(v=>v.id===id).image;await img.decode();
      if(!img.naturalWidth)faults.push(`${id}: reference image failed`);
    }
    return {frames,uniqueSilhouettes:hashes.size,faults};
  },ids);
  await page.screenshot({path:`${dir}/four-cavalry.jpg`,type:'jpeg',quality:80});
  assert.deepEqual(art.faults,[]);
  await page.setViewportSize({width:1040,height:800});
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  for(const u of units){
    await page.locator(`[data-culture="culture:${cultureForCivilization(u.faction).id}"]`).click();
    await page.locator(`[data-country="${u.faction}"]`).click();
    const input=page.locator(`input[data-id="${u.id}"][data-team="0"]`);
    assert.ok(await input.isVisible(),`${u.id}: reachable in country`);await input.fill('1');
  }
  await page.locator('[data-culture="culture:italian"]').click();
  await page.locator('[data-country="Roma İmparatorluğu"]').click();
  await page.locator('input[data-id="roman"][data-team="1"]').fill('4');
  await page.locator('#launch-battle').click();await page.waitForURL('**/crown-battle.html?historical=1');
  await page.waitForFunction(()=>document.querySelector('#north-count')?.textContent.trim()==='4');
  await page.reload();
  for(const id of ids)assert.equal(await page.locator(`#north-${id}`).inputValue(),'1');
  assert.deepEqual(errors,[]);
  await fs.writeFile(`${dir}/checks.json`,JSON.stringify({...art,ids,menuAndReload:true,errors},null,2));
  console.log(`PASS: ${art.frames} frames, ${art.uniqueSilhouettes} distinct silhouettes, references, country menus, combat and saved roster.`);
}finally{await browser.close();}
