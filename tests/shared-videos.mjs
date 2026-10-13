import assert from 'node:assert/strict';
import {sharedVideos} from '../scripts/shared-videos.mjs';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const root=await mkdtemp(path.join(os.tmpdir(),'marble-shared-test-'));
try{
  const archive=path.join(root,'work-videos');await mkdir(archive);
  const modes=['track','arena','spiral','statistics','pi','territory','glass-breaker','spiral-breaker','ball-duel','ring-escape','rock-paper-scissors'];
  const jobs=modes.map((mode,i)=>({id:'shared-'+i.toString(16).padStart(16,'0'),mode,bytes:1024,videoFile:i%2?'video.webm':'video.mp4'}));
  const missing={...jobs[0],id:'shared-aaaaaaaaaaaaaaaa'},pointer={...jobs[0],id:'shared-bbbbbbbbbbbbbbbb'};
  for(const entry of [...jobs,pointer]){
    const dir=path.join(archive,entry.id);await mkdir(dir);
    await writeFile(path.join(dir,entry.videoFile),entry===pointer?'version https://git-lfs.github.com/spec/v1\noid sha256:123\nsize 1024\n':Buffer.alloc(1024));
  }
  const manifest=entries=>writeFile(path.join(archive,'manifest.json'),JSON.stringify({version:1,jobs:entries}));
  await manifest([missing,...jobs,pointer]);
  const unavailable=[];
  const result=await sharedVideos(root,{onUnavailable:id=>unavailable.push(id)});
  assert.equal(result.length,modes.length);assert.deepEqual(result.map(j=>j.mode),modes);
  assert.ok(result.every(j=>j.state==='done'&&j.shared));
  assert.deepEqual(unavailable,[missing.id,pointer.id]);
  await writeFile(path.join(archive,jobs[1].id,'metadata.json'),JSON.stringify({recipe:{arenaGame:'territory'}}));
  assert.equal((await sharedVideos(root))[1].contentKind,'territory');
  assert.deepEqual(await sharedVideos(root,{enabled:false}),[]);
  for(const invalid of [{...jobs[0],id:'../../private'},{...jobs[0],videoFile:'../../secret.mp4'}]){
    await manifest([invalid]);await assert.rejects(sharedVideos(root),/geçersiz/);
  }
  await manifest([jobs[0],jobs[0]]);await assert.rejects(sharedVideos(root),/geçersiz/);
  console.log('PASS: all game modes, missing files/LFS pointers, playable entries, legacy metadata and safe paths.');
}finally{await rm(root,{recursive:true,force:true});}
