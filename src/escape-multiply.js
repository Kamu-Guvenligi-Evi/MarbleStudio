export const ESCAPE_RING={x:270,y:500,r:180};
export const ESCAPE_COLORS=['#ff6585','#ffb44a','#9781ff','#4ca6ff','#ffec4c','#51e5cc','#7cec67'];
const clamp=(v,d,a,b)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):d;
export function normalizeEscape(raw={}){
  raw=raw&&typeof raw==='object'?raw:{};
  return {seed:clamp(raw.seed,49,0,4294967295)>>>0,count:Math.round(clamp(raw.count,1,1,50)),addition:Math.round(clamp(raw.addition,3,1,10)),radius:clamp(raw.radius,5,1,16),gap:clamp(raw.gap,30,12,90),rotation:clamp(raw.rotation,-.9,-2,2),gravity:clamp(raw.gravity,220,0,800),duration:clamp(raw.duration,62,10,180),limit:Math.round(clamp(raw.limit,2000,100,6000)),speed:clamp(raw.speed,1,.25,3)};
}
export class EscapeMultiply{
  constructor(raw={}){
    this.impactCount=0;this.impactEnergy=0;this.impactX=0;this.settings=normalizeEscape(raw);this.seed=this.settings.seed;this.balls=[];this.time=0;this.ticks=0;this.created=0;this.escaped=0;this.lastEscapeAt=0;this.releaseAt=null;this.denseAt=null;this.contactRadius=this.settings.radius;this.opening=0;this.state='running';this.limited=false;this.onEscape=null;
    for(let i=0;i<this.settings.count;i++)this.spawn();
  }
  random(){let t=this.seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
  get angle(){
    if(!this.finalizing)return 1.9+this.time*this.settings.rotation;
    const start=1.9+this.releaseAt*this.settings.rotation,target=Math.PI/2;
    const delta=Math.atan2(Math.sin(target-start),Math.cos(target-start)),t=Math.min(1,(this.time-this.releaseAt)/.8);
    return start+delta*t*t*(3-2*t);
  }
  get finaleAge(){return this.finalizing?this.time-this.releaseAt:0;}
  get bursting(){return this.finalizing;}
  get capacity(){return Math.max(12,Math.floor(.56*(ESCAPE_RING.r/this.settings.radius)**2));}
  get finalizing(){return this.releaseAt!==null;}
  get halfGap(){const normal=this.settings.gap*Math.PI/360+this.opening;if(!this.finalizing)return normal;const t=this.finaleAge;return Math.min(Math.PI,Math.min(Math.max(normal,1.05),normal+t*.45)+Math.max(0,t-9)*.4);}
  grid(){if(this.balls.length>400)return {cells:new Map(),size:this.settings.radius*2+1};const cells=new Map(),size=this.contactRadius*2+1;for(const b of this.balls){if(b.outside)continue;const key=`${Math.floor(b.x/size)},${Math.floor(b.y/size)}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(b);}return {cells,size};}
  neighbors(x,y,grid){const result=[],cx=Math.floor(x/grid.size),cy=Math.floor(y/grid.size);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const cell=grid.cells.get(`${cx+dx},${cy+dy}`);if(cell)result.push(...cell);}return result;}
  spawn(){
    if(this.finalizing)return false;
    // Every escape feeds the same source; golden-angle rays spread each burst.
    const direction=this.created*2.399963229728653+this.time*.8;
    const velocity=360+this.random()*80;
    this.balls.push({x:ESCAPE_RING.x,y:ESCAPE_RING.y,
      vx:Math.cos(direction)*velocity,vy:Math.sin(direction)*velocity,
      bornAt:this.time,color:ESCAPE_COLORS[this.created%ESCAPE_COLORS.length],
      releaseDelay:(this.created*.61803398875%1)*1.2,outside:false});
    this.created++;return true;
  }
  impact(speed,x){
    if(speed<25)return;
    this.impactCount++;this.impactEnergy+=Math.min(1,speed/500);
    this.impactX+=Math.max(-1,Math.min(1,(x-ESCAPE_RING.x)/ESCAPE_RING.r));
  }
  collideRing(b,reflect=true){
    if(b.outside)return;
    const ring=ESCAPE_RING,r=this.settings.radius+.8;
    const dx=b.x-ring.x,dy=b.y-ring.y,d2=dx*dx+dy*dy;
    if(d2<(ring.r-r)**2||d2>(ring.r+r)**2)return;
    const gap=this.halfGap;if(gap>=Math.PI)return;
    const ringAngle=this.angle,angle=Math.atan2(dy,dx),relative=Math.atan2(Math.sin(angle-ringAngle),Math.cos(angle-ringAngle));
    // The open arc has no wall. Only its rounded endpoints can touch a ball.
    const closestAngle=Math.abs(relative)>=gap?angle:ringAngle+(relative<0?-gap:gap);
    const x=ring.x+Math.cos(closestAngle)*ring.r,y=ring.y+Math.sin(closestAngle)*ring.r;
    const cx=b.x-x,cy=b.y-y,distance=Math.hypot(cx,cy);
    if(distance>=r)return;
    const nx=distance>1e-8?cx/distance:-Math.cos(closestAngle),ny=distance>1e-8?cy/distance:-Math.sin(closestAngle);
    b.x=x+nx*(r+.001);b.y=y+ny*(r+.001);
    const velocity=b.vx*nx+b.vy*ny;
    if(reflect&&velocity<0){
      this.impact(-velocity,b.x);b.vx-=2*velocity*nx;b.vy-=2*velocity*ny;
      if(this.balls.length>400&&ny<-.3&&!this.finalizing){
        const occupancy=(this.created-this.escaped)/this.capacity;
        b.vy=Math.min(b.vy,-Math.sqrt(2*this.settings.gravity*Math.min(320,70+occupancy*100))*(.65+this.random()*.35));
      }
    }
  }
  separate(){
    if(this.balls.length>400)return;
    const diameter=this.contactRadius*2;
    for(let pass=0;pass<(this.balls.length>400?2:5);pass++){
      const grid=this.grid(),seen=new Set();
      for(const b of this.balls){if(b.outside)continue;seen.add(b);for(const a of this.neighbors(b.x,b.y,grid)){
        if(seen.has(a))continue;
        // Let newborn rays leave the shared source before pair collisions.
        if(this.time-(a.bornAt??-1)<.08||this.time-(b.bornAt??-1)<.08)continue;
        const dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;if(d2>=diameter*diameter)continue;
        const d=Math.sqrt(d2),nx=d>1e-8?dx/d:1,ny=d>1e-8?dy/d:0,push=(diameter-d+.02)/2;
        b.x-=nx*push;b.y-=ny*push;a.x+=nx*push;a.y+=ny*push;
        const relative=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
        if(relative<0){this.impact(-relative,(a.x+b.x)/2);const impulse=-relative;b.vx-=impulse*nx;b.vy-=impulse*ny;a.vx+=impulse*nx;a.vy+=impulse*ny;}
      }}
      for(const b of this.balls)this.collideRing(b,false);
    }
  }
  measureFill(){
    // Sample actual marble coverage in every horizontal band, including the top.
    const r=this.settings.radius,pitch=Math.max(5,r),bound=ESCAPE_RING.r-r;
    const size=Math.ceil(360/pitch)+1,covered=new Uint8Array(size*size);
    for(const b of this.balls){if(b.outside)continue;
      const x=b.x-90,y=b.y-320;
      for(let iy=Math.max(0,Math.ceil((y-r)/pitch));iy<=Math.min(size-1,Math.floor((y+r)/pitch));iy++)
      for(let ix=Math.max(0,Math.ceil((x-r)/pitch));ix<=Math.min(size-1,Math.floor((x+r)/pitch));ix++)
        if((ix*pitch-x)**2+(iy*pitch-y)**2<=r*r)covered[iy*size+ix]=1;
    }
    const total=[0,0,0,0],hits=[0,0,0,0];
    for(let iy=0;iy<size;iy++)for(let ix=0;ix<size;ix++){
      const x=ix*pitch-180,y=iy*pitch-180;if(x*x+y*y>bound*bound)continue;
      const band=Math.min(3,Math.max(0,Math.floor((y+180)/90)));total[band]++;hits[band]+=covered[iy*size+ix];
    }
    return Math.min(...total.map((n,i)=>n?hits[i]/n:0));
  }
  step(){
    if(this.state!=='running')return;
    const dt=1/120,s=this.settings,ring=ESCAPE_RING;
    this.time=++this.ticks*dt;let births=0,write=0;
    const occupancy=(this.created-this.escaped)/this.capacity;
    if(occupancy>=1&&this.denseAt===null)this.denseAt=this.time;
    this.contactRadius=s.radius*Math.min(1,Math.sqrt(400/Math.max(1,this.balls.length)));
    if(!this.finalizing&&this.ticks%12===0){
      const fill=this.measureFill();this.fill=fill;
      this.fullSince=fill>=.97?(this.fullSince??this.time):null;
      if(this.fullSince!==null&&this.time-this.fullSince>=3){this.releaseAt=this.time;this.releaseReason='full';this.releaseFill=fill;}
    }
    if(!this.finalizing)this.opening+=(Math.max(0,Math.min(1,(occupancy-.6)/.4))*.18-this.opening)*dt*2;
    const bursting=this.bursting,age=this.finaleAge;
    // Gravity ramps up continuously; balls retain their individual momentum.
    const drainGravity=bursting?Math.max(0,650-s.gravity)*Math.min(1,age/1.5):0;
    for(let i=0,n=this.balls.length;i<n;i++){
      const b=this.balls[i];b.vy+=s.gravity*dt;
      if(bursting)b.vy+=drainGravity*dt;
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(!b.outside){
        this.collideRing(b);
        if((b.x-ring.x)**2+(b.y-ring.y)**2>(ring.r+s.radius+.8)**2){
          b.outside=true;this.escaped++;this.lastEscapeAt=this.time;births+=s.addition;this.onEscape?.(b);
        }
      }
      if(b.outside&&(b.y>960+s.radius||((b.x < -150&&b.vx<0)||(b.x>690&&b.vx>0))))continue;
      this.balls[write++]=b;
    }
    this.balls.length=write;
    this.separate();
    if(!this.finalizing){for(let i=0;i<births;i++)this.spawn();}

    if(this.finalizing&&this.balls.length===0){this.emptyAt??=this.time;if(this.time-this.emptyAt>=1.6)this.state='finished';}
  }
}
const marbleSprites=new Map();
const particleLayers=new WeakMap();
function marbleSprite(ctx,color,r){
  const key=color+":"+r;
  if(marbleSprites.has(key))return marbleSprites.get(key);
  const sprite=ctx.canvas.ownerDocument?ctx.canvas.ownerDocument.createElement('canvas'):new OffscreenCanvas(32,32);sprite.width=sprite.height=Math.max(2,Math.ceil(r*2));
  const c=sprite.getContext('2d');c.scale(sprite.width/32,sprite.height/32);
  c.fillStyle=color;c.beginPath();c.arc(16,16,15,0,Math.PI*2);c.fill();
  marbleSprites.set(key,sprite);return sprite;
}
export function renderEscape(ctx,game){
  const {width,height}=ctx.canvas;ctx.setTransform(width/540,0,0,height/960,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,540,960);

  ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 23px Arial';ctx.fillText(game.finalizing?(game.balls.length?'LET IT POUR!':'ALL BALLS ESCAPED'):`+${game.settings.addition} after each escape`,270,177);
  ctx.fillStyle='#fff';ctx.font='18px Arial';ctx.fillText(`Inside: ${(game.created-game.escaped).toLocaleString('en-US')}`,270,282);
  ctx.font='13px Arial';ctx.fillText(`Escaped: ${game.escaped.toLocaleString('en-US')}  |  Total created: ${game.created.toLocaleString('en-US')}`,270,305);
  ctx.save();
  const r=game.settings.radius;
  let layer=particleLayers.get(ctx);
  if(!layer){
    const canvas=ctx.canvas.ownerDocument?ctx.canvas.ownerDocument.createElement('canvas'):new OffscreenCanvas(540,960);
    canvas.width=540;canvas.height=960;
    const context=canvas.getContext('2d'),data=context.createImageData(540,960);
    layer={canvas,context,data,pixels:new Uint32Array(data.data.buffer),radius:null,coverage:new Uint32Array(17*960)};particleLayers.set(ctx,layer);
  }
  if(layer.radius!==r){
    layer.radius=r;layer.size=Math.max(2,Math.ceil(r*2));layer.sprites=ESCAPE_COLORS.map(color=>{
      const sprite=marbleSprite(ctx,color,r),data=sprite.getContext('2d').getImageData(0,0,sprite.width,sprite.height);
      const pixels=new Uint32Array(data.data.buffer),spans=[];
      // Cache solid horizontal runs once instead of rewriting every pixel in JS.
      for(let y=0;y<sprite.height;y++){
        let start=-1;
        for(let x=0;x<=sprite.width;x++){
          const covered=x<sprite.width&&data.data[(y*sprite.width+x)*4+3]>=128;
          if(covered&&start<0)start=x;
          if(!covered&&start>=0){spans.push(start,x,y);start=-1;}
        }
      }
      const center=(Math.floor(sprite.height/2)*sprite.width+Math.floor(sprite.width/2))*4;
      data.data[center+3]=255;
      spans.color=pixels[center/4];
      return spans;
    });
  }
  layer.pixels.fill(0);layer.coverage.fill(0);
  // Draw front to back: fully hidden pixels need no repeated color writes.
  for(let b=game.balls.length-1;b>=0;b--){
    const ball=game.balls[b];
    if(ball.x < -r||ball.x>540+r||ball.y<210||ball.y>960+r)continue;
    const sprite=layer.sprites[ESCAPE_COLORS.indexOf(ball.color)],left=Math.round(ball.x-r),top=Math.round(ball.y-r);
    for(let i=0;i<sprite.length;i+=3){
      const y=top+sprite[i+2];if(y<210||y>=960)continue;
      const x0=Math.max(0,left+sprite[i]),x1=Math.min(540,left+sprite[i+1]);
      for(let x=x0;x<x1;){
        const word=x>>>5,end=Math.min(x1,(word+1)*32),length=end-x;
        const mask=(length===32?0xffffffff:((1<<length)-1)<<(x&31))>>>0;
        const index=y*17+word,covered=layer.coverage[index];
        if(((covered&mask)>>>0)!==mask){
          for(let px=x;px<end;px++)if(!(covered&(1<<(px&31))))layer.pixels[y*540+px]=sprite.color;
          layer.coverage[index]=covered|mask;
        }
        x=end;
      }
    }
  }
  layer.context.putImageData(layer.data,0,0);ctx.drawImage(layer.canvas,0,0);
  const half=game.halfGap;if(half<Math.PI){ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.lineCap='round';ctx.beginPath();ctx.arc(270,500,180,game.angle+half,game.angle+Math.PI*2-half);ctx.stroke();}
  ctx.restore();
  if(game.bursting&&game.finaleAge<.7){const p=game.finaleAge/.7;ctx.globalAlpha=(1-p)*.7;ctx.strokeStyle='#fff';ctx.lineWidth=3*(1-p);ctx.beginPath();ctx.arc(270,500,180+p*100,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  if(game.finalizing&&game.balls.length===0){ctx.fillStyle='#000';ctx.fillRect(0,260,540,600);ctx.textAlign='center';ctx.fillStyle='#ffec4c';ctx.font='bold 64px Arial';ctx.fillText(game.created.toLocaleString('en-US'),270,478);ctx.fillStyle='#fff';ctx.font='bold 22px Arial';ctx.fillText('EVERY LAST BALL.',270,526);ctx.font='16px Arial';ctx.fillText('ESCAPED',270,560);}
}

