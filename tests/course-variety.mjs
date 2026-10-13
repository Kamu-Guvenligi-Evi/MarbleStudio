import assert from 'node:assert/strict';
import {Race} from '../src/physics.js';
import {COURSE_META} from '../src/courses.js';
import {SECTION_SETTINGS} from '../src/section-settings.js';
import {recipe,structure,validateBatch} from '../src/factory-recipes.js';
import {withEpisode,EPISODE_FORMATS} from '../src/episode-plan.js';

assert.equal(Object.keys(COURSE_META).length,17);
assert.equal(COURSE_META.longduel.count,2);
assert.equal(COURSE_META.longduel.maxSpeed,6);
assert.ok(COURSE_META.longduel.modules.length>=20);
assert.equal(Object.keys(SECTION_SETTINGS).length,16);
for(const duration of [30,120,150,180])assert.equal(validateBatch({duration}).duration,duration);
for(const duration of [29,181])assert.throws(()=>validateBatch({duration}));
const seen=new Set(),types=new Set();
for(let seed=1;seed<=300;seed++){
  const r=recipe(seed,'track');assert.deepEqual(recipe(seed,'track'),r);
  seen.add(structure(r));
  for(const format of EPISODE_FORMATS){
    const episode=withEpisode(r,format);
    for(const heat of episode.episode.heats){
      assert.equal(new Set(heat.sequence.map(s=>s.type)).size,heat.sequence.length);
      heat.sequence.forEach(s=>types.add(s.type));
    }
  }
}
assert.equal(seen.size,300);assert.equal(types.size,16);
let runs=0;
for(const type of ['staircase','diamonds','rotorgates','weave','switchback','sieve']){
  for(const seed of [1,17,2048,89271])for(const count of [6,20])for(const edge of ['min','max']){
    const settings=Object.fromEntries(SECTION_SETTINGS[type].map(s=>[s.key,s.options?s.options.at(edge==='min'?0:-1)[0]:s[edge]]));
    const race=new Race({seed,count,sequence:[{type,settings}]});race.start();
    try{
      while(race.time<40&&race.state!=='finished'){
        race.step();assert.ok(race.balls.every(b=>Number.isFinite(b.body.position.y)&&b.body.position.x>26&&b.body.position.x<514),`${type}: escaped`);
      }
      assert.equal(race.finished.length,count,`${type}/${seed}/${count}/${edge}: incomplete`);
      assert.equal(race.rescues,0,`${type}/${seed}/${count}/${edge}: rescue`);
      runs++;
    }finally{race.dispose();}
  }
}
console.log(`PASS: ${runs} new obstacle runs, 300 distinct reproducible courses, all 16 obstacle types in episodes and duration boundaries.`);
