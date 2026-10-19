import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

for (const type of ['janissary', 'timur']) {
  const b = new Battle({ historicalArmies: [{ [type]: 1 }, { roman: 1 }] });
  const [a, z] = b.units;
  Object.assign(a, { x: 250, y: 400, cooldown: 100, order: { kind: 'hold' } });
  Object.assign(z, { x: type === 'janissary' ? 350 : 270, y: 400, hp: 1e7, maxHp: 1e7, cooldown: 100, order: { kind: 'hold' } });
  b.step(1 / 30);
  for (let i = 0; i < 240; i++) b.resolveAttack(a, z, type === 'janissary');
  assert.equal(b.effects.length, 96, `${type} burst shares the 96-effect budget`);
  if (type === 'janissary') {
    assert.equal(b.projectiles.length, 240, 'Cosmetic budget never drops projectiles');
    let hits = 0; b.onCombatEvent = e => { if (e.kind === 'hit') hits++; };
    for (let i = 0; i < 30; i++) b.step(1 / 30);
    assert.equal(hits, 240, 'Every shot still resolves damage');
  } else {
    assert.equal(b.stats.stomps, 240, 'Every area attack still resolves');
    assert(z.hp < z.maxHp);
    for (let i = 0; i < 30; i++) b.step(1 / 30);
  }
  assert.equal(b.effects.length, 0, 'Effects expire after the burst');
}
console.log('PASS gun/elephant bursts: bounded cosmetic effects, all 240 projectiles/hits retained, expiry');
