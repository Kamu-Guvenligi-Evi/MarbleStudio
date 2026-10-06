import assert from 'node:assert/strict';
import {recipe,structure,COURSE_PROFILES} from '../src/factory-recipes.js';
import {normalizeSequence} from '../src/section-settings.js';
import {Spiral} from '../src/spiral.js';
import {SPIRAL_VARIANTS} from '../src/spiral-variants.js';
import {effectSamples} from '../src/impact-audio.js';
const unique=new Set(),profiles=new Set(),rhythms=new Set(),lengths=new Set(),spirals=new Set(),arenas=new Set();
for(let seed=1;seed<=1000;seed++){
  const r=recipe(seed,'track');assert.deepEqual(r,recipe(seed,'track'));normalizeSequence(r.sequence);
  unique.add(structure(r));profiles.add(r.profile);rhythms.add(r.rhythm);lengths.add(r.sequence.length);
  for(let i=1;i<r.sequence.length;i++)assert.notEqual(r.sequence[i].type,r.sequence[i-1].type);
  spirals.add(structure(recipe(seed,'spiral')));arenas.add(structure(recipe(seed,'arena')));
}
assert.ok(unique.size>950);assert.equal(profiles.size,Object.keys(COURSE_PROFILES).length);assert.equal(rhythms.size,3);assert.equal(lengths.size,5);assert.equal(spirals.size,24);assert.equal(arenas.size,24);
for(const variant of Object.keys(SPIRAL_VARIANTS)){
  const events=[],r=new Spiral({variant,onHit:(strength,x,effect)=>events.push(effect.type)});r.start();
  for(let t=0;t<240*120&&r.state==='running';t++)r.step();
  assert.equal(r.state,'finished',variant);assert.equal(r.progress,1);
  for(const type of ['drop','impact','ice','multiply','complete'])assert.ok(events.includes(type),variant+' '+type);
}
for(const type of ['drop','impact','ice','multiply','complete']){
  const event={type,theme:'ice',seed:42,x:270},samples=effectSamples(event);
  assert.deepEqual(samples,effectSamples(event));assert.ok(samples.every(Number.isFinite));
  const peak=Math.max(...samples);assert.ok(peak>.03&&peak<1,type+' amplitude');
  assert.ok(Math.abs(samples.at(-1))<.01,type+' tail');
}
assert.notDeepEqual(effectSamples({type:'ice'}),effectSamples({type:'multiply'}));
console.log(`PASS: ${unique.size}/1000 distinct track structures; 24 spiral and 24 arena configurations; all spiral variants finish and emit five sound events; deterministic bounded audio.`);
