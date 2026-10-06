import assert from 'node:assert/strict';
import {mkdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {produce} from '../scripts/factory-worker.mjs';
import {validateBatch} from '../src/factory-recipes.js';
const root=path.resolve('artifacts/production-export-'+Date.now()),origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5182';await mkdir(root,{recursive:true});
const history=[];
const modes=process.argv.slice(2).length?process.argv.slice(2):['track','arena','spiral','statistics'];
for(const [i,mode] of modes.entries()){
  const source=mode==='statistics'?{mode,statistics:{csv:'Yıl,Alfa,Beta\n2000,1,5\n2001,10,4',heading:'Kaynak testi',source:'Test fixture',duration:'15',top:'5',interpolation:'step'}}:{mode,project:{name:'Export test',mode,seed:mode==='arena'?2:2048,count:mode==='spiral'?20:6,sequence:mode==='track'?['shortcut']:[],ballNames:['Custom Racer'],sound:true,spiralTheme:'lava',presentation:{countdown:1,outro:2,camera:'smart'}},music:{mode:mode==='track'?'leader':'fixed',track:'',volume:15,roster:Array.from({length:6},(_,i)=>({entity:'racer-'+i,track:'cipher'}))}};
  const job={id:randomUUID(),mode,ordinal:i,options:validateBatch({source,strategy:'exact',language:'tr',channel:'Export verification',resolution:720,fps:mode==='arena'?60:30,orientation:mode==='statistics'?'landscape':mode==='arena'?'square':'portrait',template:i%2?'cinema':'broadcast'})};
  let previous='';
  await produce(job,{root,origin,history,cancelled:()=>false,update:async patch=>{Object.assign(job,patch);const state=job.stage+' '+Math.floor((job.progress??0)/20)*20;if(previous!==state){console.log(mode,state);previous=state;}}});
  const metadata=JSON.parse(await readFile(path.join(root,job.id,'metadata.json'),'utf8'));
  assert.ok(metadata.analysis.complete);assert.equal(metadata.video.speed,1);assert.equal(metadata.video.fps,mode==='arena'?60:30);
  assert.equal(metadata.video.width,mode==='statistics'?1280:720);assert.equal(metadata.video.height,['statistics','arena'].includes(mode)?720:1280);
  if(mode==='track'){assert.ok(metadata.musicCredits.length);assert.equal(metadata.recipe.ballNames[0],'Custom Racer');}
  if(mode==='statistics')assert.equal(metadata.analysis.winner,'Alfa');
  for(const name of ['video.mp4','cover.jpg','metadata.json','upload.txt'])assert.ok((await stat(path.join(root,job.id,name))).size>0);
  history.push(job);console.log('PASS: full MP4 encode/decode',mode,metadata.video.duration+'s');
}
console.log('PASS: production exports ('+modes.join(', ')+'). '+root);
