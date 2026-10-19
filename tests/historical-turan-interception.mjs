import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

// A wing intercepted during its march must fight locally. Retreating bait and
// riders opening a charge lane still need to keep moving away from contact.
for (const team of [0, 1]) {
  const armies = [{ roman: 24 }, { roman: 24 }], commanders = [null, null];
  armies[team] = { seljuk_hassa: 16, seljuk_turkmen_archer: 8 };
  commanders[team] = 'alp_arslan';
  const b = new Battle({ seed: 42, expandedMap: true, historicalArmies: armies, commanders });
  b.step(1 / 30);
  const s = b.tactics.teams[team];
  const u = s.members.find(m => m.role === 'left').unit;
  const target = b.units.find(v => v.team !== team && !v.commanderId);
  for (const v of b.units) v.order = { kind: 'hold', x: v.x, y: v.y };
  u.order = null;
  u.x = s.origin.x; u.y = s.origin.y;
  target.x = u.x + s.forward.x * 20; target.y = u.y + s.forward.y * 20;
  target.order = { kind: 'hold', x: target.x, y: target.y };
  u.target = target; u.retarget = 100; u.cooldown = 0;
  u.headingX = s.forward.x; u.headingY = s.forward.y;
  const intent = { goal: { x: u.x - s.forward.x * 90, y: u.y - s.forward.y * 90 },
    retreat: false, flanking: true, pace: u.combatProfile.config.speed };
  b.tactics.intents.clear(); b.tactics.intents.set(u.id, intent);
  b.tactics.nextUpdate = Infinity;
  s.phase = 'envelop';
  assert.equal(b.tactics.steer(b, u, target, 1 / 30), false,
    'An intercepted wing releases steering for ordinary physical melee');
  let dealt = 0;
  const hit = b.hit.bind(b);
  b.hit = (victim, damage, source, ...args) => {
    const hp = victim.hp, result = hit(victim, damage, source, ...args);
    if (source === u && victim === target) dealt += Math.max(0, hp - victim.hp);
    return result;
  };
  for (let frame = 0; frame < 24; frame++) b.step(1 / 30);
  assert.ok(dealt > 0, 'The intercepted rider actually strikes using engine range/facing/armor checks');

  u.attack = 0; u.pendingAttack = null;
  target.x = u.x + s.forward.x * 20; target.y = u.y + s.forward.y * 20;
  s.phase = 'charge';
  assert.equal(b.tactics.steer(b, u, target, 1 / 30), true,
    'Charge preparation retains control to open acceleration room');
  s.phase = 'envelop'; intent.retreat = true;
  assert.equal(b.tactics.steer(b, u, target, 1 / 30), true,
    'Retreating bait is not pulled into melee by the wing defense rule');
  intent.retreat = false;
  target.x = u.x + s.forward.x * 100; target.y = u.y + s.forward.y * 100;
  assert.equal(b.tactics.steer(b, u, target, 1 / 30), true,
    'An unobstructed wing continues its route instead of chasing distant enemies');
}
console.log('PASS mirrored Turan interception: real melee, charge run-up and bait withdrawal preserved');
