import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

const tick = b => { b.time += .1; b.tactics.update(b, b.units.filter(u => u.hp > 0 && !u.removed)); };
const make = (team, roster = { roman: 24 }, enemy = { roman: 24 }, leader = 'julius_caesar') => new Battle({
  seed: 42, expandedMap: true, armyConfigs: [
    { id: 'own', team, roster, commanderId: leader },
    { id: 'ally', team, roster: { roman: 24 }, commanderId: 'julius_caesar' },
    { id: 'enemy', team: 1 - team, roster: enemy },
  ],
});
for (const team of [0, 1]) {
  for (const [roster, enemy, role, kind] of [
    [{ roman: 24 }, { roman: 24 }, 'front', 'line'],
    [{ landsknecht: 24 }, { roman: 24 }, 'front', 'block'],
    [{ roman: 24 }, { achaemenid_archer: 24 }, 'front', 'loose'],
    [{ achaemenid_archer: 24 }, { roman: 24 }, 'bow', 'loose'],
    [{ seljuk_hassa: 24 }, { roman: 24 }, 'horse', 'wedge'],
  ]) {
    const b = make(team, roster, enemy); tick(b);
    const s = b.tactics.formations.armies.get('own');
    assert.ok(s.groups.some(g => g.role === role && g.kind === kind), `${role}/${kind}`);
    assert.ok(s.members.every(m => m.unit.armyId === 'own'));
    assert.ok(s.members.every(m => Number.isFinite(m.goal.x) && Number.isFinite(m.goal.y)));
    const u = s.members[0].unit, target = b.units.find(u => u.armyId === 'enemy');
    const start = { x: u.x, y: u.y };
    for (let i = 0; i < 30; i++) b.step(1 / 30);
    assert.ok(Math.hypot(u.x - start.x, u.y - start.y) > 1, 'physical deployment or ordinary combat movement');
    b.setActiveTeam(team); b.selected = new Set([u.id]); b.stopSelected();
    assert.equal(b.tactics.steer(b, u, target, 1 / 30), false, 'manual hold wins immediately');
    const ally = b.tactics.formations.armies.get('ally'), allyPhase = ally.phase;
    b.armyCommanders.get('own').hp = 0;
    const other = s.members[1].unit;
    assert.equal(b.tactics.steer(b, other, target, 1 / 30), false, 'death releases between decisions');
    tick(b); assert.equal(s.phase, 'done');
    assert.equal(ally.phase, allyPhase, 'commander loss cannot cancel the ally; it may already have finished its deployment');
    assert.ok(ally.commander.hp > 0 && ally.commander.armyId === 'ally');
  }
  const leaderless = make(team, { roman: 24 }, { roman: 24 }, null); tick(leaderless);
  assert.ok(!leaderless.tactics.formations.armies.has('own'), 'never borrow allied commander');
  const b = make(team, { seljuk_hassa: 24 }); tick(b);
  const d = b.tactics.formations, s = d.armies.get('own'), u = s.members[0].unit;
  const target = b.units.find(u => u.armyId === 'enemy');
  target.x = u.x + 160; target.y = u.y;
  u.runDistance = 40; u.speed = 60;
  assert.equal(b.tactics.steer(b, u, target, 1 / 30), false);
  assert.equal(s.phase, 'done'); assert.equal(u.runDistance, 40); assert.equal(u.speed, 60);
  const decisions = d.stats.decisions;
  for (let i = 0; i < 20; i++) { b.time += .02; d.update(b, b.units, new Set()); }
  assert.equal(d.stats.decisions, decisions, '1 Hz deployment decisions');
}
console.log('PASS both alliances: role/threat layouts, physical motion, own commander, manual priority, death isolation, cavalry momentum, 1 Hz');

for (const team of [0, 1]) {
  const mixed = make(team, { roman: 24, achaemenid_archer: 12, seljuk_hassa: 12 }); tick(mixed);
  const mixedState = mixed.tactics.formations.armies.get('own');
  assert.equal(mixedState.groups.length, 3, 'mixed army deploys infantry, bows and horse groups');
  for (let i = 0; i < mixedState.members.length; i++) for (let j = 0; j < i; j++) {
    const a = mixedState.members[i], c = mixedState.members[j];
    assert.ok(Math.hypot(a.goal.x - c.goal.x, a.goal.y - c.goal.y) >= a.unit.combatProfile.radius + c.unit.combatProfile.radius,
      'assigned bodies do not overlap');
  }
  const b = make(team, { seljuk_hassa: 24 }, { roman: 24 }, 'alp_arslan'); tick(b);
  assert.ok(b.tactics.armies.has('own'));
  assert.ok(!b.tactics.formations.armies.has('own'), 'historical formation owns its army');
  const ordinary = make(team); tick(ordinary);
  for (let i = 0; i < 180; i++) ordinary.step(1 / 30);
  const opening = ordinary.tactics.formations.armies.get('own');
  assert.notEqual(opening.phase, 'assemble', 'prepared ranks advance instead of waiting in deployment');
  for (let i = 0; i < 1800 && opening.phase !== 'done'; i++) ordinary.step(1 / 30);
  assert.equal(opening.phase, 'done', 'bounded advance eventually releases to combat');
}
console.log('PASS historical formation priority and bounded release to ordinary combat');

// Mirroring an army must mirror its assignment, not reverse spawn order into
// long crossing paths. Large cavalry wedges must not be silently omitted.
for (const count of [24, 240]) {
  const mirrored = [];
  for (const team of [0, 1]) {
    const b = new Battle({ seed: 42, expandedMap: true, armyConfigs: [
      { id: 'own', team, roster: { roman: count / 2, achaemenid_archer: count / 4, seljuk_hassa: count / 4 }, commanderId: 'julius_caesar' },
      { id: 'enemy', team: 1 - team, roster: { roman: count } },
    ] });
    tick(b);
    const s = b.tactics.formations.armies.get('own');
    assert.equal(s.members.length, count, 'all three troop groups receive slots at large sizes');
    assert.equal(s.groups.length, 3);
    const units = b.units.filter(u => u.armyId === 'own' && !u.commanderId);
    const goals = new Map(s.members.map(m => [m.unit.id, m.goal]));
    mirrored.push(units.map(u => goals.get(u.id)));
    for (let i = 0; i < s.members.length; i++) for (let j = 0; j < i; j++) {
      const a = s.members[i], c = s.members[j];
      assert.ok(Math.hypot(a.goal.x - c.goal.x, a.goal.y - c.goal.y) >= a.unit.combatProfile.radius + c.unit.combatProfile.radius,
        'large mixed formation has no overlapping assigned bodies');
    }
    assert.ok(s.assembleLimit >= 5 && s.assembleLimit <= 25, 'wider wings get a bounded physical assembly budget');
    assert.equal(s.phase, 'advance', 'automatic opening is already assembled');
    // Exercise a stalled reassembly explicitly; automatic spawn no longer
    // spends the opening seconds walking to its first formation.
    s.phase = 'assemble';
    b.time = s.started + s.assembleLimit - 1e-9;
    b.tactics.formations.update(b, b.units, new Set());
    assert.equal(s.phase, 'done', 'assembly deadline is checked between one-Hz decisions');
    assert.equal(b.tactics.formations.intents.size, 0, 'deadline clears movement intents');
  }
  mirrored[0].forEach((a, i) => {
    const c = mirrored[1][i];
    assert.ok(Math.abs(a.x + c.x - 600) < 1e-6 && Math.abs(a.y - c.y) < 1e-6, `same slot geometry on both alliances: ${count}/${i} ${JSON.stringify([a,c])}`);
  });
}
console.log('PASS 24/240 mixed troops: mirrored assignment, complete cavalry coverage, no overlap, exact deployment deadline');
