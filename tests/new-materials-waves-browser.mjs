import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {WAVE_MODES,WAVE_PALETTES} from '../src/bounce-waves.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/bounce-waves.html');
  await page.waitForFunction(()=>window.bounceWavesStudio);
  assert.equal(await page.locator('#variant option').count(),Object.keys(WAVE_MODES).length);
  for(const variant of Object.keys(WAVE_MODES)){
    await page.locator('#variant').selectOption(variant);
    assert.equal(await page.evaluate(()=>window.bounceWavesStudio.snapshot().variant),variant);
  }
  for(const palette of Object.keys(WAVE_PALETTES))await page.locator(`[data-palette="${palette}"]`).click();
  await page.reload();await page.waitForFunction(()=>window.bounceWavesStudio);
  assert.equal(await page.locator('#variant').inputValue(),'star');
  assert.equal(await page.locator('[data-palette=meadow]').getAttribute('aria-pressed'),'true');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const result=await page.evaluate(async()=>{
    const {beginWaves,wavesFrame}=await import('/src/bounce-waves-video-render.js');
    const {WAVE_MODES,WAVE_PALETTES}=await import('/src/bounce-waves.js');
    const sheet=document.createElement('canvas');sheet.width=1260;sheet.height=640;const c=sheet.getContext('2d');
    const hashes=new Set();let index=0;
    for(const [variant,palette] of [...Object.keys(WAVE_MODES).map(v=>[v,'pearl']),...Object.keys(WAVE_PALETTES).map(p=>['twins',p])]){
      beginWaves({speed:1,recipe:{variant,palette,count:800}});const frame=wavesFrame(1.2);
      const bytes=frame.getContext('2d').getImageData(0,0,frame.width,frame.height).data;let hash=2166136261;
      for(let i=0;i<bytes.length;i+=4)hash=Math.imul(hash^bytes[i]^bytes[i+1]^bytes[i+2],16777619);hashes.add(hash);
      if(index<5)c.drawImage(frame,index*180,0,180,320);index++;
    }
    const {beginBreaker,breakerFrame}=await import('/src/breaker-video-render.js');
    index=0;
    for(const theme of ['iznik','rain','fern','ripples','frost','honeycomb','bubbles']){
      await beginBreaker({width:540,height:960,speed:1,analysis:{simulationSeconds:10},recipe:{mode:'glass-breaker',seed:42,theme,liveColors:false,playbackSpeed:1}});
      c.drawImage(breakerFrame(.5),index++*180,320,180,320);
      breakerFrame(4);
    }
    document.body.append(sheet);sheet.id='review';
    return {unique:hashes.size,total:Object.keys(WAVE_MODES).length+Object.keys(WAVE_PALETTES).length};
  });
  // Twin ripples with Pearl is deliberately present in both loops.
  assert.equal(result.unique,result.total-1);
  await page.locator('#review').screenshot({path:'artifacts/new-materials-waves.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: wave controls, palette persistence, mobile fit, distinct exported waves/colors and seven textured glass exports.');
}finally{await browser.close();}
