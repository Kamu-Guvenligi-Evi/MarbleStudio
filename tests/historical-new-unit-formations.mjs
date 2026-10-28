import assert from 'node:assert/strict';
import test from 'node:test';
import { Battle } from '../src/crown-battle.js';
import { ARMY_PRESETS, createCommanderArmy, presetMinimum } from '../src/historical-army-presets.js';
import { commanderDeployment } from '../src/historical-commander-deployment.js';
import { compactDeployment } from '../src/historical-compact-deployment.js';
import { deploymentCorps, attachDeploymentSupports } from '../src/historical-deployment-corps.js';
import { CivilizationTactics, CIVILIZATION_DOCTRINES } from '../src/historical-civilization-tactics.js';
import leaders from '../src/historical-commanders.json' with { type: 'json' };

const make = (roster, commanderId = 'julius_caesar', team = 0) => new Battle({ seed: 42, expandedMap: true, armyConfigs: [
  { id: 'own', team, roster, commanderId }, { id: 'enemy', team: 1 - team, roster: { roman: 24 } },
] });
const own = b => b.units.filter(u => u.armyId === 'own' && !u.commanderId);
function complete(plan, units, point = m => m.goal) {
  assert.equal(plan.members.length, units.length);
  assert.equal(new Set(plan.members.map(m => m.unit.id)).size, units.length);
  for (let i = 0; i < plan.members.length; i++) for (let j = 0; j < i; j++) {
    const a = plan.members[i], c = plan.members[j], p = point(a), q = point(c);
    assert.ok(Math.hypot(p.x - q.x, p.y - q.y) + 1e-7 >= a.unit.combatProfile.radius + c.unit.combatProfile.radius,
      `${a.unit.type}/${c.unit.type} overlap`);
  }
}

for (const [id, preset] of Object.entries(ARMY_PRESETS)) test(`${id}: all corps at minimum, 96 and 240, four directions`, () => {
  for (const size of [presetMinimum(preset), 96, 240]) {
    const b = make(createCommanderArmy(id, size), id), units = own(b);
    for (const direction of [0, 90, 180, 270]) {
      const bounds = { left: -1800, right: 1800, top: -1800, bottom: 1800 };
      const plan = commanderDeployment(units, { x: 0, y: 0 }, direction, bounds, false);
      assert.ok(plan); complete(plan, units);
      for (const m of plan.members) {
        const corps = deploymentCorps(m.unit);
        if (corps === 'chariot') assert.match(m.duty, /^chariot-/);
        if (corps === 'skirmisher') assert.match(m.duty, /^skirmisher-/);
        if (corps === 'light-horse') assert.match(m.duty, /^light-cavalry-/);
        if (corps === 'escort') assert.match(m.duty, /^cavalry-support-/);
        if (corps === 'pike') assert.equal(m.duty, 'pike-center');
        if (corps === 'infantry') assert.notEqual(m.duty, 'pike-center');
      }
    }
  }
});

test('core-only armies retain finite body extents without auxiliary soldiers', () => {
  const units = own(make({ roman: 12 }));
  const state = { members: units.map((unit, i) => ({ unit, f: 0, a: i * 20 })) };
  attachDeploymentSupports(state, units);
  assert.ok(state.members.every(m => Number.isFinite(m.f - m.radius) && m.radius === m.unit.combatProfile.radius));
});

for (const profile of CIVILIZATION_DOCTRINES) test(`${profile.id}: new auxiliaries and cell remainders join doctrine without overlap`, () => {
  const commander = leaders.find(c => c.doctrineIds.includes(profile.id)).id;
  for (const size of [96, 241]) {
    const units = own(make(createCommanderArmy(commander, size), commander));
    const state = { profile, members: [], origin: { x: 0, y: 0 }, forward: { x: 1, y: 0 }, side: { x: 0, y: 1 } };
    new CivilizationTactics().layout(state, units.filter(u => profile.roles[u.type]));
    const core = new Map(state.members.map(m => [m.unit.id, { f: m.f, a: m.a, role: m.role }]));
    attachDeploymentSupports(state, units); complete(state, units, m => ({ x: m.f, y: m.a }));
    for (const m of state.members) {
      if (core.has(m.unit.id)) {
        const previous = core.get(m.unit.id);
        if (m.duty === 'akinci-screen') {
          // Adding the foot screen can move scouts forward, but must preserve
          // their flank and role and keep every scout ahead of the screen.
          assert.equal(m.a, previous.a); assert.equal(m.role, previous.role);
          assert.ok(m.f >= previous.f);
          const foot = state.members.filter(p => p.duty === 'infantry-center' || p.duty === 'pike-center');
          if (foot.length) assert.ok(m.f - m.radius + 1e-7 >= Math.max(...foot.map(p => p.f + p.radius)) + 22);
        } else assert.deepEqual({ f: m.f, a: m.a, role: m.role }, previous);
      }
      else { assert.equal(m.auxiliary, true); assert.equal(m.role, 'auxiliary'); }
    }
  }
});

test('compact ranks preserve separate chariots, horse, pikes and missiles in every direction', () => {
  const units = own(make({ roman: 20, landsknecht: 12, egypt_new_chariot: 4, qin_war_chariot: 4,
    caesar_germanic_light_infantry: 6, agrianian_javelineer: 8, seljuk_hassa: 8, achaemenid_archer: 8 }));
  for (const direction of [0, 90, 180, 270]) {
    const bounds = direction % 180 === 0 ? { left: -1200, right: 1200, top: -30, bottom: 300 }
      : { left: -110, right: 110, top: -1200, bottom: 1200 };
    const plan = compactDeployment(units, { x: 0, y: 0 }, direction, bounds);
    assert.ok(plan); complete(plan, units);
    const ranks = new Map();
    for (const m of plan.members) {
      const f = m.goal.x * plan.forward.x + m.goal.y * plan.forward.y;
      if (!ranks.has(f)) ranks.set(f, new Set());
      ranks.get(f).add(deploymentCorps(m.unit));
    }
    assert.ok([...ranks.values()].every(r => r.size === 1));
  }
});

test('custom Tang and Mughal troops receive equipment-based roles without invented preset associations', () => {
  const units = own(make({ tang_crossbowman: 8, mughal_shamsherbaz: 8, japan_naginata_foot: 8, ayyubid_foot_spearman: 8 }));
  const plan = commanderDeployment(units, { x: 300, y: 500 }, 0, { left: -1000, right: 1000, top: -1000, bottom: 1000 }, false);
  complete(plan, units);
  assert.equal(deploymentCorps(units.find(u => u.type === 'tang_crossbowman')), 'missile');
  assert.ok(units.filter(u => u.type !== 'tang_crossbowman').every(u => deploymentCorps(u) === 'infantry'));
});
