import assert from 'node:assert/strict';
import {mkdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright';
import {validateBatch,sourceRecipe} from '../src/factory-recipes.js';
import {probeRps} from '../src/rock-paper-scissors-video.js';
import {produce} from '../scripts/factory-worker.mjs';

const origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5174';
const source={mode:'rock-paper-scissors',project:{seed:2,count:10,speed:2,map:'gates',background:'minimal',sound:true,soundStyle:'balanced',soundOverrides:{hit:'pluck',wall:'off',bounce:'off'}}};
const options=validateBatch({source,strategy:'exact',resolution:720,fps:12,orientation:'portrait',audio:'effects',channel:'Clipverseuni'});
assert.equal(validateBatch({source,strategy:'exact'}).fps,144);
assert.throws(()=>validateBatch({source,strategy:'variations'}));
const recipe=sourceRecipe(options.source,2),analysis=probeRps(recipe);
assert.equal(analysis.winner,'Paper');assert.ok(analysis.complete);
assert.equal(recipe.map,'gates');assert.equal(recipe.soundOverrides.hit,'pluck');
const slower=probeRps({...recipe,speed:1});assert.equal(slower.simulationSeconds,analysis.simulationSeconds*2);

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(source=>{localStorage.setItem('marble-studio-rock-paper-scissors-v1',JSON.stringify(source.project));localStorage.setItem('marble-studio.channel','Clipverseuni');},source);
  let queued;
  await page.route('**/api/factory?*',route=>route.fulfill({json:{apiVersion:4,capabilities:['studio-workbench','rps-production'],jobs:[],summary:{done:0,pending:0},total:0}}));
  await page.route('**/api/queue',route=>{queued=route.request().postDataJSON();return route.fulfill({json:{jobs:[]}});});
  await page.goto(origin+'/rock-paper-scissors.html');
  await page.locator('#studio-export').click();
  await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');
  assert.equal(await page.locator('#video-form [name=fps]').inputValue(),'144');
  assert.equal(await page.locator('#video-form [name=audio]').inputValue(),'effects');
  assert.ok(await page.locator('#video-form [name=strategy] option[value=variations]').evaluate(option=>option.disabled));
  await page.locator('#video-submit').click();
  assert.equal(await page.locator('#channel-choice select').inputValue(),'Clipverseuni');
  await page.locator('#channel-choice button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#videos-dialog')?.open);
  assert.equal(queued.source.mode,source.mode);assert.equal(queued.source.project.map,'gates');
  assert.equal(queued.source.project.speed,2);assert.equal(queued.channel,'Clipverseuni');
  assert.equal(queued.fps,144);assert.equal(queued.audio,'effects');assert.deepEqual(errors,[]);
  await page.goto(origin+'/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  const rendered=await page.evaluate(async ({recipe,analysis})=>{
    await window.factoryRenderer.begin({recipe,analysis,speed:1,intro:0,fps:12,width:720,height:1280,channel:'Clipverseuni',copy:{hook:'Test'}});
    window.factoryRenderer.frame(Math.ceil((analysis.simulationSeconds+1)*12));
    return {result:window.factoryRenderer.result(),effects:window.factoryRenderer.audio().effects};
  },{recipe,analysis});
  assert.equal(rendered.result.winner,analysis.winner);assert.ok(rendered.result.complete);
  assert.ok(rendered.effects.some(e=>e.cue.voice==='pluck'));
  assert.ok(rendered.effects.every(e=>e.time<=analysis.simulationSeconds+.01));
  console.log('PASS RPS dialog, 144 FPS default, queue settings, channel, deterministic result and sound cues');
}finally{await browser.close();}

const root=path.resolve('artifacts/rps-video-'+Date.now());await mkdir(root,{recursive:true});
const job={id:randomUUID(),mode:source.mode,ordinal:0,options};let previous='';
await produce(job,{root,origin,history:[],cancelled:()=>false,update:async patch=>{Object.assign(job,patch);if(job.stage!==previous){previous=job.stage;console.log(previous);}}});
const metadata=JSON.parse(await readFile(path.join(root,job.id,'metadata.json'),'utf8'));
assert.ok(metadata.analysis.complete);assert.equal(metadata.analysis.winner,'Paper');
assert.equal(metadata.video.fps,12);assert.equal(metadata.video.speed,1);
assert.equal(metadata.video.width,720);assert.equal(metadata.video.height,1280);
assert.equal(metadata.video.duration,Math.ceil(analysis.simulationSeconds+2));
for(const file of ['video.mp4','cover.jpg','metadata.json','upload.txt'])assert.ok((await stat(path.join(root,job.id,file))).size>0);
console.log('PASS complete RPS MP4 encode/decode:',metadata.video.duration+'s; artifacts:',path.join(root,job.id));
