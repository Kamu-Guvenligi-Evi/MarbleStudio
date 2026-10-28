import assert from 'node:assert/strict';
import test from 'node:test';
import { Battle } from '../src/crown-battle.js';
import { commanderDeployment } from '../src/historical-commander-deployment.js';
import { CivilizationTactics, CIVILIZATION_DOCTRINES } from '../src/historical-civilization-tactics.js';
import leaders from '../src/historical-commanders.json' with { type: 'json' };
import { armyTacticalLabel } from '../src/crown-battle-tactical-visuals.js';

const make = (roster, team = 0) => new Battle({ seed: 42, expandedMap: true, armyConfigs: [
  { id: 'own', team, roster, commanderId: 'julius_caesar' },
  { id: 'enemy', team: 1 - team, roster: { roman: 24 } },
] });
const soldiers = b => b.units.filter(u => u.armyId === 'own' && !u.commanderId);
function separated(members, point) {
  for (let i = 0; i < members.length; i++) for (let j = 0; j < i; j++) {
    const a = members[i], c = members[j], pa = point(a), pc = point(c);
    assert.ok(Math.hypot(pa.x - pc.x, pa.y - pc.y) + 1e-7 >= a.unit.combatProfile.radius + c.unit.combatProfile.radius,
      `${a.unit.type}/${a.role} and ${c.unit.type}/${c.role} have overlapping bodies`);
  }
}
const roster = { roman: 60, landsknecht: 36, achaemenid_archer: 24, seljuk_hassa: 24, seljuk_turkmen_archer: 12, timur: 4 };
for (const direction of [0, 90, 180, 270]) for (const edge of [false, true]) test(`combined arms ${direction}, edge=${edge}`, () => {
  const b = make(roster), units = soldiers(b);
  const origin = edge ? { x: b.bounds.right - 5, y: b.bounds.top + 5 } : { x: 300, y: 480 };
  const plan = commanderDeployment(units, origin, direction, b.bounds, false);
  assert.ok(plan); assert.equal(plan.members.length, units.length);
  assert.equal(new Set(plan.members.map(m => m.unit.id)).size, units.length);
  separated(plan.members, m => m.goal);
  for (const m of plan.members) {
    assert.ok(m.goal.x - m.radius >= b.bounds.left + 45 - 1e-7 && m.goal.x + m.radius <= b.bounds.right - 45 + 1e-7);
    assert.ok(m.goal.y - m.radius >= b.bounds.top + 115 - 1e-7 && m.goal.y + m.radius <= b.bounds.bottom - 95 + 1e-7);
    if (m.unit.type === 'seljuk_turkmen_archer') assert.ok(m.duty.startsWith('mounted-'), 'mounted archers have their own screen');
  }
  const section = duty => plan.sections.find(s => s.duty === duty);
  const front = plan.sections.filter(s => s.role === 'front' && s.duty !== 'reserve');
  assert.ok(section('pike-center'));
  assert.ok(section('reserve').front < Math.min(...front.map(s => s.rear)), 'reserve behind the fighting line');
  assert.ok(section('missile-left').right < Math.min(...front.map(s => s.left)), 'left battery has an open firing lane');
  assert.ok(section('missile-right').left > Math.max(...front.map(s => s.right)), 'right battery has an open firing lane');
  assert.ok(section('cavalry-left').right < section('missile-left').left);
  assert.ok(section('cavalry-right').left > section('missile-right').right);
  assert.ok(section('mounted-left').right < section('cavalry-left').left);
  assert.ok(section('mounted-right').left > section('cavalry-right').right);
});

for (const profile of CIVILIZATION_DOCTRINES) for (const size of [96, 240]) test(`${profile.id} rank clearance at ${size}`, () => {
  const total = Object.values(profile.required).reduce((sum, n) => sum + n, 0);
  const roster = Object.fromEntries(Object.entries(profile.required).map(([role, n]) => [
    Object.keys(profile.roles).find(type => profile.roles[type] === role), Math.ceil(size * n / total),
  ]));
  if (profile.kind === 'pikes') { roster.german_halberdier = size / 4; roster.german_pavise_crossbowman = size / 4; }
  const state = { profile, members: [], origin: { x: 0, y: 0 }, forward: { x: 1, y: 0 }, side: { x: 0, y: 1 } };
  new CivilizationTactics().layout(state, soldiers(make(roster)));
  separated(state.members, m => ({ x: m.f, y: m.a }));
});

for (const team of [0, 1]) test(`coherent advance and authority, alliance ${team}`, () => {
  const b = make({ roman: 24, achaemenid_archer: 12, seljuk_hassa: 12 }, team);
  const d = b.tactics.formations, tick = seconds => { b.time += seconds; d.update(b, b.units, new Set()); };
  tick(.1); const s = d.armies.get('own');
  for (const m of s.members) Object.assign(m.unit, { x: m.goal.x, y: m.goal.y });
  const before = s.members.map(m => ({ ...m.goal }));
  tick(1); assert.equal(s.phase, 'advance'); assert.ok(s.advance > 0);
  assert.ok(armyTacticalLabel(b, 'own'), 'marching remains visible in the tactical label');
  s.members.forEach((m, i) => {
    assert.ok(Math.abs(m.goal.x - before[i].x - s.forward.x * s.advance) < 1e-6);
    assert.ok(Math.abs(m.goal.y - before[i].y - s.forward.y * s.advance) < 1e-6);
  });
  const bow = s.members.find(m => m.role === 'bow').unit, enemy = b.units.find(u => u.armyId === 'enemy');
  enemy.x = bow.x + bow.combatProfile.config.reach - 1; enemy.y = bow.y;
  assert.equal(d.steer(b, bow, enemy, 1 / 30), false, 'shooting is allowed');
  assert.equal(s.phase, 'advance', 'one archer firing does not dissolve the line');
  const foot = s.members.find(m => m.role === 'front').unit;
  foot.order = { kind: 'hold', x: foot.x, y: foot.y };
  assert.equal(d.steer(b, foot, enemy, 1 / 30), false, 'player order wins');
  foot.order = null;
  enemy.x = foot.x + 1; enemy.y = foot.y;
  assert.equal(d.steer(b, foot, enemy, 1 / 30), false);
  assert.equal(s.phase, 'done', 'melee contact releases the army');
  assert.equal(d.intents.size, 0);
});

test('blocked advance releases within a bounded interval', () => {
  const b = make({ roman: 24 }), d = b.tactics.formations;
  b.time = .1; d.update(b, b.units, new Set()); const s = d.armies.get('own');
  s.members.forEach(m => Object.assign(m.unit, { x: m.goal.x, y: m.goal.y }));
  b.time += 1; d.update(b, b.units, new Set()); assert.equal(s.phase, 'advance');
  s.members.forEach(m => { m.unit.x -= s.forward.x * 100; });
  b.time += 8; d.update(b, b.units, new Set()); assert.equal(s.phase, 'done');
  assert.equal(d.intents.size, 0);
});

for (const team of [0, 1]) test(`yari missile withdrawal keeps distinct ranks, alliance ${team}`, () => {
  const b = new Battle({ seed: 42, expandedMap: true, armyConfigs: [
    { id: 'own', team, commanderId: leaders.find(l => l.doctrineIds.includes('JP_INFANTRY')).id,
      roster: { japan_yari_ashigaru: 48, japan_yumi_ashigaru: 48 } },
    { id: 'enemy', team: 1 - team, roster: { roman: 48 } },
  ] });
  b.time = .1; b.tactics.update(b, b.units);
  const d = b.tactics.civilizations, s = d.armies.get('own');
  s.members.forEach(m => Object.assign(m.unit, d.point(s, m.f, m.a)));
  b.units.filter(u => u.armyId === 'enemy').forEach((u, i) => Object.assign(u, d.point(s, 110, (i - 24) * 5)));
  b.time += .5; b.tactics.update(b, b.units);
  assert.equal(s.phase, 'execute');
  const bows = s.members.filter(m => m.role === 'bow');
  assert.ok(bows.every(m => d.intents.get(m.unit.id)?.retreat), 'withdrawal orders are active');
  separated(bows, m => m.goal);
  for (const side of [-1, 1]) assert.ok(new Set(bows.filter(m => Math.sign(m.a) === side).map(m => m.goal.x)).size > 1,
    'each battery keeps its depth instead of collapsing into one row');
});
