import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Battle } from '../src/crown-battle.js';
import leaders from '../src/historical-commanders.json' with { type: 'json' };
import { CIVILIZATION_DOCTRINES as profiles } from '../src/historical-civilization-tactics.js';

const results = [];
const doctrineRoster = (profile, size) => {
  const required = Object.values(profile.required).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(profile.required).map(([role, n]) => [
    Object.keys(profile.roles).find(k => profile.roles[k] === role), Math.ceil(size * n / required),
  ]));
};
const make = (commanderId, roster, team, size = 96) => new Battle({ seed: 42, expandedMap: true, armyConfigs: [
  { id: 'own', team, commanderId, roster }, { id: 'enemy', team: 1 - team, roster: { roman: size } },
] });
for (const profile of profiles) for (const size of [96, 240]) for (const team of [0, 1]) {
  const roster = doctrineRoster(profile, size);
  const commanderId = leaders.find(l => l.doctrineIds.includes(profile.id)).id;
  const b = new Battle({ seed: 42, expandedMap: true, armyConfigs: [
    { id: 'own', team, commanderId, roster },
    { id: 'enemy', team: 1 - team, roster: { roman: size } },
  ] });
  let firstHit = null, assembled;
  const director = b.tactics.civilizations, change = director.change.bind(director);
  director.change = (battle, s, phase, reason) => {
    if (s.armyId === 'own' && s.phase === 'assemble' && phase !== 'assemble') assembled = {
      time: b.time, limit: s.assembleLimit, phase, meleeNearest: s.opponent?.meleeNearest,
      // Cover exchange and yielding to a friendly shot are active deployment
      // responses. Those soldiers are not waiting at an unreachable old slot.
      fraction: s.members.filter(m => m.engaged || m.unit.screening || m.unit.screenYield?.until > b.time
        || Math.hypot(m.unit.x - director.point(s, m.f, m.a).x,
        m.unit.y - director.point(s, m.f, m.a).y) < 35).length / s.members.length,
    };
    return change(battle, s, phase, reason);
  };
  const hit = b.hit.bind(b);
  b.hit = (t, ...args) => { const hp = t.hp, r = hit(t, ...args); if (t.hp < hp) firstHit ??= b.time; return r; };
  for (let i = 0; i < Number(process.env.SECONDS || 600) * 30 && b.winner === null; i++) {
    b.step(1 / 30);
    if (i % 30 === 0) for (const intent of director.intents.values())
      assert.ok(director.inside(b, intent.goal), 'doctrine orders remain within the map');
  }
  const s = b.tactics.civilizations.armies.get('own');
  results.push({ doctrine: profile.id, size, team, firstHit, end: b.time, outcome: b.outcomeReason,
    history: s?.history, advance: s?.advance, assembled });
  console.log(profile.id, size, team, b.outcomeReason, Math.round(b.time), s?.history.map(h => `${h.phase}@${h.time.toFixed(1)}`).join(','));
}
mkdirSync('artifacts/npc-routing', { recursive: true });
writeFileSync(`artifacts/npc-routing/doctrine-spacing-${process.env.REPORT || 'current'}.json`, JSON.stringify(results, null, 2));
if (!process.env.BASELINE) for (const r of results) {
  assert.ok(r.history?.some(h => !['assemble', 'done'].includes(h.phase)), `${r.doctrine}/${r.size}/${r.team}: doctrine gets prepared`);
  assert.equal(r.outcome, 'elimination', `${r.doctrine}/${r.size}/${r.team}: natural ending`);
  assert.ok(r.assembled.time <= r.assembled.limit + .51, 'preparation remains bounded');
  const forcedWithdrawal = r.doctrine === 'CN_QIN' && r.assembled.phase === 'fallback' && r.assembled.meleeNearest < 155;
  assert.ok(r.assembled.fraction >= .6 || forcedWithdrawal, `${r.doctrine}/${r.size}/${r.team}: physical preparation or forced screen withdrawal`);
}

if (!process.env.BASELINE) {
  const generic = leaders.filter(l => !l.doctrineIds.length);
  for (const leader of generic) for (const team of [0, 1]) {
    const b = make(leader.id, { roman: 48, hussar: 24, achaemenid_archer: 24 }, team);
    for (let i = 0; i < 600 * 30 && b.winner === null; i++) b.step(1 / 30);
    const s = b.tactics.formations.armies.get('own');
    assert.equal(s?.phase, 'done', `${leader.id}/${team}: common commander formation finishes`);
    assert.equal(b.outcomeReason, 'elimination', `${leader.id}/${team}: natural ending`);
  }
  // Each commander route respects explicit orders and loses authority on death.
  for (const leader of leaders) for (const team of [0, 1]) {
    const profile = profiles.find(p => leader.doctrineIds.includes(p.id));
    const turan = leader.doctrineIds.includes('TR_SELJUK');
    const roster = profile ? doctrineRoster(profile, 96) : turan
      ? { seljuk_hassa: 64, seljuk_turkmen_archer: 32 } : { roman: 48, hussar: 24, achaemenid_archer: 24 };
    const b = make(leader.id, roster, team);
    b.step(1 / 30);
    const director = profile ? b.tactics.civilizations : turan ? b.tactics : b.tactics.formations;
    const s = director.armies.get('own');
    assert.ok(s, `${leader.id}: initializes its own supported formation`);
    const unit = s.members[0].unit, target = b.units.find(u => u.armyId === 'enemy');
    b.setActiveTeam(team); b.selected = new Set([unit.id]); b.stopSelected();
    assert.equal(b.tactics.steer(b, unit, target, 1 / 30), false, `${leader.id}: explicit hold wins`);
    b.armyCommanders.get('own').hp = 0;
    b.step(1 / 30);
    assert.equal(s.phase, 'done', `${leader.id}: commander loss releases control immediately`);
  }
  // Unmoving soldiers cannot reserve a doctrine forever even with extra space.
  for (const profile of profiles) {
    const leader = leaders.find(l => l.doctrineIds.includes(profile.id));
    const b = make(leader.id, doctrineRoster(profile, 240), 0, 240);
    b.time = .1; b.tactics.update(b, b.units);
    const s = b.tactics.civilizations.armies.get('own');
    assert.ok(s.assembleLimit >= 12 && s.assembleLimit <= 30);
    // Opening deployment now starts in formation. Explicitly displace this
    // synthetic frozen army, so the test still exercises failed assembly.
    b.tactics.civilizations.change(b, s, 'assemble');
    for (const m of s.members) {
      const slot = b.tactics.civilizations.point(s, m.f - 400, m.a);
      m.unit.x = slot.x; m.unit.y = slot.y;
    }
    b.time += s.assembleLimit + .6;
    b.tactics.update(b, b.units);
    assert.equal(s.phase, 'done', `${profile.id}: failed assembly is bounded`);
  }
  console.log(`PASS 40 doctrine battles, ${generic.length * 2} generic commander battles, ${leaders.length * 2} commander/order checks, 10 bounded assembly failures`);
}
