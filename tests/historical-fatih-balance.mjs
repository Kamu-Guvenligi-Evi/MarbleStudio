import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';
import { HISTORICAL_TYPES } from '../src/historical-combat.js';
import { armyCapacity } from '../src/historical-army-capacity.js';

const finish = battle => {
  for (let tick = 0; tick < 600 * 30 && battle.winner === null; tick++) battle.step(1 / 30);
  assert.equal(battle.outcomeReason, 'elimination', 'Balance must not depend on a timeout');
  assert.ok(battle.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite)));
};
const roster = createCommanderArmy('mehmed_ii', 96);
assert.equal(armyCapacity(roster), 96, 'More household cavalry does not grant extra army capacity');
assert.ok(Object.keys(roster).every(id => HISTORICAL_TYPES[id].projectile !== 'bullet'));
// Compare the documented pre-buff army with today's army on the same engine.
// A fixed win count from an older engine can change when battle behaviour changes.
const beforeBuff = {
  ottoman_janissary_bow: { damage: 21, cooldown: 1.65 },
  ottoman_sipah: { damage: 27, cooldown: 1.3, armor: .14 },
  ottoman_timariot: { damage: 26, cooldown: 1.3, armor: .19 },
  ottoman_cebelu: { damage: 26, cooldown: 1.2, armor: .20 },
  ottoman_janissary_armoured_sword: { damage: 23, cooldown: 1.1, armor: .23 },
};
const currentTypes = Object.fromEntries(Object.keys(beforeBuff).map(id => [id, { ...HISTORICAL_TYPES[id] }]));
function measure(before = false) {
  const wins = new Map(), sideWins = [0, 0];
  for (const opponent of ['timur', 'alp_arslan', 'harald_hardrada', 'georg_frundsberg']) {
    wins.set(opponent, 0);
    for (const side of [0, 1]) {
      const ids = side ? [opponent, 'mehmed_ii'] : ['mehmed_ii', opponent];
      const armies = ids.map(id => createCommanderArmy(id, 96));
      if (before) {
        armies[side].ottoman_sipah -= 8;
        armies[side].ottoman_solak += 4;
        armies[side].ottoman_akinci_archer += 4;
      }
      assert.equal(armyCapacity(armies[side]), 96);
      const battle = new Battle({ seed: 42, expandedMap: true,
        historicalArmies: armies, commanders: ids });
      let bowShots = 0;
      battle.onCombatEvent = e => {
        if (e.kind === 'attack' && e.projectile && e.unit.team === side
          && e.unit.type === 'ottoman_janissary_bow') bowShots++;
      };
      finish(battle);
      assert.ok(bowShots > 0, 'The missile centre participates in the battle');
      if (battle.winner === side) {
        wins.set(opponent, wins.get(opponent) + 1);
        sideWins[side]++;
      }
    }
  }
  const totalWins = [...wins.values()].reduce((sum, n) => sum + n, 0);
  return { wins, sideWins, totalWins };
}
let baseline;
try {
  for (const [id, values] of Object.entries(beforeBuff)) Object.assign(HISTORICAL_TYPES[id], values);
  baseline = measure(true);
} finally {
  for (const [id, values] of Object.entries(currentTypes)) Object.assign(HISTORICAL_TYPES[id], values);
}
const { wins, sideWins, totalWins } = measure();
assert.ok(totalWins >= baseline.totalWins + 2,
  `The buff must improve at least two matched battles: ${baseline.totalWins}/8 -> ${totalWins}/8`);
assert.ok(sideWins.every(n => n > 0), 'The improved army must win from both starting sides');
assert.ok([...wins.values()].filter(n => n > 0).length >= 2, 'The army must compete against more than one opponent');
assert.ok(totalWins < 8, 'The army must remain counterable');
assert.equal(wins.get('georg_frundsberg'), 0, 'A pike army remains a difficult matchup');

// Check the weapon counter separately from commanders, formation, and roster.
for (const side of [0, 1]) {
  const armies = [{ ottoman_sipah: 12 }, { landsknecht: 18 }];
  const battle = new Battle({ seed: 39, historicalArmies: side ? armies.reverse() : armies });
  finish(battle);
  assert.equal(battle.winner, 1 - side, 'Supported pikes still defeat a frontal sipahi force');
}
console.log(`PASS Fatih balance: ${baseline.totalWins}/8 -> ${totalWins}/8 matched commander wins; both starting sides, multiple opponents, bow participation, exact capacity, no firearms, two pike counter battles.`);
