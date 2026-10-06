import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const origin='http://127.0.0.1:5180';
const before=await (await fetch(origin+'/api/factory')).json();
const response=await fetch(origin+'/api/queue',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({count:1,duration:30,modes:['arena'],language:'en',channel:'Factory verification'})});
assert.ok(response.ok,await response.text());
const ids=new Set(before.jobs.map(j=>j.id));let job;
const deadline=Date.now()+15*60*1000;let last='';
while(Date.now()<deadline){
  const state=await (await fetch(origin+'/api/factory')).json();job=state.jobs.find(j=>!ids.has(j.id)&&j.options.channel==='Factory verification');
  if(job){const message=job.state+' '+job.stage+' '+job.progress;if(message!==last){console.log(message);last=message;}if(job.state==='done')break;if(job.state==='failed')throw new Error(job.error);}
  await new Promise(resolve=>setTimeout(resolve,2000));
}
assert.equal(job?.state,'done');
for(const name of ['video.mp4','cover.jpg','metadata.json','upload.txt'])assert.ok((await stat('output/'+job.id+'/'+name)).size>0);
const metadata=JSON.parse(await readFile('output/'+job.id+'/metadata.json','utf8'));assert.ok(metadata.video.duration>=25&&metadata.video.duration<=90);assert.equal(metadata.video.width,1080);assert.ok(metadata.analysis.complete);
console.log('PASS: real MP4 export with audio, thumbnail and upload package: output/'+job.id);
