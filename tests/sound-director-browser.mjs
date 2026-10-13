import assert from 'node:assert/strict';
import {mkdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {MEME_EFFECTS} from '../src/meme-catalog.js';
import {ringSoundTrace} from '../src/ring-sound-trace.js';

const origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5174';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1380,height:1000}}),errors=[],aiRequests=[];
  page.on('request',r=>{if(r.url().includes('/api/sound-director/'))aiRequests.push(r.url());});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/ring-escape.html');
  await page.selectOption('#layout','aligned');await page.selectOption('#count','28');await page.selectOption('#duration','30');
  await page.waitForFunction(()=>document.querySelector('#sound-generate')?.textContent.includes('Dengeli'));
  assert.equal(await page.locator('#sound-setup, #sound-api-key, #sound-connect').count(),0,'studio never asks for an API key');
  assert.equal(await page.locator('#sound-brief-field, #sound-local').count(),0,'AI controls are removed');
  await page.fill('#seed','6');await page.locator('#seed').dispatchEvent('change');await page.selectOption('#speed','2');
  await page.locator('.sound-library').filter({has:page.locator('[data-preview-sound]')}).locator('summary').click();
  assert.equal(await page.locator('[data-preview-sound]').count(),Object.keys(MEME_EFFECTS).length);
  await page.click('#sound');
  for(const [id,effect] of Object.entries(MEME_EFFECTS)){
    await page.click('[data-preview-sound="'+id+'"]');
    await page.waitForFunction(name=>document.querySelector('#sound-preview-status').textContent.includes(name),effect.name);
  }
  await page.click('#sound');await page.click('[data-preview-sound="bruh"]');
  assert((await page.textContent('#sound-preview-status')).includes('önce Sesleri aç'));
  for(const [button,title] of [['sound-meme','Meme tepkileri'],['sound-reactions','Sözlü tepkiler']]){
    await page.click('#'+button);assert((await page.textContent('#sound-score-title')).includes(title));
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-ring-sound-score-v1')).plan.title),title);
  }
  await page.reload();await page.waitForFunction(()=>ringStudio.state().soundDirector.source==='local');
  assert((await page.textContent('#sound-score-title')).includes('Sözlü tepkiler'));
  await page.click('#sound-generate');
  await page.waitForFunction(()=>ringStudio.state().soundDirector.played>0);
  assert.equal(await page.evaluate(()=>ringStudio.state().soundDirector.source),'local');
  await page.click('#pause');assert.equal(await page.evaluate(()=>ringStudio.state().soundDirector.voices),0,'pause cancels pending and active voices');
  const held=await page.evaluate(()=>ringStudio.state().time);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>ringStudio.state().time),held);
  await page.click('#pause');await page.waitForFunction(()=>ringStudio.state().soundDirector.voices>0);
  await page.click('#sound');assert.equal(await page.evaluate(()=>ringStudio.state().soundDirector.voices),0);
  await page.waitForTimeout(200);await page.click('#sound');
  await page.reload();await page.waitForFunction(()=>ringStudio.state().soundDirector.source==='local');
  await page.selectOption('#music','off');await page.click('#replay');
  await page.waitForFunction(()=>ringStudio.state().state==='won',{},{timeout:10000});
  const full=await page.evaluate(()=>({s:ringStudio.state().soundDirector,score:JSON.parse(localStorage.getItem('marble-studio-ring-sound-score-v1'))}));
  assert.equal(full.s.played,full.score.plan.cues.length,'every selected event plays exactly once');
  // Previously saved AI scores must not activate after this update.
  await page.evaluate(()=>{const key='marble-studio-ring-sound-score-v1',score=JSON.parse(localStorage.getItem(key));score.source='ai';localStorage.setItem(key,JSON.stringify(score));});
  await page.reload();await page.waitForFunction(()=>!!window.ringStudio);
  assert.equal(await page.evaluate(()=>ringStudio.state().soundDirector.source),null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('marble-studio-ring-sound-score-v1')),null);
  await page.click('#sound-reactions');
  const exportScore=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-ring-sound-score-v1')));
  const exportSettings=await page.evaluate(()=>ringStudio.snapshot());
  const duration=ringSoundTrace(exportSettings).duration/exportSettings.speed;
  const download=page.waitForEvent('download',{timeout:20000});await page.click('#export');const video=await download;
  await video.saveAs('artifacts/sound-director-test.webm');assert((await stat('artifacts/sound-director-test.webm')).size>10000);
  const pcm=execFileSync('node_modules/ffmpeg-static/ffmpeg.exe',['-v','error','-i','artifacts/sound-director-test.webm','-map','0:a:0','-f','f32le','-ac','1','-ar','16000','pipe:1'],{maxBuffer:4*1024*1024,windowsHide:true});
  let sum=0,peak=0;for(let i=0;i<pcm.length;i+=4){const s=pcm.readFloatLE(i);sum+=s*s;peak=Math.max(peak,Math.abs(s));}
  assert(pcm.length/4/16000>duration,'export preserves the soundtrack through the final');
  assert(peak>.005&&peak<1,'export contains bounded audible score');assert(sum/(pcm.length/4)>1e-7);
  assert.equal(await page.evaluate(()=>ringStudio.state().soundDirector.played),exportScore.plan.cues.length,'export uses the selected local arrangement');
  await page.selectOption('#layout','twist');
  assert.equal(await page.evaluate(()=>ringStudio.state().soundDirector.source),null,'new map invalidates old plan');
  assert.equal(await page.inputValue('#music'),'ambient','invalidated plan cannot leave silent adaptive music');
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no mobile horizontal overflow');
  assert.deepEqual(aiRequests,[],'no AI status or planning requests');
  assert.deepEqual(errors,[]);
  console.log(`PASS: score UI, persistence, pause/mute, local presets, legacy AI removal, zero AI requests, map invalidation, mobile layout, WebM audio (peak ${peak.toFixed(3)})`);
}finally{await browser.close();}
