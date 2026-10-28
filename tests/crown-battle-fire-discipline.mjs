import assert from 'node:assert/strict';
import test from 'node:test';
import { Battle } from '../src/crown-battle.js';

const advance = (battle, hz) => {
  for (let i = 0; i < 10 * hz; i++) battle.step(1 / hz);
};

function blockedGun(type, team, y, order = null) {
  const armies = [{ [type]: 1, roman: 1 }, { roman: 1 }];
  if (team) armies.reverse();
  const battle = new Battle({ historicalArmies: armies, tacticalAI: false, seed: 42 });
  const gun = battle.units.find(u => u.type === type);
  const guard = battle.units.find(u => u.team === team && u !== gun);
  const enemy = battle.units.find(u => u.team !== team);
  const x = n => team ? 600 - n : n;
  Object.assign(gun, { x: x(250), y, cooldown: 0, headingX: team ? -1 : 1, headingY: 0, order });
  Object.assign(guard, { x: x(275), y, cooldown: 100, order: { kind: 'hold' } });
  Object.assign(enemy, { x: x(380), y, hp: 10000, maxHp: 10000, cooldown: 100, order: { kind: 'hold' } });
  return { battle, gun, guard, enemy };
}

for (const type of ['janissary', 'ming_matchlock']) {
  for (const team of [0, 1]) for (const hz of [30, 60]) for (const y of [110, 400, 875]) {
    test(`${type}: blocked fire, team ${team}, ${hz} Hz, y=${y}`, () => {
      const { battle, gun, guard, enemy } = blockedGun(type, team, y);
      const start = { x: gun.x, y: gun.y }, guardHp = guard.hp;
      advance(battle, hz);
      assert(battle.stats.heldShots > 0, 'Withhold the shot while an ally blocks it');
      assert(battle.stats.shots >= 2 && enemy.hp < enemy.maxHp, 'Open a lane and hit the exposed enemy');
      assert.equal(guard.hp, guardHp, 'Keep the allied guard safe');
      assert(Math.hypot(gun.x - start.x, gun.y - start.y) < 40, 'Use only a local sidestep');
      assert(gun.y >= 110 && gun.y <= 875, 'Stay within the battlefield');
    });
  }
  for (const kind of ['hold', 'attack']) {
    test(`${type}: preserve explicit ${kind}`, () => {
      const order = { kind, x: 250, y: 400 };
      const { battle, gun, guard, enemy } = blockedGun(type, 0, 400, order);
      if (kind === 'attack') { order.targetId = enemy.id; gun.target = enemy; }
      const guardHp = guard.hp;
      advance(battle, 60);
      assert.equal(gun.order, order);
      assert.deepEqual([gun.x, gun.y], [250, 400]);
      assert.equal(battle.stats.shots, 0, 'Withhold blocked shots without overriding the player');
      assert.equal(guard.hp, guardHp);
    });
  }
}

for (const type of ['janissary', 'norse_longbowman']) for (const hz of [30, 60]) {
  test(`${type}: hold selects a visible enemy, ${hz} Hz`, () => {
    const battle = new Battle({ historicalArmies: [{ [type]: 1 }, { roman: 2 }], mapId: 'fortress', tacticalAI: false });
    const [gun, hidden, exposed] = battle.units;
    for (const u of battle.units) Object.assign(u, { hp: 10000, maxHp: 10000, cooldown: 100, order: { kind: 'hold' } });
    Object.assign(gun, { x: 180, y: 440, cooldown: 0 });
    Object.assign(hidden, { x: 250, y: 440 });
    Object.assign(exposed, { x: 180, y: 560 });
    // Retargeting must also discard an existing target hidden behind a building.
    gun.target = hidden;
    assert.equal(battle.clearShot(gun, hidden), false);
    assert.equal(battle.clearShot(gun, exposed), true);
    advance(battle, hz);
    assert(exposed.hp < exposed.maxHp, 'Attack the visible enemy instead of staring at the building');
    assert.equal(hidden.hp, hidden.maxHp, 'Do not fire through the building');
    assert.deepEqual([gun.x, gun.y], [180, 440], 'Keep the held position');
  });
}
