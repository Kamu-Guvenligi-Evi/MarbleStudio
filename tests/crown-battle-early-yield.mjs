import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { requestRangedLane, steerScreening } from '../src/crown-battle-screening.js';

function setup(type, guardType, team = 0) {
  const armies = [{ [type]: 1, [guardType]: 1 }, { roman: 1 }];
  if (team) armies.reverse();
  const b = new Battle({ seed: 33, historicalArmies: armies, tacticalAI: false });
  const bow = b.units.find(u => u.team === team && u.combatProfile.ranged);
  const guard = b.units.find(u => u.team === team && !u.combatProfile.ranged);
  const enemy = b.units.find(u => u.team !== team), sign = team ? -1 : 1;
  // A commander keeps the shooter in its firing slot until local passage
  // steering takes priority. This is not a player hold order.
  b.tactics = { update() {}, steer: (_battle, u) => u === bow };
  Object.assign(bow, { x: 300, y: 450, cooldown: 1000, target: enemy });
  Object.assign(guard, { x: 300 - sign * 100, y: 450, cooldown: 1000, target: enemy,
    headingX: sign, headingY: 0, armyId: 'friendly-reinforcements' });
  Object.assign(enemy, { x: 300 + sign * 240, y: 450, hp: 10000, order: { kind: 'hold' }, cooldown: 1000 });
  return { b, bow, guard, enemy, sign };
}

const results = [];
for (const type of ['welsh_longbowman', 'mongol']) {
  for (const guardType of ['roman', 'seljuk_hassa']) {
    for (const team of [0, 1]) for (const hz of [30, 60]) {
      const { b, bow, guard, enemy, sign } = setup(type, guardType, team);
      let firstGap = null, crossed = false, lateral = 0;
      for (let i = 0; i < hz * 9; i++) {
        b.step(1 / hz);
        if (bow.screenYield?.urgent && firstGap === null) firstGap = (bow.x - guard.x) * sign;
        if ((guard.x - 300) * sign >= 0 && !crossed) {
          crossed = true; lateral = Math.abs(bow.y - guard.y);
        }
      }
      assert.ok(firstGap > (guardType === 'roman' ? 25 : 45), `Early warning ${type}/${guardType}/${team}/${hz}: ${firstGap}`);
      assert.ok(crossed && lateral > bow.combatProfile.radius + guard.combatProfile.radius,
        `Clear passage ${type}/${guardType}/${team}/${hz}: ${lateral}`);
      assert.ok(guard.x * sign > 300 * sign + 35, 'Melee continues towards the enemy');
      results.push({ type, guardType, team, hz, firstGap: +firstGap.toFixed(1) });
    }
  }
}

// Charges do not use walk(), but must also warn allied archers in time.
for (const team of [0, 1]) for (const hz of [30, 60]) {
  const { b, bow, guard, enemy, sign } = setup('welsh_longbowman', 'seljuk_hassa', team);
  guard.x = 300 - sign * 145;
  b.startCharge(guard, enemy);
  let firstGap = null, cleared = false;
  for (let i = 0; i < hz * 3; i++) {
    b.step(1 / hz);
    if (bow.screenYield?.urgent && firstGap === null) firstGap = (bow.x - guard.x) * sign;
    if ((guard.x - 300) * sign >= 0) {
      cleared = Math.abs(bow.y - guard.y) > bow.combatProfile.radius + guard.combatProfile.radius;
      break;
    }
  }
  assert.ok(firstGap > 100 && cleared, `Charge clears early ${team}/${hz}: ${firstGap}`);
}

// An unreleased foot shot must not delay urgent movement. Near the arena edge,
// choose the other side instead of asking the shooter to leave the battlefield.
{
  const { b, bow, guard, enemy } = setup('welsh_longbowman', 'roman');
  bow.y = guard.y = enemy.y = b.bounds.top + 111;
  bow.id = 2; // preferred side points outside the arena
  bow.attack = .24; bow.pendingAttack = { target: enemy, projectile: true };
  assert.ok(requestRangedLane(b, guard, bow, 1, 0, 0));
  assert.ok(bow.screenYield.y > bow.y);
  // Build the live grids before running the steering in isolation.
  bow.screenCheckAt = Infinity;
  b.step(1 / 60);
  assert.equal(bow.pendingAttack, null);
  assert.equal(bow.attack, 0);
}

for (const kind of ['hold', 'move', 'attack']) for (const type of ['welsh_longbowman', 'mongol']) {
  const { b, bow, guard, enemy } = setup(type, 'seljuk_hassa');
  bow.order = { kind, x: 300, y: 500, targetId: enemy.id };
  assert.equal(requestRangedLane(b, guard, bow, 1, 0, 0), false);
  assert.equal(steerScreening(b, bow, 1 / 30), false);
  assert.equal(bow.order.kind, kind);
}

// Sideways deployment must not scatter a firing line; impassable destinations
// must never create a yield order.
{
  const { b, bow, guard } = setup('mongol', 'seljuk_hassa');
  assert.equal(requestRangedLane(b, guard, bow, 0, 1, 0), false);
  b.navigation = { clear: () => false };
  assert.equal(requestRangedLane(b, guard, bow, 1, 0, 0), false);
  assert.equal(bow.screenYield, null);
}

// The warning pass remains bounded in a dense mixed army, rather than scanning
// every ally for every soldier on every frame.
{
  const b = new Battle({ seed: 33, expandedMap: true, tacticalAI: false,
    historicalArmies: [{ mongol: 300, roman: 300 }, { roman: 600 }] });
  b.units.forEach((u, i) => Object.assign(u, { x: 200 + i % 20 * 13 + u.team * 300,
    y: 200 + Math.floor((i % 600) / 20) * 16 }));
  for (let i = 0; i < 90; i++) b.step(1 / 30);
  assert.ok(b.stats.laneChecks > 0 && b.stats.laneChecks <= 900 * 40 * 16);
  assert.ok(b.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y)));
}
console.log('PASS early allied passage: 16 infantry/cavalry/archer scenarios, 4 charges, boundaries, unreleased shots, navigation, manual orders and 1200 soldiers', JSON.stringify(results));
