import assert from 'node:assert/strict';
import {EscapeAudio} from '../src/escape-multiply-audio.js';
function arrangement(population){
 const audio=Object.create(EscapeAudio.prototype);audio.context={currentTime:0,state:'running'};audio.voices=new Set();audio.reset();audio.enabled=true;audio.gate=()=>{};
 const notes=[];audio.note=(pitch,gain,pan)=>notes.push({pitch,gain,pan});const game={created:population,escaped:0,impactCount:0,impactEnergy:0,impactX:0};audio.update(game);
 for(let i=0;i<64;i++){audio.context.currentTime+=.2;game.impactCount++;game.impactEnergy+=.6;audio.update(game);}
 const count=notes.length;audio.context.currentTime+=2;audio.update(game);assert.equal(notes.length,count,'no autonomous music');
 game.escaped=population-1;audio.update(game);const stage=audio.stage;audio.reset();assert.equal(audio.stage,0,'replay starts with simple melody');return {stage,notes};
}
const stages=[1,40,300,2000].map(arrangement);
assert.deepEqual(stages.map(x=>x.stage),[0,1,2,3]);
for(let i=1;i<stages.length;i++)assert.ok(stages[i].notes.length>stages[i-1].notes.length,'more balls add harmonic layers');
assert.ok(new Set(stages[3].notes.map(n=>n.pitch)).size>new Set(stages[0].notes.map(n=>n.pitch)).size);
console.log(JSON.stringify({populationStages:stages.map(x=>({stage:x.stage,notes:x.notes.length,pitches:new Set(x.notes.map(n=>n.pitch)).size})),collisionOnly:true,reset:true}));

const finale=Object.create(EscapeAudio.prototype);finale.context={currentTime:0,state:'running'};finale.voices=new Set();finale.reset();finale.enabled=true;finale.gate=()=>{};const notes=[];finale.note=(pitch,gain,pan,ending,delay)=>notes.push({pitch,ending,delay:delay||0});
const game={created:2000,escaped:0,impactCount:0,impactEnergy:0,impactX:0,finalizing:true,bursting:true,balls:[{}]};finale.update(game);finale.context.currentTime=.2;game.impactCount++;game.impactEnergy++;finale.update(game);assert.equal(notes[0].pitch,24);
game.escaped=1999;finale.context.currentTime=.4;game.impactCount++;game.impactEnergy++;finale.update(game);assert.equal(notes.at(-1).pitch,0,'last collisions resolve downward');
const before=notes.length;game.escaped=2000;game.balls=[];finale.update(game);assert.equal(notes.length-before,5);assert.ok(notes.slice(before).every(n=>n.ending));assert.ok(finale.tailUntil>finale.context.currentTime+1.2);finale.update(game);assert.equal(notes.length-before,5,'closing chord once');finale.reset();assert.equal(finale.resolved,false);assert.equal(finale.tailUntil,0);console.log('Descending finale, single resolving chord and recording tail: passed');
