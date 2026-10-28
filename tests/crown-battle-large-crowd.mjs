import { Battle } from '../src/crown-battle.js';
import { Session } from 'node:inspector';
import { writeFileSync } from 'node:fs';
const session = new Session(); session.connect();
const post = method => new Promise((resolve, reject) => session.post(method, (e,r) => e ? reject(e) : resolve(r)));
const results = [];
await post('Profiler.enable'); await post('Profiler.start');
for (const count of [3000, 10000]) {
  const army = {sword:count/8,pike:count/8,archer:count/8,cavalry:count/8};
  const battle = new Battle({seed:1066,armies:[army,army]});
  // Broad opposing ranks, packed into contact without coincident spawn points.
  for (const u of battle.units) {
    const index = u.id % (count/2);
    u.x = battle.bounds.left + 45 + index%100*5;
    u.y = 440 + u.team*90 + Math.floor(index/100)*3;
  }
  const times=[];
  for(let i=0;i<100;i++) {
    const start=performance.now();battle.step(1/30);
    if(i>=15)times.push(performance.now()-start);
  }
  times.sort((a,b)=>a-b);
  results.push({count,actual:battle.units.length,alive:battle.counts(),median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)]});
}
const {profile}=await post('Profiler.stop');session.disconnect();
writeFileSync('artifacts/crowd-stutter/large.cpuprofile',JSON.stringify(profile));
const nodes=new Map(profile.nodes.map(n=>[n.id,n.callFrame])), totals=new Map();
profile.samples.forEach((id,i)=>{const f=nodes.get(id);const key=`${f.functionName} ${f.url.split('/').at(-1)}:${f.lineNumber+1}`;totals.set(key,(totals.get(key)||0)+profile.timeDeltas[i]);});
console.log(JSON.stringify({results,hot:[...totals].sort((a,b)=>b[1]-a[1]).slice(0,18)},null,2));
