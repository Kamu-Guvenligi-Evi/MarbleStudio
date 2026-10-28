import {COLORS,NAMES,random} from './physics.js';
import {normalizeBallImages} from './ball-images.js';
import {normalizeNames} from './presentation.js';
import {COUNTRY_MAPS} from './territory-maps.js';

export const TERRITORY_SHAPES={portrait:'Dikey Arena',triangle:'Üçgen',square:'Kare',hexagon:'Altıgen',star:'Yıldız',circle:'Daire',...Object.fromEntries(Object.entries(COUNTRY_MAPS).map(([id,map])=>[id,map.name]))};
export const TERRITORY_BUFFS={speed:{duration:2,multiplier:1.8},shield:{duration:1.5}};
export const TERRITORY_BALL_RADIUS=19;
export const TERRITORY_PICKUP_RADIUS=15;
export function shapeOutline(shape){
  if(shape==='portrait')return [{x:60,y:190},{x:480,y:190},{x:504,y:214},{x:504,y:778},{x:480,y:802},{x:60,y:802},{x:36,y:778},{x:36,y:214}];
  if(COUNTRY_MAPS[shape])return COUNTRY_MAPS[shape].outline.map(p=>({...p}));
  if(shape==='triangle')return [{x:270,y:280},{x:508,y:740},{x:32,y:740}];
  if(shape==='square')return [{x:48,y:288},{x:492,y:288},{x:492,y:732},{x:48,y:732}];
  const count=shape==='star'?10:shape==='hexagon'?6:80;
  return Array.from({length:count},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/count,r=shape==='star'&&i%2?126:228;return {x:270+Math.cos(a)*r,y:510+Math.sin(a)*r};});
}
function inside(p,vertices){let yes=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){const a=vertices[i],b=vertices[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
export class TerritoryBattle{
  constructor({seed=2048,count=8,arenaShape='portrait',territoryDuration=60,ballImages=[],ballNames=[],onHit=()=>{}}={}){
    this.mode='arena';this.arenaGame='territory';this.arenaShape=Object.hasOwn(TERRITORY_SHAPES,arenaShape)?arenaShape:'triangle';
    this.duration=[30,45,60,90].includes(territoryDuration)?territoryDuration:60;this.seed=seed;this.onHit=onHit;this.rng=random(seed);
    this.time=0;this.state='ready';this.finished=[];this.winners=[];this.totalCuts=0;this.totalClaims=0;this.events=[];
    this.pickups=[];this.nextPickupAt=2;this.pickupSequence=0;
    this.sectionCount=1;this.sections=[];this.sequence=[];this.finishY=960;this.isCustom=true;
    this.size=80;this.rows=this.arenaShape==='portrait'?108:80;this.originY=this.arenaShape==='portrait'?174:270;this.cellSize=6;this.openingDuration=2.5;this.cellSeconds=count<=3 ? .035 : COUNTRY_MAPS[this.arenaShape] ? .085 : .075;this.outline=shapeOutline(this.arenaShape);this.cells=new Int16Array(this.rows*80).fill(-2);this.trailOwners=new Int16Array(this.rows*80).fill(-1);this.valid=[];
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
  position(i){return {x:30+(i%80+.5)*6,y:this.originY+(Math.floor(i/80)+.5)*6};}
  neighbors(i){const x=i%80,y=Math.floor(i/80);return [x?i-1:-1,x<79?i+1:-1,y?i-80:-1,y<this.rows-1?i+80:-1].filter(n=>n>=0&&this.cells[n]!==-2);}
  setOwner(i,id){const previous=this.cells[i];if(previous===-2||previous===id)return;
    // Keep each opening home intact while everyone learns the arena.
    if(previous>=0&&this.opening()){const home=this.balls[previous].home;if(Math.abs(i%80-home%80)<=1&&Math.abs(Math.floor(i/80)-Math.floor(home/80))<=1)return;}if(previous>=0)this.balls[previous].area--;this.cells[i]=id;if(id>=0)this.balls[id].area++;}
  seedHome(b){const x=b.home%80,y=Math.floor(b.home/80);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)this.setOwner((y+dy)*80+x+dx,b.id);}
  rectangleValid(cell,dx,dy){const x=cell%80,y=Math.floor(cell/80),x2=x+dx,y2=y+dy;if(x2<0||x2>=80||y2<0||y2>=this.rows)return false;for(let yy=Math.min(y,y2);yy<=Math.max(y,y2);yy++)for(let xx=Math.min(x,x2);xx<=Math.max(x,x2);xx++)if(this.cells[yy*80+xx]===-2)return false;return true;}
  speed(b){return b.speedUntil>this.time?TERRITORY_BUFFS.speed.multiplier:1;}
  travelTime(b,steps){
    const boosted=Math.max(0,b.speedUntil-this.time),work=Math.max(0,steps)*this.cellSeconds;
    return work<=boosted*TERRITORY_BUFFS.speed.multiplier?work/TERRITORY_BUFFS.speed.multiplier:work-boosted*(TERRITORY_BUFFS.speed.multiplier-1);
  }
  useBuff(b){
    if(!b.buffDecision)return;
    b.buffDecision=false;
    if(b.speedUntil<=this.time&&b.shieldUntil<=this.time)return;
    b.nextHuntAt=0;
    // Reconsider an unstarted loop, never turn midway through a cell or abandon
    // a committed claim. Speed already helps an open claim close sooner.
    if(!b.trail.length&&this.cells[b.cell]===b.id&&b.route.some(cell=>this.cells[cell]!==b.id)&&this.cells[b.route.at(-1)]===b.id){
      b.route=[];b.detourResumeRoute=null;b.launchReady=false;
    }
  }
  localRoute(b,accept,maxSteps=28,rank=null){
    const others=this.balls.filter(other=>other!==b&&other.eliminatedAt===null);
    const parent=new Int16Array(this.rows*80).fill(-1),depth=new Uint8Array(this.rows*80),queue=[b.cell];parent[b.cell]=b.cell;
    let best=null,bestScore=Infinity;
    const result=cell=>{const path=[];for(let i=cell;i!==b.cell;i=parent[i])path.push(i);return {cell,path:path.reverse()};};
    for(let head=0;head<queue.length;head++){
      const cell=queue[head];
      if(accept(cell,depth[cell])){
        if(!rank)return result(cell);
        const score=rank(cell,depth[cell]);if(score<bestScore){bestScore=score;best=cell;}
      }
      if(depth[cell]>=maxSteps)continue;
      for(const n of this.neighbors(cell))if(parent[n]===-1){
        const p=this.position(n);
        if(others.some(other=>Math.hypot(p.x-other.body.position.x,p.y-other.body.position.y)<b.body.circleRadius+other.body.circleRadius+5))continue;
        parent[n]=cell;depth[n]=depth[cell]+1;queue.push(n);
      }
    }
    return best===null?null:result(best);
  }
  resumeAfterPickup(b){
    const original=b.pickupTarget.resumeRoute,targets=new Map();
    original.forEach((cell,i)=>{if(!targets.has(cell))targets.set(cell,i);});
    const join=this.localRoute(b,cell=>targets.has(cell));
    b.pickupTarget=null;b.nextPickupLookAt=this.time+.35;
    // Rejoin at the nearest point instead of finishing a wasted out-and-back trip.
    b.route=join?join.path.concat(original.slice(targets.get(join.cell)+1)):[];
  }
  seekPickup(b){
    // Commit to an open claim. Buffs touching the route are still collected.
    if(b.trail.length||b.pickupTarget||b.shieldUntil>this.time||b.speedUntil>this.time||this.time<(b.nextPickupLookAt??0))return;
    b.nextPickupLookAt=this.time+.35;
    const maxSteps=28,p=this.position(b.cell),wanted=this.pickups.filter(item=>{
      const q=this.position(item.cell),active=b[item.type==='speed'?'speedUntil':'shieldUntil']>this.time;
      return !active&&item.expiresAt>this.time+.15&&Math.hypot(p.x-q.x,p.y-q.y)<=maxSteps*6;
    });
    if(!wanted.length)return;
    const targets=new Map(wanted.map(item=>[item.cell,item]));
    const reachable=(cell,steps)=>targets.has(cell)&&targets.get(cell).expiresAt>this.time+this.travelTime(b,steps)+.15;
    let target=this.localRoute(b,reachable,maxSteps);
    if(!target){
      // A larger rival can block the pickup's centre while its edge remains reachable.
      const touching=(cell,steps)=>{const p=this.position(cell);return wanted.find(item=>{
        const q=this.position(item.cell);return item.expiresAt>this.time+this.travelTime(b,steps)+.15&&Math.hypot(p.x-q.x,p.y-q.y)<=b.body.circleRadius+TERRITORY_PICKUP_RADIUS;
      });};
      target=this.localRoute(b,(cell,steps)=>Boolean(touching(cell,steps)),maxSteps);
      if(target)target.item=touching(target.cell,target.path.length);
    }
    if(!target)return;
    if(!target.path.length){this.collectPickups(b);return;}
    b.pickupTarget={item:target.item??targets.get(target.cell),resumeRoute:[b.cell,...b.route]};
    b.route=target.path;
  }
  tryCloseTrail(b){
    if(this.exposed(b)&&b.shieldUntil>this.time&&!this.opening()){
      if(this.time<(b.nextShieldLookAt??0))return false;
      b.nextShieldLookAt=this.time+.12;
      const remaining=b.shieldUntil-this.time,homeIndex=b.route.findIndex(cell=>this.cells[cell]===b.id);
      if(homeIndex>=0&&this.travelTime(b,homeIndex+1)+.18<=remaining)return false;
      const home=this.localRoute(b,cell=>this.cells[cell]===b.id,48);
      // Start banking the claim before protection expires, including the trip
      // home and a margin for cell-boundary decisions and moving obstacles.
      if(home?.path.length&&this.travelTime(b,home.path.length)+.3>=remaining){
        b.route=home.path;b.detourResumeRoute=null;return true;
      }
      return false;
    }
    if(!this.exposed(b)||b.trail.length<12||this.protected(b)||this.time<(b.nextSafetyLookAt??0))return false;
    b.nextSafetyLookAt=this.time+.6;
    if(b.route.slice(0,8).some(cell=>this.cells[cell]===b.id))return false;
    const p=this.position(b.cell),others=this.balls.filter(other=>other!==b&&other.eliminatedAt===null);
    if(!others.some(other=>Math.hypot(p.x-other.body.position.x,p.y-other.body.position.y)<60))return false;
    // Only a nearby exit from immediate danger; keep ordinary greedy loops elsewhere.
    const parent=new Int16Array(this.rows*80).fill(-1),depth=new Uint8Array(this.rows*80),queue=[b.cell];parent[b.cell]=b.cell;
    for(let head=0;head<queue.length;head++){
      const cell=queue[head];
      if(this.cells[cell]===b.id){
        const path=[];for(let i=cell;i!==b.cell;i=parent[i])path.push(i);
        b.route=path.reverse();return true;
      }
      if(depth[cell]>=8)continue;
      for(const n of this.neighbors(cell))if(parent[n]===-1){
        const q=this.position(n);
        if(others.some(other=>Math.hypot(q.x-other.body.position.x,q.y-other.body.position.y)<b.body.circleRadius+other.body.circleRadius+5))continue;
        parent[n]=cell;depth[n]=depth[cell]+1;queue.push(n);
      }
    }
    return false;
  }
  seekCut(b){
    if(this.opening()||b.trail.length||b.pickupTarget||this.time<(b.nextHuntAt??0))return false;
    b.nextHuntAt=this.time+.8;
    const targets=new Map();
    for(const victim of this.balls){
      if(victim===b||victim.eliminatedAt!==null||this.protected(victim)||victim.trail.length<8)continue;
      for(const cell of victim.trail)targets.set(cell,victim.id);
    }
    if(!targets.size)return false;
    const shieldRemaining=b.shieldUntil-this.time;
    const range=shieldRemaining>0?32:b.speedUntil>this.time?22:12;
    const target=this.localRoute(b,(cell,steps)=>targets.has(cell)&&(shieldRemaining>0?this.travelTime(b,steps*2)+.2<=shieldRemaining:this.travelTime(b,steps)<=12*this.cellSeconds),range);
    if(!target?.path.length)return false;
    // A protected raid has a known route back even if the victim banks its trail.
    b.route=shieldRemaining>0?target.path.concat([b.cell,...target.path.slice(0,-1)].reverse()):target.path;
    b.detourResumeRoute=null;b.launchReady=false;
    return true;
  }
  cutTrails(b){
    if(this.opening())return;
    // Use the visible marble edge, not just its centre cell, to cut an open trail.
    const p=b.body.position,r=b.body.circleRadius+2.25,reach=Math.ceil(r/this.cellSize);
    const x=Math.floor((p.x-30)/this.cellSize),y=Math.floor((p.y-this.originY)/this.cellSize);
    for(let yy=Math.max(0,y-reach);yy<=Math.min(this.rows-1,y+reach);yy++)for(let xx=Math.max(0,x-reach);xx<=Math.min(79,x+reach);xx++){
      const cell=yy*80+xx,id=this.trailOwners[cell];if(id<0||id===b.id)continue;
      const q=this.position(cell);if((p.x-q.x)**2+(p.y-q.y)**2<=r*r)this.eliminate(this.balls[id],b,'trail',q);
    }
  }
  claimCandidate(b,dx,dy,horizontal){
    const moves=horizontal?[[Math.sign(dx),Math.abs(dx)],[Math.sign(dy)*80,Math.abs(dy)],[-Math.sign(dx),Math.abs(dx)],[-Math.sign(dy)*80,Math.abs(dy)]]:[[Math.sign(dy)*80,Math.abs(dy)],[Math.sign(dx),Math.abs(dx)],[-Math.sign(dy)*80,Math.abs(dy)],[-Math.sign(dx),Math.abs(dx)]];
    const route=[],trail=new Set();let cell=b.cell,closed=false;
    outer:for(const [delta,n] of moves)for(let i=0;i<n;i++){
      cell+=delta;route.push(cell);
      if(this.cells[cell]!==b.id)trail.add(cell);
      else if(trail.size){closed=true;break outer;}
    }
    if(!closed)return null;
    // Capture happens at the FIRST return to owned land. Score that excursion,
    // not the rest of a rectangle which the marble will never travel.
    const x=b.cell%80,y=Math.floor(b.cell/80),left=Math.min(x,x+dx),top=Math.min(y,y+dy);
    const width=Math.abs(dx)+1,height=Math.abs(dy)+1,blocked=new Uint8Array(width*height),seen=new Uint8Array(width*height),queue=[];
    for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++){
      const i=yy*width+xx,c=(top+yy)*80+left+xx;
      blocked[i]=this.cells[c]===b.id||trail.has(c)?1:0;
      if(!blocked[i]&&(xx===0||yy===0||xx===width-1||yy===height-1)){seen[i]=1;queue.push(i);}
    }
    for(let head=0;head<queue.length;head++){
      const i=queue[head],xx=i%width,yy=Math.floor(i/width);
      for(const n of [xx>0?i-1:-1,xx+1<width?i+1:-1,yy>0?i-width:-1,yy+1<height?i+width:-1])if(n>=0&&!blocked[n]&&!seen[n]){seen[n]=1;queue.push(n);}
    }
    let gain=trail.size;
    for(let i=0;i<seen.length;i++)if(!blocked[i]&&!seen[i])gain++;
    return {route,gain,interior:gain-trail.size};
  }
  plan(b){
    if(b.eliminatedAt!==null)return;
    if(this.cells[b.cell]!==b.id){
      // Finish an open trail by returning to owned land.
      const parent=new Int16Array(this.rows*80).fill(-1),queue=[b.cell];parent[b.cell]=b.cell;
      for(let head=0;head<queue.length;head++){
        const cell=queue[head];
        if(this.cells[cell]===b.id){const path=[];for(let i=cell;i!==b.cell;i=parent[i])path.push(i);b.route=path.reverse();return;}
        for(const n of this.neighbors(cell))if(parent[n]===-1){parent[n]=cell;queue.push(n);}
      }
      return;
    }
    if(!b.launchReady){
      // Walk through owned land to its frontier so the next loop expands outward.
      const parent=new Int16Array(this.rows*80).fill(-1),distance=new Uint16Array(this.rows*80),queue=[b.cell];parent[b.cell]=b.cell;
      let target=b.cell,best=-Infinity;
      for(let head=0;head<queue.length;head++){
        const cell=queue[head],adjacent=this.neighbors(cell),frontier=adjacent.filter(i=>this.cells[i]!==b.id).length;
        // Prefer a useful nearby edge over crossing the entire empire randomly.
        if(frontier){const score=frontier+this.rng()*.5-distance[cell]*.2;if(score>best){best=score;target=cell;}}
        for(const n of adjacent)if(this.cells[n]===b.id&&parent[n]===-1){parent[n]=cell;distance[n]=distance[cell]+1;queue.push(n);}
      }
      const path=[];for(let i=target;i!==b.cell;i=parent[i])path.push(i);b.launchReady=true;
      if(path.length){b.route=path.reverse();return;}
    }
    b.launchReady=false;
    // Alternate ordinary claims with ambitious loops: the extra area stays at risk
    // until the player reconnects to their land. Narrow maps retain small fallbacks.
    const ambitious=!this.opening()&&this.rng()<.3;
    const shieldBudget=b.shieldUntil-this.time-.2;
    const speedExtra=Math.floor(Math.max(0,b.speedUntil-this.time)*(TERRITORY_BUFFS.speed.multiplier-1)/this.cellSeconds/4);
    let best=null,score=-Infinity;
    for(let attempt=0;attempt<48;attempt++){
      const normalSpan=ambitious&&attempt<36?28:14;
      const span=shieldBudget>0?Math.max(1,Math.min(normalSpan,Math.floor(shieldBudget*this.speed(b)/this.cellSeconds/2)-3)):normalSpan+Math.min(6,speedExtra);
      const dx=(this.rng()<.5?-1:1)*(2+Math.floor(this.rng()*span)),dy=(this.rng()<.5?-1:1)*(2+Math.floor(this.rng()*span));
      if(!this.rectangleValid(b.cell,dx,dy))continue;
      for(const horizontal of [true,false]){
        const candidate=this.claimCandidate(b,dx,dy,horizontal);
        if(!candidate)continue;
        const travel=this.travelTime(b,candidate.route.length);
        if(shieldBudget>0&&travel>shieldBudget)continue;
        // Prefer an enclosed patch over drawing a thin strip along existing land.
        const value=(candidate.gain+candidate.interior)/(travel/(2*this.cellSeconds));
        if(value>score){score=value;best=candidate;}
      }
    }
    if(!best){const adjacent=this.neighbors(b.cell);b.route=adjacent.length?[adjacent[Math.floor(this.rng()*adjacent.length)]]:[];return;}
    b.route=best.route;
  }
  trimTrail(b,length=0){const removed=b.trail.splice(length);for(const i of removed)if(this.trailOwners[i]===b.id)this.trailOwners[i]=this.balls.find(other=>other.eliminatedAt===null&&other.trail.includes(i))?.id??-1;}
  clearTrail(b){this.trimTrail(b);b.trailAnchor=null;}
  opening(){return this.state==='running'&&this.time<this.openingDuration;}
  protected(b){return this.opening()||b.shieldUntil>this.time;}
  exposed(b){return b.trail.length>0&&this.cells[b.cell]!==b.id;}
  contact(b,p){
    for(const other of this.balls){
      if(other===b||other.eliminatedAt!==null)continue;
      const q=other.body.position;
      // Include the visible outline. Resolve contact before two bodies overlap.
      if(Math.hypot(p.x-q.x,p.y-q.y)>=b.body.circleRadius+other.body.circleRadius+4-1e-8)continue;
      const vulnerable=this.exposed(b)&&!this.protected(b),otherVulnerable=this.exposed(other)&&!this.protected(other);
      // Equally exposed bodies yield. Array iteration order must not choose a winner.
      if(otherVulnerable&&!vulnerable&&this.eliminate(other,b,'contact',p))continue;
      if(vulnerable&&!otherVulnerable)this.eliminate(b,other,'contact',p);
      return false;
    }
    return true;
  }
  detour(b){
    if(this.time<(b.nextDetourAt??0))return;
    b.nextDetourAt=this.time+.15;
    const obstacles=this.balls.filter(other=>other!==b&&other.eliminatedAt===null).map(other=>({...other.body.position,id:other.id,spacing:b.body.circleRadius+other.body.circleRadius+4}));
    const p=this.position(b.cell),nearest=obstacles.reduce((best,o)=>!best||Math.hypot(o.x-p.x,o.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?o:best,null);
    const clear=(from,to)=>{
      const p=this.position(from),q=this.position(to),dx=q.x-p.x,dy=q.y-p.y;
      return obstacles.every(o=>{
        const t=Math.max(0,Math.min(1,((o.x-p.x)*dx+(o.y-p.y)*dy)/(dx*dx+dy*dy)));
        // Leave a cell of room for moving rivals; allow stepping away from a
        // close neighbour instead of repeatedly rejoining a blocked segment.
        const margin=Math.min(o.spacing+this.cellSize,Math.hypot(p.x-o.x,p.y-o.y));
        return Math.hypot(p.x+dx*t-o.x,p.y+dy*t-o.y)>=Math.max(o.spacing,margin)-1e-8;
      });
    };
    // Rejoin the existing route around a blocking body, without choosing new land.
    const targets=new Map();b.route.forEach((cell,i)=>{if(cell!==b.cell&&!targets.has(cell))targets.set(cell,i);});
    const parent=new Int16Array(this.rows*80).fill(-1),depth=new Uint8Array(this.rows*80),queue=[b.cell];parent[b.cell]=b.cell;
    const pathTo=cell=>{const path=[];for(let i=cell;i!==b.cell;i=parent[i])path.push(i);return path.reverse();};
    let escape=b.cell,escapeScore=-Infinity;
    for(let head=0;head<queue.length;head++){
      const cell=queue[head];
      if(targets.has(cell)){
        b.route=pathTo(cell).concat(b.route.slice(targets.get(cell)+1));return;
      }
      const q=this.position(cell),distance=Math.hypot(q.x-p.x,q.y-p.y);
      if(distance>=12){
        const clearance=Math.min(...obstacles.map(o=>Math.hypot(q.x-o.x,q.y-o.y)-o.spacing));
        // Prefer yielding sideways: backing straight away sends head-on
        // players back into the same collision when they resume their routes.
        const lateral=nearest?Math.abs((q.x-p.x)*(nearest.y-p.y)-(q.y-p.y)*(nearest.x-p.x))/Math.max(1,Math.hypot(nearest.x-p.x,nearest.y-p.y)):0;
        const score=Math.min(clearance,24)+Math.min(lateral,36)*.5-depth[cell]*.5;
        if(score>escapeScore){escape=cell;escapeScore=score;}
      }
      if(depth[cell]>=36)continue;
      // Alternate passing sides so head-on players do not mirror every detour.
      const adjacent=this.neighbors(cell);if(nearest&&b.id>nearest.id)adjacent.reverse();
      for(const n of adjacent)if(parent[n]===-1&&!(n===b.blockedCell&&this.time<b.blockedUntil)&&clear(cell,n)){parent[n]=cell;depth[n]=depth[cell]+1;queue.push(n);}
    }
    // A crowded pocket can make every old waypoint unreachable. Yield into
    // nearby free space and plan again instead of retrying the same wall.
    if(escape!==b.cell){b.detourResumeRoute??=[...b.route];b.route=pathTo(escape);b.pickupTarget=null;b.launchReady=false;}
  }
  move(b,dt){
    if(b.eliminatedAt!==null)return;
    this.collectPickups(b);
    const before={...b.body.position};let budget=dt*this.speed(b)/this.cellSeconds;
    while(budget>1e-8&&b.eliminatedAt===null){
      if(b.phase===0&&!b.retreating){
        if(b.pickupTarget&&(!this.pickups.includes(b.pickupTarget.item)||b.pickupTarget.item.expiresAt<=this.time))this.resumeAfterPickup(b);
        this.useBuff(b);
        if(this.tryCloseTrail(b))b.pickupTarget=null;else if(!this.seekCut(b))this.seekPickup(b);
      }
      if(!b.route.length&&b.detourResumeRoute){
        const targets=new Map();b.detourResumeRoute.forEach((cell,i)=>targets.set(cell,i));
        // Resume at a reachable forward waypoint. Jumping straight to the final
        // home cell abandons the entire claim after every sideways dodge.
        const visited=new Set(b.trail);
        const destination=b.detourResumeRoute.at(-1),claim=b.trail.length&&this.cells[destination]===b.id;
        const join=claim
          ?this.localRoute(b,cell=>targets.has(cell)&&!visited.has(cell),36,(cell,steps)=>steps+targets.get(cell)*.5)
          :this.localRoute(b,cell=>cell===destination,36)??this.localRoute(b,cell=>targets.has(cell));
        if(join)b.route=join.path.concat(b.detourResumeRoute.slice(targets.get(join.cell)+1));
        b.detourResumeRoute=null;
      }
      if(!b.route.length)this.plan(b);if(!b.route.length)break;
      const p=this.position(b.cell),q=this.position(b.route[0]);
      const amount=Math.min(budget,b.retreating?b.phase:1-b.phase);
      const phase=b.phase+(b.retreating?-amount:amount),next={x:p.x+(q.x-p.x)*phase,y:p.y+(q.y-p.y)*phase};
      if(!this.contact(b,next)){
        if(b.eliminatedAt!==null)break;
        if(!b.retreating){b.blockedCell=b.route[0];b.blockedUntil=this.time+.75;}
        if(b.phase>0)b.retreating=true;else this.detour(b);
        break;
      }
      b.phase=phase;b.body.position=next;budget-=amount;this.collectPickups(b);this.cutTrails(b);
      if(b.retreating&&b.phase<=1e-8){b.phase=0;b.retreating=false;this.detour(b);break;}
      if(!b.retreating&&b.phase>=1-1e-8){this.advance(b);b.phase=0;}
    }
    b.body.velocity=b.eliminatedAt!==null?{x:0,y:0}:{x:(b.body.position.x-before.x)/dt,y:(b.body.position.y-before.y)/dt};
  }
  eliminate(victim,attacker,reason='trail',contactPosition=attacker.body.position){
    if(victim===attacker||victim.eliminatedAt!==null||attacker.eliminatedAt!==null||this.protected(victim))return false;
    const cutPosition={...contactPosition},lostTrail=[...victim.trail],trailAnchor=victim.trailAnchor,changedCells=[];
    victim.eliminatedAt=this.time;victim.speedUntil=0;victim.shieldUntil=0;victim.route=[];victim.pickupTarget=null;victim.body.velocity={x:0,y:0};this.clearTrail(victim);
    let transferred=0;for(const i of this.valid)if(this.cells[i]===victim.id){this.setOwner(i,attacker.id);transferred++;changedCells.push(i);}
    attacker.cuts++;this.totalCuts++;this.onHit(6,this.position(attacker.cell).x);
    this.events.unshift({type:'elimination',reason,cutter:attacker.id,owner:victim.id,cells:transferred,changedCells,trail:lostTrail,trailAnchor,position:{...victim.body.position},cutPosition,time:this.time});return true;
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
    if(b.eliminatedAt!==null)return;
    const p=b.body.position;
    this.pickups=this.pickups.filter(item=>{
      if(item.expiresAt<=this.time)return false;
      const q=this.position(item.cell);if(Math.hypot(p.x-q.x,p.y-q.y)>b.body.circleRadius+TERRITORY_PICKUP_RADIUS)return true;
      b[item.type==='speed'?'speedUntil':'shieldUntil']=this.time+TERRITORY_BUFFS[item.type].duration;
      b.buffDecision=true;
      this.events.unshift({type:item.type,owner:b.id,time:this.time});this.onHit(3,p.x);return false;
    });
  }
  capture(b){
    const seen=new Uint8Array(this.rows*80),queue=[];
    // Own land and the returning trail form a fence. Fill every enclosed pocket.
    const trail=new Set(b.trail),blocked=i=>this.cells[i]===b.id||trail.has(i);
    for(const i of this.valid)if(!blocked(i)&&this.neighbors(i).length<4){seen[i]=1;queue.push(i);}
    for(let head=0;head<queue.length;head++)for(const n of this.neighbors(queue[head]))if(!seen[n]&&!blocked(n)){seen[n]=1;queue.push(n);}
    let changed=0;const changedCells=[];for(const i of this.valid)if((!seen[i]||trail.has(i))&&this.cells[i]!==b.id){this.setOwner(i,b.id);if(this.cells[i]===b.id){changed++;changedCells.push(i);}}
    this.clearTrail(b);b.route=[];b.pickupTarget=null;b.detourResumeRoute=null;b.launchReady=false;
    if(changed){b.claims++;this.totalClaims++;this.onHit(4,b.body.position.x);this.events.unshift({type:'claim',owner:b.id,cells:changed,changedCells,position:{...b.body.position},time:this.time});}
    for(const other of this.balls)if(other!==b&&other.eliminatedAt===null&&other.area===0){if(this.protected(other))other.lastConqueror=b.id;else this.eliminate(other,b,'territory');}
  }
  advance(b){
    if(b.eliminatedAt!==null)return;
    if(!b.route.length)this.plan(b);const next=b.route[0];if(next===undefined)return;
    const p=this.position(next);if(!this.contact(b,p))return;
    const previous=b.cell;b.route.shift();b.cell=next;b.body.position=p;
    this.collectPickups(b);
    for(const victim of this.balls){
      if(victim===b||victim.eliminatedAt!==null)continue;
      if(victim.trail.includes(next))this.eliminate(victim,b,'trail',p);
    }
    if(this.cells[next]===b.id){if(b.trail.length)this.capture(b);}else{
      const revisited=b.trail.indexOf(next);
      // Retracing retracts the open path; otherwise the rendered line jumps from
      // the abandoned tip to the new route and cuts invisible or invented segments.
      if(revisited>=0)this.trimTrail(b,revisited+1);
      else{if(!b.trail.length)b.trailAnchor=previous;this.trailOwners[next]=b.id;b.trail.push(next);}
    }
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
        if(!b.area&&!this.protected(b)&&b.lastConqueror!==undefined){const conqueror=this.balls[b.lastConqueror];const owner=conqueror.eliminatedAt===null?conqueror:this.ranking().find(other=>other!==b&&other.eliminatedAt===null);if(owner)this.eliminate(b,owner,'territory');continue;}
        this.move(b,dt);
      }
      remaining-=dt;if(this.balls.filter(b=>b.eliminatedAt===null).length===1)this.finish();
    }
    this.events=this.events.filter(e=>this.time-e.time<8).slice(0,96);
    if(this.state==='running'&&this.time>=this.duration-1e-8){this.time=this.duration;this.finish();}
  }
  dispose(){}
}
