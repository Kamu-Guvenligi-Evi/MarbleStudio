import {COLORS,NAMES,random} from './physics.js';
import {normalizeBallImages} from './ball-images.js';
import {normalizeNames} from './presentation.js';
import {COUNTRY_MAPS} from './territory-maps.js';

export const TERRITORY_SHAPES={triangle:'Üçgen',square:'Kare',hexagon:'Altıgen',star:'Yıldız',circle:'Daire',...Object.fromEntries(Object.entries(COUNTRY_MAPS).map(([id,map])=>[id,map.name]))};
export const TERRITORY_BUFFS={speed:{duration:2,multiplier:1.8},shield:{duration:1.5}};
export const TERRITORY_BALL_RADIUS=11;
export function shapeOutline(shape){
  if(COUNTRY_MAPS[shape])return COUNTRY_MAPS[shape].outline.map(p=>({...p}));
  if(shape==='triangle')return [{x:270,y:280},{x:508,y:740},{x:32,y:740}];
  if(shape==='square')return [{x:48,y:288},{x:492,y:288},{x:492,y:732},{x:48,y:732}];
  const count=shape==='star'?10:shape==='hexagon'?6:80;
  return Array.from({length:count},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/count,r=shape==='star'&&i%2?126:228;return {x:270+Math.cos(a)*r,y:510+Math.sin(a)*r};});
}
function inside(p,vertices){let yes=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){const a=vertices[i],b=vertices[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
export class TerritoryBattle{
  constructor({seed=2048,count=12,arenaShape='triangle',territoryDuration=45,ballImages=[],ballNames=[],onHit=()=>{}}={}){
    this.mode='arena';this.arenaGame='territory';this.arenaShape=Object.hasOwn(TERRITORY_SHAPES,arenaShape)?arenaShape:'triangle';
    this.duration=[30,45,60].includes(territoryDuration)?territoryDuration:45;this.seed=seed;this.onHit=onHit;this.rng=random(seed);
    this.time=0;this.state='ready';this.finished=[];this.winners=[];this.totalCuts=0;this.totalClaims=0;this.events=[];
    this.pickups=[];this.nextPickupAt=2;this.pickupSequence=0;
    this.sectionCount=1;this.sections=[];this.sequence=[];this.finishY=960;this.isCustom=true;
    this.size=80;this.cellSize=6;this.outline=shapeOutline(this.arenaShape);this.cells=new Int16Array(6400).fill(-2);this.trailOwners=new Int16Array(6400).fill(-1);this.valid=[];
    for(let i=0;i<this.cells.length;i++)if(inside(this.position(i),this.outline)){this.cells[i]=-1;this.valid.push(i);}
    // Rasterized coastlines can leave tiny disconnected tips. Keep a traversable arena.
    const unseen=new Set(this.valid),components=[];
    while(unseen.size){const group=[unseen.values().next().value];unseen.delete(group[0]);for(let head=0;head<group.length;head++)for(const n of this.neighbors(group[head]))if(unseen.delete(n))group.push(n);components.push(group);}
    this.valid=components.sort((a,b)=>b.length-a.length)[0];
    const playable=new Set(this.valid);for(let i=0;i<this.cells.length;i++)if(!playable.has(i))this.cells[i]=-2;
    const images=normalizeBallImages(ballImages),names=normalizeNames(ballNames),starts=[];
    const homes=this.valid.filter(i=>[-1,1].every(dx=>[-1,1].every(dy=>this.rectangleValid(i,dx,dy))));
    this.balls=Array.from({length:Number.isInteger(count)?Math.max(2,Math.min(20,count)):12},(_,id)=>{
      const candidates=homes.filter(i=>starts.every(j=>Math.abs(i%80-j%80)>2||Math.abs(Math.floor(i/80)-Math.floor(j/80))>2));
      if(!candidates.length)throw new Error('Bu haritada oyuncular için yeterli başlangıç alanı yok.');
      let home=candidates[Math.floor(this.rng()*candidates.length)],best=-1;
      if(starts.length)for(const cell of candidates){const p=this.position(cell),distance=Math.min(...starts.map(i=>{const q=this.position(i);return (p.x-q.x)**2+(p.y-q.y)**2;}));if(distance>best){best=distance;home=cell;}}
      starts.push(home);return {id,name:names[id]??NAMES[id],imageSrc:images[id],color:COLORS[id],cell:home,home,area:0,cuts:0,claims:0,trail:[],route:[],phase:0,speedUntil:0,shieldUntil:0,eliminatedAt:null,finishedAt:null,body:{position:this.position(home),velocity:{x:0,y:0},circleRadius:TERRITORY_BALL_RADIUS}};
    });
    for(const b of this.balls)this.seedHome(b);
  }
  position(i){return {x:30+(i%80+.5)*6,y:270+(Math.floor(i/80)+.5)*6};}
  neighbors(i){const x=i%80,y=Math.floor(i/80);return [x?i-1:-1,x<79?i+1:-1,y?i-80:-1,y<79?i+80:-1].filter(n=>n>=0&&this.cells[n]!==-2);}
  setOwner(i,id){const previous=this.cells[i];if(previous===-2||previous===id)return;if(previous>=0)this.balls[previous].area--;this.cells[i]=id;if(id>=0)this.balls[id].area++;}
  seedHome(b){const x=b.home%80,y=Math.floor(b.home/80);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)this.setOwner((y+dy)*80+x+dx,b.id);}
  rectangleValid(cell,dx,dy){const x=cell%80,y=Math.floor(cell/80),x2=x+dx,y2=y+dy;if(x2<0||x2>=80||y2<0||y2>=80)return false;for(let yy=Math.min(y,y2);yy<=Math.max(y,y2);yy++)for(let xx=Math.min(x,x2);xx<=Math.max(x,x2);xx++)if(this.cells[yy*80+xx]===-2)return false;return true;}
  speed(b){return b.speedUntil>this.time?TERRITORY_BUFFS.speed.multiplier:1;}
  seekPickup(b){
    if(this.time<(b.nextPickupLookAt??0)||b.trail.length>30)return;
    b.nextPickupLookAt=this.time+.35;
    const p=this.position(b.cell),wanted=this.pickups.filter(item=>{
      const q=this.position(item.cell),active=b[item.type==='speed'?'speedUntil':'shieldUntil']>this.time;
      return !active&&item.expiresAt>this.time+.7&&Math.hypot(p.x-q.x,p.y-q.y)<=96;
    });
    if(!wanted.length)return;
    // A short trip for a nearby buff, then resume the existing land-taking route.
    const targets=new Set(wanted.map(item=>item.cell)),parent=new Int16Array(6400).fill(-1),depth=new Uint8Array(6400),queue=[b.cell];parent[b.cell]=b.cell;
    for(let head=0;head<queue.length;head++){
      const cell=queue[head];
      if(targets.has(cell)){
        const path=[];for(let i=cell;i!==b.cell;i=parent[i])path.push(i);path.reverse();
        if(!path.length){this.collectPickups(b);return;}
        b.route=path.concat(path.slice(0,-1).reverse(),b.cell,b.route);
        b.nextPickupLookAt=this.time+path.length*.07+.5;return;
      }
      if(depth[cell]>=16)continue;
      for(const n of this.neighbors(cell))if(parent[n]===-1){parent[n]=cell;depth[n]=depth[cell]+1;queue.push(n);}
    }
  }
  plan(b){
    if(b.eliminatedAt!==null)return;
    if(this.cells[b.cell]!==b.id){
      // Finish an open trail by returning to owned land.
      const parent=new Int16Array(6400).fill(-1),queue=[b.cell];parent[b.cell]=b.cell;
      for(let head=0;head<queue.length;head++){
        const cell=queue[head];
        if(this.cells[cell]===b.id){const path=[];for(let i=cell;i!==b.cell;i=parent[i])path.push(i);b.route=path.reverse();return;}
        for(const n of this.neighbors(cell))if(parent[n]===-1){parent[n]=cell;queue.push(n);}
      }
      return;
    }
    if(!b.launchReady){
      // Walk through owned land to its frontier so the next loop expands outward.
      const parent=new Int16Array(6400).fill(-1),queue=[b.cell];parent[b.cell]=b.cell;
      let target=b.cell,best=-Infinity;
      for(let head=0;head<queue.length;head++){
        const cell=queue[head],adjacent=this.neighbors(cell),frontier=adjacent.filter(i=>this.cells[i]!==b.id).length;
        if(frontier){const score=frontier+this.rng()*3;if(score>best){best=score;target=cell;}}
        for(const n of adjacent)if(this.cells[n]===b.id&&parent[n]===-1){parent[n]=cell;queue.push(n);}
      }
      const path=[];for(let i=target;i!==b.cell;i=parent[i])path.push(i);b.launchReady=true;
      if(path.length){b.route=path.reverse();return;}
    }
    b.launchReady=false;
    let best=null,score=-Infinity;
    for(let attempt=0;attempt<48;attempt++){
      const dx=(this.rng()<.5?-1:1)*(2+Math.floor(this.rng()*14)),dy=(this.rng()<.5?-1:1)*(2+Math.floor(this.rng()*14));
      if(!this.rectangleValid(b.cell,dx,dy))continue;
      const x=b.cell%80,y=Math.floor(b.cell/80);let gain=0;
      for(let yy=Math.min(y,y+dy);yy<=Math.max(y,y+dy);yy++)for(let xx=Math.min(x,x+dx);xx<=Math.max(x,x+dx);xx++)if(this.cells[yy*80+xx]!==b.id)gain++;
      const value=gain/(Math.abs(dx)+Math.abs(dy))+this.rng()*2;
      if(value>score){score=value;best={dx,dy,horizontal:this.rng()<.5};}
    }
    if(!best){const adjacent=this.neighbors(b.cell);b.route=adjacent.length?[adjacent[Math.floor(this.rng()*adjacent.length)]]:[];return;}
    let cell=b.cell;const {dx,dy,horizontal}=best,moves=horizontal?[[Math.sign(dx),Math.abs(dx)],[Math.sign(dy)*80,Math.abs(dy)],[-Math.sign(dx),Math.abs(dx)],[-Math.sign(dy)*80,Math.abs(dy)]]:[[Math.sign(dy)*80,Math.abs(dy)],[Math.sign(dx),Math.abs(dx)],[-Math.sign(dy)*80,Math.abs(dy)],[-Math.sign(dx),Math.abs(dx)]];
    for(const [delta,n] of moves)for(let i=0;i<n;i++){cell+=delta;b.route.push(cell);}
  }
  clearTrail(b){const old=b.trail;b.trail=[];for(const i of old)if(this.trailOwners[i]===b.id)this.trailOwners[i]=this.balls.find(other=>other.eliminatedAt===null&&other.trail.includes(i))?.id??-1;}
  protected(b){return b.shieldUntil>this.time;}
  exposed(b){return b.trail.length>0&&this.cells[b.cell]!==b.id;}
  contact(b,p){
    for(const other of this.balls){
      if(other===b||other.eliminatedAt!==null)continue;
      const q=other.body.position;
      // Include the visible outline. Resolve contact before two bodies overlap.
      if(Math.hypot(p.x-q.x,p.y-q.y)>=b.body.circleRadius+other.body.circleRadius+2-1e-8)continue;
      if(this.exposed(other)&&this.eliminate(other,b))continue;
      if(this.exposed(b))this.eliminate(b,other);
      return false;
    }
    return true;
  }
  detour(b){
    if(this.time<(b.nextDetourAt??0))return;
    b.nextDetourAt=this.time+.15;
    const obstacles=this.balls.filter(other=>other!==b&&other.eliminatedAt===null).map(other=>({...other.body.position,id:other.id,spacing:b.body.circleRadius+other.body.circleRadius+2}));
    const p=this.position(b.cell),nearest=obstacles.reduce((best,o)=>!best||Math.hypot(o.x-p.x,o.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?o:best,null);
    const clear=(from,to)=>{
      const p=this.position(from),q=this.position(to),dx=q.x-p.x,dy=q.y-p.y;
      return obstacles.every(o=>{const t=Math.max(0,Math.min(1,((o.x-p.x)*dx+(o.y-p.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x+dx*t-o.x,p.y+dy*t-o.y)>=o.spacing-1e-8;});
    };
    // Rejoin the existing route around a blocking body, without choosing new land.
    const targets=new Map();b.route.forEach((cell,i)=>{if(cell!==b.cell&&!targets.has(cell))targets.set(cell,i);});
    const parent=new Int16Array(6400).fill(-1),queue=[b.cell];parent[b.cell]=b.cell;
    for(let head=0;head<queue.length;head++){
      const cell=queue[head];
      if(targets.has(cell)){
        const path=[];for(let i=cell;i!==b.cell;i=parent[i])path.push(i);
        b.route=path.reverse().concat(b.route.slice(targets.get(cell)+1));return;
      }
      // Alternate passing sides so head-on players do not mirror every detour.
      const adjacent=this.neighbors(cell);if(nearest&&b.id>nearest.id)adjacent.reverse();
      for(const n of adjacent)if(parent[n]===-1&&clear(cell,n)){parent[n]=cell;queue.push(n);}
    }
  }
  move(b,dt){
    const before={...b.body.position};let budget=dt*this.speed(b)/.035;
    while(budget>1e-8&&b.eliminatedAt===null){
      if(b.phase===0&&!b.retreating)this.seekPickup(b);
      if(!b.route.length)this.plan(b);if(!b.route.length)break;
      const p=this.position(b.cell),q=this.position(b.route[0]);
      const amount=Math.min(budget,b.retreating?b.phase:1-b.phase);
      const phase=b.phase+(b.retreating?-amount:amount),next={x:p.x+(q.x-p.x)*phase,y:p.y+(q.y-p.y)*phase};
      if(!this.contact(b,next)){
        if(b.eliminatedAt!==null)break;
        if(b.phase>0)b.retreating=true;else this.detour(b);
        break;
      }
      b.phase=phase;b.body.position=next;budget-=amount;
      if(b.retreating&&b.phase<=1e-8){b.phase=0;b.retreating=false;this.detour(b);break;}
      if(!b.retreating&&b.phase>=1-1e-8){this.advance(b);b.phase=0;}
    }
    b.body.velocity=b.eliminatedAt!==null?{x:0,y:0}:{x:(b.body.position.x-before.x)/dt,y:(b.body.position.y-before.y)/dt};
  }
  eliminate(victim,attacker){
    if(victim===attacker||victim.eliminatedAt!==null||attacker.eliminatedAt!==null||this.protected(victim))return false;
    victim.eliminatedAt=this.time;victim.speedUntil=0;victim.shieldUntil=0;victim.route=[];victim.body.velocity={x:0,y:0};this.clearTrail(victim);
    let transferred=0;for(const i of this.valid)if(this.cells[i]===victim.id){this.setOwner(i,attacker.id);transferred++;}
    attacker.cuts++;this.totalCuts++;this.onHit(6,this.position(attacker.cell).x);
    this.events.unshift({type:'elimination',cutter:attacker.id,owner:victim.id,cells:transferred,time:this.time});return true;
  }
  spawnPickups(){
    this.pickups=this.pickups.filter(p=>p.expiresAt>this.time);
    if(this.time<this.nextPickupAt)return;
    this.nextPickupAt=this.time+7;
    for(const type of ['speed','shield']){
      if(this.pickups.some(p=>p.type===type))continue;
      const candidates=this.valid.filter(i=>this.trailOwners[i]===-1&&!this.pickups.some(p=>p.cell===i)&&!this.balls.some(b=>b.eliminatedAt===null&&b.cell===i));
      if(candidates.length)this.pickups.push({id:++this.pickupSequence,type,cell:candidates[Math.floor(this.rng()*candidates.length)],expiresAt:this.time+12});
    }
  }
  collectPickups(b){
    const p=this.position(b.cell);
    this.pickups=this.pickups.filter(item=>{
      const q=this.position(item.cell);if(Math.hypot(p.x-q.x,p.y-q.y)>15)return true;
      b[item.type==='speed'?'speedUntil':'shieldUntil']=this.time+TERRITORY_BUFFS[item.type].duration;
      this.events.unshift({type:item.type,owner:b.id,time:this.time});this.onHit(3,p.x);return false;
    });
  }
  capture(b){
    const seen=new Uint8Array(6400),queue=[];
    // Own land and the returning trail form a fence. Fill every enclosed pocket.
    const trail=new Set(b.trail),blocked=i=>this.cells[i]===b.id||trail.has(i);
    for(const i of this.valid)if(!blocked(i)&&this.neighbors(i).length<4){seen[i]=1;queue.push(i);}
    for(let head=0;head<queue.length;head++)for(const n of this.neighbors(queue[head]))if(!seen[n]&&!blocked(n)){seen[n]=1;queue.push(n);}
    let changed=0;for(const i of this.valid)if((!seen[i]||trail.has(i))&&this.cells[i]!==b.id){this.setOwner(i,b.id);changed++;}
    this.clearTrail(b);if(changed){b.claims++;this.totalClaims++;this.onHit(4,b.body.position.x);this.events.unshift({type:'claim',owner:b.id,cells:changed,time:this.time});}
    for(const other of this.balls)if(other!==b&&other.eliminatedAt===null&&other.area===0){if(this.protected(other))other.lastConqueror=b.id;else this.eliminate(other,b);}
  }
  advance(b){
    if(b.eliminatedAt!==null)return;
    if(!b.route.length)this.plan(b);const next=b.route[0];if(next===undefined)return;
    const p=this.position(next);if(!this.contact(b,p))return;
    b.route.shift();b.cell=next;b.body.position=p;
    this.collectPickups(b);
    for(const victim of this.balls){
      if(victim===b||victim.eliminatedAt!==null)continue;
      if(victim.trail.includes(next))this.eliminate(victim,b);
    }
    if(this.cells[next]===b.id){if(b.trail.length)this.capture(b);}else if(!b.trail.includes(next)){this.trailOwners[next]=b.id;b.trail.push(next);}
  }
  start(){if(this.state==='ready')this.state='running';}
  share(b){return b.area/this.valid.length*100;}
  linkCount(b){return b.area;}
  ranking(){return [...this.balls].sort((a,b)=>(a.eliminatedAt!==null)-(b.eliminatedAt!==null)||b.area-a.area||b.cuts-a.cuts||a.id-b.id);}
  finish(){this.state='finished';this.finished=this.ranking();this.winners=this.finished.filter(b=>b.eliminatedAt===null&&b.area===this.finished[0].area);this.finished.forEach(b=>{if(b.eliminatedAt===null)b.finishedAt=this.time;});}
  step(ms=1000/120){
    if(this.state!=='running'||!Number.isFinite(ms)||ms<=0)return;
    let remaining=Math.min(ms/1000,this.duration-this.time);
    while(remaining>1e-8&&this.state==='running'){
      const dt=Math.min(remaining,1/120);this.time+=dt;this.spawnPickups();
      for(const b of this.balls){
        if(b.eliminatedAt!==null)continue;
        if(!b.area&&!this.protected(b)&&b.lastConqueror!==undefined){const conqueror=this.balls[b.lastConqueror];const owner=conqueror.eliminatedAt===null?conqueror:this.ranking().find(other=>other!==b&&other.eliminatedAt===null);if(owner)this.eliminate(b,owner);continue;}
        this.move(b,dt);
      }
      remaining-=dt;if(this.balls.filter(b=>b.eliminatedAt===null).length===1)this.finish();
    }
    this.events=this.events.filter(e=>this.time-e.time<2.5).slice(0,3);
    if(this.state==='running'&&this.time>=this.duration-1e-8){this.time=this.duration;this.finish();}
  }
  dispose(){}
}
