import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Battle } from '../src/crown-battle.js';

// Fixed seeds exercise crowded fire lanes and successive cavalry contacts.
// Wall time is headless simulation CPU evidence, not browser frame rate.
const results = [];
for (const size of [12, 48, 120]) for (const seed of [19, 71, 137]) {
  const army = { sword: size, pike: size, archer: size, cavalry: size };
  const b = new Battle({ seed, armies: [army, army], expandedMap: true });
  const start = performance.now();
  while (b.time < 180 && b.winner === null) b.step(1 / 30);
  assert.notEqual(b.winner, null, `${size * 8} soldiers, seed ${seed}: battle must finish`);
  assert(b.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite)));
  assert(b.counts().some(n => n === 0), 'finish must be an elimination, not a timeout');
  assert((b.stats.friendlyProjectileHits || 0) <= (b.stats.projectileHits || 0));
  results.push({ soldiers: size * 8, seed, time: +b.time.toFixed(2), winner: b.winner,
    survivors: b.counts(), shots: b.stats.arrows, hits: b.stats.projectileHits || 0,
    friendlyHits: b.stats.friendlyProjectileHits || 0, heldShots: b.stats.heldShots || 0,
    headlessWallMs: Math.round(performance.now() - start) });
}
const files = ['src/crown-battle.js', 'src/crown-battle-contact.js', 'src/crown-battle-projectiles.js', 'src/crown-battle-npc-routing.js'];
const hashes = Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')]));
mkdirSync('artifacts/physical-simulation', { recursive: true });
writeFileSync('artifacts/physical-simulation/stress.json', JSON.stringify({ hashes, results }, null, 2));
console.log(`PASS physical stress: ${results.length} seeded battles, 96/384/960 soldiers; all finish by elimination, finite positions; ${Math.max(...results.map(r => r.time)).toFixed(1)}s longest simulated battle`);
