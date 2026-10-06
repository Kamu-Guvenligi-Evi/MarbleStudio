import {openRepetitionLedger,contentKeys} from '../scripts/repetition-guard.mjs';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
const root=await mkdtemp(path.resolve('artifacts/service-test-'));
const fixture={version:1,schedule:null,jobs:Array.from({length:25},(_,i)=>({id:'fixture-'+i,state:'cancelled',mode:'arena',stage:'Test',options:{count:1,duration:30,channel:'Fixture',language:'tr'},ordinal:i}))};
await writeFile(path.join(root,'factory.json'),JSON.stringify(fixture));
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const origin='http://127.0.0.1:'+port,env={...process.env,FACTORY_PORT:String(port),FACTORY_OUTPUT:root};
let log='';const server=spawn(process.execPath,['scripts/factory-server.mjs'],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
const get=async suffix=>(await fetch(origin+suffix)).json();
try{
  const ready=Date.now()+60000;
  while(true){try{if((await fetch(origin+'/api/factory')).ok)break;}catch{}if(Date.now()>ready||server.exitCode!==null)throw new Error(log);await new Promise(resolve=>setTimeout(resolve,200));}
  const first=await get('/api/factory');assert.equal(first.apiVersion,3);assert.equal(first.total,25);assert.equal(first.jobs.length,12);assert.equal(first.jobs[0].id,'fixture-24');
  const cors=await fetch(origin+'/api/factory',{headers:{Origin:'http://127.0.0.1:5173'}});assert.equal(cors.headers.get('access-control-allow-origin'),'http://127.0.0.1:5173');
  assert.equal((await fetch(origin+'/api/factory',{headers:{Origin:'https://example.com'}})).status,403);
  assert.equal((await fetch(origin+'/api/queue',{method:'OPTIONS',headers:{Origin:'http://127.0.0.1:5173','Access-Control-Request-Method':'POST'}})).status,204);
  const next=await get('/api/factory?offset=12&limit=12');assert.equal(next.jobs[0].id,'fixture-12');assert.equal((await get('/api/factory?state=done')).total,0);
  const duplicate=spawn(process.execPath,['scripts/factory-server.mjs'],{env:{...env,FACTORY_PORT:String(port+1)},windowsHide:true,stdio:['ignore','pipe','pipe']});let message='';duplicate.stderr.on('data',d=>message+=d);const [exit]=await once(duplicate,'exit');assert.notEqual(exit,0);assert.match(message,/zaten açık/);
  const options={count:1,duration:30,language:'tr',channel:'API export',source:{mode:'statistics',statistics:{csv:'Yıl,Alfa,Beta\n2000,1,4\n2001,8,3',heading:'API test',source:'Fixture',duration:'15',top:'5',interpolation:'step'}},strategy:'exact',resolution:720,orientation:'landscape',audio:'none'};
  const response=await fetch(origin+'/api/queue',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(options)});assert.equal(response.status,200,await response.text());
  const end=Date.now()+180000;let job;
  while(Date.now()<end){job=(await get('/api/factory')).jobs.find(j=>j.options.channel==='API export');if(job?.state==='done')break;if(job?.state==='failed')throw new Error(job.error);await new Promise(resolve=>setTimeout(resolve,500));}
  assert.equal(job?.state,'done');assert.ok(!Object.hasOwn(job.options,'source'));
  const metadata=await get('/output/'+job.id+'/metadata.json');assert.equal(metadata.video.width,1280);assert.equal(metadata.video.height,720);assert.equal(metadata.analysis.winner,'Alfa');
  const videoURL=origin+'/output/'+job.id+'/video.mp4?preview=1';
  const head=await fetch(videoURL,{method:'HEAD'});assert.equal(head.status,200);assert.match(head.headers.get('content-disposition'),/^inline/);
  const range=await fetch(videoURL,{headers:{Range:'bytes=0-63'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,64);assert.match(range.headers.get('content-range'),/^bytes 0-63\//);
  assert.equal((await fetch(videoURL,{headers:{Range:'bytes=999999999999-'}})).status,416);
  const index=JSON.parse(await readFile(path.join(root,'factory.json'),'utf8'));assert.equal(index.version,2);assert.equal(index.jobs.length,26);assert.ok(index.jobs.every(j=>j.detail));
  const detail=JSON.parse(await readFile(path.join(root,'.jobs',job.id+'.json'),'utf8'));assert.equal(detail.state,'done');assert.equal(detail.options.source.statistics.csv,options.source.statistics.csv);
  assert.equal((await get('/api/factory?state=done')).total,1);
  const ledger=await openRepetitionLedger(root);assert.ok(ledger.entries().some(row=>row.id===job.id&&row.exact===contentKeys(metadata.recipe).exact));
  const restarted=await openRepetitionLedger(root,[]);assert.equal(restarted.entries().length,ledger.entries().length);
  console.log('PASS: legacy history migration, pagination/filtering, single-service lock, real API queue → MP4, source retention and lean responses.');
}finally{server.kill();}
