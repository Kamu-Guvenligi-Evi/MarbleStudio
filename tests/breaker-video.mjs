import assert from 'node:assert/strict';
import {mkdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright';
import {productionBrowserOptions} from '../scripts/browser-runtime.mjs';
import {selectTestChannel} from './browser-channel.mjs';
import {validateBatch,sourceRecipe} from '../src/factory-recipes.js';
import {probeBreaker} from '../src/breaker-video.js';
import {produce} from '../scripts/factory-worker.mjs';

const origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5174';
const root=path.resolve('artifacts/breaker-video-'+Date.now());await mkdir(root,{recursive:true});
const sources=[
  {mode:'glass-breaker',project:{seed:42,theme:'gold',liveColors:true,playbackSpeed:3,sound:true}},
  {mode:'spiral-breaker',project:{mapId:'spiral',playbackSpeed:2,sound:true}},
];
for(const source of sources){
  assert.throws(()=>validateBatch({source,strategy:'variations'}));
  assert.throws(()=>validateBatch({source:{...source,project:{...source.project,playbackSpeed:99}}}));
  assert.throws(()=>validateBatch({modes:[source.mode]}));
  const r=sourceRecipe(validateBatch({source}).source,42);r.clipSeconds=28;
  const result=probeBreaker(r);assert.ok(result.complete&&result.finite);
  if(source.mode==='spiral-breaker'){assert.equal(result.simulationSeconds,28);assert.equal(result.winner,'In progress');assert.equal(result.gameComplete,false);}
}
const browser=await chromium.launch(productionBrowserOptions());
try{
  for(const source of sources){
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await selectTestChannel(page);
    let queued;
    await page.route('**/api/**',async route=>{
      if(route.request().url().endsWith('/queue'))queued=validateBatch(route.request().postDataJSON());
      await route.fulfill({json:{apiVersion:4,capabilities:['studio-workbench','breaker-production'],jobs:[],total:0,summary:{done:0,pending:0}}});
    });
    await page.goto(origin+'/'+source.mode+'.html');
    if(source.mode==='glass-breaker'){await page.locator('[data-theme="gold"]').click();await page.locator('#live-colors').check();}
    await page.locator('#studio-export').click();
    await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');
    assert.equal(await page.locator('#video-form [name=strategy] option[value=variations]').evaluate(o=>o.disabled),true);
    assert.equal(await page.locator('#video-series').isVisible(),source.mode==='spiral-breaker');
    assert.equal(await page.locator('[name=count]').isVisible(),false);
    if(source.mode==='spiral-breaker')await page.selectOption('[name=duration]','30');
    await page.locator('#video-advanced summary').click();
    await page.selectOption('[name=resolution]','720');await page.locator('[name=fps]').fill('4');
    await page.selectOption('[name=audio]','effects');await page.locator('[name=orientation][value=square]').check();
    await page.locator('#video-submit').click();await page.waitForFunction(()=>document.querySelector('#videos-dialog').open);
    assert.equal(queued.source.mode,source.mode);assert.equal(queued.orientation,'square');assert.equal(queued.audio,'effects');
    if(source.mode==='glass-breaker'){assert.equal(queued.source.project.theme,'gold');assert.equal(queued.source.project.liveColors,true);}
    else assert.equal(queued.duration,30);
    assert.deepEqual(errors,[]);await page.close();
  }
}finally{await browser.close();}
console.log('PASS breaker validation and both video dialogs');
for(const source of sources){
  const job={id:randomUUID(),mode:source.mode,ordinal:0,options:validateBatch({source,strategy:'exact',duration:30,resolution:720,fps:4,orientation:source.mode==='glass-breaker'?'square':'landscape',audio:'effects',channel:'LastBallStand'})};
  let previous='';await produce(job,{root,origin,history:[],cancelled:()=>false,update:async patch=>{Object.assign(job,patch);if(job.stage!==previous){previous=job.stage;console.log(source.mode,previous);}}});
  const metadata=JSON.parse(await readFile(path.join(root,job.id,'metadata.json'),'utf8'));
  assert.ok(metadata.analysis.complete);assert.equal(metadata.video.fps,4);assert.equal(metadata.video.speed,1);
  assert.equal(metadata.video.height,720);assert.equal(metadata.video.width,source.mode==='glass-breaker'?720:1280);
  if(source.mode==='spiral-breaker')assert.equal(metadata.video.duration,30);
  for(const file of ['video.mp4','cover.jpg','metadata.json','upload.txt'])assert.ok((await stat(path.join(root,job.id,file))).size>0);
  console.log('PASS MP4 encode/decode and matching simulation:',source.mode,metadata.video.duration+'s');
}
console.log('Local artifacts:',root);
