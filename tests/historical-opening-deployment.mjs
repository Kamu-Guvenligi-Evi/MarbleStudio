import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { CIVILIZATION_DOCTRINES } from '../src/historical-civilization-tactics.js';
import commanders from '../src/historical-commanders.json' with { type: 'json' };

const make = (roster, enemy, team = 0, commanderId = 'julius_caesar', options = {}) => new Battle({
  seed: 42, expandedMap: true, armyConfigs: [
    { id: 'own', team, roster, commanderId },
    { id: 'enemy', team: 1 - team, roster: enemy },
  ], ...options,
});
const scenarios = [
  ['brace', { egypt_new_spearman: 24, roman: 16, achaemenid_archer: 8 }, { seljuk_hassa: 32 }],
  ['close', { roman: 32, seljuk_hassa: 16 }, { achaemenid_archer: 32 }],
  ['flank', { roman: 24, seljuk_hassa: 24 }, { landsknecht: 32 }],
  ['skirmish', { seljuk_turkmen_archer: 32, seljuk_hassa: 8 }, { roman: 32 }],
  ['balanced', { roman: 32, achaemenid_archer: 8 }, { roman: 32 }],
];
function checkOpening(b, id = 'own') {
  const opening = b.openingDeployments.get(id);
  assert.ok(opening, `opening exists: ${id}`);
  const { state: s, kind } = opening;
  for (const m of s.members) {
    const goal = kind === 'formation' ? m.goal : kind === 'civilization'
      ? b.tactics.civilizations.point(s, m.f, m.a)
      : b.tactics.point(s, (m.role === 'bait' ? 85 : 15) + m.depth,
        m.role === 'bait' ? m.offset : (m.role === 'left' ? -1 : 1) * s.spread + m.offset);
    assert.ok(Math.hypot(m.unit.x - goal.x, m.unit.y - goal.y) < 1e-7, 'soldier starts in its actual tactical slot');
  }
  for (let i = 0; i < b.units.length; i++) for (let j = i + 1; j < b.units.length; j++) {
    const u = b.units[i], v = b.units[j];
    assert.ok(Math.hypot(u.x - v.x, u.y - v.y) >= u.combatProfile.radius + v.combatProfile.radius,
      `bodies overlap: ${u.type}/${v.type}`);
  }
  const before = b.units.map(u => [u.x, u.y]);
  b.time = .1; b.tactics.update(b, b.units);
  const director = kind === 'formation' ? b.tactics.formations : kind === 'civilization' ? b.tactics.civilizations : b.tactics;
  assert.equal(director.armies.get(id), s, 'first order adopts the exact initial plan');
  // Seljuk bait deliberately waits for actual pursuit even when wings are ready.
  if (kind !== 'seljuk') assert.notEqual(s.phase, 'assemble', 'ready army does not waste time assembling');
  assert.notEqual(s.phase, 'done', 'opening remains active');
  assert.deepEqual(b.units.map(u => [u.x, u.y]), before, 'issuing the first order never teleports soldiers');
  for (const m of s.members) assert.ok(b.tactics.coordination.contains(id, m.unit, m.unit.combatProfile.radius));
  return opening;
}
for (const [kind, roster, enemy] of scenarios) for (const team of [0, 1]) {
  const b = make(roster, enemy, team);
  const opening = b.openingDeployments.get('own');
  assert.equal(opening.strategy.kind, kind);
  if (kind === 'brace') {
    const front = opening.state.sections.find(s => s.duty === 'spear-front');
    const support = opening.state.sections.find(s => s.duty === 'infantry-support');
    assert.ok(front && support && front.rear > support.front, 'spears physically precede infantry support');
  }
  checkOpening(b);
}
console.log('PASS five opponent responses, both sides, exact starting ranks and immediate first orders');

for (const profile of CIVILIZATION_DOCTRINES) for (const team of [0, 1]) {
  const commander = commanders.find(c => c.doctrineIds?.includes(profile.id));
  const roster = Object.fromEntries(Object.entries(profile.required).map(([role, n]) =>
    [Object.keys(profile.roles).find(id => profile.roles[id] === role), Math.max(6, n)]));
  const b = make(roster, { roman: 48 }, team, commander.id);
  assert.equal(b.openingDeployments.get('own')?.kind, 'civilization', profile.id);
  checkOpening(b);
}
for (const team of [0, 1]) checkOpening(make({ seljuk_turkmen_archer: 24, seljuk_hassa: 24, roman: 8 }, { roman: 48 }, team, 'alp_arslan'));
console.log('PASS ten historical doctrines and Seljuk wings, mirrored sides, distinct support files');

const mixed = make({ roman: 24, egypt_new_chariot: 8, qin_war_chariot: 8, timur: 4,
  seljuk_turkmen_archer: 12, seljuk_hassa: 12 }, { roman: 48 });
assert.equal(mixed.openingDeployments.get('own').positions.length, 68);
checkOpening(mixed);
for (const change of ['manual', 'moved', 'commander', 'added']) {
  const b = make({ roman: 24 }, { roman: 24 }), cached = b.openingDeployments.get('own').state;
  const u = cached.members[0].unit;
  if (change === 'manual') for (const m of cached.members) m.unit.tacticalOverride = true;
  if (change === 'moved') u.x -= 100;
  if (change === 'commander') cached.commander.hp = 0;
  if (change === 'added') b.units.push({ ...u, id: 999999 });
  b.time = .1; b.tactics.update(b, b.units);
  assert.notEqual(b.tactics.formations.armies.get('own'), cached, `${change} invalidates cached orders`);
}
for (const options of [{ tacticalAI: false }, { mapId: 'fortress' }]) {
  const b = make({ roman: 24 }, { roman: 24 }, 0, 'julius_caesar', options);
  assert.ok(!b.openingDeployments?.size, 'opening does not override disabled AI or a siege');
}
for (const roster of [{}, { roman: 4 }]) {
  const b = make(roster, {}, 0, 'julius_caesar', { allowEmpty: true });
  assert.ok(b.units.every(u => Number.isFinite(u.x + u.y)), 'empty armies stay finite');
}
console.log('PASS chariots/elephants/mounted archers, manual edits, commander loss, changed roster and empty armies');

const allied = new Battle({ expandedMap: true, armyConfigs: Array.from({ length: 6 }, (_, i) => ({
  id: `army-${i}`, team: i % 2, commanderId: i % 2 ? 'julius_caesar' : 'alp_arslan',
  roster: i % 2 ? { roman: 48, achaemenid_archer: 8 } : { seljuk_turkmen_archer: 24, seljuk_hassa: 24 },
})) });
for (const [id, opening] of allied.openingDeployments) {
  assert.equal(opening.kind, opening.state.team ? 'formation' : 'seljuk');
}
allied.time = .1; allied.tactics.update(allied, allied.units);
for (const [id, opening] of allied.openingDeployments) {
  const s = opening.state;
  for (const { unit } of opening.positions) assert.ok(allied.tactics.coordination.contains(id, unit, unit.combatProfile.radius));
  if (opening.kind === 'seljuk') for (const across of [-s.spread - 60, s.spread + 60]) {
    assert.ok(allied.tactics.coordination.contains(id, allied.tactics.point(s, 0, across)), 'allied wing has maneuver space');
  }
}
for (let i = 0; i < 150; i++) allied.step(1 / 30);
assert.ok(allied.units.every(u => Number.isFinite(u.x + u.y)));
assert.equal(allied.tactics.coordination.fallback.size, 0, 'no opening abandoned for lack of allied maneuver space');
console.log('PASS six allied armies keep separate tactical sectors and Seljuk maneuver envelopes');
