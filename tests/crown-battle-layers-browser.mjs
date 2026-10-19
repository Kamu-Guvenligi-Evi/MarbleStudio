import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage();
  await page.routeWebSocket('**/*',s=>s.close());
  await page.route('**/layers-empty',r=>r.fulfill({contentType:'text/html',body:'<style>canvas{display:block}</style><div style="position:relative;width:800px;height:500px"><canvas style="position:absolute;inset:0;width:100%;height:100%"></canvas></div>'}));
  await page.goto('http://127.0.0.1:5173/layers-empty');
  const result=await page.evaluate(async()=>{
    const {Battle}=await import('/src/crown-battle.js');
    const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
    const b=new Battle({historicalArmies:[{samurai:100},{viking:100}]});
    const r=new BattleRenderer(document.querySelector('canvas'),b);
    r.resize(800,500,true);r.enableLayers();r.render();
    const state=()=>JSON.stringify(b.units.map(u=>[u.x,u.y,u.hp]));
    const initial=state();
    for(let i=0;i<100;i++) {r.prepareBattle();if(r.warmIndex>=r.warmJobs.length)break;}
    const warmed=r.warmIndex===r.warmJobs.length;
    const sources=r.sprites.cache.size;
    r.prepareBattle();
    const stable=sources===r.sprites.cache.size && b.time===0 && state()===initial;
    for(let i=0;i<40;i++)r.render();
    const oldKey=r.groundKey,oldScene=r.groundScene;
    r.render();
    const groundStable=r.groundKey===oldKey && r.groundScene===oldScene;
    const order=[...r.canvas.parentNode.children];
    const layering=order.indexOf(r.groundCanvas)<order.indexOf(r.underCanvas) && order.indexOf(r.underCanvas)<order.indexOf(r.spriteBatch.canvas) && order.indexOf(r.spriteBatch.canvas)<order.indexOf(r.canvas);
    const input=[r.groundCanvas,r.underCanvas,r.spriteBatch.canvas].every(c=>getComputedStyle(c).pointerEvents==='none');
    // Missing one pose must only invoke one Canvas fallback, not disable batching.
    const missing=b.units[0],cached=r.cachedSprite.bind(r),soldier=r.soldier.bind(r);let fallbacks=0;
    r.cachedSprite=u=>u===missing?null:cached(u);
    r.soldier=u=>{fallbacks++;return soldier(u);};
    const frames=r.spriteBatch.frames;r.render();
    const partial=r.spriteBatch.frames===frames+1 && fallbacks===1;
    r.cachedSprite=cached;r.soldier=soldier;
    r.spriteBatchEnabled=false;r.render();
    const hidden=getComputedStyle(r.spriteBatch.canvas).display==='none';
    r.spriteBatchEnabled=true;r.resize(920,560,true);r.render();
    const aligned=[r.groundCanvas,r.underCanvas,r.spriteBatch.canvas].every(c=>c.width===920&&c.height===560);
    const entry=[...r.frameSprites.values()].find(Boolean);
    r.resize(1080,1920,false);r.render();
    const portrait=[r.groundCanvas,r.underCanvas,r.spriteBatch.canvas].every(c=>getComputedStyle(c).display==='none');
    // Grow the texture array, then verify an older page was re-uploaded intact.
    const batch=r.spriteBatch,cache=r.spriteCache;
    const oldPage=entry.page;
    const pixel=oldPage.ctx.getImageData(entry.x,entry.y,entry.width,entry.height).data;
    let p=0;while(p<pixel.length && pixel[p+3]<250)p+=4;
    if(p===pixel.length)throw Error('Opaque sample missing');
    const x=entry.x+(p/4)%entry.width,y=entry.y+Math.floor(p/4/entry.width);
    const pages=[...cache.pages];
    while(pages.length<5){
      const c=document.createElement('canvas');c.width=c.height=1024;
      const ctx=c.getContext('2d',{willReadFrequently:true});ctx.fillRect(0,0,2,2);
      // Uploads now consume the bounded, premultiplied CPU page buffer.
      const pixels=new Uint8Array(1024*1024*4);
      for(let y=0;y<2;y++)for(let x=0;x<2;x++)pixels[(y*1024+x)*4+3]=255;
      pages.push({canvas:c,ctx,pixels,version:1,regions:[{x:0,y:0,width:2,height:2}]});
    }
    batch.uploadPages(pages);
    const gl=batch.gl,f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);
    gl.framebufferTextureLayer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,batch.texture,0,batch.pages.get(oldPage).layer);
    const actual=new Uint8Array(4);gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,actual);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.deleteFramebuffer(f);
    const growth=batch.layers>=5 && actual.every((v,i)=>Math.abs(v-(i===3?pixel[p+i]:Math.round(pixel[p+i]*pixel[p+3]/255)))<=1);
    return {warmed,stable,groundStable,layering,input,partial,hidden,aligned,portrait,growth,glError:gl.getError()};
  });
  for(const [key,value]of Object.entries(result))assert.equal(value,key==='glError'?0:true,key);
  console.log('PASS layers: idle warmup, partial batch, input, resize, portrait, stale-layer hiding, texture growth',JSON.stringify(result));
}finally{await browser.close();}
