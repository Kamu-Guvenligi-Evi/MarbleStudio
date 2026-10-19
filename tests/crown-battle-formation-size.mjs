import assert from 'node:assert/strict';
import { FORMATIONS, formationLayout } from '../src/crown-battle-formations.js';
const bounds = { left: -2000, right: 2000, top: -2000, bottom: 2000 };
const units = Array.from({length:32}, (_,id)=>({id,radius:id%5===0?14:5}));
const plan = (kind,scale,direction=0,b= bounds)=>formationLayout(units,0,0,{kind,scale,direction},b,u=>u.radius);
const span = (p,axis)=>Math.max(...p.slots.map(s=>s[axis]))-Math.min(...p.slots.map(s=>s[axis]));
let count=0;
for(const kind of Object.keys(FORMATIONS)) for(const direction of [0,90,180,270]) for(const scale of [.75,1,1.5,2.5]) {
  const p=plan(kind,scale,direction); assert.ok(p.valid,`${kind}/${scale}`);
  for(let i=0;i<p.slots.length;i++) for(let j=i+1;j<p.slots.length;j++) {
    const a=p.slots[i],b=p.slots[j];
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)+1e-8>=a.radius+b.radius,`${kind}/${scale} body clearance`);
  }
  count++;
}
for(const kind of ['circle','line']) {
  const small=plan(kind,.75), normal=plan(kind,1), large=plan(kind,2);
  assert.ok(span(small,'y')<span(normal,'y'));
  assert.ok(Math.abs(span(large,'y')/span(normal,'y')-2)<1e-8);
  if(kind==='line') assert.equal(span(large,'x'),span(normal,'x'),'Line depth stays unchanged');
  else assert.ok(Math.abs(span(large,'x')/span(normal,'x')-2)<1e-8);
}
for(const scale of [NaN,Infinity,0,-1,3,'2']) assert.equal(plan('circle',scale).valid,false);
assert.equal(plan('circle',2.5,0,{left:-100,right:100,top:-200,bottom:200}).valid,false,'Oversize is rejected instead of collapsed');
console.log(`PASS formation size: ${count} layouts, shrink/grow, line depth, mixed body clearance, invalid sizes and capacity`);
