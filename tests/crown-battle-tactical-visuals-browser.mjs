import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch({channel:'chrome', headless:true});
try {
  const page = await browser.newPage({viewport:{width:1100,height:720}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.routeWebSocket('**/*',s=>s.close());
  await page.route('**/tactics-visual-empty',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#17251f"><canvas id="battle" style="position:relative;display:block"></canvas></body>'}));
  await page.goto('http://127.0.0.1:5173/tactics-visual-empty');
  const result = await page.evaluate(async()=>{
    const {Battle}=await import('/src/crown-battle.js');
    const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
    const {hasChargePose,tacticalPhaseLabel}=await import('/src/crown-battle-tactical-visuals.js');
    const {HISTORICAL_ART_PROFILES:profiles}=await import('/src/historical-art-profiles.js');
    const {HISTORICAL_TYPES}=await import('/src/historical-combat.js');
    const {drawHistoricalWarrior}=await import('/src/historical-warrior-art.js');
    const scratch=document.createElement('canvas');scratch.width=320;scratch.height=300;
    const g=scratch.getContext('2d',{willReadFrequently:true}), clips=[];
    let frames=0;
    for(const [type,p] of Object.entries(profiles)) {
      if(!hasChargePose(type)||!HISTORICAL_TYPES[type])continue;
      for(const action of ['charge-ready','charge'])for(let frame=0;frame<8;frame++) {
        g.resetTransform();g.clearRect(0,0,320,300);g.setTransform(2,0,0,2,120,180);
        drawHistoricalWarrior(g,p,HISTORICAL_TYPES[type],0,frame,action,0);
        const data=g.getImageData(0,0,320,300).data; let outside=0;
        for(let y=0;y<300;y++)for(let x=0;x<320;x++)if((x<60||x>=220||y<58||y>=210)&&data[(y*320+x)*4+3]>32)outside++;
        if(outside)clips.push({type,action,frame,outside});frames++;
      }
    }
    const battle=new Battle({seed:42,expandedMap:true,commanders:['alp_arslan',null],historicalArmies:[{seljuk_hassa:24},{roman:24}]});
    battle.setActiveTeam(0);battle.select('all');
    for(let i=0;i<900&&battle.tactics.teams[0]?.phase!=='retreat';i++)battle.step(1/30);
    if(battle.tactics.teams[0]?.phase!=='retreat')throw Error('Real retreat did not begin');
    const canvas=document.querySelector('#battle');
    const renderer=new BattleRenderer(canvas,battle);
    renderer.resize(1100,720,true,1);
    for(let i=0;i<40;i++)renderer.render({running:false});
    const routes=renderer.tacticalVisuals.routes.length;
    if(!routes||routes>3)throw Error('Selected manoeuvre routes missing or unbounded');
    const phase=tacticalPhaseLabel(battle,0);
    // The fallback portrait path and layered desktop path must also render the overlay.
    renderer.resize(540,960,false,1);renderer.render();
    renderer.resize(1100,720,true,1);renderer.enableLayers();renderer.render();
    const sampleCount=renderer.tacticalVisuals.samples;
    for(let i=0;i<10;i++)renderer.render();
    if(renderer.tacticalVisuals.samples!==sampleCount)throw Error('Repeated draws re-scan tactics');
    return {frames,clips,routes,phase,samples:renderer.tacticalVisuals.samples};
  });
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/tactical-visuals-preview.jpg',quality:65});
  assert.deepEqual(errors,[]);assert.deepEqual(result.clips,[]);
  assert.ok(result.frames>=32);assert.equal(result.phase,'Sahte ricat');
  console.log(JSON.stringify(result));
} finally {await browser.close();}
