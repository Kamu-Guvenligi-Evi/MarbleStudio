import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/smooth-motion-test', route => route.fulfill({contentType:'text/html',body:'<canvas width="600" height="960"></canvas>'}));
  await page.goto('http://127.0.0.1:5173/smooth-motion-test');
  const result = await page.evaluate(async () => {
    const {BattleSpriteBatch} = await import('/src/crown-battle-sprite-batch.js');
    const {BattleSpriteCache} = await import('/src/crown-battle-sprite-cache.js');
    let now = 0;
    Object.defineProperty(performance, 'now', {configurable:true,value:()=>now});
    const canvas = document.querySelector('canvas'), batch = new BattleSpriteBatch();
    const source = document.createElement('canvas'); source.width = source.height = 16;
    source.getContext('2d').fillRect(0,0,16,16);
    const cache = new BattleSpriteCache(); cache.beginFrame(1);
    const entry = cache.get(source,1,false,1,null);
    const u = {id:1,type:'sword',hp:100,face:1,x:150,y:480};
    const renderer = {canvas,ctx:canvas.getContext('2d'),spriteCache:cache,frameSprites:new Map([[u,entry]]),
      view:{x:300,y:480,zoom:1},spriteScaleX:1,spriteScaleY:1,battle:{time:0},layersActive:true,motionInterval:100};
    const centroid = () => {
      const gl=batch.gl,pixels=new Uint8Array(600*960*4);gl.readPixels(0,0,600,960,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      let sum=0,weight=0;
      for(let i=3;i<pixels.length;i+=4){sum+=((i-3)/4%600)*pixels[i];weight+=pixels[i];}
      return sum/weight;
    };
    batch.render(renderer,[],[u],()=>0); const initial=centroid();
    now=100; u.x+=100;
    batch.render(renderer,[],[u],()=>0); const start=centroid();
    now=150; const intermediateDraw=batch.animate(now),middle=centroid();
    const simulationUnchanged=u.x===250 && renderer.battle.time===0;
    // A fresh simulation sample must start where the previous frame is shown.
    u.x+=100; batch.render(renderer,[],[u],()=>0);const continuous=centroid();
    now=200; batch.animate(now);const secondMiddle=centroid();
    now=250; batch.animate(now);const end=centroid();
    const settled=!batch.animate(300);
    renderer.motionInterval=0; batch.render(renderer,[],[u],()=>0);
    const pause=!batch.animate(400),paused=centroid();
    renderer.view.x+=100;batch.render(renderer,[],[u],()=>0);const camera=centroid();
    // Reordering and temporary invisibility must never interpolate from another
    // soldier's slot or stale offscreen coordinates.
    const other={...u,id:2,x:450};renderer.frameSprites.set(other,entry);
    renderer.motionInterval=100;now=500;batch.render(renderer,[],[other,u],()=>0);
    const snapshots=[batch.motion.get(u).x,batch.motion.get(other).x];
    now=600;batch.render(renderer,[],[other],()=>0);
    u.x=50;now=650;batch.render(renderer,[],[u,other],()=>0);
    const reentry=batch.motion.get(u).startX===batch.motion.get(u).x;
    const glError=batch.gl.getError();
    batch.gl.getExtension('WEBGL_lose_context').loseContext();
    const lost=!batch.animate(700);
    return {initial,start,middle,continuous,secondMiddle,end,paused,camera,intermediateDraw,simulationUnchanged,settled,pause,snapshots,reentry,glError,lost};
  });
  const close=(a,b)=>assert(Math.abs(a-b)<1,`${a} differs from ${b}`);
  close(result.start,result.initial);close(result.middle,result.initial+50);
  close(result.continuous,result.middle);close(result.secondMiddle,result.initial+125);
  close(result.end,result.initial+200);close(result.paused,result.end);close(result.camera,result.end-100);
  for(const key of ['intermediateDraw','simulationUnchanged','settled','pause','reentry','lost'])assert(result[key],key);
  assert.deepEqual(result.snapshots,[350,450]);assert.equal(result.glError,0);assert.deepEqual(errors,[]);
  console.log('PASS GPU pixel positions: intermediate movement, continuity across samples, stable identity, pause/camera/context loss; simulation untouched');
} finally { await browser.close(); }
