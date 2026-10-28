import assert from 'node:assert/strict';
import test from 'node:test';
import { Battle } from '../src/crown-battle.js';
import { AllianceCoordination, fitArmyFront } from '../src/historical-alliance-coordination.js';
import { compactDeployment } from '../src/historical-compact-deployment.js';
import { CIVILIZATION_DOCTRINES } from '../src/historical-civilization-tactics.js';
import leaders from '../src/historical-commanders.json' with { type: 'json' };

const army = (id, team, roster, commanderId) => ({ id, team, roster, commanderId });
const make = (configs) => new Battle({ seed: 42, expandedMap: true, armyConfigs: configs });
const tick = b => { b.time += 1; b.tactics.update(b, b.units.filter(u => u.hp > 0 && !u.removed)); };
const active = b => [b.tactics, b.tactics.civilizations, b.tactics.formations];
function contained(b) {
  for (const director of active(b)) for (const [id, intent] of director.intents) {
    const u = b.units.find(u => u.id === id);
    assert.ok(b.tactics.coordination.contains(u.armyId, intent.goal, u.combatProfile.radius), `${u.armyId}: goal crosses allied front at ${b.time}`);
  }
}
function disjoint(b) {
  for (const team of [0, 1]) {
    const sectors = [...b.tactics.coordination.sectors.values()].filter(s => s.team === team).sort((a, c) => a.min - c.min);
    for (let i = 1; i < sectors.length; i++) assert.ok(sectors[i].min - sectors[i - 1].max >= 36 - 1e-8);
  }
}
const roster = p => Object.fromEntries(Object.entries(p.required).map(([role, n]) => [Object.keys(p.roles).find(k => p.roles[k] === role), n * 2]));
for (const p of CIVILIZATION_DOCTRINES) for (const team of [0, 1]) test(`${p.id}: independent parallel fronts, team ${team}`, () => {
  const leader = leaders.find(l => l.doctrineIds.includes(p.id)).id;
  const b = make([army('a', team, roster(p), leader), army('b', team, roster(p), leader), army('enemy', 1 - team, { roman: 60 })]);
  tick(b); disjoint(b); contained(b);
  const a = b.tactics.civilizations.armies.get('a'), c = b.tactics.civilizations.armies.get('b');
  assert.ok(a && c, 'both historical doctrines remain available');
  assert.deepEqual(a.forward, c.forward, 'allies must not converge diagonally on one enemy centroid');
  assert.ok(a.members.every(m => m.unit.armyId === 'a'));
});

for (const team of [0, 1]) for (const vertical of [false, true]) test(`stable fronts after rotation/reordering, ${team}/${vertical}`, () => {
  const b = make([army('a', team, { roman: 48 }, 'julius_caesar'), army('b', team, { roman: 24 }, 'julius_caesar'), army('enemy', 1 - team, { roman: 60 })]);
  if (vertical) {
    for (const u of b.units) [u.x, u.y] = [u.y, u.x];
    const r = b.bounds; b.bounds = { left: r.top, right: r.bottom, top: r.left, bottom: r.right };
  }
  tick(b); disjoint(b); contained(b);
  const c = new AllianceCoordination(); c.initialize(b, [...b.units].reverse());
  assert.deepEqual(c.sectors, b.tactics.coordination.sectors);
  const plans = [...b.tactics.formations.armies.values()];
  assert.equal(plans.length, 2); assert.deepEqual(plans[0].forward, plans[1].forward);
  assert.equal(c.sectors.get('a').axis, vertical ? 'x' : 'y');
});

test('whole formation translation preserves spacing; oversized plan is rejected', () => {
  const coordination = new AllianceCoordination();
  coordination.sectors.set('a', { axis: 'y', min: 100, max: 200 });
  const b = { tactics: { coordination } }, s = { armyId: 'a', origin: { x: 0, y: 0 } };
  assert.equal(fitArmyFront(b, s, [{ x: 0, y: 80, radius: 5 }, { x: 0, y: 130, radius: 5 }]), true);
  assert.equal(s.origin.y, 25);
  assert.equal(fitArmyFront(b, s, [{ y: 0, radius: 5 }, { y: 100, radius: 5 }]), false);
  assert.equal(s.origin.y, 25, 'failed fit does not mutate formation');
});

test('empty front selects nearest opposition; manual orders and close combat retain priority', () => {
  const c = new AllianceCoordination(); c.sectors.set('a', { axis: 'y', min: 0, max: 100 });
  const enemies = [{ x: 400, y: 200 }, { x: 400, y: 600 }];
  assert.deepEqual(c.enemies('a', enemies), [enemies[0]]);
  const u = { armyId: 'a', x: 0, y: 50, combatProfile: { config: { reach: 20 } } };
  assert.ok(c.penalty(u, enemies[0]) > 0);
  assert.equal(c.penalty({ ...u, order: {} }, enemies[0]), 0);
  assert.equal(c.penalty({ ...u, tacticalOverride: true }, enemies[0]), 0);
  assert.equal(c.penalty(u, { x: 0, y: 110 }), 0);
});

test('late doctrine fallback hands control to a compact formation without stale intents', () => {
  // Obtain the period-correct commander from the existing catalogue.
  const leader = leaders.find(l => l.doctrineIds.includes('PE_ACHAEMENID')).id;
  const scenario = make([army('a', 0, { achaemenid_archer: 12, persian: 12 }, leader), army('b', 0, { roman: 24 }, 'julius_caesar'), army('enemy', 1, { roman: 48 })]);
  tick(scenario);
  const doctrine = scenario.tactics.civilizations.armies.get('a'); assert.ok(doctrine);
  const sector = scenario.tactics.coordination.sectors.get('a');
  sector.min = doctrine.origin.y - 30; sector.max = doctrine.origin.y + 30;
  tick(scenario);
  assert.equal(doctrine.phase, 'done');
  const plan = scenario.tactics.formations.armies.get('a');
  assert.ok(plan?.compact, 'a narrow replacement is actually controlled');
  assert.ok(doctrine.members.every(m => !scenario.tactics.civilizations.intents.has(m.unit.id)));
  contained(scenario);
  const m = plan.members[0], target = scenario.units.find(u => u.armyId === 'enemy');
  assert.equal(scenario.tactics.steer(scenario, m.unit, target, 1/30), true);
  scenario.armyCommanders.get('a').hp = 0; tick(scenario);
  assert.equal(plan.phase, 'done');
});

for (const direction of [0, 90, 180, 270]) test(`compact fallback has separate bodies and front melee, ${direction}`, () => {
  const b = make([army('a', 0, { roman: 30, achaemenid_archer: 18 }), army('e', 1, { roman: 12 })]);
  const units = b.units.filter(u => u.armyId === 'a' && !u.commanderId);
  const bounds = direction % 180 === 0 ? { left: -500, right: 500, top: -150, bottom: 150 } : { left: -90, right: 90, top: -600, bottom: 600 };
  const plan = compactDeployment(units, { x: 0, y: 0 }, direction, bounds); assert.ok(plan);
  const f = p => p.x * plan.forward.x + p.y * plan.forward.y;
  assert.ok(Math.min(...plan.members.filter(m => !m.unit.combatProfile.ranged).map(m => f(m.goal)))
    >= Math.max(...plan.members.filter(m => m.unit.combatProfile.ranged).map(m => f(m.goal))));
  for (let i = 0; i < plan.members.length; i++) for (let j = 0; j < i; j++) {
    const a = plan.members[i].goal, c = plan.members[j].goal;
    assert.ok(Math.hypot(a.x - c.x, a.y - c.y) >= a.radius + c.radius);
  }
  assert.equal(compactDeployment(units, { x: 0, y: 0 }, direction, { left: 0, right: 92, top: 0, bottom: 212 }), null);
});

for (const team of [0, 1]) test(`mixed allied maneuver goals remain separated during battle, ${team}`, () => {
  const b = make([army('seljuk', team, { seljuk_hassa: 24 }, 'alp_arslan'),
    army('german', team, { landsknecht: 24 }, 'georg_frundsberg'),
    army('roman', team, { roman: 24, achaemenid_archer: 12 }, 'julius_caesar'),
    army('enemy1', 1 - team, { roman: 48 }, 'julius_caesar'),
    army('enemy2', 1 - team, { landsknecht: 24 }, 'georg_frundsberg')]);
  let decisions = 0;
  for (let i = 0; i < 90 * 30 && b.winner === null; i++) {
    b.step(1/30);
    if (i % 15 === 0) { contained(b); decisions++; }
  }
  disjoint(b); assert.ok(decisions > 20);
  assert.ok(b.units.some(u => u.hp < u.maxHp), 'sector rules allow the armies to reach actual combat');
});
