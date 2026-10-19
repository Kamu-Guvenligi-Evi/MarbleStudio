import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { activeCommander, commanderSupportsDoctrine } from '../src/historical-commander-tactics.js';

const make = (commanders = ['alp_arslan', null], mirrored = false) => new Battle({
  seed: 42, commanders, expandedMap: true,
  historicalArmies: [{ seljuk_hassa: 24 }, mirrored ? { seljuk_hassa: 24 } : { roman: 24 }],
});
const tick = b => { b.time += 1 / 30; b.tactics.update(b, b.units.filter(u => u.hp > 0 && !u.removed)); };

for (const commanders of [null, [null, null], ['invalid', null], ['mehmed_ii', null], [null, 'alp_arslan']]) {
  const b = make(commanders); tick(b);
  assert.equal(b.tactics.teams[0], null, 'Only an appropriate commander on the same team can start the plan');
  assert.equal(b.tactics.intents.size, 0);
  const initial = b.units.filter(u => !u.commanderId).map(u => [u.x, u.y]);
  for (let i = 0; i < 60; i++) b.step(1 / 30);
  assert.ok(b.units.filter(u => !u.commanderId).some((u, i) => Math.hypot(u.x - initial[i][0], u.y - initial[i][1]) > 5),
    'Normal unit combat still works without an army doctrine');
}
console.log('PASS absent, invalid, wrong-period/state and enemy commanders do not enable Seljuk tactics; ordinary combat continues');

for (const change of ['dead', 'removed', 'wrong-team', 'wrong-type', 'missing']) {
  const b = make(), leader = b.commanders[0];
  if (change === 'dead') leader.hp = 0;
  if (change === 'removed') leader.removed = true;
  if (change === 'wrong-team') leader.team = 1;
  if (change === 'wrong-type') leader.type = 'seljuk_hassa';
  if (change === 'missing') { b.commanders[0] = null; b.armyCommanders.delete('army-0'); }
  assert.equal(activeCommander(b, 0), null);
  assert.equal(commanderSupportsDoctrine(b, 0, 'TR_SELJUK'), false);
  tick(b); assert.equal(b.tactics.teams[0], null);
}
console.log('PASS invalid/dead/removed commander identities are rejected');

for (const team of [0, 1]) for (const phase of ['assemble', 'retreat', 'envelop', 'charge', 'regroup']) for (const loss of ['death', 'removal']) {
  const b = make(['alp_arslan', 'alp_arslan'], true);
  // The real director assigns members/intents; isolate interruption in each phase
  // from pursuit timing, which historical-tactics.mjs exercises end to end.
  tick(b);
  const state = b.tactics.teams[team], other = b.tactics.teams[1 - team];
  assert.ok(state && other);
  state.phase = phase;
  const member = state.members[0].unit, target = other.members[0].unit;
  assert.ok(b.tactics.intents.has(member.id));
  if (loss === 'death') b.hit(b.commanders[team], 10000);
  else { b.setActiveTeam(team); b.selected = new Set([b.commanders[team].id]); b.removeSelected(); }
  assert.equal(b.tactics.steer(b, member, target, 1 / 30), false, 'No stale steering even before the next director update');
  const decisions = b.tactics.stats.decisions;
  tick(b);
  assert.equal(b.tactics.stats.decisions, decisions, 'Loss handling does not force a full army rescan');
  assert.equal(state.phase, 'done');
  assert.match(state.reason, /komutan/);
  assert.ok(state.members.every(m => !b.tactics.intents.has(m.unit.id)));
  assert.notEqual(other.phase, 'done', 'The opposing commander remains independent');
  assert.ok(other.members.some(m => b.tactics.intents.has(m.unit.id)));
  const historyLength = state.history.length;
  tick(b); assert.equal(state.history.length, historyLength, 'Cancellation is recorded only once');
}
console.log('PASS both teams, all five active phases: immediate death/removal cancellation between decisions, no cross-team cancellation');

{
  const b = make(); b.commanders[0].order = { kind: 'hold' }; tick(b);
  assert.equal(b.tactics.teams[0]?.phase, 'assemble', 'A living commander can command while holding position');
  assert.equal(commanderSupportsDoctrine(b, 0, 'CN_QIN'), false);
  assert.equal(new Battle({ commanders: ['alp_arslan', 'alp_arslan'] }).tactics, null);
}
console.log('PASS explicit doctrine matching, commander hold and classic isolation');

{
  const b = make();
  for (let i = 0; i < 450 && b.tactics.teams[0]?.phase !== 'retreat'; i++) b.step(1 / 30);
  assert.equal(b.tactics.teams[0]?.phase, 'retreat');
  b.hit(b.commanders[0], 10000);
  b.step(1 / 30);
  assert.equal(b.tactics.teams[0].phase, 'done');
  assert.equal(b.tactics.intents.size, 0);
  for (let i = 0; i < 5400 && b.winner === null; i++) b.step(1 / 30);
  assert.notEqual(b.winner, null, 'Actual battle still resolves after commander loss mid-retreat');
}
console.log('PASS end-to-end commander loss during actual retreat and bounded battle completion');
