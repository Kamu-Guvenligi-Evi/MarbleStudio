import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {Battle} from '../src/crown-battle.js';
// By default compare against synchronous stepping, without requiring local artifacts.
// An optional snapshot also checks parity with the pre-change combat implementation.
let Before=Battle;
if(process.argv[2]) {
  const source=readFileSync(process.argv[2],'utf8').replace(/from '(\.\/[^']+)'/g,(_,s)=>`from '${pathToFileURL(resolve('src',s)).href}'`);
  ({Battle:Before}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`));
}
function digest(b) {
  return createHash('sha256').update(JSON.stringify({units:b.units,projectiles:b.projectiles,effects:b.effects,stats:b.stats,time:b.time,winner:b.winner},(key,value)=>{
    if(key==='combatProfile')return undefined;
    if((key==='target'||key==='nearbyThreat')&&value)return value.id;
    if(value instanceof Set)return [...value].sort((a,b)=>a-b);
    if(value&&typeof value==='object'&&!Array.isArray(value))return Object.fromEntries(Object.keys(value).sort().map(k=>[k,value[k]]));
    return value;
  })).digest('hex');
}
for(const count of [320,3000,10000]) {
  const army={sword:count/8,pike:count/8,archer:count/8,cavalry:count/8};
  const before=new Before({seed:1066,armies:[army,army]});
  const after=new Battle({seed:1066,armies:[army,army]});
  for(const b of [before,after])for(const u of b.units){const i=u.id%(count/2);u.x=70+i%100*5;u.y=440+u.team*90+Math.floor(i/100)*3;}
  let chunks=0;
  for(let tick=0;tick<45;tick++) {
    before.step(1/30);
    let done=false;
    while(!done){done=after.advanceFrame(1/30,0);chunks++;}
    assert.equal(after.pendingStep,null);
    if(tick%15===14)assert.equal(digest(after),digest(before),`${count} units tick ${tick}: exact combat state`);
  }
  assert(chunks>45);
  assert.equal(after.units.length,count);
  console.log(`PASS ${count} soldiers: ${chunks} slices, exact original movement/damage/projectiles/results at 3 checkpoints`);
}
const empty=new Battle({armies:[{sword:0,pike:0,archer:0,cavalry:0},{sword:0,pike:0,archer:0,cavalry:0}],allowEmpty:true});
assert(empty.advanceFrame(1/30,0));assert.equal(empty.pendingStep,null);assert.equal(empty.time,0);
console.log('PASS empty battle leaves no pending step');

const synchronous=new Battle({seed:42}),interrupted=new Battle({seed:42});
assert.equal(interrupted.advanceFrame(1/30,0),false);
assert(interrupted.pendingStep);
interrupted.step(1/30);
synchronous.step(1/30);synchronous.step(1/30);
assert.equal(interrupted.pendingStep,null);
assert.equal(digest(interrupted),digest(synchronous),'switching to synchronous stepping completes the pending tick exactly once');
for(const dt of [0,-1,NaN,Infinity]) {
  const time=interrupted.time;
  assert(interrupted.advanceFrame(dt,0));
  assert.equal(interrupted.time,time);
  assert.equal(interrupted.pendingStep,null);
}
console.log('PASS partial-to-synchronous transition and invalid timestep cleanup');
