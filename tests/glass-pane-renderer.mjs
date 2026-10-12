import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5174';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  await page.goto(origin+'/glass-breaker.html');
  await page.locator('#pause').click();
  const result=await page.evaluate(async()=>{
    const {GlassBreaker,WIDTH,HEIGHT}=await import('/src/glass-breaker.js');
    const {GlassPaneRenderer}=await import('/src/glass-pane-renderer.js');
    const {GLASS_THEMES}=await import('/src/glass-themes.js');const themes=Object.values(GLASS_THEMES);
    const make=()=>{const c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;return c.getContext('2d',{willReadFrequently:true});};
    const cached=make(),reference=make(),renderer=new GlassPaneRenderer(cached),full=new GlassPaneRenderer(reference);
    let fills=0;const fill=CanvasRenderingContext2D.prototype.fill;CanvasRenderingContext2D.prototype.fill=function(...args){fills++;return fill.apply(this,args);};
    const game=new GlassBreaker({seed:42});
    renderer.update(game.cells,game.revision);
    const initialFills=fills;let firstImpactFills=0,comparisons=0,maxDifference=0,maxShards=0,updates=0;
    function compare(){
      full.setTheme(renderer.theme);full.reset();full.update(game.cells,game.revision);
      const a=cached.getImageData(0,0,WIDTH,HEIGHT).data,b=reference.getImageData(0,0,WIDTH,HEIGHT).data;
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
    return {initialFills,firstImpactFills,comparisons,maxDifference,maxShards,updates,unchangedFills:fills};
  });
  assert.ok(result.updates>30&&result.comparisons>3);
  assert.ok(result.firstImpactFills<result.initialFills*.2,'Local impacts must not redraw the whole pane');
  assert.equal(result.maxDifference,0,'Incremental image must match a complete redraw, including after reset');
  assert.equal(result.unchangedFills,0);
  assert.ok(result.maxShards<=180);
  console.log('PASS: localized glass rendering, full redraw pixel parity, reset and debris cap. '+JSON.stringify(result));
}finally{await browser.close();}
