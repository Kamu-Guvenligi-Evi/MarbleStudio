import assert from 'node:assert/strict';
import { Battle, UNIT_TYPES } from '../src/crown-battle.js';
const army = (type, count = 1) => ({ sword: 0, pike: 0, archer: 0, cavalry: 0, [type]: count });
const place = (u, x, y, headingX = 1) => Object.assign(u, {
  x, y, headingX, headingY: 0, cooldown: 100, retarget: 0,
  chargeCooldown: 100, order: { kind: 'hold' },
});

// Crowded contact must beat a free but distant lane, even with target hysteresis.
{
  const b = new Battle({ armies: [army('sword', 7), army('sword', 2)] });
  const allies = b.units.filter(u => !u.team), [front, far] = b.units.filter(u => u.team);
  place(front, 312, 400, -1); place(far, 345, 400, -1);
  allies.forEach((u, i) => { place(u, 300, 400 + i * 12); u.target = front; });
  const a = allies[0]; a.order = null; a.target = far;
  b.step(1 / 30);
  assert.equal(a.target, front);
  b.selected.add(a.id); b.attackSelected(far.id); b.step(1 / 30);
  assert.equal(a.target, far, 'Explicit target retains priority over nearby contact');
  console.log('PASS contact priority with crowd claims; explicit attack preserved');
}

// Shoot right, escape a melee threat on the left. Target and evasion are separate decisions.
for (const type of ['archer', 'mongol']) {
  const b = type === 'mongol'
    ? new Battle({ historicalArmies: [{ mongol: 1 }, { roman: 1, janissary: 1 }] })
    : new Battle({ armies: [army('archer'), { ...army('sword'), archer: 1 }] });
  const a = b.units.find(u => !u.team);
  const threat = b.units.find(u => u.team && ['sword', 'roman'].includes(u.type));
  const target = b.units.find(u => u.team && u !== threat);
  place(a, 300, 400); a.order = null;
  place(threat, 260, 400); place(target, 336, 400, -1); a.target = target;
  b.step(1 / 30);
  assert.equal(a.target, target);
  assert.equal(a.nearbyThreat, threat);
  assert.ok(a.x > 300, `${type} escapes left-side melee while retaining right-side firing target`);
  b.selected.add(a.id); b.stopSelected();
  const stoppedX = a.x; b.step(1 / 30);
  assert.equal(a.x, stoppedX, 'Hold order suppresses autonomous evasion');
  threat.hp = 0; a.order = null; a.retarget = 0; b.step(1 / 30);
  assert.equal(a.nearbyThreat, null, 'Dead threats are cleared');
  console.log(`PASS ${type}: independent evasion threat, hold order, dead-threat cleanup`);
}

// Directional melee advantage is evaluated at impact and still respects armor.
for (const type of ['sword', 'roman']) {
  const damage = [];
  for (const angle of [Math.PI, Math.PI / 2, 0]) {
    const b = type === 'roman'
      ? new Battle({ historicalArmies: [{ roman: 1 }, { roman: 1 }] })
      : new Battle({ armies: [army('sword'), army('sword')] });
    const [a, z] = b.units;
    place(a, 300, 400); place(z, 312, 400);
    z.headingX = Math.cos(angle); z.headingY = Math.sin(angle);
    b.resolveAttack(a, z, false); damage.push(z.maxHp - z.hp);
  }
  const cfg = UNIT_TYPES[type], base = cfg.damage * (1 - (cfg.armor || 0));
  for (const [i, multiplier] of [1, 1.12, 1.25].entries()) {
    assert.ok(Math.abs(damage[i] - base * multiplier) < 1e-8);
  }
  console.log(`PASS ${type}: front/side/rear melee damage and armor`);
}

// A frontal spear stops a charge before it can hit any further sampled soldiers.
{
  const b = new Battle({ armies: [army('cavalry'), { ...army('pike'), sword: 1 }] });
  const a = b.units[0], spear = b.units.find(u => u.type === 'pike'), rear = b.units.find(u => u.team && u.type === 'sword');
  place(a, 270, 400); place(spear, 290, 400, -1); place(rear, 299, 400, -1);
  // Unit iteration order is deliberately explicit to exercise the post-counter early exit.
  b.units = [a, spear, rear]; a.order = null; b.startCharge(a, spear); b.step(1 / 30);
  assert.equal(b.stats.pikeCounters, 1); assert.equal(a.charge, null);
  assert.equal(rear.hp, rear.maxHp);
  console.log('PASS pike counter terminates charge without further hits');
}
