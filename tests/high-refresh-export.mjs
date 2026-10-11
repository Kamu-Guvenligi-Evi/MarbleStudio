import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
const root=await mkdtemp(path.resolve('artifacts/high-refresh-'));
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  for(const kind of ['track','arena','territory','spiral','statistics'])for(const fps of [240,360]){
    const recipe=kind==='statistics'?{mode:'statistics',statistics:{csv:'Yıl,Alfa,Beta\n2000,1,5\n2001,10,4',duration:'15',top:'5',interpolation:'linear'}}:{mode:kind==='territory'?'arena':kind,seed:2048,count:12,arenaGame:kind==='territory'?'territory':'links'};
    await page.evaluate(config=>window.factoryRenderer.begin(config),{recipe,fps,width:720,height:1280,speed:1,intro:0,analysis:{simulationSeconds:15},copy:{hook:'Test',language:'tr'}});
    const frames=await page.evaluate(({fps})=>Array.from({length:12},(_,i)=>window.factoryRenderer.frame(fps+i)),{fps});
    assert.equal(new Set(frames).size,12,`${kind} ${fps}: every intermediate frame changes`);
    console.log('PASS: distinct rendered frames',kind,fps);
  }
  const file=path.join(root,'territory-240fps.mp4');
  await page.evaluate(()=>window.factoryRenderer.begin({recipe:{mode:'arena',arenaGame:'territory',seed:2048,count:12},fps:240,width:720,height:1280,speed:1,intro:0,analysis:{simulationSeconds:15},copy:{hook:'Test',language:'tr'}}));
  const encoder=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','240','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',file],{windowsHide:true,stdio:['pipe','ignore','pipe']});
  let stderr='';encoder.stderr.on('data',chunk=>stderr+=chunk);const finished=once(encoder,'close');
  for(let i=0;i<240;i++){const jpeg=Buffer.from(await page.evaluate(i=>window.factoryRenderer.frame(i),i),'base64');if(!encoder.stdin.write(jpeg))await once(encoder.stdin,'drain');}
  encoder.stdin.end();assert.equal((await finished)[0],0,stderr);
  const probe=spawnSync(ffmpeg,['-hide_banner','-i',file,'-an','-f','null','-','-progress','pipe:1'],{windowsHide:true,encoding:'utf8'});
  assert.equal(probe.status,0);assert.match(probe.stderr,/\b240 fps\b/);assert.match(probe.stdout,/frame=240\r?\n/);
  assert.deepEqual(errors,[]);await writeFile(path.join(root,'verification.json'),JSON.stringify({fps:240,frames:240,seconds:1,modes:['track','arena','territory','spiral','statistics'],testedFPS:[240,360]},null,2));
  console.log('PASS: real 720p H.264 MP4 encoded and decoded, 240 frames in 1 second. '+file);
}finally{await browser.close();}
