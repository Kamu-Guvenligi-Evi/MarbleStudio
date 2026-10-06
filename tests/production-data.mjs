import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {normalizeSnapshot,createBackup,restoreBackup,parseBackup} from '../src/studio-transfer.js';
import {validateBatch,sourceRecipe} from '../src/factory-recipes.js';
import {createFactoryStore,recoverableWriter} from '../scripts/factory-store.mjs';
import {musicSegments} from '../scripts/factory-audio.mjs';
import {qualityReport,visualSimilarity} from '../src/production-quality.js';

class MemoryStorage{
  data=new Map();get length(){return this.data.size;}key(i){return [...this.data.keys()][i];}getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,v);}removeItem(k){this.data.delete(k);}
}
const source=normalizeSnapshot({mode:'track',project:{name:'My race',seed:2048,count:6,sequence:[],ballNames:['One'],presentation:{countdown:0,outro:2,camera:'leader'}},music:{mode:'leader',volume:42,roster:[{entity:'tr',track:'cipher'}]}});
assert.equal(sourceRecipe(source,88).ballNames[0],'One');assert.equal(sourceRecipe(source,88).music.volume,42);
assert.equal(validateBatch({source,count:20,strategy:'exact'}).count,1);
assert.equal(validateBatch({}).fps,60);assert.equal(validateBatch({automatic:true}).fps,60);assert.equal(validateBatch({source}).fps,60);assert.equal(validateBatch({fps:30}).fps,30);
assert.throws(()=>validateBatch({source,fps:25}));assert.throws(()=>validateBatch({orientation:'invalid'}));
assert.throws(()=>normalizeSnapshot({...source,music:{track:'../../secrets'}}));
const memory=new MemoryStorage();memory.setItem('unrelated','keep');memory.setItem('marble-studio-track-v1',JSON.stringify(source.project));
const backup=createBackup(memory);memory.setItem('marble-studio-track-v1','{}');restoreBackup(memory,backup);assert.deepEqual(createBackup(memory).entries,backup.entries);assert.equal(memory.getItem('unrelated'),'keep');
assert.throws(()=>parseBackup(JSON.stringify({...backup,entries:{unrelated:'{}'}})));
const old=createBackup(memory),set=memory.setItem.bind(memory);let fail=true;
memory.setItem=(k,v)=>{if(fail&&k==='marble-studio-test'){fail=false;throw Error('Disk quota');}set(k,v);};
assert.throws(()=>restoreBackup(memory,{...backup,entries:{'marble-studio-test':'{}'}}));assert.deepEqual(createBackup(memory).entries,old.entries);
let attempts=0;const write=recoverableWriter(async()=>{if(++attempts===1)throw Error('I/O failure');return 'saved';});await assert.rejects(write({}));assert.equal(await write({}),'saved');
const root=await mkdtemp(path.join(os.tmpdir(),'marble-store-')),store=createFactoryStore(root),state={version:1,jobs:[{id:'test-job',state:'queued',options:{source}}],schedule:null};
await store.save(state);state.jobs[0].state='done';await store.save(state);assert.equal((await createFactoryStore(root).load()).jobs[0].state,'done');
assert.equal(JSON.parse(await readFile(path.join(root,'factory.json'),'utf8')).jobs[0].detail,true);
await writeFile(path.join(root,'factory.json'),'{broken');assert.equal((await createFactoryStore(root).load()).jobs.length,1);
assert.deepEqual(musicSegments(source.music,[{time:0,id:0},{time:2,id:1},{time:4,id:0}],6).map(s=>[s.start,s.end,s.track]),[[0,2,'cipher'],[4,6,'cipher']]);
const sample=(motion,visible)=>Array.from({length:20},(_,i)=>({time:i/2,motion,visible,close:true}));
const lively=qualityReport({mode:'track',seconds:10,eventTimes:[.1,1,2,3,4,5,6,7,8,9],samples:sample(20,1),leadChanges:8});
const dull=qualityReport({mode:'track',seconds:10,eventTimes:[8],samples:sample(0,.2),leadChanges:0});assert.ok(lively.score>dull.score+30);
assert.equal(qualityReport({mode:'spiral',seconds:10,eventTimes:[1],samples:[],leadChanges:500}).leadChanges,0);
assert.equal(visualSimilarity({mode:'arena',count:6},{mode:'arena',count:6}),1);
console.log('PASS: source transfer, validation, backup roundtrip/rollback, I/O recovery, indexed history/backup recovery, music timeline and quality discrimination.');
