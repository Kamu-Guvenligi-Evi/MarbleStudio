import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { Race } from '../src/physics.js';
import { COURSE_META, updateCourse } from '../src/courses.js';

let runs = 0, totalBalls = 0, longest = 0, rescueCount = 0;
for (const preset of Object.keys(COURSE_META)) {
  for (const sections of [4, 6, 8]) {
    for (const [index, seed] of [1, 2048, 89271].entries()) {
      const count = [6, 12, 20][index];
      const r = new Race({ preset, seed, sections, count });
      assert.equal(r.sections.length, sections);
      assert.equal(new Set(r.sections.map(s => s.type)).size, sections, 'No repeated modules');
      r.start();
      for (let i = 0; i < 120 * 120 && r.state !== 'finished'; i++) {
        r.step();
        assert.ok(r.balls.every(b => Number.isFinite(b.body.position.x) && b.body.position.x > 0 && b.body.position.x < 540), `${preset}/${sections}/${seed}: ball escaped`);
      }
      assert.equal(r.finished.length, count, `${preset}/${sections}/${seed}: ${r.finished.length}/${count} reached finish: ${JSON.stringify(r.balls.filter(b => b.finishedAt === null).map(b => ({position:b.body.position,section:r.sectionAt(b.body.position.y)?.type})))}`);
      assert.ok(r.finished.every((b, i) => b.finishedAt > 0 && (!i || b.finishedAt >= r.finished[i - 1].finishedAt)));
      console.log(`${preset} / ${sections} sections / ${seed}: ${count}/${count} finished in ${r.time.toFixed(2)}s (${r.rescues} nudges)`);
      runs++; totalBalls += count; longest = Math.max(longest, r.time); rescueCount += r.rescues; r.dispose();
    }
  }
}

// Reproducible generation and moving obstacle simulation, independent of effects.
const lineups=new Set(),winners=new Set();
for(let seed=1;seed<=12;seed++) {
  const r=new Race({seed,count:12,sequence:['shortcut','wheels','crossramps']});
  lineups.add(r.balls.map(b=>`${Math.round((b.body.position.x-88)/52)},${b.body.position.y}`).join('|'));
  r.start();while(r.time<30&&r.state!=='finished')r.step();
  assert.equal(r.finished.length,12);winners.add(r.finished[0].id);r.dispose();
}
assert.equal(lineups.size,12,'Different seeds must shuffle color starting slots');
assert.ok(winners.size>1,'The same course should permit different winners');
console.log(`PASS: 12 distinct starting lineups and ${winners.size} different winners on one course.`);
const a = new Race({ seed: 2048, preset: 'clockwork', sections: 8 });
const b = new Race({ seed: 2048, preset: 'clockwork', sections: 8 });
assert.deepEqual(a.sections, b.sections);
a.start(); b.start();
for (let i = 0; i < 2400; i++) { a.step(); b.step(); b.particles = []; }
assert.deepEqual(a.balls.map(x => x.body.position), b.balls.map(x => x.body.position));
a.dispose(); b.dispose();
const original = new Race({ seed: 2048 }), changed = new Race({ seed: 2049 });
assert.notDeepEqual(original.sections.map(s => s.type), changed.sections.map(s => s.type));
original.dispose(); changed.dispose();

// Pulse gates visibly open and close with corresponding collision masks.
const gates = new Race({ preset: 'clockwork' });
const gate = gates.course.gates[0];
updateCourse(gates.course, gate.period - gate.phase + .1);
assert.equal(gate.open, true); assert.equal(gate.body.collisionFilter.mask, 0);
updateCourse(gates.course, gate.period - gate.phase + 2.1);
assert.equal(gate.open, false); assert.notEqual(gate.body.collisionFilter.mask, 0);
gates.dispose();

// Two balls cross in one fixed step; actual crossing time must beat array order.
const photo = new Race(); photo.start();
Matter.Body.setPosition(photo.balls[0].body, { x: 120, y: photo.finishY - 1 });
Matter.Body.setVelocity(photo.balls[0].body, { x: 0, y: 2.2 });
Matter.Body.setPosition(photo.balls[1].body, { x: 420, y: photo.finishY - 4 });
Matter.Body.setVelocity(photo.balls[1].body, { x: 0, y: 12 });
photo.step(); assert.equal(photo.finished[0].id, 1); photo.dispose();
// User order is exact, may repeat modules, and supports an empty editing draft.
const empty = new Race({ sequence: [] }); assert.equal(empty.sectionCount, 0); empty.dispose();
assert.throws(() => new Race({ sequence: ['invalid'] }));
assert.throws(() => new Race({ sequence: Array(25).fill('slalom') }));
for (const sequence of [['slalom'], ['pulse','pulse','slalom','fork','slalom'], Array(24).fill('slalom')]) {
  const custom = new Race({ sequence, count: 20 });
  assert.deepEqual(custom.sections.map(s => s.type), sequence);
  custom.start();
  for (let i = 0; i < 120 * 180 && custom.state !== 'finished'; i++) custom.step();
  assert.equal(custom.finished.length, 20, `Custom ${sequence.length}-section course failed`);
  console.log(`Custom ${sequence.length} sections: 20/20 finished in ${custom.time.toFixed(2)}s`);
  custom.dispose();
}
console.log(`PASS: ${runs} races, ${totalBalls} arrivals, longest ${longest.toFixed(2)}s, ${rescueCount} recovery nudges. Seeded replay, module variation, gate collisions and photo finish passed.`);
