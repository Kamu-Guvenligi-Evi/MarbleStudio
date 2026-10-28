import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {chromium} from 'playwright';
import {productionBrowserOptions} from '../scripts/browser-runtime.mjs';
import {videoTiming} from '../scripts/video-timing.mjs';
import {produce} from '../scripts/factory-worker.mjs';
import {validateBatch,sourceRecipe} from '../src/factory-recipes.js';
import {probeWaves} from '../src/bounce-waves.js';

const origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5173';
if(!process.argv.includes('--encode-only')){
const browser=await chromium.launch(productionBrowserOptions());
try{
  const page=await browser.newPage();
  await page.goto(origin+'/factory-render.html');
  await page.waitForFunction(()=>window.factoryRenderer);
  for(const [duration,speed,fps,count,intro] of [[30,.75,144,8000,0],[30,1,30,500,0],[30,1.5,60,500,3],[15,2,12,500,0],[15.001,1,12,500,0]]){
    const recipe=sourceRecipe({mode:'bounce-waves',project:{duration,speed,count}},1);
    const analysis=probeWaves(recipe),timing=videoTiming(analysis.simulationSeconds,55,{exact:true,intro,outro:0});
    const config={recipe,analysis,...timing,intro,fps,width:180,height:320,copy:{hook:'Test'}};
    const result=await page.evaluate(async config=>{
      const renderer=window.factoryRenderer;
      await renderer.begin(config);
      renderer.frame(Math.max(0,Math.floor((config.intro+config.analysis.simulationSeconds)*config.fps)-2));
      const before=renderer.result();
      // Match the worker: indices are 0..ceil(duration*fps)-1, never duration*fps.
      renderer.frame(Math.ceil(config.duration*config.fps)-1);
      const last=renderer.result();
      const {BounceWaves}=await import('/src/bounce-waves.js');
      const {renderWaves}=await import('/src/bounce-waves-renderer.js');
      const {beginWaves,wavesFrame}=await import('/src/bounce-waves-video-render.js');
      beginWaves(config);
      const exported=wavesFrame((Math.ceil(config.duration*config.fps)-1)/config.fps);
      const expected=document.createElement('canvas');expected.width=1080;expected.height=1920;
      renderWaves(expected.getContext('2d'),new BounceWaves(config.recipe).seek(config.recipe.duration));
      const landed=exported.toDataURL()===expected.toDataURL();
      // A genuinely truncated video must still fail completion validation.
      await renderer.begin({...config,duration:config.intro+config.analysis.simulationSeconds-1});
      renderer.frame(Math.ceil((config.intro+config.analysis.simulationSeconds-1)*config.fps)-1);
      return {before,last,landed,truncated:renderer.result()};
    },config);
    assert.equal(result.before.complete,false,'earlier frame must remain unfinished');
    assert.deepEqual(result.last,{complete:true,winner:analysis.winner},`${duration}s / ${speed}x / ${fps}fps final encoded frame`);
    assert.ok(result.landed,'last encoded frame must show the physical landing');
    assert.equal(result.truncated.complete,false,'do not bypass validation of incomplete videos');
  }
  console.log('PASS final encoded frame: 144/60/30/12 FPS, speed, intro, rounding, landing pixels and truncated-video rejection');
}finally{await browser.close();}
}

if(process.argv.includes('--encode')||process.argv.includes('--encode-only')){
  const root=path.resolve('artifacts/bounce-waves-export-end');
  const source={mode:'bounce-waves',project:{duration:15,speed:1.5,count:500}};
  const options=validateBatch({source,resolution:720,fps:12,audio:process.argv.includes('--audio')?'effects':'none'});
  const job={id:randomUUID(),mode:source.mode,ordinal:0,options};
  await produce(job,{root,origin,history:[],cancelled:()=>false,update:async patch=>Object.assign(job,patch)});
  const metadata=JSON.parse(await readFile(path.join(root,job.id,'metadata.json'),'utf8'));
  assert.equal(job.state,'done');assert.equal(job.progress,100);
  assert.equal(metadata.video.duration,10);assert.equal(metadata.video.fps,12);
  assert.ok((await stat(path.join(root,job.id,'video.mp4'))).size>1024);
  if(process.argv.includes('--audio')){
    const decoded=spawnSync(ffmpeg,['-v','error','-i',path.join(root,job.id,'video.mp4'),'-map','0:a:0','-f','s16le','-ac','1','-ar','48000','pipe:1'],{windowsHide:true,maxBuffer:4000000});
    assert.equal(decoded.status,0,decoded.stderr?.toString());
    let peak=0;for(let i=0;i<decoded.stdout.length;i+=2)peak=Math.max(peak,Math.abs(decoded.stdout.readInt16LE(i)));
    assert.ok(peak>600&&peak<10000,'final MP4 must contain gentle, audible floor contacts');
  }
  console.log('PASS real 10-second MP4 encode, full decode and ready status:',path.join(root,job.id,'video.mp4'));
}
