import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Battle } from '../src/crown-battle.js';
import { MIDDLE_EARTH_UNITS } from '../src/middle-earth-units.js';
import { HISTORICAL_TYPES } from '../src/historical-combat.js';

// Real engine, fixed timestep, three seeds and both army sides. No altered HP,
// cooldowns or attack mocks: role-dependent deployment is part of the matchup.
const seeds = [5, 39, 1066];
const cases = MIDDLE_EARTH_UNITS.map(u => {
  const giant = ['cave_troll','balrog','ent','shelob','mumakil'].some(id => u.id === `me_${id}`);
  const opponent = u.kind === 'cavalry' && !u.hero ? 'knight' : 'roman';
  return { name: `${u.id}/${opponent}`, left: { [u.id]: u.hero || giant ? 1 : 12 }, right: { [opponent]: u.hero || giant ? 8 : 12 } };
});
for (const id of ['rohirrim','gondor_cavalry','dwarf_ram_rider','elf_stag_rider'])
  cases.push({ name: `${id}/pikes`, left: { [`me_${id}`]: 12 }, right: { spartan: 18 } });
for (const [left,right] of [
  [{me_legolas:1},{me_faramir:1}], [{me_legolas:1},{me_aragorn:1}],
  [{me_legolas:1},{knight:4}], [{me_iron_hills_veteran:12},{varangian:18}],
  [{me_balrog:1},{janissary:20}], [{me_sauron:1},{janissary:20}],
  [{me_mumakil:1},{janissary:24}], [{me_shelob:1},{spartan:20}],
  [{me_gondor_veteran:12},{varangian:12}], [{me_iron_hills_dwarf:12},{varangian:12}],
  [{me_nazgul:12},{spartan:18}], [{me_aragorn:1},{roman:16}],
  [{me_gimli:1},{roman:3}], [{me_witch_king:1},{roman:3}],
  [{me_elrond:1},{roman:3}], [{me_dain:1},{roman:3}],
  [{me_iron_hills_veteran:12},{varangian:12}], [{me_nazgul:12},{spartan:24}],
]) cases.push({name: `${Object.keys(left)[0]}/${Object.keys(right)[0]}`,left,right});

function fight(c,seed,swap) {
  const b = new Battle({seed,historicalArmies: swap ? [c.right,c.left] : [c.left,c.right]});
  for(let i=0;i<30*240 && b.winner===null;i++) b.step(1/30);
  const team = swap ? 1 : 0;
  return { win:b.winner===team, timeout:b.winner===null, time:+b.time.toFixed(1),
    remaining:b.units.filter(u=>u.team===team&&u.hp>0).length,
    hp:+b.units.filter(u=>u.team===team).reduce((sum,u)=>sum+Math.max(0,u.hp),0).toFixed(1),
    enemyHp:+b.units.filter(u=>u.team!==team).reduce((sum,u)=>sum+Math.max(0,u.hp),0).toFixed(1),
    counters:b.stats.pikeCounters, arrows:b.stats.arrows };
}
const results=cases.map(c=>{
  const runs=seeds.flatMap(seed=>[false,true].map(swap=>({seed,swap,...fight(c,seed,swap)})));
  return {...c,wins:runs.filter(r=>r.win).length,timeouts:runs.filter(r=>r.timeout).length,runs};
});
const report={seeds,step:1/30,limitSeconds:240,stats:Object.fromEntries(MIDDLE_EARTH_UNITS.map(u=>[u.id,HISTORICAL_TYPES[u.id]])),results};
mkdirSync('artifacts/middle-earth',{recursive:true});
const label=process.argv.includes('--baseline')?'before':'after';
writeFileSync(`artifacts/middle-earth/balance-${label}.json`,JSON.stringify(report,null,2));
for(const r of results) console.log(`${r.name}: ${r.wins}/6 wins, ${r.timeouts} timeouts, mean survivors ${(r.runs.reduce((n,x)=>n+x.remaining,0)/6).toFixed(1)}`);
if(!process.argv.includes('--baseline')) {
  assert.ok(results.every(r=>r.timeouts===0),'Every tested battle must finish');
  const matchup=(left,right,count)=>results.find(r=>Object.hasOwn(r.left,left)&&Object.hasOwn(r.right,right)&&r.right[right]===count);
  const meanHp=r=>r.runs.reduce((sum,x)=>sum+x.hp,0)/r.runs.length;
  // Ordinary elite troops must win at a cost, not with most of their health.
  for(const [id,opponent] of [['gondor_veteran','varangian'],['iron_hills_dwarf','varangian'],['dwarf_ram_rider','knight']]) {
    const r=matchup(`me_${id}`,opponent,12);
    assert.ok(r.wins>=4,`${id} retains its elite/durable role`);
    assert.ok(meanHp(r)<HISTORICAL_TYPES[`me_${id}`].hp*12*.25,`${id} pays for an equal-count heavy matchup`);
  }
  assert.ok(matchup('me_iron_hills_veteran','varangian',12).wins>=4,'Veteran dwarves remain stronger individually');
  assert.ok(matchup('me_iron_hills_veteran','varangian',18).wins<=2,'A 50% numerical heavy-infantry advantage counters veteran dwarves');
  const gondor=matchup('me_gondor_cavalry','knight',12);
  assert.ok(gondor.wins>=1&&gondor.wins<=5,'Comparable heavy cavalry has no guaranteed winner');
  assert.ok(gondor.runs.every(r=>r.hp+r.enemyHp<12*HISTORICAL_TYPES.knight.hp*.25),'Heavy cavalry wins are costly on either side');
  assert.equal(matchup('me_nazgul','spartan',24).wins,0,'Elite Nazgul can be countered by twice as many pikes');
  for(const id of ['rohirrim','gondor_cavalry','dwarf_ram_rider','elf_stag_rider']) {
    const r=matchup(`me_${id}`,'spartan',18);
    assert.equal(r.wins,0,`${id}: pike counter survives balance changes`);
    assert.ok(r.runs.every(x=>x.counters>0),'Pikes actually counter mounted opponents');
  }
  for(const [id,count] of [['balrog',20],['sauron',20],['mumakil',24]])
    assert.equal(matchup(`me_${id}`,'janissary',count).wins,0,`${id} has a ranged counter`);
  for(const id of ['gimli','witch_king','elrond','dain'])
    assert.ok(matchup(`me_${id}`,'roman',3).wins>=4,`${id} remains a hero`);
  assert.equal(matchup('me_aragorn','roman',16).wins,0,'Heroes cannot solo an arbitrary army');
  assert.equal(matchup('me_legolas','knight',4).wins,0,'Mounted pursuit counters the archer hero');
  for(const c of [cases[9],cases[23]]) assert.deepEqual(fight(c,39,false),fight(c,39,false),'Seeded combat is repeatable');
}
console.log(`PASS balance audit: ${results.length*6} battles, ${MIDDLE_EARTH_UNITS.length} unit definitions; report balance-${label}.json`);
