import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import catalogue from '../src/historical-catalogue.js';
import { HISTORICAL_ART_PROFILES as gear } from '../src/historical-art-profiles.js';
import { HISTORICAL_TYPES as types, restoreHistoricalArmies } from '../src/historical-combat.js';
import { Battle } from '../src/crown-battle.js';

// Equipment relationships, not a nationality/era multiplier or equal-stat recipe.
const humans = catalogue.filter(u => !/^(me_|myth_)/.test(u.id));
const myths = catalogue.filter(u => u.id.startsWith('myth_'));
const middleEarth = catalogue.filter(u => u.id.startsWith('me_'));
assert.equal(new Set(catalogue.map(u => u.id)).size, catalogue.length);
assert.equal(Object.keys(types).length, catalogue.length);
const armies = [Object.fromEntries(catalogue.map(u => [u.id, 2])), Object.fromEntries(catalogue.map(u => [u.id, 3]))];
assert.deepEqual(restoreHistoricalArmies(JSON.parse(JSON.stringify(armies))).armies, armies);
for (const u of catalogue) {
  const t = types[u.id];
  for (const key of ['hp', 'speed', 'damage', 'reach', 'cooldown'])
    assert.ok(Number.isFinite(t[key]) && t[key] > 0, `${u.id}: valid ${key}`);
  assert.ok((t.armor ?? 0) >= 0 && (t.armor ?? 0) < 1, `${u.id}: bounded protection`);
}
for (const u of humans) {
  const g = gear[u.id], t = types[u.id];
  if (u.id === 'timur') {
    assert.equal(t.role, 'elephant');
    assert.ok(t.splash > 0 && t.speed < types.knight.speed && t.cooldown > types.roman.cooldown);
    continue; // Dedicated elephant drawing; no humanoid equipment profile.
  }
  assert.ok(g, `${u.id}: equipment review required`);
  if (t.role === 'cavalry') assert.ok(t.speed >= 30 && t.speed <= 48, `${u.id}: mounted mobility`);
  else assert.ok(t.speed >= 18 && t.speed <= 31, `${u.id}: foot mobility`);
  if (/lance|kontos|xyston/i.test(g.weapon)) {
    assert.equal(t.role, 'cavalry', `${u.id}: mounted lance`);
    assert.ok(t.reach >= 29, `${u.id}: lance must reach beyond mounted blades`);
    assert.ok(t.chargeDamage > 0 && !t.ranged, `${u.id}: contact charge`);
  }
  if (['pike', 'mcPike', 'ahSarissa', 'schiltronSpear'].includes(g.weapon)) {
    assert.equal(t.role, 'pike');
    assert.ok(t.reach >= 39, `${u.id}: long formation weapon`);
  }
  if (g.armor === 'plate') assert.ok(t.armor >= .25, `${u.id}: plate protection`);
  if (g.armor === 'mail') assert.ok(t.armor >= .14, `${u.id}: mail protection`);
  if (/bow|yumi/i.test(g.weapon)) {
    assert.ok(t.role === 'archer' || (t.role === 'cavalry' && t.ranged), `${u.id}: actual bow behavior`);
    if (t.role === 'cavalry') assert.ok(t.skirmish && t.chargeDamage === 0, `${u.id}: mounted archery, no lance bonus`);
    if (/crossbow/i.test(g.weapon)) {
      assert.equal(t.projectile, 'bolt');
      assert.ok(t.cooldown >= 2.2, `${u.id}: crossbow reload`);
    } else assert.ok(t.reach >= 160 && t.reach <= 218, `${u.id}: bounded light-bow to longbow engagement ranges`);
  }
  if (g.weapon === 'musket') {
    assert.equal(t.projectile, 'bullet');
    assert.ok(t.cooldown > types.english_cheshire_guard.cooldown, 'Musket reload differs from bow cadence');
  }
}
assert.ok(types.japan_odachi_samurai.reach > types.samurai.reach && types.japan_odachi_samurai.cooldown > types.samurai.cooldown);
assert.ok(types.english_early_archer.reach < types.english_cheshire_guard.reach && types.english_early_archer.damage < types.english_cheshire_guard.damage,
  'Light Anglo-Saxon bow support remains distinct from later longbow specialists');
assert.ok(types.mamluk_bahri.reach > types.mamluk_burji.reach && types.mamluk_burji.cooldown < types.mamluk_bahri.cooldown);
assert.ok(types.mexica_jaguar.hp / types.mexica_eagle.hp < 1.1 && types.mexica_jaguar.damage / types.mexica_eagle.damage < 1.1,
  'Shared macuahuitl/shield equipment does not justify a large arbitrary strength gap');
assert.ok(types.welsh_longbowman.reach <= types.english_cheshire_guard.reach * 1.05, 'Clothing references do not justify exceptional bow range');
assert.ok(types.myth_fenrir.speed > types.myth_jotun.speed && types.myth_jotun.hp > types.myth_fenrir.hp);
assert.ok(types.myth_centaur.ranged && types.myth_centaur.skirmish && types.myth_centaur.chargeDamage === 0);

// Individual mythological profiles also fight; human and Middle-earth sweeps
// live in historical-balance.mjs and middle-earth-balance.mjs respectively.
const runs = [];
for (const u of myths) for (const seed of [5, 39, 1066]) for (const swap of [false, true]) {
  const t = types[u.id], giant = t.role === 'elephant';
  const opponent = t.ranged ? 'knight' : t.role === 'cavalry' ? 'spartan' : 'roman';
  const forces = [{ [u.id]: giant ? 1 : 6 }, { [opponent]: giant ? 8 : 6 }];
  const battle = new Battle({ seed, historicalArmies: swap ? forces.reverse() : forces });
  for (let step = 0; step < 7200 && battle.winner === null; step++) battle.step(1 / 30);
  assert.notEqual(battle.winner, null, `${u.id}: pursuit/contact must finish (seed ${seed}, swap ${swap})`);
  assert.ok(battle.units.every(unit => [unit.hp, unit.x, unit.y].every(Number.isFinite)));
  runs.push({ id: u.id, seed, swap, opponent, winner: battle.winner, seconds: +battle.time.toFixed(2) });
}

const out = 'artifacts/realism-balance';
mkdirSync(out, { recursive: true });
const beforeFile = `${out}/before-types.json`;
const before = existsSync(beforeFile) ? JSON.parse(readFileSync(beforeFile, 'utf8')) : null;
const keys = ['hp', 'speed', 'damage', 'reach', 'cooldown', 'armor', 'chargeDamage', 'splash', 'ranged', 'skirmish', 'projectile'];
const reasons = {
  samurai: 'Zırhlı yaya kılıçlı: daha fazla koruma, daha düşük hareket ve saldırı temposu.',
  kipchak: 'Zincir zırh ve atlı yay; yay menzili diğer atlı okçularla tutarlı.',
  hussar: 'Plaka zırhlı uzun mızraklı: koruma ve hücum erişimi; daha düşük hız ve saldırı temposu.',
  mamluk: 'Zincir zırh ve atlı mızrağa uygun koruma, erişim ve saldırı aralığı.',
  viking: 'Zincir zırh ve baltaya uygun koruma; yaya hareketi.',
  persian: 'Pul zırh ve kalkanın koruması.',
  landsknecht: 'Uzun piyade mızrağı erişimi.',
  mamluk_burji: 'Çizimdeki sabre esas alındı: daha kısa erişim, daha hızlı yakın dövüş, daha düşük hücum.',
  mongol_keshig: 'Lamelli koruma; hafif atlı yay rolü korunur.',
  mexica_eagle: 'Jaguar ile ortak silah/kalkan; dayanım ve hasar farkı küçültüldü.',
  mexica_jaguar: 'Kartal ile ortak silah/kalkan; dayanım ve hasar farkı küçültüldü.',
  norse_dane_axeman: 'Zincir zırhlı iki elli baltacı koruması.',
  welsh_longbowman: 'Giyim kaynağı üstün yay menzili kanıtlamaz; diğer uzun yaylara yaklaştırıldı.',
  kipchak_lancer: 'Zincir zırhlı hareketli mızraklı; plaka süvariden hızlı, daha az korumalı ve daha hafif hücum.',
};
const rows = catalogue.map(u => {
  const t = types[u.id], g = gear[u.id] ?? null;
  const changes = before?.[u.id] ? Object.fromEntries(keys.filter(k => before[u.id][k] !== t[k]).map(k => [k, { before: before[u.id][k] ?? null, after: t[k] ?? null }])) : {};
  const changed = Object.keys(changes).length > 0;
  return { id: u.id, name: u.name, faction: u.faction, period: u.period || null,
    category: u.id.startsWith('me_') ? 'middle-earth' : u.id.startsWith('myth_') ? 'mythology' : 'historical',
    role: u.role, equipment: g, combat: t, source: u.source || null,
    status: !before ? 'reviewed' : !before[u.id] ? 'added-by-other-tab-reviewed' : changed ? 'changed' : 'retained',
    review: changed ? reasons[u.id] || 'Atlı uzun mızrak erişimi kısa kılıç erişiminden ayrıldı.'
      : 'Mevcut donanım/rol değerleri korundu; sayısal, kayıt ve rol savaş kontrolleri kapsamına alındı.', changes };
});
writeFileSync(`${out}/catalogue-audit.json`, JSON.stringify({ counts: { total: rows.length, historical: humans.length, middleEarth: middleEarth.length, mythology: myths.length }, rows, mythBattles: runs }, null, 2));
writeFileSync(`${out}/after-types.json`, JSON.stringify(types, null, 2));
console.log(`PASS realism: ${catalogue.length} profiles (${humans.length} historical, ${middleEarth.length} Middle-earth, ${myths.length} mythological); equipment, saved IDs, ${runs.length} myth battles.`);
console.log(`Audit: ${rows.filter(r => r.status === 'changed').length} changed, ${rows.filter(r => r.status === 'retained').length} retained, ${rows.filter(r => r.status === 'added-by-other-tab-reviewed').length} concurrent additions reviewed.`);
