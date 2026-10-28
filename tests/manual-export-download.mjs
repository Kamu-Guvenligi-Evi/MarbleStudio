import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import http from 'node:http';
import {chromium} from 'playwright';
import {assertManualExport,cleanDownloadedVideo} from '../scripts/manual-export.mjs';
import {validateBatch} from '../src/factory-recipes.js';
import {selectTestChannel} from './browser-channel.mjs';

const root=await mkdtemp(path.resolve('artifacts/manual-download-'));
const port=5197,origin=`http://127.0.0.1:${port}`;
const jobs=[];
for(const id of ['full','partial','abort','legacy','youtube']){
  await mkdir(path.join(root,id));
  await writeFile(path.join(root,id,'video.mp4'),Buffer.alloc(id==='abort'?16*1024*1024:8192,1));
  jobs.push({id,state:'done',mode:'track',files:['video.mp4'],transient:id!=='legacy',options:{},...(id==='youtube'?{youtube:{state:'failed'}}:{})});
}
jobs.push({id:'old-automatic',state:'queued',options:{automatic:true,count:1},mode:'track'});
await writeFile(path.join(root,'factory.json'),JSON.stringify({version:1,jobs,schedule:{enabled:true,options:{count:1}},schedules:[{enabled:true,options:{count:1}}]}));
const log=createWriteStream(path.join(root,'server.log'));
const child=spawn(process.execPath,['scripts/factory-server.mjs'],{env:{...process.env,FACTORY_PORT:String(port),FACTORY_OUTPUT:root},stdio:['ignore','pipe','pipe'],windowsHide:true});
child.stdout.pipe(log);child.stderr.pipe(log);
let browser;
async function status(){const res=await fetch(origin+'/api/factory?limit=50');assert.equal(res.status,200);return res.json();}
async function until(fn){for(let i=0;i<150;i++){if(await fn())return;await new Promise(r=>setTimeout(r,100));}throw new Error('Timed out');}
async function exists(id){return stat(path.join(root,id,'video.mp4')).then(()=>true,()=>false);}
async function get(id,options={},query=''){const res=await fetch(`${origin}/output/${id}/video.mp4${query}`,options);await res.arrayBuffer();return res;}
try{
  await until(async()=>{try{await status();return true;}catch{return false;}});
  const initial=await status();assert.equal(initial.githubSharing,false);assert.equal(initial.schedule,null);assert.deepEqual(initial.schedules,[]);assert.equal(initial.summary.pending,0);
  assert.equal(initial.jobs.find(j=>j.id==='old-automatic').state,'cancelled');
  for(const endpoint of ['schedule','schedules','reveal','import-video'])assert.equal((await fetch(origin+'/api/'+endpoint,{method:'POST'})).status,410);
  for(const options of [{automatic:true},{count:3},{source:{},strategy:'variations'}]){
    assert.throws(()=>assertManualExport(options));
    assert.equal((await fetch(origin+'/api/queue',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(options)})).status,400);
  }
  await get('full',{},'?preview=1');await get('full',{method:'HEAD'});assert(await exists('full'));
  assert.equal((await get('partial',{headers:{Range:'bytes=9000-'}})).status,416);
  await get('partial',{headers:{Range:'bytes=0-4095'}});assert(await exists('partial'));
  await get('partial',{headers:{Range:'bytes=4096-8191'}});await until(async()=>!await exists('partial'));
  await new Promise((resolve,reject)=>{const request=http.get(`${origin}/output/abort/video.mp4`,res=>res.once('data',()=>{res.destroy();resolve();}));request.on('error',reject);});
  await new Promise(r=>setTimeout(r,150));assert(await exists('abort'));
  await get('full');await until(async()=>!await exists('full'));
  await get('legacy');assert(await exists('legacy'));
  await get('youtube');await until(async()=>Boolean((await status()).jobs.find(j=>j.id==='youtube').downloadedAt));assert(await exists('youtube'));
  assert.equal(await cleanDownloadedVideo(root,{id:'youtube',state:'done',transient:true,downloadedAt:'now',youtube:{state:'done'}}),true);
  await assert.rejects(()=>cleanDownloadedVideo(root,{id:'../outside',state:'done',transient:true,downloadedAt:'now'}));
  assert.equal((await status()).jobs.find(j=>j.id==='full').state,'downloaded');
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await selectTestChannel(page);await page.goto(origin+'/index.html?edit=1');
  await page.waitForFunction(()=>window.marbleStudio);
  assert.equal(await page.locator('#automatic-back,#automatic-start').count(),0);
  await page.locator('#studio-export').click();await page.waitForFunction(()=>document.getElementById('video-submit').textContent==='Videoyu hazırla');
  assert.equal(await page.locator('select[name=strategy]').count(),0);
  let submitted;
  await page.route('**/api/queue',async route=>{submitted=route.request().postDataJSON();await route.fulfill({json:{ok:true}});});
  await page.locator('#video-submit').click();await until(async()=>!!submitted);
  assertManualExport(submitted);const valid=validateBatch(submitted);assert.equal(valid.strategy,'exact');assert.equal(valid.count,1);
  await page.locator('#videos-dialog').waitFor({state:'visible'});
  assert.equal(await page.locator('#videos-upload,[data-job-action=reveal]').count(),0);
  assert.equal(await page.locator('[data-job=full] [data-job-action=retry]').count(),0);
  assert.deepEqual(errors,[]);
  await page.goto(origin+'/factory.html');await page.waitForURL('**/index.html?edit=1');
  console.log('PASS: manual export, disabled automation/archive, complete/ranged/aborted downloads, preview/HEAD, legacy files, upload deferral, path safety, browser UI.');
}finally{
  await browser?.close();child.kill();await new Promise(resolve=>child.exitCode!==null?resolve():child.once('exit',resolve));log.end();
}
