import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { HistoricalTactics } from '../src/historical-tactics.js';

const make = (team = 0, seed = 42) => new Battle({ seed, expandedMap: true,
  commanders: team ? [null, 'alp_arslan'] : ['alp_arslan', null],
  historicalArmies: team ? [{ roman: 24 }, { seljuk_hassa: 24 }] : [{ seljuk_hassa: 24 }, { roman: 24 }] });
const advance = (b, seconds, until = () => false) => {
  for (let i = 0; i < seconds * 30 && b.winner === null && !until(); i++) b.step(1 / 30);
};
const phases = (b, team = 0) => b.tactics.teams[team]?.history.map(h => h.phase);
const projection = (p, state) => p.x * state.forward.x + p.y * state.forward.y;

for (const team of [0, 1]) {
  const b = make(team), initial = b.units.map(u => [u.x, u.y, u.headingX, u.headingY]);
  b.tactics.update(b, b.units);
  assert.equal(b.tactics.initialized, false);
  assert.deepEqual(b.units.map(u => [u.x, u.y, u.headingX, u.headingY]), initial);
  advance(b, 12, () => b.tactics.teams[team]?.phase === 'retreat');
  const state = b.tactics.teams[team];
  assert.equal(state?.phase, 'retreat');
  const bait = state.members.filter(m => m.role === 'bait');
  const before = bait.map(m => projection(m.unit, state));
  advance(b, 12, () => state.phase !== 'retreat');
  assert.equal(state.phase, 'envelop');
  assert.ok(bait.reduce((sum, m, i) => sum + before[i] - projection(m.unit, state), 0) / bait.length >= 25,
    'The bait physically retreats, rather than only changing a phase label');
  const wings = state.members.filter(m => m.role !== 'bait');
  const wingBefore = wings.map(m => ({ x: m.unit.x, y: m.unit.y }));
  advance(b, 4);
  assert.ok(wings.some((m, i) => Math.hypot(m.unit.x - wingBefore[i].x, m.unit.y - wingBefore[i].y) > 20));
  advance(b, 180);
  assert.notEqual(b.winner, null);
  assert.deepEqual(phases(b, team), ['assemble', 'retreat', 'envelop', 'charge', 'done']);
}
console.log('PASS mirrored actual retreat, pursuit, wing movement, bounded battle');

{
  const b = make(); b.setActiveTeam(1); b.select('all'); b.stopSelected();
  advance(b, 25);
  assert.deepEqual(phases(b), ['assemble', 'regroup', 'done']);
  assert.equal(b.tactics.stats.envelopments, 0);
  assert.match(b.tactics.teams[0].reason, /takibe gelmedi/);
}
console.log('PASS a stationary opponent does not trigger envelopment');

for (const order of ['move', 'hold', 'attack', 'engage']) {
  const b = make(); advance(b, 12, () => b.tactics.teams[0]?.phase === 'retreat');
  const u = b.tactics.teams[0].members.find(m => m.role === 'bait').unit;
  b.selected = new Set([u.id]);
  const target = b.units.find(v => v.team === 1);
  if (order === 'move') b.moveSelected(310, 800);
  if (order === 'hold') b.stopSelected();
  if (order === 'attack') b.attackSelected(target.id);
  if (order === 'engage') b.engageSelected();
  assert.equal(b.tactics.steer(b, u, target, 1 / 30), false);
  advance(b, .7);
  if (order === 'engage') assert.ok(u.tacticalOverride);
  else assert.equal(u.order.kind, order);
  if (order === 'attack') assert.equal(u.target, target);
  assert.equal(b.tactics.intents.has(u.id), false);
}
console.log('PASS move, hold, attack and free-attack immediately override tactics');

{
  const b = make(); advance(b, 1);
  b.select('all'); b.stopSelected(); advance(b, 1);
  assert.equal(b.tactics.teams[0].phase, 'done');
  assert.equal(b.tactics.intents.size, 0);
  const small = new Battle({ commanders: ['alp_arslan', null], historicalArmies: [{ seljuk_hassa: 6 }, { roman: 6 }] });
  const unsupported = new Battle({ commanders: ['alp_arslan', null], historicalArmies: [{ kipchak_lancer: 24 }, { roman: 24 }] });
  const edge = make(); edge.units.filter(u => !u.team).forEach(u => { u.x = edge.bounds.left + 10; });
  const fort = make(); fort.navigation = {};
  for (const candidate of [small, unsupported, edge]) { advance(candidate, 1); assert.equal(candidate.tactics.teams[0], null); }
  fort.time = .1; fort.tactics.update(fort, fort.units); assert.equal(fort.tactics.teams[0], null);
  assert.equal(new Battle().tactics, null);
  assert.equal(new Battle({ historicalArmies: [{ seljuk_hassa: 24 }, { roman: 24 }], tacticalAI: false }).tactics, null);
}
console.log('PASS cancellation, insufficient force/space, unsupported units, fortress and classic isolation');

{
  const results = [];
  for (let run = 0; run < 2; run++) {
    const b = make(); advance(b, 180);
    results.push([b.winner, b.time, b.tactics.teams[0].history, b.units.map(u => [u.x, u.y, u.hp])]);
  }
  assert.deepEqual(results[0], results[1]);
  const source = make(); source.step(1 / 30);
  // Thousands of soldiers: audit director work separately from combat/rendering.
  const units = Array.from({ length: 4000 }, (_, i) => ({ ...source.units[i % source.units.length], id: i + 1,
    team: i % 2, type: i % 2 ? 'roman' : 'seljuk_hassa', x: i % 2 ? 420 : 180, y: 450 + i % 7 }));
  const director = new HistoricalTactics();
  const battle = { time: .1, bounds: source.bounds, commanders: source.commanders, log() {} };
  director.update(battle, units);
  assert.ok(director.stats.scanned <= units.length * 3);
  for (let i = 0; i < 10; i++) { battle.time += .03; director.update(battle, units); }
  assert.equal(director.stats.decisions, 1);
}
console.log('PASS deterministic replay and bounded, twice-per-second linear army decisions');
