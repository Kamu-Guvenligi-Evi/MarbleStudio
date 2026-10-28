import assert from 'node:assert/strict';
import test from 'node:test';
import { Battle } from '../src/crown-battle.js';

const army = (id, team, roster = { roman: 24 }, commanderId = 'julius_caesar') => ({ id, team, roster, commanderId });
const make = configs => new Battle({ seed: 42, expandedMap: true, armyConfigs: configs });
const tick = b => { b.time += 1; b.tactics.update(b, b.units.filter(u => u.hp > 0 && !u.removed)); };
const kill = (b, id) => b.units.filter(u => u.armyId === id && !u.commanderId).forEach(u => { u.hp = 0; });
const fronts = (b, team) => [...b.tactics.coordination.sectors].filter(([, s]) => s.team === team).sort((a, c) => a[1].min - c[1].min);
const snapshot = b => structuredClone(b.tactics.coordination.sectors);
function separated(b, team) {
  const sectors = fronts(b, team);
  for (let i = 1; i < sectors.length; i++) assert.ok(sectors[i][1].min - sectors[i - 1][1].max >= 36 - 1e-8);
  const units = new Map(b.units.map(u => [u.id, u]));
  for (const director of [b.tactics, b.tactics.civilizations, b.tactics.formations]) {
    for (const [id, { goal }] of director.intents) {
      const unit = units.get(id);
      if (unit.hp <= 0) continue;
      assert.ok(b.tactics.coordination.contains(unit.armyId, goal, unit.combatProfile.radius));
    }
  }
}

for (const team of [0, 1]) for (const vertical of [false, true]) for (const lost of [0, 1, 2]) {
  test(`vacated front expands neighbors without shifting surviving orders: ${team}/${vertical}/${lost}`, () => {
    const b = make([army('a', team), army('b', team), army('c', team), army('enemy', 1 - team)]);
    if (vertical) {
      for (const u of b.units) [u.x, u.y] = [u.y, u.x];
      const r = b.bounds; b.bounds = { left: r.top, right: r.bottom, top: r.left, bottom: r.right };
    }
    tick(b);
    const before = snapshot(b), ordered = fronts(b, team), lostId = ordered[lost][0];
    const slots = new Map([...b.tactics.formations.armies].filter(([id]) => before.has(id)).map(([id, s]) => [id,
      s.members.map(m => m.goal[before.get(id).axis])]));
    kill(b, lostId); tick(b);
    assert.ok(!b.tactics.coordination.sectors.has(lostId), 'an army with no soldiers must release its front');
    assert.ok(b.armyCommanders.get(lostId).hp > 0, 'a lone surviving commander does not reserve an army-sized front');
    const after = fronts(b, team);
    assert.equal(after.length, 2);
    assert.equal(after[0][1].min, ordered[0][1].min);
    assert.equal(after.at(-1)[1].max, ordered.at(-1)[1].max);
    for (const [id, sector] of after) {
      assert.ok(sector.min <= before.get(id).min && sector.max >= before.get(id).max, 'surviving fronts only expand');
      assert.deepEqual(sector.forward, before.get(id).forward);
      assert.deepEqual(b.tactics.formations.armies.get(id).members.map(m => m.goal[sector.axis]), slots.get(id), 'no sideways redeployment of fighting ranks');
    }
    separated(b, team);
    const stable = snapshot(b); tick(b); assert.deepEqual(snapshot(b), stable, 'no boundary drift on later decisions');
  });
}

test('consecutive gaps and later losses preserve the full available front', () => {
  const b = make(['a', 'b', 'c', 'd'].map(id => army(id, 0)).concat(army('enemy', 1)));
  tick(b); const before = fronts(b, 0), low = before[0][1].min, high = before.at(-1)[1].max;
  kill(b, before[1][0]); kill(b, before[2][0]); tick(b);
  assert.equal(fronts(b, 0).length, 2); separated(b, 0);
  kill(b, before[0][0]); tick(b);
  const [[last, sector]] = fronts(b, 0);
  assert.equal(sector.min, low); assert.equal(sector.max, high);
  kill(b, last); tick(b); assert.equal(fronts(b, 0).length, 0);
});

test('commander loss, manual orders and a single surviving soldier retain ownership', () => {
  const b = make([army('a', 0), army('b', 0), army('enemy', 1)]);
  tick(b); const before = snapshot(b);
  b.armyCommanders.get('b').hp = 0;
  const soldiers = b.units.filter(u => u.armyId === 'b' && !u.commanderId);
  for (const u of soldiers.slice(1)) u.hp = 0;
  soldiers[0].order = { kind: 'hold', x: soldiers[0].x, y: soldiers[0].y };
  soldiers[0].tacticalOverride = true;
  tick(b); assert.deepEqual(snapshot(b), before);
  soldiers[0].removed = true; tick(b);
  assert.ok(!b.tactics.coordination.sectors.has('b'), 'removed soldiers cannot keep an empty front occupied');
});

test('a loss changes only the adjacent borders of its own alliance', () => {
  const b = make([...['a', 'b', 'c', 'd'].map(id => army(id, 0)), army('enemy-a', 1), army('enemy-b', 1)]);
  tick(b); const before = snapshot(b), ordered = fronts(b, 0);
  kill(b, ordered[1][0]); b.units.reverse(); tick(b);
  const after = snapshot(b);
  assert.deepEqual(after.get(ordered[3][0]), before.get(ordered[3][0]), 'distant allied front is untouched');
  for (const [id] of fronts(b, 1)) assert.deepEqual(after.get(id), before.get(id), 'opposing alliance owns separate frontage');
  assert.equal(after.get(ordered[0][0]).min, before.get(ordered[0][0]).min);
  assert.equal(after.get(ordered[2][0]).max, before.get(ordered[2][0]).max);
  separated(b, 0); separated(b, 1);
});

for (const team of [0, 1]) for (const [leader, type, waiting] of [
  ['charles_vii', 'french_ordonnance_gendarme', 'wait'],
  ['francesco_sforza', 'milan_ducal_cavalry', 'reserve'],
]) test(`${leader} uses a newly vacated allied flank, team ${team}`, () => {
  const b = make([army('left', team), army('cavalry', team, { [type]: 24 }, leader), army('right', team), army('enemy', 1 - team, { landsknecht: 24 })]);
  tick(b);
  const director = b.tactics.civilizations, s = director.armies.get('cavalry'); assert.ok(s);
  for (const m of s.members) Object.assign(m.unit, director.point(s, m.f, m.a));
  b.units.filter(u => u.armyId === 'enemy').forEach((u, i) => Object.assign(u, director.point(s, 450, (i - 12) * 12)));
  tick(b); b.time += 12; tick(b);
  assert.equal(s.phase, waiting, 'a blocked flank must not trigger a frontal cavalry rush');
  assert.equal(s.flank, null);
  const origin = { ...s.origin }, old = { ...b.tactics.coordination.sectors.get('cavalry') };
  kill(b, 'right'); tick(b);
  assert.equal(s.phase, 'flank', 'the existing doctrine must notice the new route');
  assert.deepEqual(s.origin, origin);
  assert.ok(s.members.some(m => director.intents.has(m.unit.id) && !(
    director.intents.get(m.unit.id).goal[old.axis] >= old.min && director.intents.get(m.unit.id).goal[old.axis] <= old.max
  )), 'actual movement orders use the newly available space');
  separated(b, team);
  for (const m of s.members) {
    const intent = director.intents.get(m.unit.id);
    if (intent && !m.cleared) {
      const forward = (intent.goal.x - s.origin.x) * s.forward.x + (intent.goal.y - s.origin.y) * s.forward.y;
      assert.ok(Math.abs(forward - m.f - s.advance) < 1e-8, 'clear the flank sideways before advancing past pikes');
    }
  }
});
