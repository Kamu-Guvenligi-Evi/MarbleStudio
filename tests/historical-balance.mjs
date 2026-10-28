import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import catalogue from '../src/historical-catalogue.js';
import { HISTORICAL_TYPES } from '../src/historical-combat.js';
import { Battle } from '../src/crown-battle.js';

const humans = catalogue.filter(u => !u.id.startsWith('me_') && !u.id.startsWith('myth_'));
const seeds = [5, 39, 1066];
const cases = [];
function add(id, count, opponent, enemyCount, purpose) {
  cases.push({ id, count, opponent, enemyCount, purpose });
}
for (const u of humans) {
  const c = HISTORICAL_TYPES[u.id];
  const opponent = c.role === 'cavalry' ? (c.ranged ? 'kipchak' : 'knight')
    : c.role === 'archer' ? 'ottoman_solak' : c.role === 'pike' ? 'persian' : 'roman';
  add(u.id, c.role === 'elephant' ? 1 : 12, opponent, 12, 'peer');
  if (c.role === 'cavalry') add(u.id, 12, c.ranged ? 'english_cheshire_guard' : 'spartan', c.ranged ? 12 : 18, 'counter');
  else if (c.role === 'archer') add(u.id, 12, 'ottoman_sipah', 12, 'counter');
  else if (c.role === 'pike') add(u.id, 18, 'ottoman_sipah', 12, 'anti-cavalry');
  else if (c.role === 'elephant') add(u.id, 1, 'janissary', 12, 'counter');
  else add(u.id, 12, 'roman', 18, 'outnumbered');
}
for (const id of ['england_housecarl', 'gaelic_gallowglass', 'german_armoured_foot'])
  add(id, 12, 'varangian', 12, 'heavy-peer');
for (const id of ['parthian_cataphract', 'sasanian_aswaran', 'templar_knight', 'hospitaller_knight', 'teutonic_knight'])
  add(id, 12, 'ottoman_sipah', 12, 'light-cavalry');
function fight(c, seed, swap) {
  const armies = [{ [c.id]: c.count }, { [c.opponent]: c.enemyCount }];
  const b = new Battle({ seed, historicalArmies: swap ? armies.reverse() : armies });
  for (let i = 0; i < 30 * 240 && b.winner === null; i++) b.step(1 / 30);
  const team = swap ? 1 : 0;
  return { win: b.winner === team, timeout: b.winner === null, time: +b.time.toFixed(1),
    hp: +b.units.filter(u => u.team === team).reduce((s, u) => s + Math.max(0, u.hp), 0).toFixed(1),
    enemyHp: +b.units.filter(u => u.team !== team).reduce((s, u) => s + Math.max(0, u.hp), 0).toFixed(1),
    counters: b.stats.pikeCounters, arrows: b.stats.arrows };
}
const results = cases.map(c => {
  const runs = seeds.flatMap(seed => [false, true].map(swap => ({ seed, swap, ...fight(c, seed, swap) })));
  return { ...c, wins: runs.filter(r => r.win).length, timeouts: runs.filter(r => r.timeout).length,
    remainingFraction: +(runs.reduce((s, r) => s + r.hp, 0) / runs.length / (c.count * HISTORICAL_TYPES[c.id].hp)).toFixed(3), runs };
});
mkdirSync('artifacts/historical-balance', { recursive: true });
const baseline = process.argv.includes('--baseline');
writeFileSync(`artifacts/historical-balance/${baseline ? 'before' : 'after'}.json`, JSON.stringify({ seeds, step: 1 / 30, limit: 240,
  stats: Object.fromEntries(humans.map(u => [u.id, HISTORICAL_TYPES[u.id]])), results }, null, 2));
for (const r of results) console.log(`${r.id} ${r.purpose} / ${r.opponent}: ${r.wins}/6, HP ${r.remainingFraction}, timeouts ${r.timeouts}`);
assert.ok(results.every(r => r.timeouts === 0), 'All tested battles finish');
if (!baseline) {
  const match = (id, purpose) => results.find(r => r.id === id && r.purpose === purpose);
  const enemyFraction = r => r.runs.reduce((s, x) => s + x.enemyHp, 0) / r.runs.length / (r.enemyCount * HISTORICAL_TYPES[r.opponent].hp);
  for (const u of humans) {
    const cfg = HISTORICAL_TYPES[u.id];
    if ((cfg.role === 'cavalry' && !cfg.ranged) || cfg.role === 'archer' || cfg.role === 'elephant')
      assert.equal(match(u.id, 'counter').wins, 0, `${u.id} retains its tested counter`);
    if (cfg.role === 'pike') {
      const r = match(u.id, 'anti-cavalry');
      // Langxian is the formation's entangling support weapon, not a dedicated
      // cavalry-stopping pike. Do not inflate its damage to force a clean sweep.
      if (u.id === 'ming_langxian') {
        assert.ok(cfg.damage < HISTORICAL_TYPES.swiss_pikeman.damage, 'Support weapon retains lower direct damage');
        assert.ok(r.wins >= 4, 'Supported by numerical advantage, langxian can contest cavalry');
      } else assert.equal(r.wins, 6, `${u.id} can stop a smaller cavalry force`);
      assert.ok(r.runs.every(x => x.counters > 0), 'Actual pike counters occur');
    }
    if (cfg.role === 'sword') assert.equal(match(u.id, 'outnumbered').wins, 0, `${u.id} cannot ignore 50% more heavy infantry`);
  }
  for (const id of ['england_housecarl', 'gaelic_gallowglass', 'german_armoured_foot']) {
    const r = match(id, 'peer');
    assert.equal(r.wins, 6, `${id} benefits from its heavy equipment`);
    assert.ok(r.remainingFraction < .6, `${id} still takes substantial losses`);
    const heavy = match(id, 'heavy-peer');
    assert.ok(heavy.wins < 6 && enemyFraction(heavy) < .4, `${id} competes with heavy infantry without dominating`);
  }
  assert.ok(enemyFraction(match('rome_praetorian', 'peer')) < .15, 'Shielded Roman troops remain comparable');
  for (const id of ['parthian_cataphract', 'sasanian_aswaran', 'templar_knight', 'hospitaller_knight', 'teutonic_knight']) {
    const r = match(id, 'light-cavalry');
    assert.equal(r.wins, 6, `${id} gains a heavy armour advantage`);
    assert.ok(r.remainingFraction < .5, `${id} wins with a health cost`);
    assert.ok(match(id, 'peer').wins < 6 && enemyFraction(match(id, 'peer')) < .3, `${id} competes with plate cavalry without dominating`);
  }
  for (const c of [cases[0], cases[4], cases[8]]) assert.deepEqual(fight(c, 39, false), fight(c, 39, false), 'Seeded fights repeat');
}
console.log(`PASS historical balance: ${humans.length} types, ${results.length * 6} battles`);
