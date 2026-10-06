import {COLORS,NAMES,random} from './physics.js';
import {normalizeBallImages} from './ball-images.js';
import {normalizeNames} from './presentation.js';

export const TERRITORY_SHAPES={triangle:'Üçgen',square:'Kare',hexagon:'Altıgen',star:'Yıldız',circle:'Daire'};
export function shapeOutline(shape){
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
    this.sectionCount=1;this.sections=[];this.sequence=[];this.finishY=960;this.isCustom=true;
    this.size=80;this.cellSize=6;this.outline=shapeOutline(this.arenaShape);this.cells=new Int16Array(6400).fill(-2);this.trailOwners=new Int16Array(6400).fill(-1);this.valid=[];
    for(let i=0;i<this.cells.length;i++)if(inside(this.position(i),this.outline)){this.cells[i]=-1;this.valid.push(i);}
    const images=normalizeBallImages(ballImages),names=normalizeNames(ballNames),starts=[];
    this.balls=Array.from({length:Math.max(6,Math.min(20,count))},(_,id)=>{
      const candidates=this.valid.filter(i=>this.rectangleValid(i,3,3)&&this.rectangleValid(i,-3,-3));
      let home=candidates[Math.floor(this.rng()*candidates.length)],best=-1;
      if(starts.length)for(const cell of candidates){const p=this.position(cell),distance=Math.min(...starts.map(i=>{const q=this.position(i);return (p.x-q.x)**2+(p.y-q.y)**2;}));if(distance>best){best=distance;home=cell;}}
      starts.push(home);return {id,name:names[id]??NAMES[id],imageSrc:images[id],color:COLORS[id],cell:home,home,area:0,cuts:0,claims:0,trail:[],route:[],phase:0,eliminatedAt:null,finishedAt:null,body:{position:this.position(home),velocity:{x:0,y:0},circleRadius:9}};
    });
    for(const b of this.balls)this.seedHome(b);
  }
  position(i){return {x:30+(i%80+.5)*6,y:270+(Math.floor(i/80)+.5)*6};}
  neighbors(i){const x=i%80,y=Math.floor(i/80);return [x?i-1:-1,x<79?i+1:-1,y?i-80:-1,y<79?i+80:-1].filter(n=>n>=0&&this.cells[n]!==-2);}
  setOwner(i,id){const previous=this.cells[i];if(previous===-2||previous===id)return;if(previous>=0)this.balls[previous].area--;this.cells[i]=id;if(id>=0)this.balls[id].area++;}
  seedHome(b){const x=b.home%80,y=Math.floor(b.home/80);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)this.setOwner((y+dy)*80+x+dx,b.id);}
  rectangleValid(cell,dx,dy){const x=cell%80,y=Math.floor(cell/80),x2=x+dx,y2=y+dy;if(x2<0||x2>=80||y2<0||y2>=80)return false;for(let yy=Math.min(y,y2);yy<=Math.max(y,y2);yy++)for(let xx=Math.min(x,x2);xx<=Math.max(x,x2);xx++)if(this.cells[yy*80+xx]===-2)return false;return true;}
  plan(b){
    if(!b.launchReady&&this.cells[b.cell]===b.id){
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
      const dx=(this.rng()<.5?-1:1)*(4+Math.floor(this.rng()*12)),dy=(this.rng()<.5?-1:1)*(4+Math.floor(this.rng()*12));
      if(!this.rectangleValid(b.cell,dx,dy))continue;
      const x=b.cell%80,y=Math.floor(b.cell/80);let gain=0;
      for(let yy=Math.min(y,y+dy);yy<=Math.max(y,y+dy);yy++)for(let xx=Math.min(x,x+dx);xx<=Math.max(x,x+dx);xx++)if(this.cells[yy*80+xx]!==b.id)gain++;
      const value=gain/(Math.abs(dx)+Math.abs(dy)) + this.rng()*2;
      if(value>score){score=value;best={dx,dy,horizontal:this.rng()<.5};}
    }
    if(!best){const neighbor=this.neighbors(b.cell);b.route=[neighbor[Math.floor(this.rng()*neighbor.length)]];return;}
    let cell=b.cell;const {dx,dy,horizontal}=best,moves=horizontal?[[Math.sign(dx),Math.abs(dx)],[Math.sign(dy)*80,Math.abs(dy)],[-Math.sign(dx),Math.abs(dx)],[-Math.sign(dy)*80,Math.abs(dy)]]:[[Math.sign(dy)*80,Math.abs(dy)],[Math.sign(dx),Math.abs(dx)],[-Math.sign(dy)*80,Math.abs(dy)],[-Math.sign(dx),Math.abs(dx)]];
    for(const [delta,n] of moves)for(let i=0;i<n;i++){cell+=delta;b.route.push(cell);}
  }
  clearTrail(b){for(const i of b.trail)if(this.trailOwners[i]===b.id)this.trailOwners[i]=-1;b.trail=[];}
  capture(b){
    const seen=new Uint8Array(6400),queue=[];
    // Own land and the returning trail form a fence. Fill every enclosed pocket.
    const blocked=i=>this.cells[i]===b.id||this.trailOwners[i]===b.id;
    for(const i of this.valid)if(!blocked(i)&&this.neighbors(i).length<4){seen[i]=1;queue.push(i);}
    for(let head=0;head<queue.length;head++)for(const n of this.neighbors(queue[head]))if(!seen[n]&&!blocked(n)){seen[n]=1;queue.push(n);}
    let changed=0;for(const i of this.valid)if((!seen[i]||this.trailOwners[i]===b.id)&&this.cells[i]!==b.id){this.setOwner(i,b.id);changed++;}
    this.clearTrail(b);if(changed){b.claims++;this.totalClaims++;this.onHit(4,b.body.position.x);this.events.unshift({type:'claim',owner:b.id,cells:changed,time:this.time});}
  }
  resetRunner(b){
    this.clearTrail(b);b.route=[];b.launchReady=false;
    if(!b.area)this.seedHome(b);
    const p=this.position(b.cell);let nearest=b.home,distance=Infinity;
    for(const i of this.valid)if(this.cells[i]===b.id){const q=this.position(i),d=(p.x-q.x)**2+(p.y-q.y)**2;if(d<distance){distance=d;nearest=i;}}
    b.cell=nearest;b.body.position=this.position(nearest);b.phase=0;
  }
  advance(b){
    if(!b.route.length)this.plan(b);const next=b.route.shift();if(next===undefined)return;
    const victim=this.trailOwners[next];
    if(victim>=0&&victim!==b.id){this.resetRunner(this.balls[victim]);b.cuts++;this.totalCuts++;this.onHit(6,this.position(next).x);this.events.unshift({type:'cut',cutter:b.id,owner:victim,time:this.time});}
    b.cell=next;
    if(this.cells[next]===b.id){if(b.trail.length)this.capture(b);}else if(this.trailOwners[next]!==b.id){this.trailOwners[next]=b.id;b.trail.push(next);}
    if(!b.route.length&&b.trail.length)this.resetRunner(b);
    if(this.cells[b.cell]!==b.id&&!b.trail.length)this.resetRunner(b);
  }
  start(){if(this.state==='ready')this.state='running';}
  share(b){return b.area/this.valid.length*100;}
  linkCount(b){return b.area;}
  ranking(){return [...this.balls].sort((a,b)=>b.area-a.area||b.cuts-a.cuts||a.id-b.id);}
  step(ms=1000/120){if(this.state!=='running')return;let remaining=Math.min(ms/1000,this.duration-this.time);while(remaining>1e-8){const dt=Math.min(remaining,1/120);this.time+=dt;for(const b of this.balls){b.phase+=dt/.035;while(b.phase>=1){b.phase--;this.advance(b);}const p=this.position(b.cell),q=this.position(b.route[0]??b.cell);b.body.position={x:p.x+(q.x-p.x)*b.phase,y:p.y+(q.y-p.y)*b.phase};b.body.velocity={x:(q.x-p.x)/.035,y:(q.y-p.y)/.035};}remaining-=dt;}this.events=this.events.filter(e=>this.time-e.time<2.5).slice(0,3);if(this.time>=this.duration-1e-8){this.time=this.duration;this.state='finished';this.finished=this.ranking();this.winners=this.finished.filter(b=>b.area===this.finished[0].area);this.finished.forEach(b=>b.finishedAt=this.time);}}
  dispose(){}
}
