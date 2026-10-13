import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile} from 'node:fs/promises';
import path from 'node:path';
import {sharedVideos} from '../scripts/shared-videos.mjs';
const root=await mkdtemp(path.resolve('artifacts/shared-video-service-')),origin='http://127.0.0.1:5188';
const server=spawn(process.execPath,['scripts/factory-server.mjs'],{windowsHide:true,env:{...process.env,FACTORY_PORT:'5188',FACTORY_OUTPUT:root,FACTORY_SHARED_VIDEOS:'1',FACTORY_DISABLE_REVEAL:'1'},stdio:'pipe'});let log='';server.stderr.on('data',d=>log+=d);
let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(origin+'/api/factory')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));if(i===99)throw Error(log);}
 const catalog=await (await fetch(origin+'/api/factory?limit=50')).json();const count=(await sharedVideos(path.resolve('.'))).length;assert.equal(catalog.total,count);assert.equal(catalog.summary.done,count);
 const manifest=JSON.parse(await readFile('work-videos/manifest.json','utf8'));if(count<manifest.jobs.length)assert.match(catalog.sharedWarning,/indirilmemiş/);
 for(const ext of ['mp4','webm']){const job=catalog.jobs.find(j=>j.videoFile==='video.'+ext),response=await fetch(origin+'/output/'+job.id+'/'+job.videoFile+'?preview=1',{headers:{Range:'bytes=0-1023'}});assert.equal(response.status,206);assert.equal(response.headers.get('content-type'),'video/'+ext);assert.equal((await response.arrayBuffer()).byteLength,1024);}
 const bad=await fetch(origin+'/output/'+catalog.jobs[0].id+'/private.json');assert.equal(bad.status,404);
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{const url=new URL(route.request().url());return url.origin===origin||!url.protocol.startsWith('http')?route.continue():route.abort();});
 await page.goto(origin+'/index.html?edit=1');await page.waitForFunction(()=>window.marbleStudio);
 assert.equal(new URL(page.url()).origin,origin);
 await page.locator('#studio-videos').click();await page.waitForFunction(()=>document.querySelector('#videos-list video'));
 assert.equal(await page.locator('#videos-list video').count(),12);assert.match(await page.locator('#videos-summary').innerText(),new RegExp(String(count)));
 const video=page.locator('#videos-list video').first();await video.evaluate(v=>v.load());await page.waitForFunction(()=>document.querySelector('#videos-list video').readyState>=1);
 const metadata=await video.evaluate(v=>({duration:v.duration,width:v.videoWidth}));assert.ok(metadata.duration>0);assert.ok(metadata.width>0);
 assert.ok(await page.evaluate(()=>document.querySelector('#videos-dialog').scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 await page.setViewportSize({width:1440,height:900});
 for(const game of ['ball-duel','glass-breaker','spiral-breaker','ring-escape','rock-paper-scissors']){
   await page.goto(origin+'/'+game+'.html');
   await page.locator(game==='rock-paper-scissors'?'.rps-header nav a':'[data-studio-game="track"]').click();
   await page.waitForFunction(()=>window.marbleStudio);
   assert.equal(new URL(page.url()).origin,origin);assert.equal(new URL(page.url()).pathname,'/index.html');
 }
 await page.goto(origin+'/factory.html');await page.waitForFunction(()=>!document.querySelector('#summary').textContent.includes('Bağlanıyor'));
 assert.equal(await page.locator('#notice').textContent(),'');
 assert.equal(await page.locator('#jobs a[href$="upload.txt"]').count(),0);
 await page.locator('header a').click();await page.waitForFunction(()=>window.marbleStudio);assert.equal(new URL(page.url()).origin,origin);
 await page.locator('#studio-export').click();
 await page.waitForFunction(()=>!document.querySelector('#video-submit').disabled);
 assert.deepEqual(errors,[]);
 console.log('PASS: incomplete shared archive, playable previews, file allowlist, all standalone game return links and factory-only Studio on a custom port.');
}finally{await browser?.close();server.kill();}
