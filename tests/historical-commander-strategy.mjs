import assert from 'node:assert/strict';
import test from 'node:test';
import { Battle } from '../src/crown-battle.js';
import { selectBattlePlan } from '../src/historical-commander-strategy.js';
import { armyTacticalLabel } from '../src/crown-battle-tactical-visuals.js';
import { commanderDeployment } from '../src/historical-commander-deployment.js';

const make = (roster, enemy, team = 0, commanderId = 'julius_caesar') => {
  const b = new Battle({ seed: 42, expandedMap: true, armyConfigs: [
    { id: 'own', team, roster, commanderId }, { id: 'enemy', team: 1 - team, roster: enemy },
  ] });
  b.bounds = { left: -1500, right: 1500, top: -1000, bottom: 1000 };
  for (const id of ['own', 'enemy']) b.units.filter(u => u.armyId === id).forEach((u, i) => {
    u.x = id === 'own' ? -600 : 600; u.y = (i % 8 - 3.5) * 16;
  });
  return b;
};
const units = (b, id) => b.units.filter(u => u.armyId === id && !u.commanderId && u.hp > 0);
const tick = (b, time) => { b.time = time; b.tactics.update(b, b.units.filter(u => u.hp > 0)); };
const scenarios = [
  ['brace', { egypt_new_spearman: 24, roman: 16, achaemenid_archer: 8 }, { seljuk_hassa: 32 }],
  ['close', { roman: 32, seljuk_hassa: 16 }, { achaemenid_archer: 32 }],
  ['flank', { roman: 24, seljuk_hassa: 24 }, { landsknecht: 32 }],
  ['skirmish', { seljuk_turkmen_archer: 32, seljuk_hassa: 8 }, { roman: 32 }],
  ['balanced', { roman: 32, achaemenid_archer: 8 }, { roman: 32 }],
];
for (const [kind, roster, enemy] of scenarios) for (const team of [0, 1]) test(`${kind}, alliance ${team}: actual plan and movement goals`, () => {
  const b = make(roster, enemy, team); tick(b, .1);
  const s = b.tactics.formations.armies.get('own');
  assert.ok(s); assert.equal(s.strategy.kind, kind); assert.equal(s.members.length, units(b, 'own').length);
  assert.ok(armyTacticalLabel(b, 'own').includes(s.strategy.label));
  if (kind === 'brace') {
    const spears = s.sections.find(x => x.duty === 'spear-front');
    assert.ok(spears); assert.ok(s.sections.find(x => x.duty === 'infantry-support').front < spears.rear);
    s.members.forEach(m => Object.assign(m.unit, m.goal)); tick(b, 1.1);
    assert.equal(s.holding, true); assert.equal(s.advance, 0);
    tick(b, 7.1); assert.ok(s.advance > 0, 'defence has a bounded wait, not a permanent stalemate');
  }
  if (kind === 'close') assert.equal(s.sections.find(x => x.duty === 'line').kind, 'loose');
  if (kind === 'flank') {
    const wing = s.members.filter(m => m.flanking); assert.ok(wing.length);
    assert.ok(wing.every(m => Math.abs(m.a) > s.strategy.enemy.width + 45));
    const foot = s.members.find(m => m.role === 'front'), target = units(b, 'enemy')[0];
    target.x = foot.unit.x + 1; target.y = foot.unit.y;
    assert.equal(b.tactics.formations.steer(b, foot.unit, target, 1 / 30), false);
    assert.equal(foot.engaged, true); assert.notEqual(s.phase, 'done', 'centre contact does not cancel the moving flank');
  }
});

test('same mixed army changes formation for cavalry versus missile opponents', () => {
  const roster = { egypt_new_spearman: 24, roman: 16, achaemenid_archer: 8 };
  const cavalry = make(roster, { seljuk_hassa: 32 }), archers = make(roster, { achaemenid_archer: 32 });
  tick(cavalry, .1); tick(archers, .1);
  const a = cavalry.tactics.formations.armies.get('own'), c = archers.tactics.formations.armies.get('own');
  assert.notEqual(a.strategy.kind, c.strategy.kind);
  assert.notDeepEqual(a.members.map(m => m.goal), c.members.map(m => m.goal));
});

test('no cavalry or pikes are invented to answer a threat', () => {
  const b = make({ roman: 24 }, { seljuk_hassa: 32 }); tick(b, .1);
  assert.equal(b.tactics.strategy.plans.get('own').kind, 'balanced');
  assert.ok(b.tactics.formations.armies.get('own').members.every(m => m.unit.type === 'roman'));
});

test('no commander, death, navigation and manual orders never retain AI authority', () => {
  const absent = make({ roman: 24 }, { achaemenid_archer: 24 }, 0, null); tick(absent, .1);
  assert.equal(absent.tactics.strategy.plans.has('own'), false); assert.equal(absent.tactics.formations.armies.has('own'), false);
  const b = make({ roman: 24 }, { achaemenid_archer: 24 });
  const manual = units(b, 'own')[0]; manual.order = { kind: 'hold', x: manual.x, y: manual.y };
  tick(b, .1); assert.ok(!b.tactics.formations.armies.get('own').members.some(m => m.unit === manual));
  b.armyCommanders.get('own').hp = 0; tick(b, .11);
  assert.equal(b.tactics.strategy.plans.has('own'), false); assert.equal(b.tactics.formations.intents.size, 0);
  const walls = make({ roman: 24 }, { roman: 24 }); walls.navigation = {}; tick(walls, .1);
  assert.equal(walls.tactics.strategy.plans.size, 0); assert.equal(walls.tactics.formations.armies.size, 0);
});

test('sustained enemy losses trigger one safe re-formation; transient changes do not', () => {
  const b = make({ roman: 24, seljuk_hassa: 24 }, { landsknecht: 24, achaemenid_archer: 24 }); tick(b, .1);
  const s = b.tactics.formations.armies.get('own'); assert.equal(s.strategy.kind, 'close');
  for (const u of units(b, 'enemy').filter(u => u.combatProfile.ranged)) u.hp = 0;
  tick(b, 1.1); tick(b, 2.1); assert.equal(s.strategy.kind, 'close');
  tick(b, 4.1); assert.equal(s.strategy.kind, 'flank'); assert.equal(s.replans, 1);
  tick(b, 5.1); assert.equal(s.replans, 1);
});

test('blocked flank is replaced with a fitted frontage, never clamped into allied troops', () => {
  const b = make({ roman: 24, seljuk_hassa: 24 }, { landsknecht: 32 });
  const own = units(b, 'own'), enemy = units(b, 'enemy');
  const strategy = selectBattlePlan(own, enemy, { origin: { x: -600, y: 0 }, forward: { x: 1, y: 0 }, side: { x: 0, y: 1 } });
  strategy.enemy.width = 900;
  const plan = b.tactics.formations.deployment(b, 'own', own, enemy, strategy);
  assert.equal(plan.strategy.kind, 'balanced'); assert.ok(plan.members.every(m => !m.flanking));
});

test('all four headings keep an adaptive spear line in front and distinct bodies', () => {
  const b = make(scenarios[0][1], scenarios[0][2]); tick(b, .1);
  for (const direction of [0, 90, 180, 270]) {
    const p = commanderDeployment(units(b, 'own'), { x: 0, y: 0 }, direction, b.bounds, false, b.tactics.strategy.plans.get('own'));
    assert.ok(p);
    for (let i = 0; i < p.members.length; i++) for (let j = 0; j < i; j++) {
      const a = p.members[i].goal, c = p.members[j].goal;
      assert.ok(Math.hypot(a.x - c.x, a.y - c.y) >= a.radius + c.radius - 1e-7);
    }
  }
});

test('shieldwall doctrine keeps command and advances against a distant missile army', () => {
  const b = make({ england_housecarl: 24 }, { achaemenid_archer: 32 }, 0, 'harold_godwinson');
  tick(b, .1);
  const d = b.tactics.civilizations, s = d.armies.get('own');
  assert.ok(s, 'historical shieldwall is retained');
  assert.equal(b.tactics.strategy.plans.get('own').kind, 'close');
  for (const m of s.members) Object.assign(m.unit, d.point(s, m.f, m.a));
  tick(b, 1.1); assert.equal(s.phase, 'hold');
  tick(b, 3.1); assert.equal(s.phase, 'execute'); assert.ok(s.advance > 0);
});
