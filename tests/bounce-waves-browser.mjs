import assert from 'node:assert/strict';
import {mkdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright';
import {validateBatch,sourceRecipe} from '../src/factory-recipes.js';
import {probeWaves} from '../src/bounce-waves.js';
import {produce} from '../scripts/factory-worker.mjs';
const origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5174';
const root=path.resolve('artifacts/bounce-waves-review');await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
let source={mode:'bounce-waves',project:{count:1400,duration:15,speed:2,music:{track:'monkeys',volume:27}}};
try{
  const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(source=>{if(!localStorage.getItem('marble-studio-bounce-waves-v1'))localStorage.setItem('marble-studio-bounce-waves-v1',JSON.stringify(source.project));localStorage.setItem('marble-studio.channel','Clipverseuni');},source);
  let queued;
  await page.route('**/api/factory?*',route=>route.fulfill({json:{apiVersion:5,capabilities:['studio-workbench','temporary-downloads','waves-production'],jobs:[],summary:{done:0,pending:0},total:0}}));
  await page.route('**/api/queue',route=>{queued=route.request().postDataJSON();return route.fulfill({json:{jobs:[]}});});
  await page.goto(origin+'/bounce-waves.html');await page.waitForFunction(()=>window.bounceWavesStudio?.state().time>.1);
  assert.equal(await page.locator('#count').inputValue(),'4200','legacy density upgrades on first launch');
  assert.ok((await page.evaluate(()=>window.bounceWavesStudio.state())).count>4000);
  await page.locator('#pause').click();const state=await page.evaluate(()=>window.bounceWavesStudio.state());
  await page.waitForTimeout(100);assert.deepEqual(await page.evaluate(()=>window.bounceWavesStudio.state()),state);
  for(const variant of ['spiral','cross','petals','ripple'])await page.locator('#variant').selectOption(variant);
  await page.locator('[data-palette=custom]').click();
  await page.locator('#colorA').fill('#ffe440');await page.locator('#colorA').dispatchEvent('change');
  await page.locator('#colorB').fill('#ff2458');await page.locator('#colorB').dispatchEvent('change');
  await page.locator('#count').selectOption('2600');
  await page.reload();await page.waitForFunction(()=>window.bounceWavesStudio);
  assert.equal(await page.locator('#colorA').inputValue(),'#ffe440');assert.equal(await page.locator('#count').inputValue(),'2600');
  await page.locator('#count').selectOption('8000');
  await page.reload();await page.waitForFunction(()=>window.bounceWavesStudio);
  assert.equal(await page.locator('#count').inputValue(),'8000');
  assert.ok((await page.evaluate(()=>window.bounceWavesStudio.state())).count>7600);
  await page.waitForFunction(()=>document.querySelector('#music-track').value==='monkeys');
  assert.equal(await page.locator('#music-volume').inputValue(),'27');
  await page.locator('#pause').click();
  await page.locator('.music-menu summary').click();await page.locator('#music-preview').click();
  await page.waitForFunction(()=>!document.querySelector('#music-audio').paused);await page.locator('#music-preview').click();
  // Drive the real app with a low-frequency display clock: time must not slow
  // down when frames take longer than 50 ms, and pauses must not catch up.
  const clockPage=await browser.newPage();
  await clockPage.addInitScript(()=>{
    localStorage.setItem('marble-studio-bounce-waves-v1',JSON.stringify({speed:1,sound:false}));
    window.requestAnimationFrame=callback=>{window.waveTestFrame=callback;return 1;};
  });
  await clockPage.goto(origin+'/bounce-waves.html');
  await clockPage.waitForFunction(()=>window.bounceWavesStudio&&window.waveTestFrame);
  const advance=now=>clockPage.evaluate(now=>{window.waveTestFrame(now);return window.bounceWavesStudio.state().time;},now);
  assert.equal(await advance(1000),0);
  assert.ok(Math.abs(await advance(1100)-.1)<1e-9,'10 FPS still advances 100 ms');
  assert.ok(Math.abs(await advance(1500)-.5)<1e-9,'a stalled frame does not slow the clock');
  await clockPage.locator('#pause').click();await advance(2000);
  assert.equal(await advance(4000),.5);
  await clockPage.locator('#pause').click();assert.equal(await advance(5000),.5);
  assert.ok(Math.abs(await advance(5100)-.6)<1e-9,'resume excludes paused time');
  await clockPage.locator('#height').fill('300');await clockPage.locator('#height').dispatchEvent('change');
  assert.equal(await advance(5200),0,'changing physics restarts instead of moving airborne balls');
  await clockPage.close();
  source.project=await page.evaluate(()=>window.bounceWavesStudio.snapshot());
  await page.locator('#studio-export').click();await page.waitForFunction(()=>!document.querySelector('#video-submit').disabled);
  assert.equal(await page.locator('[name=fps]').inputValue(),'144');
  await page.locator('#video-submit').click();await page.locator('#channel-choice button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#videos-dialog')?.open);
  assert.equal(queued.fps,144);assert.equal(queued.source.mode,'bounce-waves');assert.equal(queued.channel,'Clipverseuni');assert.equal(queued.source.project.music.volume,27);
  await page.goto(origin+'/bounce-waves.html');await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no mobile overflow');
  await page.goto(origin+'/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  const recipe=sourceRecipe(source,1),analysis=probeWaves(recipe);
  const checks=await page.evaluate(async({recipe,analysis})=>{
    const {BounceWaves,WAVE_MODES}=await import('/src/bounce-waves.js');
    const {renderWaves}=await import('/src/bounce-waves-renderer.js');
    const frame=document.createElement('canvas');frame.width=540;frame.height=960;const ctx=frame.getContext('2d');
    const sheet=document.createElement('canvas');sheet.id='review';sheet.width=1080;sheet.height=480;
    for(const [i,variant] of Object.keys(WAVE_MODES).entries()){
      const game=new BounceWaves({variant,palette:['aurora','sunset','candy','spectrum'][i]});game.seek(9.125);renderWaves(ctx,game,{channel:'Clipverseuni'});sheet.getContext('2d').drawImage(frame,i*270,0,270,480);
    }
    const dense=new BounceWaves({count:8000});const times=[];
    for(let i=0;i<180;i++){const start=performance.now();dense.seek(5+i/60);renderWaves(ctx,dense);times.push(performance.now()-start);}
    times.sort((a,b)=>a-b);
    // The accelerated path must retain the original sphere colors and layering.
    const reference=document.createElement('canvas');reference.width=540;reference.height=960;
    const getContext=HTMLCanvasElement.prototype.getContext;
    try{
      HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:getContext.call(this,type,...args);};
      renderWaves(reference.getContext('2d'),dense);
    }finally{HTMLCanvasElement.prototype.getContext=getContext;}
    const pixels=ctx.getImageData(0,0,540,960).data,original=reference.getContext('2d').getImageData(0,0,540,960).data;
    let difference=0;for(let i=0;i<pixels.length;i++)difference+=Math.abs(pixels[i]-original[i]);
    const meanPixelDifference=difference/pixels.length;
    await window.factoryRenderer.begin({recipe,analysis,speed:1,intro:0,fps:144,width:1080,height:1920,channel:'Clipverseuni',copy:{hook:'Test'}});
    window.factoryRenderer.frame(144*4);
    const {beginWaves,wavesFrame}=await import('/src/bounce-waves-video-render.js');
    beginWaves({recipe,analysis,speed:1,intro:0,channel:'Clipverseuni'});
    const exported=wavesFrame(4),live=document.createElement('canvas');live.width=1080;live.height=1920;
    renderWaves(live.getContext('2d'),new BounceWaves(recipe).seek(4*recipe.speed),{channel:'Clipverseuni'});
    const equal=exported.toDataURL()===live.toDataURL();
    window.factoryRenderer.frame(144*analysis.simulationSeconds);
    const complete=window.factoryRenderer.result().complete;
    document.body.replaceChildren(sheet);
    return {p50:times[90],p95:times[171],count:dense.balls.length,meanPixelDifference,equal,complete};
  },{recipe,analysis});
  assert.ok(checks.equal,'preview and export match exactly');assert.ok(checks.complete);assert.ok(checks.p95<33,'dense render fits 30fps budget');
  assert.ok(checks.meanPixelDifference<2,'GPU rendering preserves the canvas appearance');
  await page.setViewportSize({width:1100,height:500});await page.locator('#review').screenshot({path:path.join(root,'modes.png')});
  assert.deepEqual(errors,[]);console.log('PASS controls, palette persistence, music, mobile, 144 FPS export dialog, render parity:',checks);
}finally{await browser.close();}
if(process.argv.includes('--encode')){
  const options=validateBatch({source,resolution:720,fps:12,audio:'all',channel:'Clipverseuni'});
  const job={id:randomUUID(),mode:source.mode,ordinal:0,options};
  await produce(job,{root,origin,history:[],cancelled:()=>false,update:async patch=>Object.assign(job,patch)});
  const metadata=JSON.parse(await readFile(path.join(root,job.id,'metadata.json'),'utf8'));
  assert.ok(metadata.analysis.complete);assert.ok(metadata.musicCredits.some(c=>c.includes('Monkeys Spinning Monkeys')));
  assert.ok((await stat(path.join(root,job.id,'video.mp4'))).size>1000);
  assert.equal(metadata.recipe.palette,'custom');assert.equal(metadata.video.speed,1);
  console.log('PASS actual MP4 encode/decode with music:',metadata.video.duration+'s',path.join(root,job.id,'video.mp4'));
}
