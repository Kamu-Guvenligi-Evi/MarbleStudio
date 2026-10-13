import assert from 'node:assert/strict';
import {Race} from '../src/physics.js';
import {COURSE_META, extendStudioCourse, COURSE_START, SECTION_HEIGHT} from '../src/courses.js';

const timings=[];
for (const [preset,meta] of Object.entries(COURSE_META)) {
  const original=new Race({preset,sections:8,sequence:meta.maxSpeed?meta.modules:null});
  const before=structuredClone(original.sequence);
  const sequence=extendStudioCourse(original.sequence,preset);
  assert.deepEqual(sequence.slice(0,before.length),before);
  assert.deepEqual(original.sequence,before);
  assert.deepEqual(extendStudioCourse(sequence,preset),sequence);
  original.dispose();
  for (const seed of [17,2048]) {
    const race=new Race({seed,count:2,sequence,maxSpeed:meta.maxSpeed??18});
    assert.ok(race.sectionCount>=18);
    assert.equal(race.finishY,COURSE_START+sequence.length*SECTION_HEIGHT+220);
    race.start();
    while (race.time<240 && race.state!=='finished') race.step();
    assert.equal(race.state,'finished',`${preset}/${seed}: all racers must finish`);
    assert.ok(race.balls.every(ball=>Number.isFinite(ball.body.position.y)));
    timings.push(race.finished[0].finishedAt);
    race.dispose();
  }
}
console.log(JSON.stringify({passed:true,races:timings.length,firstFinishSeconds:{min:Math.min(...timings),max:Math.max(...timings)}}));
