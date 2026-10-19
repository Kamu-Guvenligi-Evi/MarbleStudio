import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import catalogue from '../src/historical-catalogue.js';
import { Battle } from '../src/crown-battle.js';
import { createHistoricalTypes, HISTORICAL_TYPES as types, restoreHistoricalArmies } from '../src/historical-combat.js';
import { HISTORICAL_EQUIPMENT_BALANCE as reviewed } from '../src/historical-equipment-balance.js';

const combatKeys = ['hp', 'speed', 'damage', 'reach', 'cooldown', 'armor', 'chargeDamage', 'splash', 'ranged', 'skirmish', 'projectile'];
const defaults = [];
const profiles = new Map();
for (const unit of catalogue) {
  const cfg = types[unit.id];
  const signature = JSON.stringify([cfg.role, ...combatKeys.map(key => cfg[key] ?? null)]);
  assert.ok(!profiles.has(signature), `${unit.id} duplicates every combat trait of ${profiles.get(signature)}`);
  profiles.set(signature, unit.id);
  const generic = createHistoricalTypes([{ ...unit, id: 'audit_generic', combat: undefined }]).audit_generic;
  if (combatKeys.every(key => cfg[key] === generic[key])) defaults.push(unit.id);
  for (const key of ['hp', 'speed', 'damage', 'reach', 'cooldown'])
    assert.ok(Number.isFinite(cfg[key]) && cfg[key] > 0, `${unit.id}: usable ${key}`);
  assert.ok((cfg.armor ?? 0) >= 0 && (cfg.armor ?? 0) < 1, `${unit.id}: bounded armour`);
}
assert.deepEqual(defaults, [], 'Existing catalogue entries must not silently use a generic role profile');
// Related equipment must offer a real choice, with a strength AND a weakness.
// These are gameplay identities, not assertions about historical populations.
const endurance = cfg => cfg.hp / (1 - (cfg.armor ?? 0));
for (const [mobile, heavy] of [['mongol_keshig', 'ilkhan_keshikten'], ['mexica_eagle', 'mexica_jaguar']]) {
  const a = types[mobile], b = types[heavy];
  assert.equal(a.role, b.role, 'Shared equipment retains its established role');
  assert.ok(a.speed > b.speed && a.cooldown < b.cooldown, `${mobile}: mobility and tempo advantage`);
  assert.ok(a.damage < b.damage && endurance(a) < endurance(b), `${heavy}: impact and endurance advantage`);
}
assert.ok(types.mamluk_bahri.chargeDamage > types.mamluk_burji.chargeDamage, 'Bahri trades protection for charge');
assert.ok(types.mamluk_bahri.reach > types.mamluk_burji.reach, 'A lance out-reaches the represented Burji sabre');
assert.ok(types.mamluk_burji.cooldown < types.mamluk_bahri.cooldown, 'The sabre recovers faster in sustained close combat');
const orders = ['templar_knight', 'hospitaller_knight', 'teutonic_knight'];
for (const id of orders.slice(1)) {
  assert.ok(types.templar_knight.speed > types[id].speed && types.templar_knight.chargeDamage > types[id].chargeDamage, 'Templar charge specialization');
  assert.ok(endurance(types.templar_knight) < endurance(types[id]), 'Charge specialization costs endurance');
}
for (const id of ['templar_knight', 'teutonic_knight'])
  assert.ok(endurance(types.hospitaller_knight) > endurance(types[id]), 'Hospitalier endurance specialization');
for (const id of orders.slice(0, 2))
  assert.ok(types.teutonic_knight.damage > types[id].damage && types.teutonic_knight.cooldown > types[id].cooldown, 'Teutonic heavy blow has slower recovery');
const armies = [Object.fromEntries(catalogue.map(u => [u.id, 2])), Object.fromEntries(catalogue.map(u => [u.id, 3]))];
assert.deepEqual(restoreHistoricalArmies(JSON.parse(JSON.stringify(armies))).armies, armies, 'Both saved armies retain every current unit ID/count');
const custom = { ...catalogue.find(u => u.id === 'ottoman_sipah'), combat: { hp: 173 } };
assert.equal(createHistoricalTypes([custom]).ottoman_sipah.hp, 173, 'Explicit catalogue equipment overrides reviewed legacy defaults');
assert.ok(createHistoricalTypes([{ ...custom, id: 'future_unit', combat: undefined }]).future_unit.hp > 0, 'Future additions still have a playable fallback');

const seeds = [5, 39, 1066];
const cases = [];
for (const id of Object.keys(reviewed)) {
  const c = types[id];
  if (c.role === 'cavalry' && !c.ranged) cases.push({ id, count: 24, enemy: 'spartan', enemyCount: 36, purpose: 'pike-counter', expectedWins: 0 });
  else if (c.role === 'pike') cases.push({ id, count: 36, enemy: 'ottoman_sipah', enemyCount: 24, purpose: 'stop-charge', expectedWins: 6 });
  else if (c.role === 'archer') cases.push({ id, count: 24, enemy: 'ottoman_sipah', enemyCount: 24, purpose: 'mounted-pursuit', expectedWins: 0 });
  else if (c.ranged) {
    cases.push({ id, count: 24, enemy: 'english_cheshire_guard', enemyCount: 24, purpose: 'ranged-peer' });
    cases.push({ id, count: 12, enemy: 'roman', enemyCount: 12, purpose: 'bounded-chase' });
  } else cases.push({ id, count: 24, enemy: 'roman', enemyCount: 36, purpose: 'numerical-counter', expectedWins: 0 });
}
for (const id of orders)
  cases.push({ id, count: 24, enemy: 'spartan', enemyCount: 36, purpose: 'pike-counter', expectedWins: 0 });
for (const [id, enemy] of [['mamluk_bahri', 'mamluk_burji'], ['mongol_keshig', 'ilkhan_keshikten'], ['mexica_eagle', 'mexica_jaguar'], ['templar_knight', 'hospitaller_knight'], ['hospitaller_knight', 'teutonic_knight'], ['teutonic_knight', 'templar_knight']])
  cases.push({ id, count: 12, enemy, enemyCount: 12, purpose: 'specialized-peer' });
function fight(c, seed, swap) {
  const armies = [{ [c.id]: c.count }, { [c.enemy]: c.enemyCount }];
  const b = new Battle({ seed, historicalArmies: swap ? armies.reverse() : armies });
  for (let tick = 0; tick < 30 * 240 && b.winner === null; tick++) b.step(1 / 30);
  const team = swap ? 1 : 0;
  assert.ok(b.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite)), 'Finite combat state');
  return { win: b.winner === team, timeout: b.winner === null, seconds: +b.time.toFixed(2),
    hp: +b.units.filter(u => u.team === team).reduce((s, u) => s + Math.max(0, u.hp), 0).toFixed(2),
    counters: b.stats.pikeCounters, arrows: b.stats.arrows };
}
const results = cases.map(c => {
  const runs = seeds.flatMap(seed => [false, true].map(swap => ({ seed, swap, ...fight(c, seed, swap) })));
  return { ...c, wins: runs.filter(r => r.win).length, runs };
});
mkdirSync('artifacts/equipment-balance', { recursive: true });
writeFileSync('artifacts/equipment-balance/regression.json', JSON.stringify({ catalogueSize: catalogue.length, seeds, step: 1 / 30, limitSeconds: 240, results }, null, 2));
for (const r of results) {
  assert.ok(r.runs.every(x => !x.timeout), `${r.id}/${r.purpose}: combat finishes`);
  if (r.expectedWins !== undefined) assert.equal(r.wins, r.expectedWins, `${r.id}/${r.purpose}: counter survives larger formations`);
  if (r.purpose === 'pike-counter' || r.purpose === 'stop-charge') assert.ok(r.runs.every(x => x.counters > 0), `${r.id}: actual directional pike counters`);
  if (types[r.id].ranged) assert.ok(r.runs.every(x => x.arrows > 0), `${r.id}: mounted archers actually fire`);
}
assert.deepEqual(fight(cases[0], 39, false), fight(cases[0], 39, false), 'Seeded outcomes repeat');
console.log(`PASS equipment balance: ${catalogue.length} distinct profiles, no generic leftovers, specialization tradeoffs, saved armies preserved, ${results.length * 6} mirrored battles without timeouts.`);
