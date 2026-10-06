import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
const root=path.resolve('artifacts/automatic-review-'+Date.now());await mkdir(root,{recursive:true});
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
const origin='http://127.0.0.1:'+port,server=spawn(process.execPath,['scripts/factory-server.mjs'],{env:{...process.env,FACTORY_PORT:String(port),FACTORY_OUTPUT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
async function ff(args){const child=spawn(ffmpeg,['-hide_banner','-loglevel','error',...args],{windowsHide:true,stdio:['ignore','pipe','pipe']});const chunks=[];let err='';child.stdout.on('data',d=>chunks.push(d));child.stderr.on('data',d=>err+=d);const [code]=await once(child,'exit');if(code)throw new Error(err);return Buffer.concat(chunks);}
const get=async url=>{const response=await fetch(origin+url);if(!response.ok)throw new Error(await response.text());return response.json();};
const report=[];
try{
 const deadline=Date.now()+60000;while(true){try{await get('/api/factory');break;}catch{}if(Date.now()>deadline||server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,200));}
 for(const [i,mode] of (process.argv.slice(2).length?process.argv.slice(2):['track','arena','spiral','statistics','track','spiral']).entries()){
  const response=await fetch(origin+'/api/queue',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({automatic:true,automaticMode:mode,count:1,duration:55,resolution:720,language:'tr',channel:'Automatic review '+i})});
  assert.equal(response.status,200,await response.text());
  const end=Date.now()+600000;let job,last='';
  while(Date.now()<end){job=(await get('/api/factory?limit=50')).jobs.find(j=>j.options.channel==='Automatic review '+i);if(job?.error)throw new Error(job.error);if(job?.state==='done')break;const stage=job?.stage+' '+Math.floor((job?.progress??0)/25)*25;if(stage!==last){console.log(mode,stage);last=stage;}await new Promise(r=>setTimeout(r,1000));}
  assert.equal(job?.state,'done');const folder=path.join(root,job.id),meta=JSON.parse(await readFile(path.join(folder,'metadata.json'),'utf8'));
  assert.ok(meta.analysis.complete);assert.ok(meta.outputQuality.accepted);assert.equal(meta.recipe.mode,mode);
  const accepted=meta.candidateReview.filter(c=>c.accepted);if(mode!=='statistics'){assert.ok(accepted.length>=1);assert.equal(new Set(meta.candidateReview.map(c=>c.structure)).size,meta.candidateReview.length);assert.ok(meta.musicCredits.length);}
  const file=path.join(folder,'video.mp4'),frames=[];
  for(const fraction of [.1,.5,1]){const target=path.join(folder,'review-'+fraction+'.jpg');await ff(['-y','-ss',String(Math.min(meta.video.duration-.25,meta.video.duration*fraction)),'-i',file,'-frames:v','1','-vf','scale=360:-2',target]);frames.push(target);}
  const pcm=await ff(['-i',file,'-vn','-ac','1','-ar','16000','-f','f32le','pipe:1']);let peak=0,sum=0,silent=0;
  for(let k=0;k<pcm.length;k+=4){const x=pcm.readFloatLE(k);assert.ok(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));sum+=x*x;if(Math.abs(x)<.0001)silent++;}
  const audio={peak,rms:Math.sqrt(sum/(pcm.length/4)),silentFraction:silent/(pcm.length/4)};
  if(mode==='statistics')assert.equal(peak,0);else{assert.ok(audio.rms>.001);assert.ok(peak<1,'Audio must not clip');}
  report.push({id:job.id,mode,video:file,frames,duration:meta.video.duration,score:meta.analysis.score,quality:meta.outputQuality,candidates:meta.candidateReview.length,accepted:accepted.length,theme:meta.recipe.theme,variant:meta.recipe.variant,energy:meta.recipe.energy,roster:meta.automation.rosterCategory,music:meta.recipe.music?.track,dataset:meta.automation.dataset,audio,selection:meta.selection});
  await writeFile(path.join(root,'review.json'),JSON.stringify(report,null,2));console.log('PASS',mode,JSON.stringify(report.at(-1)));
 }
 if(report.length>=2){assert.notEqual(report[0].music,report[1].music);}
 if(report.length===6)assert.notEqual(report[2].theme+'|'+report[2].variant,report[5].theme+'|'+report[5].variant);
 console.log('PASS: real automatic exports, distinct candidate selection, finished results, video decode, source metadata and audio levels. '+root);
}finally{server.kill();}
