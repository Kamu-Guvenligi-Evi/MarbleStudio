import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {mkdtemp} from 'node:fs/promises';
import path from 'node:path';

const root=await mkdtemp(path.resolve('artifacts/failure-test-'));
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');
const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const origin='http://127.0.0.1:'+port;
const server=spawn(process.execPath,['scripts/factory-server.mjs'],{env:{...process.env,FACTORY_PORT:String(port),FACTORY_OUTPUT:root},windowsHide:true,stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',d=>log=(log+d).slice(-3000));server.stderr.on('data',d=>log=(log+d).slice(-3000));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const snapshot=async()=>(await(await fetch(origin+'/api/factory')).json()).jobs;
try{
  const ready=Date.now()+60000;
  while(true){try{await snapshot();break;}catch{}if(Date.now()>ready||server.exitCode!==null)throw new Error(log);await pause(200);}
  // Valid input, but this exact course finishes before the minimum export duration.
  // The worker raises an ordinary error, which previously triggered silent retries.
  const options={strategy:'exact',channel:'Failure regression',audio:'none',source:{mode:'track',project:{mode:'track',seed:2048,count:6,sequence:['shortcut'],presentation:{countdown:1,outro:2}}}};
  const response=await fetch(origin+'/api/queue',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(options)});
  assert.equal(response.status,200,await response.text());
  let job;const deadline=Date.now()+60000;
  while(Date.now()<deadline){[job]=await snapshot();if(job?.state==='failed')break;await pause(200);}
  assert.equal(job?.state,'failed');assert.equal(job.attempts,1);assert.match(job.error,/30.180/);
  // Cover the old 15-second automatic retry interval.
  await pause(17000);const [later]=await snapshot();
  assert.equal(later.state,'failed');assert.equal(later.attempts,1);assert.equal(later.progress,job.progress);
  console.log('PASS: an ordinary export failure remains failed after the retry window, without restarting or losing progress.');
}finally{server.kill();}
