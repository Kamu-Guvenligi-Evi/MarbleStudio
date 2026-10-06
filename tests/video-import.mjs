import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const root=await mkdtemp(path.resolve('artifacts/video-import-test-')),origin='http://127.0.0.1:5189';
const server=spawn(process.execPath,['scripts/factory-server.mjs'],{windowsHide:true,env:{...process.env,FACTORY_OUTPUT:root,FACTORY_PORT:'5189',FACTORY_GITHUB_SYNC:'0'},stdio:'pipe'});let log='';server.stderr.on('data',d=>log+=d);
let browser;
try{
 for(let i=0;i<150;i++){try{if((await fetch(origin+'/api/factory')).ok)break;}catch{}if(server.exitCode!==null)throw Error(log);await new Promise(r=>setTimeout(r,200));if(i===149)throw Error(log);}
 const manifest=JSON.parse(await readFile('work-videos/manifest.json','utf8')),mp4=manifest.jobs.filter(j=>j.videoFile==='video.mp4').sort((a,b)=>a.bytes-b.bytes)[0],webm=manifest.jobs.filter(j=>j.videoFile==='video.webm').sort((a,b)=>a.bytes-b.bytes)[0];
 const payload=await readFile(path.join('work-videos',mp4.id,'video.mp4'));
 const upload=await fetch(origin+'/api/import-video',{method:'POST',headers:{Origin:'http://127.0.0.1:5173','Content-Type':'video/mp4','X-Marble-Title':encodeURIComponent('Takım videosu'),'X-Marble-Mode':'territory'},body:payload});assert.equal(upload.status,200,await upload.clone().text());const {id}=await upload.json();
 let data=await (await fetch(origin+'/api/factory')).json();assert.equal(data.total,1);assert.equal(data.githubSharing,false);assert.equal(data.jobs[0].copy.title,'Takım videosu');assert.equal(data.jobs[0].github.state,'queued');
 assert.equal(data.jobs[0].mode,'arena');assert.equal(data.jobs[0].contentKind,'territory');
 const meta=JSON.parse(await readFile(path.join(root,id,'metadata.json'),'utf8'));assert.equal(meta.recipe.arenaGame,'territory');
 const download=await fetch(origin+'/output/'+id+'/video.mp4?preview=1');assert.deepEqual(Buffer.from(await download.arrayBuffer()),payload);
 const invalid=await fetch(origin+'/api/import-video',{method:'POST',headers:{Origin:'http://127.0.0.1:5173','Content-Type':'video/mp4'},body:Buffer.alloc(1000)});assert.equal(invalid.status,400);data=await (await fetch(origin+'/api/factory')).json();assert.equal(data.total,1);
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);await page.evaluate(url=>{document.querySelector('.factory-link').href=url;},origin);await page.locator('#studio-videos').click();await page.locator('#videos-upload-file').setInputFiles(path.resolve('work-videos',webm.id,'video.webm'));await page.waitForFunction(()=>document.querySelectorAll('#videos-list video').length===2);assert.ok(await page.evaluate(()=>document.querySelector('#videos-dialog').scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS: MP4 import, playable original bytes, invalid video rejected, queued sharing, WebM upload through UI and mobile layout.');
}finally{await browser?.close();server.kill();}
