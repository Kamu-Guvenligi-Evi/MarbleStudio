import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';

const results = [];
for (const commanderId of ['georg_frundsberg', 'qi_jiguang'])
  for (const size of [48, 96, 240]) for (const team of [0, 1]) {
    const roster = createCommanderArmy(commanderId, size);
    const b = new Battle({ seed: 42, expandedMap: true, armyConfigs: [
      { id: 'own', team, commanderId, roster },
      { id: 'enemy', team: 1 - team, roster: { roman: size } },
    ] });
    const s = b.openingDeployments.get('own')?.state;
    assert.ok(s?.formationGeometry, 'historical layout exists before the first frame');
    const { members: ms } = s, assigned = new Set(ms.map(m => m.unit.id));
    assert.equal(assigned.size, ms.length, 'no soldier occupies two roles');
    assert.equal(ms.length, Object.values(roster).reduce((a, n) => a + n, 0), 'all preset troops have a place');
    let minimumGap = Infinity;
    for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
      const a = ms[i], c = ms[j];
      const gap = Math.hypot(a.unit.x - c.unit.x, a.unit.y - c.unit.y)
        - a.unit.combatProfile.radius - c.unit.combatProfile.radius;
      minimumGap = Math.min(minimumGap, gap);
      assert.ok(gap >= 1, `${commanderId}/${size}: opening bodies overlap or lack clearance`);
    }
    if (commanderId === 'georg_frundsberg') {
      const melee = ms.filter(m => ['front', 'support'].includes(m.role));
      const pikes = melee.filter(m => m.role === 'front'), support = melee.filter(m => m.role === 'support');
      const lo = key => Math.min(...melee.map(m => m[key])), hi = key => Math.max(...melee.map(m => m[key]));
      assert.ok((hi('f') - lo('f')) / (hi('a') - lo('a')) < 1.5, 'large pike force remains a block');
      for (const m of support) {
        assert.ok(m.f < Math.max(...pikes.map(p => p.f)) && m.f > Math.min(...pikes.map(p => p.f)), 'short weapons stay inside the pike depth');
        assert.ok(pikes.some(p => p.a < m.a && Math.abs(p.f - m.f) < 11)
          && pikes.some(p => p.a > m.a && Math.abs(p.f - m.f) < 11), 'short weapons have protected flanks');
      }
      assert.ok(ms.filter(m => m.role === 'bow').every(m => m.a < lo('a') - 12 || m.a > hi('a') + 12), 'shot can fire alongside the block');
    } else {
      const cells = [...new Set(ms.filter(m => m.cell !== undefined).map(m => m.cell))];
      for (const cell of cells) {
        const soldiers = ms.filter(m => m.cell === cell);
        const roles = Object.fromEntries(['longShield', 'shield', 'wolf', 'spear', 'short'].map(r => [r, soldiers.filter(m => m.role === r)]));
        assert.deepEqual(Object.values(roles).map(a => a.length), [1, 1, 2, 4, 2], 'each complete team keeps its weapon complement');
        const shields = [...roles.longShield, ...roles.shield];
        for (const wolf of roles.wolf) assert.ok(shields.some(m => Math.abs(m.a - wolf.a) < .01 && m.f > wolf.f && m.f - wolf.f <= 11), 'each langxian follows its shield');
        for (const spear of roles.spear) assert.ok(shields.some(m =>
          Math.hypot(m.a - spear.a, m.f + m.unit.combatProfile.radius * 2 - spear.f) <= spear.unit.combatProfile.config.reach), 'spears can actually reach an attacker at the shield front');
        assert.ok(roles.short.every(m => roles.spear.every(p => m.f < p.f)), 'short weapons back up the spears');
      }
      const core = ms.filter(m => m.cell !== undefined), reserve = ms.filter(m => m.duty === 'ming-reserve');
      assert.ok(reserve.every(m => Math.abs(m.a) <= Math.max(...core.map(p => Math.abs(p.a)))), 'incomplete teams remain near the centre');
      const screen = ms.filter(m => m.duty === 'ming-fire-screen');
      assert.ok(screen.every(m => m.unit.combatProfile.ranged && m.f > 0), 'fire screen uses missile troops, ahead of the team body');
    }
    // The opening must be used by the live director, not just a preview diagram.
    b.step(1 / 30);
    assert.equal(b.tactics.civilizations.armies.get('own'), s);
    results.push({ commanderId, size, team, geometry: s.formationGeometry, minimumGap });
  }
mkdirSync('artifacts/tactical-responsiveness', { recursive: true });
writeFileSync('artifacts/tactical-responsiveness/infantry-openings.json', JSON.stringify(results));
console.log(`PASS ${results.length} historical openings: complete rosters, clear bodies, weapon support, scaled blocks, both sides.`);
