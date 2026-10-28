import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await browser.newPage();
  await page.route('**/batch-empty',r=>r.fulfill({contentType:'text/html',body:'<html></html>'}));
  await page.goto('http://127.0.0.1:5173/batch-empty');
  const result = await page.evaluate(async()=>{
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');
    await (await import('/src/middle-earth-painted-art.js')).middleEarthArtReady;
    const {visualScaleOf}=await import('/src/crown-battle-visual-scale.js');
    const {BattleSpriteCache}=await import('/src/crown-battle-sprite-cache.js');
    const {BattleSpriteBatch}=await import('/src/crown-battle-sprite-batch.js');
    const {combatPose,drawPosedSprite}=await import('/src/crown-battle-combat-motion.js');
    const {makeContactShadow}=await import('/src/crown-battle-pc-scene.js');
    const {UNIT_TYPES,roleOf}=await import('/src/crown-battle.js');
    const library=new SpriteLibrary(),cache=new BattleSpriteCache(),shadow=makeContactShadow(),batch=new BattleSpriteBatch();
    const a=document.createElement('canvas'),b=document.createElement('canvas');
    const ac=a.getContext('2d',{willReadFrequently:true}),bc=b.getContext('2d',{willReadFrequently:true});
    const types=['me_balrog','me_sauron','me_witch_king','sword','pike','archer','cavalry','kipchak','samurai',Object.keys(UNIT_TYPES).find(k=>UNIT_TYPES[k].role==='elephant'),Object.keys(UNIT_TYPES).find(k=>k.startsWith('commander_'))].filter(Boolean);
    const cases=[];
    for(const resolution of [1,1.5,2]) for(const zoom of [.8,1.6]) for(const age of [0,.15,.4,.65,2]) {
      if(resolution===2 && age===0)cache.clear(); // Reuse GPU layers after atlas retirement.
      a.width=b.width=600;a.height=b.height=480;
      cache.beginFrame(resolution);
      const units=[],fallen=[],frameSprites=new Map();
      for(let i=0;i<types.length*2;i++) {
        const u={id:i,type:types[i%types.length],team:i%2,face:i%2?1:-1,x:130+i%4*110,y:200+Math.floor(i/4)*150,hp:i%3?100:0,deadAt:0};
        const horse=['cavalry','elephant'].includes(roleOf(u));
        u.flash=i%2?.07:0;u.stagger=i%2?0:.16;u.hitDirection=-u.face;
        frameSprites.set(u,cache.get(library.get(u.type,u.team,4,u.hp?'attack':'idle',i%3),u.face,horse,resolution,u.hp?shadow:null));
        (u.hp?units:fallen).push(u);
      }
      for(const ctx of [ac,bc]){ctx.fillStyle='#445a32';ctx.fillRect(0,0,600,480);}
      const renderer={canvas:b,ctx:bc,spriteCache:cache,frameSprites,viewWidth:600,viewHeight:960,view:{x:300,y:480,zoom},spriteScaleX:1.2,spriteScaleY:1.5,battle:{time:age,winner:null}};
      ac.save();ac.scale(1,.5);ac.translate(300,480);ac.scale(zoom,zoom);ac.translate(-300,-480);
      for(const list of [fallen,units])for(const u of list){
        const e=frameSprites.get(u),size=visualScaleOf(u);ac.save();ac.translate(u.x,u.y);ac.scale(1.2*size,1.5*size);
        drawPosedSprite(ac,e,combatPose(u,age,3,{}),new Float64Array(15));ac.restore();
      }
      ac.restore();
      if(!batch.render(renderer,fallen,units,()=>3))throw new Error('GPU batch unavailable');
      const ap=ac.getImageData(0,0,600,480).data,bp=bc.getImageData(0,0,600,480).data;
      let sum=0,bad=0;
      for(let i=0;i<ap.length;i++){const d=Math.abs(ap[i]-bp[i]);sum+=d;if(d>35)bad++;}
      cases.push({resolution,zoom,age,mean:sum/ap.length,badFraction:bad/ap.length});
    }
    const missingFallback=!batch.render({frameSprites:new Map()},[],[{}],()=>0);
    const glError=batch.gl.getError();
    batch.gl.getExtension('WEBGL_lose_context').loseContext();
    const lostFallback=!batch.render({},[],[],()=>0);
    return {cases,glError,missingFallback,lostFallback,frames:batch.frames};
  });
  assert.equal(result.glError,0);assert.equal(result.lostFallback,true);assert.equal(result.missingFallback,true);
  for(const c of result.cases){assert.ok(c.mean<1,JSON.stringify(c));assert.ok(c.badFraction<.006,JSON.stringify(c));}
  console.log('PASS GPU atlas: hit/fall poses, facing, zoom, resolution and fallback',JSON.stringify({cases:result.cases.length,maxMean:Math.max(...result.cases.map(c=>c.mean)),maxBadFraction:Math.max(...result.cases.map(c=>c.badFraction)),glError:result.glError}));
}finally{await browser.close();}
