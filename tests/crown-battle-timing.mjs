import assert from 'node:assert/strict';
import {advanceBattleFrame} from '../src/crown-battle-timing.js';

function fakeBattle(count, cost = 1) {
  let clock = 0, remaining = 0, duration = 0;
  const b = {units: {length: count}, winner: null, pendingStep: null, time: 0, completed: 0,
    advanceFrame(dt, budget) {
      if (!this.pendingStep) { this.pendingStep = {}; remaining = cost; duration = dt; }
      const work = Math.min(remaining, budget); clock += work; remaining -= work;
      if (remaining > 1e-9) return false;
      this.pendingStep = null; this.time += duration; this.completed++; return true;
    },
    step(dt) { clock += cost; this.time += dt; this.completed++; },
    now: () => clock};
  return b;
}
for (const count of [320,3000,6000,10000]) for (const speed of [1,2,4]) {
  const b = fakeBattle(count); let accumulator = 0;
  for (let frame = 0; frame < 120; frame++) accumulator = advanceBattleFrame(b, accumulator, 1/60, speed, b.now);
  assert(Math.abs(b.time - 2*speed) < .051, `${count} soldiers ${speed}x must advance at requested speed`);
  if(count>=2500) assert.equal(b.completed,count>=6000&&speed===4?20:40,'crowd updates stay bounded while preserving playback speed');
}
const switching = fakeBattle(3000, 18);
let switchingAccumulator = advanceBattleFrame(switching, 0, .05, 4, switching.now);
assert(switching.pendingStep);
switchingAccumulator = advanceBattleFrame(switching, switchingAccumulator, 0, 1, switching.now);
assert.equal(switching.time,.2,'speed change finishes the existing tick with its original duration');
assert.equal(switchingAccumulator,0,'speed change does not charge a pending tick twice');
const slow = fakeBattle(10000, 45); let accumulator = 0;
for (let frame = 0; frame < 180; frame++) {
  const before = slow.now(); accumulator = advanceBattleFrame(slow, accumulator, 1/60, 4, slow.now);
  assert(slow.now() - before <= 9.000001, 'work stays within the crowd frame budget');
  assert(accumulator <= .4 && accumulator >= 0, 'bounded backlog');
}
assert.equal(slow.completed, 29, 'last requested tick can remain in progress at the end of the sample');
assert(Math.abs(slow.time - 11.6) < 1e-8, '4x large crowd playback advances 400ms per completed update');
const overloaded = fakeBattle(10000, 90); let backlog = 0;
for (let frame = 0; frame < 180; frame++) {
  const before = overloaded.now();
  backlog = advanceBattleFrame(overloaded, backlog, 1/60, 4, overloaded.now);
  assert(overloaded.now() - before <= 9.000001);
  assert(backlog >= 0 && backlog <= .4, 'overloaded simulation must not accumulate unbounded catch-up');
}
assert.equal(overloaded.completed,17,'overloaded frames resume partial work without dropping ticks');
const smallSlow = fakeBattle(320, 45);
advanceBattleFrame(smallSlow, 0, 1/60, 4, smallSlow.now);
assert(smallSlow.pendingStep, '4x also slices expensive ticks below the crowd threshold');
assert(smallSlow.now() <= 9.000001);
slow.winner = 0;
const finished = slow.completed;
advanceBattleFrame(slow, .25, .1, 4, slow.now);
assert.equal(slow.completed, finished);
console.log('PASS 320/3000/10000 soldiers at 1x/2x/4x; partial ticks, bounded catch-up, frame budget and battle end');
