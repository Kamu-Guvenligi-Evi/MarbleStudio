import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const base = process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173';

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.routeWebSocket('**/*',socket=>socket.close());
  await page.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
  await page.goto(base+'/crown-battle.html?historical=new');
  const result=await page.evaluate(async()=>{
    const {Battle}=await import('/src/crown-battle.js');
    const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
    const {createCommanderArmy}=await import('/src/historical-army-presets.js');
    const battle=new Battle({seed:42,expandedMap:true,armyConfigs:[
      {id:'own',team:0,commanderId:'mehmed_ii',roster:createCommanderArmy('mehmed_ii',96)},
      // Stable central assault, independent of the French commander's flank choice.
      {id:'enemy',team:1,roster:{french_ordonnance_gendarme:64,french_coutilier:16,french_franc_archer:8,french_dismounted_man_at_arms:8}},
    ]});
    const canvas=document.createElement('canvas');canvas.id='support-test';
    Object.assign(canvas.style,{position:'fixed',inset:'0',zIndex:99999,width:'1280px',height:'800px'});
    document.body.append(canvas);
    const renderer=new BattleRenderer(canvas,battle);renderer.resize(1280,800,true,1);renderer.fitMap();renderer.render();
    for(let i=0;i<600;i++)battle.step(1/30);
    renderer.render({running:true});
    const s=battle.tactics.civilizations.armies.get('own');
    return {time:battle.time,center:s.members.filter(m=>m.role==='bow'&&m.unit.hp>0).length,
      supportAt:s.supportAt,supportLoss:s.supportLoss,finite:battle.units.every(u=>Number.isFinite(u.x+u.y+u.hp))};
  });
  assert.deepEqual(errors,[]);
  assert.ok(result.finite&&result.center>=24&&result.supportAt<20&&result.supportLoss<.1,JSON.stringify(result));
  mkdirSync('artifacts/tactical-responsiveness',{recursive:true});
  await page.locator('#support-test').screenshot({path:'artifacts/tactical-responsiveness/browser-support.jpg',type:'jpeg',quality:60});
  writeFileSync('artifacts/tactical-responsiveness/browser-support.json',JSON.stringify(result));
  console.log('PASS browser: Ottoman centre support in rendered battle',JSON.stringify(result));
} finally {await browser.close();}
