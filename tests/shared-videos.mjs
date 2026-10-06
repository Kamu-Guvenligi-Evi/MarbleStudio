import assert from 'node:assert/strict';
import {sharedVideos} from '../scripts/shared-videos.mjs';
import {readFile,mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const project=path.resolve('.'),jobs=await sharedVideos(project);
assert.equal(jobs.length,32);assert.equal(new Set(jobs.map(j=>j.id)).size,32);
assert.ok(jobs.some(j=>j.videoFile==='video.webm'));assert.ok(jobs.some(j=>j.videoFile==='video.mp4'));
for(const j of jobs){assert.equal(j.state,'done');assert.equal(j.shared,true);const dir=path.join(project,'work-videos',j.id);assert.equal(createHash('sha256').update(await readFile(path.join(dir,j.videoFile))).digest('hex'),j.sha256);assert.ok((await readFile(path.join(dir,'cover.jpg'))).length>100);JSON.parse(await readFile(path.join(dir,'metadata.json'),'utf8'));}
assert.deepEqual(await sharedVideos(project,{enabled:false}),[]);
const test=await mkdtemp(path.join(project,'artifacts/shared-video-validation-'));await mkdir(path.join(test,'work-videos'));
await writeFile(path.join(test,'work-videos/manifest.json'),JSON.stringify({version:1,jobs:[{...jobs[0],id:'../../private'}]}));await assert.rejects(sharedVideos(test),/geçersiz/);
console.log('PASS: shared catalog, 32 unique video hashes, posters/metadata, MP4/WebM, isolation and invalid paths.');
