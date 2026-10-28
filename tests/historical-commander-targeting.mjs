import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

for (const team of [0, 1]) for (const type of ['roman', 'seljuk_hassa', 'achaemenid_archer']) {
  const b = new Battle({ expandedMap: true, tacticalAI: false, armyConfigs: [
    { id: 'own', team, commanderId: null, roster: { [type]: 1 } },
    { id: 'enemy', team: 1 - team, commanderId: 'harold_godwinson', roster: { roman: 1 } },
  ] });
  const u = b.units.find(u => u.armyId === 'own'), enemy = b.units.find(u => u.armyId === 'enemy' && !u.commanderId);
  const leader = b.armyCommanders.get('enemy'), reach = u.combatProfile.config.reach;
  const arrange = distance => {
    Object.assign(u, { x: 0, y: 300, face: 1, headingX: 1, headingY: 0, retarget: 0, order: null, pendingAttack: null });
    Object.assign(enemy, { x: 700, y: 300 });
    Object.assign(leader, { x: distance, y: 300 });
  };
  arrange(reach + 30); u.target = leader;
  b.step(1 / 30);
  assert.equal(u.target, enemy, `${type}/${team}: releases fleeing leader, searches past nearby leader for combatants`);
  arrange(5); u.target = null;
  b.step(1 / 30);
  assert.equal(u.target, leader, `${type}/${team}: leader within weapon reach remains vulnerable`);
  arrange(reach + 30); u.target = leader;
  u.order = { kind: 'attack', targetId: leader.id };
  b.step(1 / 30);
  assert.equal(u.target, leader, `${type}/${team}: explicit player attack remains authoritative`);
}
console.log('PASS commander targeting: infantry, cavalry and archers on both sides; no autonomous pursuit, close attacks and explicit orders preserved');
