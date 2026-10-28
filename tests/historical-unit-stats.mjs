import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import catalogue from '../src/historical-catalogue.js';
import { HISTORICAL_TYPES as types, createHistoricalTypes, restoreHistoricalArmies } from '../src/historical-combat.js';
import { UNIT_STAT_BALANCE, RETAINED_FANTASY_STATS } from '../src/historical-unit-stat-balance.js';
import { Battle } from '../src/crown-battle.js';

const reviewed = new Set([...Object.keys(UNIT_STAT_BALANCE), ...RETAINED_FANTASY_STATS]);
assert.deepEqual([...reviewed].sort(), catalogue.map(u => u.id).sort(), 'Every current unit receives an explicit review, including concurrent additions');
for (const u of catalogue) {
  const c = types[u.id];
  for (const key of ['hp', 'speed', 'damage', 'reach', 'cooldown']) assert.ok(Number.isFinite(c[key]) && c[key] > 0, `${u.id}/${key}`);
  assert.ok((c.armor ?? 0) >= 0 && (c.armor ?? 0) < .5, `${u.id}: armour cannot confer invulnerability`);
  for (const [key, value] of Object.entries(u.combat ?? {})) assert.equal(c[key], value, `${u.id}: catalogue and simulation agree on ${key}`);
  if (/^(me_|myth_)/.test(u.id)) continue;
  if (u.kind === 'sword' || u.kind === 'spear') assert.ok(c.hp >= 85 && c.hp <= 140, `${u.id}: human endurance, not a second armour multiplier`);
  if (u.kind === 'cavalry') {
    assert.ok(c.speed >= 32 && c.speed <= 48, `${u.id}: mounted movement`);
    if (c.ranged) assert.equal(c.chargeDamage, 0, `${u.id}: archery has no lance impact`);
  }
  if (c.projectile === 'bullet') assert.ok(c.cooldown >= 3 && c.damage >= 35, `${u.id}: early firearm reload/impact tradeoff`);
  if (c.projectile === 'bolt') assert.ok(c.cooldown >= 2.5 && c.damage >= 27, `${u.id}: crossbow reload/impact tradeoff`);
  if (u.kind === 'chariot') assert.ok(c.radius >= 9 && c.ranged && c.chargeDamage === 0, `${u.id}: crewed archery platform`);
}
assert.ok(types.polish_light_cavalry.speed > types.imperial_gothic_knight.speed);
assert.ok(types.ottoman_martolos.speed > types.german_armoured_foot.speed);
assert.ok(types.german_armoured_foot.armor > types.ottoman_martolos.armor);
assert.ok(types.macedon_sarissa_phalangite.reach > types.spartan.reach && types.spartan.reach > types.roman.reach);
assert.ok(types.japan_odachi_samurai.damage > types.samurai.damage && types.japan_odachi_samurai.cooldown > types.samurai.cooldown);
assert.ok(types.janissary.damage > types.ottoman_solak.damage && types.janissary.cooldown > types.ottoman_solak.cooldown);
assert.ok(types.maori_taiaha.reach > types.samurai.reach, 'Long staff retains its reach instead of inheriting sword range');
assert.ok(types.kerma_dagger_warrior.reach < types.samurai.reach, 'Short weapons require closer contact');
assert.ok(types.castilian_jinete.reach > types.polish_light_cavalry.reach, 'Short mounted spear still out-reaches a sabre');
const custom = { ...catalogue.find(u => u.id === 'roman'), combat: { hp: 173, damage: 11 } };
assert.equal(createHistoricalTypes([custom]).roman.hp, 173, 'Explicit scenario overrides retain precedence');
const saved = [Object.fromEntries(catalogue.map(u => [u.id, 1])), { roman: 1 }];
assert.deepEqual(restoreHistoricalArmies(JSON.parse(JSON.stringify(saved))).armies, saved);

function fight(id, count, enemy, enemyCount, seed, swap) {
  const armies = [{ [id]: count }, { [enemy]: enemyCount }];
  const b = new Battle({ historicalArmies: swap ? armies.reverse() : armies, seed });
  for (let n = 0; n < 30 * 240 && b.winner === null; n++) b.step(1 / 30);
  assert.ok(b.units.every(u => [u.hp, u.x, u.y].every(Number.isFinite)), `${id}: finite simulation`);
  return { id, enemy, seed, swap, win: b.winner === (swap ? 1 : 0), timeout: b.winner === null,
    seconds: +b.time.toFixed(2), counters: b.stats.pikeCounters, arrows: b.stats.arrows, shots: b.stats.shots,
    hp: +b.units.filter(u => u.team === (swap ? 1 : 0)).reduce((s, u) => s + u.hp, 0).toFixed(2) };
}
// Two opposing deployments per unit, including every new soldier and creature.
const sweep = catalogue.flatMap(u => {
  const c = types[u.id], big = c.hp >= 300;
  const enemy = c.role === 'cavalry' ? 'spartan' : c.role === 'archer' ? 'ottoman_sipah' : 'roman';
  return [false, true].map(swap => fight(u.id, big ? 1 : 6, enemy, big ? 10 : 6, 39, swap));
});
const matchups = [
  ['swiss_pikeman', 18, 'knight', 12, 'pike-counter'],
  ['landsknecht', 18, 'ottoman_sipah', 12, 'pike-counter'],
  ['knight', 12, 'ottoman_solak', 12, 'cavalry-closes'],
  ['german_armoured_foot', 12, 'ottoman_martolos', 12, 'armoured-infantry'],
  ['mongol', 12, 'english_cheshire_guard', 12, 'horse-bow-vs-foot-bow'],
  ['janissary', 12, 'polish_light_cavalry', 12, 'firearm-reload'],
  ['egypt_new_chariot', 6, 'qin_war_chariot', 6, 'chariot-peer'],
  ['timur', 1, 'janissary', 12, 'elephant-counter'],
];
const matches = matchups.map(([id, count, enemy, enemyCount, purpose]) => {
  const runs = [5, 39, 1066].flatMap(seed => [false, true].map(swap => fight(id, count, enemy, enemyCount, seed, swap)));
  return { id, enemy, purpose, wins: runs.filter(r => r.win).length, runs };
});
mkdirSync('artifacts/unit-stats-2026-10-16', { recursive: true });
writeFileSync('artifacts/unit-stats-2026-10-16/battles.json', JSON.stringify({ catalogueSize: catalogue.length, sweep, matches }, null, 2));
for (const r of matches) console.log(`${r.purpose}: ${r.wins}/6 wins (${r.id})`);
assert.ok([...sweep, ...matches.flatMap(m => m.runs)].every(r => !r.timeout), 'All catalogue and matchup battles finish');
for (const r of matches.filter(r => r.purpose === 'pike-counter')) {
  assert.equal(r.wins, 6, `${r.id}: supported pikes stop frontal cavalry`);
  // Long weapons can kill/disrupt a rider before charge contact; that is also
  // a successful defence. The contact counter must still occur in this set.
  assert.ok(r.runs.some(x => x.counters > 0), 'Frontal charge contact still activates engine counters');
}
for (const purpose of ['cavalry-closes', 'armoured-infantry']) assert.equal(matches.find(m => m.purpose === purpose).wins, 6, purpose);
for (const purpose of ['firearm-reload', 'elephant-counter']) assert.equal(matches.find(m => m.purpose === purpose).wins, 0, purpose);
for (const purpose of ['horse-bow-vs-foot-bow', 'chariot-peer']) {
  const match = matches.find(m => m.purpose === purpose);
  assert.ok(match.runs.every(r => r.arrows > 0), `${purpose}: both ranged roles engage`);
  for (const seed of [5, 39, 1066]) {
    const sides = match.runs.filter(r => r.seed === seed);
    assert.equal(sides[0].win, sides[1].win, `${purpose}: outcome does not depend on deployment side`);
  }
}
assert.deepEqual(fight('knight', 12, 'ottoman_solak', 12, 39, false), fight('knight', 12, 'ottoman_solak', 12, 39, false), 'Seeded outcomes repeat');
console.log(`PASS: ${catalogue.length} reviewed units; ${sweep.length + matches.length * 6 + 2} battles, both sides, deterministic outcomes.`);
