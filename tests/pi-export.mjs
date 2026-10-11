import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {produce} from '../scripts/factory-worker.mjs';
import {validateBatch} from '../src/factory-recipes.js';

// Exercise the local worker directly: do not enqueue or publish a test video.
const root=path.resolve('artifacts/pi-export');
const source={mode:'pi',project:{digits:2,speed:2,sound:true,name:'Pi export test'}};
const job={id:randomUUID(),mode:'pi',ordinal:0,options:validateBatch({source,strategy:'exact',resolution:720,fps:30,audio:'effects',language:'en'})};
await produce(job,{root,origin:process.env.TEST_ORIGIN??'http://127.0.0.1:5173',history:[],cancelled:()=>false,update:async patch=>Object.assign(job,patch)});
const dir=path.join(root,job.id),metadata=JSON.parse(await readFile(path.join(dir,'metadata.json'),'utf8'));
assert.ok(metadata.analysis.complete);assert.equal(metadata.analysis.collisions,31);
assert.equal(metadata.video.width,720);assert.equal(metadata.video.height,1280);assert.equal(metadata.video.fps,30);
const probe=spawnSync(ffmpeg,['-hide_banner','-i',path.join(dir,'video.mp4')],{windowsHide:true,encoding:'utf8'});
assert.match(probe.stderr,/Video:.*\b30 fps\b/);assert.match(probe.stderr,/Audio: aac/);
for(const file of ['video.mp4','cover.jpg','metadata.json','upload.txt'])assert.ok((await stat(path.join(dir,file))).size>0);
console.log(`PASS: Pi MP4, 31 collisions, 720 × 1280, 30 FPS, collision audio; ${metadata.video.duration}s. ${dir}`);
