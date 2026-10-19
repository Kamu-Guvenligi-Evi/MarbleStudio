import assert from 'node:assert/strict';
import { mkdirSync, statSync } from 'node:fs';
import { chromium } from 'playwright';

const dir='artifacts/battle-combat-motion';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:960,height:560}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.routeWebSocket('**/*',s=>s.close());
  await page.route('**/__combat-motion',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0"><canvas width="960" height="560"></canvas></body>'}));
  await page.goto('http://127.0.0.1:5173/__combat-motion');
  const result=await page.evaluate(async()=>{
    const {Battle}=await import('/src/crown-battle.js');
    const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
    const {BattleSpriteCache}=await import('/src/crown-battle-sprite-cache.js');
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');
    const {combatPose,drawPosedSprite}=await import('/src/crown-battle-combat-motion.js');
    const {drawCombatEffect}=await import('/src/crown-battle-feedback.js');
    await(await import('/src/middle-earth-painted-art.js')).middleEarthArtReady;
    const b=new Battle({allowEmpty:true,historicalArmies:[{},{}]});
    const renderer=new BattleRenderer(document.createElement('canvas'),b);
    const probe={id:1,type:'samurai',team:0,face:1,hp:100};
    const liveIdentity=renderer.spriteIdentity(probe);probe.hp=0;
    const isolatedCorpseCache=liveIdentity!==renderer.spriteIdentity(probe);
    b.time=5;b.winner=null;renderer.updateCombatTime(100);renderer.updateCombatTime(500);
    const paused=renderer.combatTime===5;
    b.winner=0;renderer.updateCombatTime(1000);renderer.updateCombatTime(1900);
    const completed=renderer.combatTime===5.9;
    renderer.updateCombatTime(5000);const capped=renderer.combatTime===6.4;
    const unchanged=b.time===5;
    b.winner=null;b.time=0;renderer.updateCombatTime(5100);const reset=renderer.combatTime===0;
    const library=new SpriteLibrary(),cache=new BattleSpriteCache();cache.beginFrame(3);
    const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
    ctx.fillStyle='#394536';ctx.fillRect(0,0,960,560);ctx.font='14px sans-serif';
    const times=[0,.14,.32,.52,.85,1.3];
    ctx.fillStyle='#eee7d6';times.forEach((t,i)=>ctx.fillText(`${t.toFixed(2)} s`,i*150+70,28));
    const types=['samurai','roman','hussar','me_sauron'];
    for(let row=0;row<types.length;row++){
      const type=types[row];ctx.fillStyle='#eee7d6';ctx.fillText(type,8,60+row*120);
      const u={id:2,type,team:0,face:1,hp:0,deadAt:0,deathDirection:1};
      const e=cache.get(library.get(type,0,0,'idle',2),1,type==='hussar',3,null);
      for(let i=0;i<times.length;i++){
        const x=70+i*150,y=125+row*120;
        ctx.strokeStyle='#728164';ctx.beginPath();ctx.moveTo(x-25,y+2);ctx.lineTo(x+100,y+2);ctx.stroke();
        ctx.save();ctx.translate(x,y);ctx.scale(2,2);
        drawPosedSprite(ctx,e,combatPose(u,times[i],0,{}),new Float64Array(15));
        if(i===1)drawCombatEffect(ctx,{kind:'armor-hit',born:0,life:.3,height:14,variant:2,angle:0},.06);
        ctx.restore();
      }
    }
    const right=combatPose({id:0,type:'samurai',hp:0,deadAt:0,face:1,deathDirection:1},1,0,{});
    const left=combatPose({id:0,type:'samurai',hp:0,deadAt:0,face:-1,deathDirection:-1},1,0,{});
    const mirrored=right.x===-left.x&&right.b===-left.b&&right.c===-left.c&&right.d===left.d;
    const settled=JSON.stringify(right)===JSON.stringify(combatPose({id:0,type:'samurai',hp:0,deadAt:0,face:1,deathDirection:1},4,0,{}));
    return{isolatedCorpseCache,paused,completed,capped,unchanged,reset,mirrored,settled};
  });
  for(const [key,value] of Object.entries(result))assert.equal(value,true,key);
  assert.deepEqual(errors,[]);
  await page.locator('canvas').screenshot({path:`${dir}/fall-sequence.png`});
  console.log('PASS combat visual clock, mirrored falls and settled bodies',result,'preview bytes:',statSync(`${dir}/fall-sequence.png`).size);
}finally{await browser.close();}
