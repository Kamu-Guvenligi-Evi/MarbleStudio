import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {mkdtemp,readFile} from 'node:fs/promises';
import path from 'node:path';
import {openRepetitionLedger} from '../scripts/repetition-guard.mjs';
const root=await mkdtemp(path.resolve('artifacts/repetition-service-')),ledger=await openRepetitionLedger(root);
const {items}=JSON.parse(await readFile('public/statistics/manifest.json','utf8'));
for(const item of items)await ledger.remember({id:'old-'+item.id,recipe:{mode:'statistics',statistics:{csv:await readFile('public'+item.csv,'utf8')}}});
for(const theme of ['ice','lava','aurora','gold','candy','cosmic'])for(const variant of ['classic','avalanche','precision','burst'])await ledger.remember({id:theme+'-'+variant,recipe:{mode:'spiral',seed:1,count:1,theme,variant}});
const socket=createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(r=>socket.close(r));
const origin='http://127.0.0.1:'+port,server=spawn(process.execPath,['scripts/factory-server.mjs'],{env:{...process.env,FACTORY_OUTPUT:root,FACTORY_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
try{
 const ready=Date.now()+60000;while(true){try{if((await fetch(origin+'/api/factory')).ok)break;}catch{}if(Date.now()>ready||server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,200));}
 for(const mode of ['statistics','spiral']){
  const response=await fetch(origin+'/api/queue',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({automatic:true,automaticMode:mode,count:1,channel:mode})});assert.equal(response.status,200);
  let job;const end=Date.now()+10000;
  while(Date.now()<end){job=(await(await fetch(origin+'/api/factory')).json()).jobs.find(j=>j.options.channel===mode);if(job?.state==='failed')break;await new Promise(r=>setTimeout(r,200));}
  assert.equal(job.state,'failed');assert.equal(job.attempts,1);assert.match(job.error,/tekrar|kullanılmış/);
 }
 assert.equal((await openRepetitionLedger(root)).entries().length,items.length+24);
 console.log('PASS: persisted ledger without job history prevents reused statistics and exhausted spiral styles over the real API; neither failure is automatically retried.');
}finally{server.kill();}
