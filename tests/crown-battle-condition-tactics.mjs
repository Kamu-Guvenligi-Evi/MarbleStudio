import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

const make = (team, hz) => {
  const historicalArmies = [{ roman: 24 }, { roman: 24 }], commanders = [null, null];
  historicalArmies[team] = { seljuk_hassa: 16, seljuk_turkmen_archer: 8 };
  commanders[team] = 'alp_arslan';
  const b = new Battle({ seed: 42, expandedMap: true, historicalArmies, commanders });
  for (const u of b.units.filter(u => u.team !== team)) u.order = { kind: 'hold' };
  const run = seconds => { for (let i = 0; i < seconds * hz; i++) b.step(1 / hz); };
  run(1 / hz);
  const rider = b.units.find(u => u.type === 'seljuk_turkmen_archer');
  assert.ok(b.tactics.intents.has(rider.id), 'Real commander assigns a mounted archer to the plan');
  return { b, rider, run };
};

for (const hz of [30, 60]) for (const team of [0, 1]) {
  const { b, rider, run } = make(team, hz);
  const plan = b.tactics.teams[team], origin = { x: rider.x, y: rider.y };
  rider.fatigue = 82;
  let resumed = false;
  const steer = b.tactics.steer.bind(b.tactics);
  b.tactics.steer = (battle, u, target, dt) => {
    const result = steer(battle, u, target, dt);
    if (u === rider && !u.resting && result) resumed = true;
    return result;
  };
  run(2);
  assert.ok(rider.fatigue < 78, 'A safe exhausted rider recovers despite a commander movement intent');
  assert.ok(Math.hypot(rider.x - origin.x, rider.y - origin.y) < 3, 'Recovery stops tactical marching');
  assert.ok(plan.members.some(m => m.unit === rider), 'Recovery retains army membership');
  run(14);
  assert.ok(resumed, 'Recovered rider resumes the active commander plan');
  assert.ok(rider.fatigue < 45 && !rider.resting);
  assert.equal(b.tactics.teams[team], plan, 'No replacement/restarted doctrine needed');
}

// Recovery still reacts to an approaching enemy instead of freezing in place.
for (const team of [0, 1]) {
  const { b, rider, run } = make(team, 30);
  const enemy = b.units.find(u => u.team !== team);
  const forward = team ? -1 : 1;
  Object.assign(rider, { x: 650, y: 450, fatigue: 85, retarget: 0 });
  Object.assign(enemy, { x: 650 + forward * 45, y: 450 });
  const origin = { x: rider.x, y: rider.y };
  run(1.5); // Allow the horse to turn before translating away from the threat.
  assert.ok(rider.resting && rider.moving, 'Threatened rider seeks separation while exhausted');
  assert.ok(Math.hypot(rider.x - origin.x, rider.y - origin.y) > 2);
  assert.ok(Math.hypot(rider.x - enemy.x, rider.y - enemy.y) > 45, 'Recovery movement increases distance from the immediate threat');
}

// A direct player route still takes priority; fatigue must not erase its goal.
{
  const { b, rider, run } = make(0, 30);
  rider.fatigue = 85;
  const x = rider.x;
  rider.order = { kind: 'move', x: rider.x + 90, y: rider.y };
  const order = rider.order;
  run(1);
  assert.equal(rider.order, order);
  assert.ok(rider.x > x + 3 && rider.resting, 'Player may move an exhausted horse at its reduced speed');
}

// Morale retreat temporarily suspends the real commander, then rejoins its plan.
{
  const { b, rider, run } = make(0, 30);
  rider.morale = 10;
  let rallied = false, resumed = false;
  const steer = b.tactics.steer.bind(b.tactics);
  b.tactics.steer = (battle, u, target, dt) => {
    if (u === rider) assert.equal(u.rally, null, 'Commander cannot override a morale retreat');
    const result = steer(battle, u, target, dt);
    if (u === rider && rallied && result) resumed = true;
    return result;
  };
  run(1); rallied = !!rider.rally;
  assert.ok(rallied);
  run(9);
  assert.ok(resumed && !rider.rally && rider.morale >= 40);
}
console.log('PASS commander recovery and resumption: both teams at 30/60 Hz, manual movement and morale retreat');
