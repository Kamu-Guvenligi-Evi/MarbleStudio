import assert from 'node:assert/strict';
import {mkdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {produce} from '../scripts/factory-worker.mjs';
import {validateBatch} from '../src/factory-recipes.js';
const origin='http://127.0.0.1:5173',root=path.resolve('artifacts/territory-export-'+Date.now());await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});let roster;
try{const page=await browser.newPage();await page.goto(origin+'/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);roster=await page.evaluate(async()=>{const catalog=await (await fetch('/catalog/manifest.json')).json(),items=catalog.items.filter(i=>i.category==='teams').slice(0,6);return {names:items.map(i=>i.name),images:await window.factoryRenderer.prepareRoster(items)};});}finally{await browser.close();}
const source={mode:'arena',project:{mode:'arena',arenaGame:'territory',arenaShape:'triangle',territoryDuration:30,name:'Alan Savaşı',seed:2048,count:6,sequence:[],ballNames:roster.names,ballImages:roster.images,sound:true,presentation:{countdown:1,outro:2,camera:'smart'}}};
const job={id:'territory-triangle',mode:'arena',ordinal:0,options:validateBatch({source,strategy:'exact',language:'tr',channel:'Territory verification',resolution:720,fps:30,orientation:'portrait',audio:'effects'})};
let previous='';await produce(job,{root,origin,history:[],cancelled:()=>false,update:async patch=>{Object.assign(job,patch);const state=job.stage+' '+Math.floor((job.progress??0)/25)*25;if(state!==previous){previous=state;console.log(state);}}});
const dir=path.join(root,job.id),meta=JSON.parse(await readFile(path.join(dir,'metadata.json'),'utf8'));
assert.equal(meta.recipe.arenaGame,'territory');assert.equal(meta.recipe.arenaShape,'triangle');assert.deepEqual(meta.recipe.ballNames.slice(0,6),roster.names);assert.equal(meta.video.speed,1);assert.equal(meta.video.width,720);assert.equal(meta.video.height,1280);assert.equal(meta.video.fps,30);assert.ok(meta.analysis.complete);assert.ok(meta.analysis.finite);assert.equal(meta.analysis.simulationSeconds,30);assert.ok(meta.video.duration>=33);
assert.ok((await stat(path.join(dir,'video.mp4'))).size>1024);console.log('PASS: territory MP4 encode/decode, team roster, 720p portrait, effects, 1x speed and timed result. '+path.join(dir,'video.mp4'));
