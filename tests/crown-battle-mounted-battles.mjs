import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
const results = [];
for (const team of [0, 1]) for (const opposition of ['roman', 'seljuk_hassa', 'mongol', 'mixed']) {
  const mixed = opposition === 'mixed';
  const armies = [{ roman: 24 }, { roman: 24 }], commanders = [null, null];
  armies[team] = mixed ? { seljuk_turkmen_archer: 8, seljuk_hassa: 16 } : { mongol: 16 };
  armies[1 - team] = mixed ? { roman: 16, kipchak: 8 } : { [opposition]: 24 };
  if (mixed) commanders[team] = 'alp_arslan';
  const b = new Battle({ seed: 93, expandedMap: true, historicalArmies: armies, commanders });
  let movingShots = 0;
  const resolve = b.resolveAttack.bind(b);
  b.resolveAttack = (u, target, projectile) => {
    const arrows = b.stats.arrows;
    resolve(u, target, projectile);
    if (u.team === team && u.moving && b.stats.arrows > arrows) movingShots++;
  };
  for (let i = 0; i < 600 * 30 && b.winner === null; i++) b.step(1 / 30);
  assert.equal(b.outcomeReason, 'elimination', `${opposition}/${team}: natural completion without timeout`);
  assert.ok(movingShots > 5, `${opposition}/${team}: real moving releases in an unmodified battle`);
  results.push({ team, opposition, winner: b.winner, seconds: +b.time.toFixed(1), movingShots });
}
console.log('PASS 8 real mounted battles (infantry, lancers, mounted archers, commander-led mixed armies)', JSON.stringify(results));
