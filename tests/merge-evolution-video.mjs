import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {writeFile,stat} from 'node:fs/promises';
import ffmpeg from 'ffmpeg-static';
import {productionAudio} from '../scripts/factory-audio.mjs';
const dir='artifacts/merge-evolution',browser=await chromium.launch({channel:'chrome',headless:true});
function run(args){const child=spawn(ffmpeg,args,{windowsHide:true});let log='';child.stderr.on('data',d=>log=(log+d).slice(-1800));const done=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error(log)));});return {child,done};}
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
 const {recipe,duration}=await page.evaluate(async()=>{const {normalizeMerge}=await import('/src/merge-evolution.js');const recipe={...normalizeMerge({theme:'butterfly'}),mode:'merge-evolution'},analysis=window.factoryRenderer.probe(recipe);await window.factoryRenderer.begin({recipe,analysis,speed:1,intro:0,fps:30,width:540,height:960,template:'minimal',copy:{hook:'Merge'},channel:'LastBallStand'});return {recipe,duration:Math.ceil(analysis.simulationSeconds)+2};});
 const encoder=run(['-y','-v','error','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-pix_fmt','yuv420p',dir+'/silent.mp4']);
 for(let i=0;i<duration*30;i++){const frame=await page.evaluate(i=>window.factoryRenderer.frame(i),i);if(!encoder.child.stdin.write(Buffer.from(frame,'base64')))await once(encoder.child.stdin,'drain');}
 encoder.child.stdin.end();await encoder.done;
 const {events,result}=await page.evaluate(()=>({events:window.factoryRenderer.audio(),result:window.factoryRenderer.result()}));assert.equal(result.outcome,'final');assert.equal(result.complete,true);
 const audio=await productionAudio({events,recipe,duration,audio:'effects',project:process.cwd()});await writeFile(dir+'/audio.wav',audio.buffer);
 await run(['-y','-v','error','-i',dir+'/silent.mp4','-i',dir+'/audio.wav','-c:v','copy','-c:a','aac','-shortest','-movflags','+faststart',dir+'/sample.mp4']).done;
 await run(['-v','error','-i',dir+'/sample.mp4','-f','null','-']).done;
 console.log(JSON.stringify({encoded:true,decoded:true,audioCues:events.effects.length,duration,bytes:(await stat(dir+'/sample.mp4')).size,path:dir+'/sample.mp4'}));
}finally{await browser.close();}
