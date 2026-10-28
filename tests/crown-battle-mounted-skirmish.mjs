import assert from 'node:assert/strict';
import { Battle, UNIT_TYPES } from '../src/crown-battle.js';

const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function make(type = 'mongol', team = 0, allies = 0) {
  const armies = [{ roman: 1 }, { roman: 1 }];
  armies[team] = { [type]: 1, ...(allies ? { seljuk_hassa: allies } : {}) };
  const b = new Battle({ seed: 1427, historicalArmies: armies });
  const a = b.units.find(u => u.type === type), z = b.units.find(u => u.team !== team);
  Object.assign(a, { x: 300, y: 450, cooldown: 0 });
  Object.assign(z, { x: team ? 250 : 350, y: 450, hp: 10000, cooldown: 1000 });
  return { b, a, z };
}
function run(b, seconds, inspect = () => {}, hz = 30) {
  for (let i = 0; i < seconds * hz && b.winner === null; i++) { b.step(1 / hz); inspect(); }
}
const metrics = [];
for (const type of ['mongol', 'seljuk_turkmen_archer', 'parthian_horse_archer', 'tang_mounted_archer']) {
  for (const team of [0, 1]) {
    const { b, a, z } = make(type, team);
    let arrows = 0, movingShots = 0, laterShots = 0, contactFrames = 0;
    run(b, 45, () => {
      if (b.stats.arrows > arrows && a.moving) { movingShots++; if (b.time > 15) laterShots++; }
      arrows = b.stats.arrows;
      if (b.time > 3 && gap(a, z) < 25) contactFrames++;
    });
    assert.ok(a.evadeSpent > 500, `${type}: manoeuvring does not expire after 180px`);
    assert.ok(movingShots >= 10 && laterShots >= 5, `${type}: actual moving releases continue late in combat`);
    assert.ok(z.hp < 9900, `${type}: moving arrows cause real damage`);
    assert.ok(contactFrames < 30, `${type}/${team}: slower pursuer cannot pin a healthy rider`);
    metrics.push({ type, team, movingShots, gap: +gap(a, z).toFixed(1) });
  }
}

// Apply the behavior by equipment/role, including every current catalogue entry.
const mountedTypes = Object.entries(UNIT_TYPES).filter(([, cfg]) => cfg.role === 'cavalry' && cfg.ranged).map(([type]) => type);
for (const type of mountedTypes) {
  const { b, a } = make(type);
  let shots = 0, arrows = 0;
  run(b, 45, () => {
    if (a.moving && b.stats.arrows > arrows) shots++;
    arrows = b.stats.arrows;
  });
  assert.ok(shots >= 5 && a.evadeSpent > 300, `${type}: mounted ranged role remains mobile`);
}

// A held cavalry rank blocks the direct retreat; riders must go around its end.
for (const team of [0, 1]) for (const hz of [30, 60]) {
  const { b, a, z } = make('mongol', team, 9), sign = team ? -1 : 1;
  const screen = b.units.filter(u => u.type === 'seljuk_hassa');
  screen.forEach((u, i) => Object.assign(u, { x: 300 - sign * 25, y: 398 + i * 13, order: { kind: 'hold' }, cooldown: 1000 }));
  const initial = screen.map(u => ({ x: u.x, y: u.y }));
  let movedAround = false, lateArrows = 0, arrows = 0;
  run(b, 20, () => {
    if ((a.x - (300 - sign * 25)) * sign < -6) movedAround = true;
    if (b.time > 8 && b.stats.arrows > arrows) lateArrows++;
    arrows = b.stats.arrows;
  }, hz);
  assert.ok(movedAround && lateArrows > 0, `Team ${team}/${hz}Hz: escape allied screen and resume firing`);
  screen.forEach((u, i) => assert.ok(gap(u, initial[i]) < .1, 'Hold ranks are not moved by AI'));
  assert.ok(gap(a, z) > 40, 'No permanent contact after leaving the screen');
}

// A corner is a turn, not a lifetime exhaustion trigger.
{
  const { b, a, z } = make();
  Object.assign(a, { x: 42, y: 117 }); Object.assign(z, { x: 93, y: 160 });
  run(b, 20);
  assert.ok(gap(a, { x: 42, y: 117 }) > 100 && gap(a, z) > 60);
  assert.ok(b.stats.arrows > 5);
}

// Deliberately prevent damage: failed shooting must not cause an eternal chase.
{
  const { b, a, z } = make();
  b.hit = () => {};
  run(b, 50);
  assert.equal(a.mountedSkirmish.exhausted, true);
  assert.ok(gap(a, z) < 25, 'No-hit pursuit ends in engagement');
}

// Stop/move/attack take precedence even while a nearby enemy triggers evasion.
{
  const { b, a, z } = make();
  z.order = { kind: 'hold' };
  run(b, 2); b.selected = new Set([a.id]); b.stopSelected();
  const stopped = { x: a.x, y: a.y }; run(b, 2);
  assert.ok(gap(a, stopped) < .1);
  b.moveSelected(200, 650); run(b, 15);
  assert.ok(gap(a, { x: 200, y: 650 }) < 2 && a.order.kind === 'hold');
  b.attackSelected(z.id); run(b, 8);
  assert.equal(a.target, z); assert.equal(a.order.kind, 'attack');
  assert.equal(a.mountedSkirmish, null, 'Explicit attack does not start autonomous retreat');
}

// A movement order keeps its destination while the rider shoots in passing.
{
  const { b, a, z } = make();
  z.order = { kind: 'hold' };
  b.selected = new Set([a.id]); b.moveSelected(280, 650);
  let movingReleases = 0, arrows = 0;
  run(b, 3, () => {
    if (b.stats.arrows > arrows && a.moving) movingReleases++;
    arrows = b.stats.arrows;
    assert.equal(a.order.kind, 'move');
    assert.equal(a.order.x, 280); assert.equal(a.order.y, 650);
  });
  assert.ok(movingReleases >= 1, 'Shoot while following a player movement order');
}

// Bounded local samples: doubling soldiers must not create all-pairs steering.
{
  const b = new Battle({ seed: 42, expandedMap: true, historicalArmies: [{ mongol: 600 }, { roman: 600 }] });
  b.units.forEach(u => {
    const i = u.id % 600;
    Object.assign(u, { x: 200 + (i % 20) * 13 + u.team * 310, y: 200 + Math.floor(i / 20) * 16 });
  });
  run(b, 3);
  assert.ok(b.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y)));
  assert.ok(b.stats.skirmishChecks > 1000 && b.stats.skirmishChecks < 600 * 40 * 15);
}
console.log(`PASS mounted skirmish: all ${mountedTypes.length} mounted ranged types; 8 role/team pursuits, allied screens at 30/60Hz, corner, no-hit fallback, manual orders, 1200 soldiers`, JSON.stringify(metrics));
