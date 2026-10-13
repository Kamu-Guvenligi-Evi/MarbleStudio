import assert from 'node:assert/strict';
import {ringSoundTrace,ringSignature} from '../src/ring-sound-trace.js';
import {localPlan,softPlan,memePlan,validatePlan,cueSamples,VOICES} from '../src/sound-plan.js';
import {MEME_EFFECTS} from '../src/meme-catalog.js';

const trace=ringSoundTrace({seed:6}),plan=localPlan(trace);
assert.deepEqual(ringSoundTrace({seed:6}),trace,'same simulation produces same event identifiers');
assert.equal(ringSignature({seed:6,theme:'aurora'}),trace.signature,'appearance does not invalidate a score');
assert.notEqual(ringSignature({seed:6,speed:2}),trace.signature);
assert.deepEqual(validatePlan(plan,trace),plan);
const dense=ringSoundTrace({layout:'rush',count:800,seed:55});
for(const make of [localPlan,softPlan]){
  const p=make(dense);validatePlan(p,dense);
  assert.ok(p.cues.length<=256,'dense runs keep the sound plan bounded');
  assert.ok(dense.events[p.cues[0].eventId].time<2,'audio starts with the action');
  assert.equal(p.cues.at(-1).eventId,dense.events.at(-1).id,'audio retains the ending');
}
for(const speed of [.5,1,2])for(const spoken of [false,true]){
  const t=ringSoundTrace({seed:6,speed}),p=memePlan(t,spoken);
  assert.deepEqual(validatePlan(p,t),p);
  assert.equal(p.cues.at(-1).eventId,t.events.at(-1).id);
  assert(p.cues.length<localPlan(t).cues.length,'recorded clips have breathing room');
  assert(p.cues.some(c=>spoken?MEME_EFFECTS[c.voice]?.speech:c.voice==='bubble-pop'));
  const speech=p.cues.filter(c=>MEME_EFFECTS[c.voice]?.speech&&!['win','timeout','complete'].includes(t.events.find(e=>e.id===c.eventId).type));
  for(let i=1;i<speech.length;i++){
    const time=c=>t.events.find(e=>e.id===c.eventId).time/t.speed;
    assert(time(speech[i])-time(speech[i-1])>=MEME_EFFECTS[speech[i-1].voice].interval,'spoken reactions leave enough time for the previous recording');
  }
}
for(const mutate of [p=>p.cues.push({...p.cues[0]}),p=>p.cues[0].eventId=9999,p=>p.cues.pop(),p=>p.sections[0].start=1,p=>p.sections[1].start=0,p=>p.sections[1].start=trace.duration,p=>p.cues[0].gain=NaN,p=>p.cues[0].voice='unknown',p=>p.extra=true]){
  const invalid=structuredClone(plan);mutate(invalid);assert.throws(()=>validatePlan(invalid,trace));
}
for(const voice of VOICES){
  const cue={voice,degree:3,gain:.8},a=cueSamples(plan,cue),b=cueSamples(plan,cue);
  assert.deepEqual(a,b);assert.equal(a[0],0);assert(Math.abs(a.at(-1))<.0001);
  let energy=0;for(const s of a){assert(Number.isFinite(s)&&Math.abs(s)<=.8);energy+=s*s;}assert(energy>.1);
}
console.log('PASS: local sound plans, validation, dense runs, timing and deterministic voices.');
