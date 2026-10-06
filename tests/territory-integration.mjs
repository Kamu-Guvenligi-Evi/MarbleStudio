import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
import {chromium} from 'playwright';
import {validateBatch} from '../src/factory-recipes.js';
import {planAutomatic,automaticCandidate,automaticKind,outputQuality} from '../scripts/production-automation.mjs';
import {produce} from '../scripts/factory-worker.mjs';
const project=path.resolve('.'),options=await planAutomatic(validateBatch({automatic:true,automaticMode:'territory',count:1,resolution:720,language:'tr'}),[],project);
assert.equal(options.modes[0],'arena');assert.equal(options.arenaGame,'territory');assert.equal(options.fps,60);
const candidates=[];for(let i=0;i<8;i++){const r=automaticCandidate(options,2048+i,[],candidates);assert.equal(r.arenaGame,'territory');assert.ok(r.ballNames.length);assert.equal(automaticKind({mode:'arena',recipe:r}),'territory');candidates.push(r);}
assert.ok(new Set(candidates.map(r=>r.arenaShape)).size>1);
const arena=await planAutomatic(validateBatch({automatic:true,automaticMode:'arena',count:1}),[],project);assert.equal(automaticCandidate(arena,42).arenaGame,'links');
assert.throws(()=>validateBatch({arenaGame:'invalid'}));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[],queued=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/factory?*',route=>route.fulfill({json:{apiVersion:4,capabilities:['studio-workbench','automatic-diversity','long-term-repetition','episode-formats','territory-production'],jobs:[],summary:{done:0,pending:0},total:0},headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:5173'}}));
 await page.route('**/api/queue',route=>{queued.push(route.request().postDataJSON());return route.fulfill({json:{ok:true},headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:5173'}});});
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.marbleStudio);
 await page.locator('[name=kind][value=territory]').check();assert.match(await page.locator('#automatic-note').innerText(),/Üçgen/);await page.locator('#automatic-create').click();await page.waitForFunction(()=>document.querySelector('#videos-dialog').open);
 assert.equal(queued[0].automaticMode,'territory');assert.equal(queued[0].fps,60);await page.locator('#videos-dialog [data-wb-close]').click();
 await page.locator('#automatic-edit').click();assert.equal(await page.locator('#watch-title').innerText(),'Alan Savaşı');assert.equal(await page.locator('#nav-territory').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#nav-arena').getAttribute('aria-pressed'),'false');
 for(const shape of ['triangle','square','hexagon','star','circle'])await page.locator('#arena-shape').selectOption(shape);
 await page.locator('#territory-duration').selectOption('30');await page.locator('#count').selectOption('6');
 await page.locator('#nav-arena').click();assert.equal(await page.locator('#arena-game').inputValue(),'links');await page.locator('#count').selectOption('8');
 await page.locator('#nav-territory').click();assert.equal(await page.locator('#arena-shape').inputValue(),'circle');assert.equal(await page.locator('#count').inputValue(),'6');
 await page.locator('#studio-works').click();await page.locator('#work-name').fill('Alan çalışmam');await page.locator('#work-save').click();await page.waitForFunction(()=>document.querySelector('#works-message').textContent.includes('kaydedildi'));assert.match(await page.locator('#works-list').innerText(),/Alan Savaşı/);await page.locator('#works-dialog [data-wb-close]').click();
 await page.locator('#studio-export').click();await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');assert.match(await page.locator('#video-source-description').innerText(),/Alan Savaşı/);await page.locator('#video-submit').click();await page.waitForFunction(()=>document.querySelector('#videos-dialog').open);assert.equal(queued[1].source.project.arenaGame,'territory');assert.equal(queued[1].source.project.arenaShape,'circle');assert.equal(queued[1].fps,60);
 await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-territory').click();assert.equal(await page.locator('#arena-shape').inputValue(),'circle');assert.equal(await page.locator('#territory-duration').inputValue(),'30');await page.locator('#nav-arena').click();assert.equal(await page.locator('#count').inputValue(),'8');
 await page.locator('#nav-territory').click();await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);const analysis=await page.evaluate(r=>window.factoryRenderer.probe(r),candidates[0]);assert.ok(analysis.complete);assert.ok(outputQuality(analysis,1).accepted,JSON.stringify(analysis));assert.deepEqual(errors,[]);
 console.log('PASS: separate automatic choice, forced territory candidates, shape diversity, editor navigation, independent drafts, saved works, exact 60 FPS export payload, mobile and production quality gates.');
}finally{await browser.close();}
if(process.argv.includes('--export')){
 const root=path.resolve('artifacts/territory-automatic-'+Date.now());await mkdir(root,{recursive:true});
 const job={id:'automatic-territory',ordinal:0,mode:'arena',options:validateBatch({automatic:true,automaticMode:'territory',count:1,resolution:720,language:'tr'})};let stage='';
 await produce(job,{root,origin:process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5173',history:[],cancelled:()=>false,update:async patch=>{Object.assign(job,patch);const current=job.stage+' '+Math.floor((job.progress??0)/25)*25;if(stage!==current){stage=current;console.log(stage);}}});
 const file=path.join(root,job.id,'video.mp4'),meta=JSON.parse(await readFile(path.join(root,job.id,'metadata.json'),'utf8'));assert.equal(meta.recipe.arenaGame,'territory');assert.equal(meta.video.fps,60);assert.ok(meta.recipe.ballImages.length);assert.ok(meta.musicCredits.length);assert.equal(meta.video.speed,1);
 const probe=spawnSync(ffmpeg,['-hide_banner','-i',file],{windowsHide:true,encoding:'utf8'});assert.match(probe.stderr,/Video:.*\b60 fps\b/);console.log('PASS: automatic territory MP4 with catalog racers, music and real 60 FPS. '+file);
}
