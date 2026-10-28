import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {MergeEvolution,MERGE_FINALE_SECONDS} from '../src/merge-evolution.js';
for(const speed of [.5,1,2,4]){
 const g=new MergeEvolution({theme:'sports-brands',speed});let finals=0;g.onEvent=e=>{if(e.type==='final')finals++;};
 while(g.finalAt===null)g.step();const board=JSON.stringify(g.balls),spawned=g.spawned;
 while(g.state==='running')g.step();assert.equal(JSON.stringify(g.balls),board);assert.equal(g.spawned,spawned);assert.equal(finals,1);assert.ok(Math.abs((g.time-g.finalAt)/speed-MERGE_FINALE_SECONDS)<1/60);
}
const b=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await b.newPage();await p.goto('http://127.0.0.1:5173/');await p.setContent('<html><body></body></html>');
 const shot=await p.evaluate(async()=>{const {MergeEvolution}=await import('/src/merge-evolution.js');const {prepareMergeImages}=await import('/src/merge-images.js');const {renderMerge}=await import('/src/merge-evolution-renderer.js');const {beginMerge,mergeFrame,mergeAudio,mergeResult}=await import('/src/merge-evolution-video.js');const g=new MergeEvolution({theme:'gems'});const loaded=await prepareMergeImages(g.theme);if(!loaded.every(Boolean))throw new Error("Finale images failed to load");while(g.state==='running')g.step();const c=document.createElement('canvas');c.width=540;c.height=960;renderMerge(c.getContext('2d'),g);await beginMerge({recipe:g.settings,analysis:{simulationSeconds:g.time},intro:0,speed:1});const exported=mergeFrame(g.time+1);c.getContext("2d").drawImage(exported,0,0,540,960);return {image:c.toDataURL('image/jpeg',.8).split(',')[1],complete:mergeResult().complete,ending:mergeAudio().effects.filter(e=>e.originalType==='complete' && e.cue.voice==='soft-resolve').length};});
 assert.equal(shot.complete,true);assert.equal(shot.ending,1);await fs.writeFile('artifacts/merge-evolution/finale.jpg',Buffer.from(shot.image,'base64'));console.log('Finale passed: fixed presentation duration at 4 speeds, frozen board, one final event and export sound, completed export.');
}finally{await b.close();}

