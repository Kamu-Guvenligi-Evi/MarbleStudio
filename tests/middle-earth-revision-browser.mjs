import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1200,height:820}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/art-revision-test',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#30443b"></body>'}));
  await page.goto('http://127.0.0.1:5173/art-revision-test');
  const result=await page.evaluate(async()=>{
    const {middleEarthArtReady,paintedArtVersion}=await import('/src/middle-earth-painted-art.js');
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');
    const {Battle,UNIT_TYPES}=await import('/src/crown-battle.js');
    const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
    const {BattleSpriteCache}=await import('/src/crown-battle-sprite-cache.js');
    const {unitAtPoint}=await import('/src/crown-battle-hit-test.js');
    const {visualScaleOf}=await import('/src/crown-battle-visual-scale.js');
    const loaded=await middleEarthArtReady;
    const lib=new SpriteLibrary(),cache=new BattleSpriteCache();
    const ids=['me_gondor_swordsman','me_gondor_spearman','me_gondor_veteran','me_witch_king','me_sauron','me_balrog'];
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=530;document.body.append(canvas);
    const ctx=canvas.getContext('2d');ctx.fillStyle='#30443b';ctx.fillRect(0,0,1200,530);
    ctx.fillStyle='#91a388';ctx.fillRect(0,402,1200,1);
    const ratios={},heights={};
    for(const [i,type]of ids.entries()){
      const size=visualScaleOf({type}),source=lib.get(type,0,0,'idle',0),bounds=cache.boundsOf(source);
      heights[type]=(bounds.bottom-bounds.top)*size;
      ctx.save();ctx.translate(80+i*190,400);ctx.scale(2*size,2*size);ctx.drawImage(source,-30,-61,80,76);ctx.restore();
      ctx.fillStyle='#f2ead5';ctx.font='14px sans-serif';ctx.fillText(UNIT_TYPES[type].name.slice(0,24),15+i*190,435);
    }
    ratios.balrog=heights.me_balrog/heights.me_gondor_swordsman;ratios.sauron=heights.me_sauron/heights.me_gondor_swordsman;
    const battle=new Battle({historicalArmies:[{me_balrog:1},{roman:1}],seed:1}),u=battle.units[0];
    Object.assign(u,{x:300,y:480,moving:false,attack:0});
    const battlefield=document.createElement('canvas');battlefield.style.width='600px';battlefield.style.height='400px';document.body.append(battlefield);
    const terrain=document.createElement('canvas');terrain.width=600;terrain.height=960;
    const renderer=new BattleRenderer(battlefield,battle,{sprites:lib,terrain});renderer.resize(600,400,true,1);
    const hits=[];
    for(const face of [-1,1])for(const team of [0,1])for(const mode of ['idle','walk','attack']){
      Object.assign(u,{face,team,moving:mode==='walk',attack:mode==='attack'?.12:0,phase:0});battle.time=0;
      const frame=mode==='attack'?4:0,sprite=lib.get(u.type,team,frame,mode,0);
      const data=sprite.getContext('2d').getImageData(0,0,sprite.width,sprite.height).data;
      // A visible point above the ordinary infantry hit box must select the giant.
      let point=null;
      for(let y=Math.floor(sprite.height*80/456);y<sprite.height*180/456&&!point;y++)for(let x=Math.floor(sprite.width*100/480);x<sprite.width*360/480;x++)if(data[(y*sprite.width+x)*4+3]>230){
        const {combatOffset}=await import('/src/crown-battle-feedback.js');
        point={x:u.x+((x/sprite.width*80-30)*face+combatOffset(u))*renderer.spriteScaleX*visualScaleOf(u),y:u.y+(y/sprite.height*76-61)*renderer.spriteScaleY*visualScaleOf(u)};break;
      }
      hits.push(!!point&&unitAtPoint(battle,renderer,point,team,0)===u);
    }
    u.moving=false;u.attack=0;u.face=1;
    // A giant with its feet below the viewport can still have its upper body visible.
    u.y=renderer.view.y+480+100*renderer.spriteScaleY;
    renderer.render();const retained=renderer.frameSprites.has(u);
    const pages=renderer.spriteCache.pages.length;
    // Exercise fallback/mobile drawing, not just the GPU vertex path.
    renderer.resize(390,800,false,1);u.y=480;renderer.render();
    battlefield.remove();
    return {loaded,painted:loaded.every(id=>paintedArtVersion(id)===1),ratios,hits,retained,pages};
  });
  assert.equal(result.loaded.filter(Boolean).length,36);assert.ok(result.painted);
  assert.ok(result.ratios.balrog>2.8&&result.ratios.balrog<3.5,JSON.stringify(result.ratios));
  assert.ok(result.ratios.sauron>1.5);assert.ok(result.hits.every(Boolean),JSON.stringify(result.hits));
  assert.ok(result.retained);assert.ok(result.pages<=16);assert.deepEqual(errors,[]);
  await fs.mkdir('artifacts/middle-earth',{recursive:true});
  await page.locator('canvas').screenshot({path:'artifacts/middle-earth/revised-scale.jpg',type:'jpeg',quality:86});
  await fs.writeFile('artifacts/middle-earth/revision-checks.json',JSON.stringify(result,null,2));
  console.log('PASS painted assets, 12 giant hit tests, culling, mobile fallback, atlas cap and scale:',JSON.stringify(result));
}finally{await browser.close();}
