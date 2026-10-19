import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { weaponFamily, weaponMotion } from '../src/crown-battle-weapon-motion.js';

for (const weapon of ['spear','ashigaruYari','ahSarissa','mcHookLance']) assert.equal(weaponFamily(weapon),'thrust');
for (const weapon of ['starMace','hammer','mocheMace','warFlail','ecPollaxe']) assert.equal(weaponFamily(weapon),'heavy');
assert.equal(weaponFamily('katana'),'slash');
for (const weapon of ['spear','katana','starMace']) {
  const idle=weaponMotion(weapon,'idle',0,.3);
  assert.deepEqual(weaponMotion(weapon,'attack',0,.3),idle);
  assert.deepEqual(weaponMotion(weapon,'attack',7/8,.3),idle,'Recover before the next attack');
  for(let i=0;i<8;i++)assert.ok(Object.values(weaponMotion(weapon,'attack',i/8)).every(Number.isFinite));
}
const prepared=weaponMotion('spear','attack',.25),contact=weaponMotion('spear','attack',.5);
assert.equal(prepared.angle,contact.angle,'Thrust translates a level shaft, rather than swinging it');
assert.ok(contact.x-prepared.x>=7);
assert.ok(weaponMotion('mace','attack',.25).y<weaponMotion('sword','attack',.25).y,'Heavy weapon lifts above the sword windup');

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.routeWebSocket('**/*',socket=>socket.close());
  await page.route('**/weapon-empty',r=>r.fulfill({contentType:'text/html',body:'<html></html>'}));
  await page.goto('http://127.0.0.1:5173/weapon-empty');
  const result=await page.evaluate(async()=>{
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');
    const {HISTORICAL_ART_PROFILES:profiles}=await import('/src/historical-art-profiles.js');
    const {HISTORICAL_TYPES}=await import('/src/historical-combat.js');
    const {drawHistoricalWarrior}=await import('/src/historical-warrior-art.js');
    const {MIDDLE_EARTH_BY_ID}=await import('/src/middle-earth-units.js');
    const lib=new SpriteLibrary(),types=['sword','pike','cavalry',...Object.keys(profiles).filter(k=>HISTORICAL_TYPES[k]),...Object.keys(MIDDLE_EARTH_BY_ID)];
    let checks=0;const clips=[];
    for(const type of types)for(const team of [0,1])for(let frame=0;frame<8;frame++){
      const sprite=lib.get(type,team,frame,'attack',0);
      if(!sprite.width||!sprite.height)throw Error('Empty '+type);
      if(lib.get(type,team,frame,'attack',0)!==sprite)throw Error('Cache miss '+type);
      checks++;
    }
    // Draw historical art in a larger surface: detect actual source clipping,
    // not just an atlas crop that perfectly reproduces an already clipped source.
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=300;
    const g=canvas.getContext('2d',{willReadFrequently:true});
    for(const [type,p] of Object.entries(profiles)){
      const cfg=HISTORICAL_TYPES[type];if(!cfg||cfg.role==='elephant')continue;
      for(let frame=0;frame<8;frame++){
        g.resetTransform();g.clearRect(0,0,320,300);g.setTransform(2,0,0,2,120,180);
        drawHistoricalWarrior(g,p,cfg,0,frame,'attack',0);
        const data=g.getImageData(0,0,320,300).data;let outside=0;
        for(let y=0;y<300;y++)for(let x=0;x<320;x++)if((x<60||x>=220||y<58||y>=210)&&data[(y*320+x)*4+3]>32)outside++;
        if(outside>0)clips.push({type,weapon:p.weapon,frame,outside});
      }
    }
    const examples=['spartan','samurai','inca_decorated_warrior','japan_yari_ashigaru','me_sauron','me_dain'];
    const sheet=document.createElement('canvas');sheet.width=1060;sheet.height=examples.length*132+32;
    const ctx=sheet.getContext('2d');ctx.fillStyle='#d9ded4';ctx.fillRect(0,0,sheet.width,sheet.height);
    ctx.font='14px sans-serif';ctx.fillStyle='#22302a';ctx.fillText('Wind-up (0–2)    →    contact (4)    →    follow-through (5)    →    recovery (7)',180,20);
    examples.forEach((type,row)=>{ctx.fillText(type,8,row*132+92);for(let frame=0;frame<8;frame++){
      const sprite=lib.get(type,0,frame,'attack',0);ctx.drawImage(sprite,180+frame*108,row*132+30,106,101);
      ctx.fillText(String(frame),225+frame*108,row*132+127);
    }});
    return {checks,typeCount:types.length,cacheEntries:lib.cache.size,clips,preview:sheet.toDataURL('image/png')};
  });
  await mkdir('artifacts',{recursive:true});
  await writeFile('artifacts/weapon-motion-preview.png',Buffer.from(result.preview.split(',')[1],'base64'));
  delete result.preview;
  await writeFile('artifacts/weapon-motion-check.json',JSON.stringify(result,null,2));
  assert.deepEqual(errors,[]);
  assert.ok(result.checks>2000);
  assert.deepEqual(result.clips,[], 'Attack weapons must stay inside their source sprite');
  console.log(JSON.stringify({checks:result.checks,typeCount:result.typeCount,cacheEntries:result.cacheEntries,clippedFrames:result.clips.length,clips:result.clips.slice(0,18)}));
} finally { await browser.close(); }
