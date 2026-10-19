import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const base = process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173';

const folder='artifacts/tactical-responsiveness';
mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:900,height:700}}),errors=[],results=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.routeWebSocket('**/*',socket=>socket.close());
  await page.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
  await page.goto(base+'/crown-battle.html?historical=new');
  for(const [commanderId,capacity] of [['georg_frundsberg',96],['qi_jiguang',96],['mehmed_ii',96],['charles_vii',240],['francesco_sforza',960]]) {
    const result=await page.evaluate(async ({id,capacity})=>{
      const {Battle}=await import('/src/crown-battle.js');
      const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
      const {createCommanderArmy}=await import('/src/historical-army-presets.js');
      const battle=new Battle({seed:42,expandedMap:true,armyConfigs:[
        {id:'own',team:0,commanderId:id,roster:createCommanderArmy(id,capacity)},
        {id:'enemy',team:1,roster:{roman:96}},
      ]});
      document.querySelector('#opening-test')?.remove();
      const canvas=document.createElement('canvas');canvas.id='opening-test';
      Object.assign(canvas.style,{position:'fixed',inset:'0',zIndex:99999,width:'900px',height:'700px'});
      document.body.append(canvas);
      const renderer=new BattleRenderer(canvas,battle);renderer.resize(900,700,true,1);
      const own=battle.units.filter(u=>u.armyId==='own');
      const x=own.map(u=>u.x),y=own.map(u=>u.y);
      renderer.view={x:(Math.min(...x)+Math.max(...x))/2,y:(Math.min(...y)+Math.max(...y))/2,
        zoom:Math.min(3,800/(Math.max(...x)-Math.min(...x)+100),600/(Math.max(...y)-Math.min(...y)+100))};
      renderer.render();
      window.openingTest={battle,renderer};
      return {commanderId:id,geometry:battle.openingDeployments.get('own').state.formationGeometry,units:own.length};
    },{id:commanderId,capacity});
    await page.locator('#opening-test').screenshot({path:`${folder}/${commanderId}-opening.jpg`,type:'jpeg',quality:65});
    Object.assign(result,await page.evaluate(()=>{
      const {battle,renderer}=window.openingTest;
      for(let i=0;i<900&&battle.winner===null;i++)battle.step(1/30);
      renderer.render({running:true});
      return {time:battle.time,finite:battle.units.every(u=>Number.isFinite(u.x+u.y+u.hp)),
        phase:battle.tactics.civilizations.armies.get('own')?.phase};
    }));
    assert.ok(result.finite&&result.phase!=='assemble',JSON.stringify(result));
    results.push(result);
  }
  assert.deepEqual(errors,[]);
  writeFileSync(`${folder}/infantry-openings-browser.json`,JSON.stringify(results));
  console.log(`PASS ${results.length} rendered openings and 30 seconds of browser simulation, no page errors.`);
} finally {await browser.close();}
