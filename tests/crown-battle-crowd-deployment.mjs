import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { BattleDeployment } from '../src/crown-battle-deployment.js';

const army = (sword=0,pike=0,archer=0,cavalry=0) => ({sword,pike,archer,cavalry});
function verify(armies,preset='field') {
  const b = new Battle({armies,expandedMap:true,preset});
  assert.equal(b.units.length,armies.reduce((n,a)=>n+Object.values(a).reduce((x,y)=>x+y,0),0));
  const cells = new Map(), size = 40;
  for (const u of b.units) {
    const r=u.combatProfile.radius, {left,right,top,bottom}=b.bounds;
    assert(u.x-r>=left && u.x+r<=right && u.y-r>=top && u.y+r<=bottom);
    const cx=Math.floor(u.x/size),cy=Math.floor(u.y/size);
    for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)
      for(const v of cells.get(`${x}:${y}`)||[])
        assert(Math.hypot(u.x-v.x,u.y-v.y)>=r+v.combatProfile.radius,`overlap ${u.id}/${v.id}`);
    const key=`${cx}:${cy}`;
    if(!cells.has(key))cells.set(key,[]);
    cells.get(key).push(u);
  }
  return b;
}
const b=verify([army(1250,1250,1250,1250),army(1250,1250,1250,1250)]);
verify([army(0,0,0,5000),army(0,0,0,5000)]);
const flank=verify([army(1250,1250,1250,1250),army(1250,1250,1250,1250)],'flank');
assert(flank.units.filter(u=>u.team===0&&u.type==='cavalry').every(u=>u.y<480),'flank preset keeps cavalry on the upper wing');
verify([army(1000,500,0,500),army(0,0,500,0)]);
assert.equal(new Battle({size:160,expandedMap:true}).initialArmyAreas,undefined);

// Existing automatic saves must regenerate; deliberate placement must survive.
let saved=null;
const storage=()=>({getItem:()=>saved,setItem:(_,v)=>{saved=v;}});
const deployment=new BattleDeployment('classic',{storage});
deployment.capture(b);
const data=JSON.parse(saved);
data.units[0].x=300;data.units[0].y=480;
data.units[1].x=320;data.units[1].y=500;data.units[1].tacticalOverride=true;
saved=JSON.stringify(data);
const original={x:b.units[0].x,y:b.units[0].y};
new BattleDeployment('classic',{storage}).restore(b);
assert.deepEqual({x:b.units[0].x,y:b.units[0].y},original);
assert.equal(b.units[1].x,320);assert.equal(b.units[1].y,500);
console.log('PASS crowd deployment: 10,000 mixed/cavalry troops, asymmetric armies, no overlaps, bounds, small battles and saved manual placement');
