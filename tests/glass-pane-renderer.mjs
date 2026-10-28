import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5174';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  await page.goto(origin+'/glass-breaker.html');
  await page.locator('#pause').click();
  for(const scale of [1,720/540,2]){
  const result=await page.evaluate(async scale=>{
    const {GlassBreaker,WIDTH,HEIGHT}=await import('/src/glass-breaker.js');
    const {GlassPaneRenderer}=await import('/src/glass-pane-renderer.js');
    const {GLASS_THEMES}=await import('/src/glass-themes.js');const themes=Object.values(GLASS_THEMES);
    const make=()=>{const c=document.createElement('canvas');c.width=Math.round(WIDTH*scale);c.height=Math.round(HEIGHT*scale);const ctx=c.getContext('2d',{willReadFrequently:true});ctx.scale(scale,scale);return ctx;};
    const cached=make(),reference=make(),renderer=new GlassPaneRenderer(cached),full=new GlassPaneRenderer(reference);
    let fills=0;const fill=CanvasRenderingContext2D.prototype.fill;CanvasRenderingContext2D.prototype.fill=function(...args){fills++;return fill.apply(this,args);};
    const game=new GlassBreaker({seed:42});
    renderer.update(game.cells,game.revision);
    const initialFills=fills;let firstImpactFills=0,comparisons=0,maxDifference=0,maxShards=0,updates=0;
    function compare(){
      full.setTheme(renderer.theme);full.reset();full.update(game.cells,game.revision);
      const a=cached.getImageData(0,0,cached.canvas.width,cached.canvas.height).data,b=reference.getImageData(0,0,reference.canvas.width,reference.canvas.height).data;
      for(let i=0;i<a.length;i++)maxDifference=Math.max(maxDifference,Math.abs(a[i]-b[i]));
      comparisons++;
    }
    for(let frame=0;frame<3600&&game.state==='running';frame++){
      const previous=game.revision;game.step(1/60);maxShards=Math.max(maxShards,game.shards.length);
      if(previous===game.revision)continue;
      fills=0;renderer.update(game.cells,game.revision);updates++;
      if(!firstImpactFills)firstImpactFills=fills;
      if(updates===1||updates%15===0||game.state==='won')compare();
      if(updates%15===0){renderer.setTheme(themes[(updates/15)%themes.length]);renderer.update(game.cells,game.revision);compare();}
    }
    game.reset(43);renderer.reset();renderer.update(game.cells,game.revision);compare();
    fills=0;renderer.update(game.cells,game.revision);
    CanvasRenderingContext2D.prototype.fill=fill;
    return {scale,initialFills,firstImpactFills,comparisons,maxDifference,maxShards,updates,unchangedFills:fills};
  },scale);
  assert.ok(result.updates>30&&result.comparisons>3);
  assert.ok(result.firstImpactFills<result.initialFills*.2,'Local impacts must not redraw the whole pane');
  assert.ok(result.maxDifference<=1,'Textured incremental image must match a complete redraw within one 8-bit rounding level');
  assert.equal(result.unchangedFills,0);
  assert.ok(result.maxShards<=180);
  console.log('PASS: localized glass rendering, full redraw pixel parity, reset and debris cap. '+JSON.stringify(result));
  }
  const exports=await page.evaluate(async()=>{
    const {beginBreaker,breakerFrame}=await import('/src/breaker-video-render.js');
    const results=[];
    for(const [width,height] of [[1080,1920],[720,1280],[1080,1080]]){
      await beginBreaker({width,height,speed:1,analysis:{simulationSeconds:10},recipe:{mode:'glass-breaker',seed:42,theme:'spectrum',liveColors:false,playbackSpeed:1}});
      const first=breakerFrame(0),pixels=first.getContext('2d').getImageData(0,0,first.width,first.height).data;
      let detail=0;for(let i=4;i<pixels.length;i+=4)if(Math.abs(pixels[i]-pixels[i-4])>20)detail++;
      const later=breakerFrame(4);
      results.push({width:later.width,height:later.height,detail});
    }
    return results;
  });
  assert.deepEqual(exports.map(({width,height})=>[width,height]),[[1080,1920],[720,1280],[608,1081]]);
  assert.ok(exports.every(result=>result.detail>100),'Export frames must contain glass detail');
  console.log('PASS: native export frames at 1080p, 720p and square fit. '+JSON.stringify(exports));
}finally{await browser.close();}
