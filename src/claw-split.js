export const CLAW_RING={x:270,y:485,r:230};
export const clawBallRadius=radius=>radius;
const clamp=(v,d,a,b)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):d;
export function normalizeClaw(raw={}){
  raw=raw&&typeof raw==='object'?raw:{};
  return {seed:clamp(raw.seed,1,0,4294967295)>>>0,count:Math.round(clamp(raw.count,1,1,50)),radius:clamp(raw.radius,5,1,16),rpm:clamp(raw.rpm,12,1,30),acceleration:clamp(raw.acceleration,.4,0,1),gravity:clamp(raw.gravity,280,0,800),duration:clamp(raw.duration,34,10,180),limit:Math.round(clamp(raw.limit,20000,100,20000)),speed:clamp(raw.speed,1,.25,3)};
}
export class ClawSplit{
  constructor(raw={}){this.settings=normalizeClaw(raw);this.seed=this.settings.seed;this.time=0;this.ticks=0;this.balls=[];this.particles=[];this.splits=0;this.state='running';this.limited=false;this.radius=this.settings.radius;this.onSplit=null;this.fill=0;this.finalTime=0;this.fillTicks=0;this.fullSince=null;this.coverage=new Int32Array(576).fill(-1000);for(let i=0;i<this.settings.count;i++){const a=this.random()*Math.PI*2;this.balls.push({x:270,y:485,vx:Math.cos(a)*45,vy:180,cooldown:0,trapped:false,capture:null});}}
  random(){let t=this.seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
  rotation(time=this.time){
    const {rpm,acceleration}=this.settings,headroom=Math.max(0,30-rpm);
    if(!acceleration||!headroom)return {rpm,turn:rpm*time*Math.PI/30};
    const k=acceleration/headroom,progress=-Math.expm1(-k*time);
    return {rpm:rpm+headroom*progress,turn:(rpm*time+headroom*(time-progress/k))*Math.PI/30};
  }
  get rpm(){return this.rotation().rpm;}
  get hue(){return (190+this.time*9)%360;}
  claws(time=this.time){
    const {turn}=this.rotation(time);
    // Each mirrored hook has ONE rim attachment, a trailing elbow and an
    // inward free tip. A symmetric V with both ends on the rim is not the reference.
    return [1,-1].map(sign=>{
      const a=Math.PI/2+sign*(1.1+turn);
      const points=[[0,0],[-sign*40,-34],[0,-68]];
      return points.map(([t,r])=>({x:CLAW_RING.x+Math.cos(a)*(CLAW_RING.r+r)-Math.sin(a)*t,y:CLAW_RING.y+Math.sin(a)*(CLAW_RING.r+r)+Math.cos(a)*t}));
    });
  }
  hit(b,claws){for(const points of claws)for(let i=0;i<2;i++){const a=points[i],z=points[i+1],dx=z.x-a.x,dy=z.y-a.y,t=Math.max(0,Math.min(1,((b.x-a.x)*dx+(b.y-a.y)*dy)/(dx*dx+dy*dy)));if(Math.hypot(b.x-a.x-t*dx,b.y-a.y-t*dy)<=this.radius+3)return true;}return false;}
  pocket(claws=this.claws()){
    const [l,r]=claws;
    const cross=(a,b)=>a.x*b.y-a.y*b.x;
    const intersection=(a,b,c,d)=>{
      const u={x:b.x-a.x,y:b.y-a.y},v={x:d.x-c.x,y:d.y-c.y},w={x:c.x-a.x,y:c.y-a.y},den=cross(u,v);
      if(Math.abs(den)<1e-8)return null;
      const t=cross(w,v)/den,k=cross(w,u)/den;
      return t>=0&&t<=1&&k>=0&&k<=1?{x:a.x+t*u.x,y:a.y+t*u.y}:null;
    };
    const outer=intersection(l[0],l[1],r[0],r[1]),inner=intersection(l[1],l[2],r[1],r[2]);
    if(!outer||!inner)return null;
    const points=[outer,l[1],inner,r[1]],x=270,y=(outer.y+inner.y)/2;
    const clearance=Math.min(...points.map((a,i)=>{const b=points[(i+1)%4];return Math.abs((b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x))/Math.hypot(b.x-a.x,b.y-a.y);}));
    return {points,x,y,clearance,minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};
  }
  inside(b,p){
    if(b.x<p.minX||b.x>p.maxX||b.y<p.minY||b.y>p.maxY)return false;
    let sign=0;
    for(let i=0;i<4;i++){const a=p.points[i],z=p.points[(i+1)%4],c=(z.x-a.x)*(b.y-a.y)-(z.y-a.y)*(b.x-a.x);if(Math.abs(c)<1e-7)continue;if(sign&&Math.sign(c)!==sign)return false;sign=Math.sign(c);}
    return !!sign;
  }
  segments(claws,time){
    const omega=this.rotation(time).rpm*Math.PI/30;
    return claws.flatMap((points,h)=>points.slice(0,2).map((a,i)=>{
      const z=points[i+1],dx=z.x-a.x,dy=z.y-a.y;
      return {x:a.x,y:a.y,dx,dy,length2:dx*dx+dy*dy,minX:Math.min(a.x,z.x),maxX:Math.max(a.x,z.x),minY:Math.min(a.y,z.y),maxY:Math.max(a.y,z.y),w:h===0?omega:-omega};
    }));
  }
  collide(b,segments){
    const radius=this.radius+2;
    if((b.x-270)**2+(b.y-485)**2<(150-radius)**2)return;
    for(const a of segments){
      if(b.x<a.minX-radius||b.x>a.maxX+radius||b.y<a.minY-radius||b.y>a.maxY+radius)continue;
      const t=Math.max(0,Math.min(1,((b.x-a.x)*a.dx+(b.y-a.y)*a.dy)/a.length2)),x=a.x+t*a.dx,y=a.y+t*a.dy,dx=b.x-x,dy=b.y-y,d2=dx*dx+dy*dy;
      if(d2>=radius*radius)continue;
      const d=Math.sqrt(d2),nx=d>1e-8?dx/d:-a.dy/Math.sqrt(a.length2),ny=d>1e-8?dy/d:a.dx/Math.sqrt(a.length2);
      const vx=-(y-485)*a.w,vy=(x-270)*a.w,v=(b.vx-vx)*nx+(b.vy-vy)*ny;
      b.x=x+nx*radius;b.y=y+ny*radius;
      if(v<0){b.vx-=1.35*v*nx;b.vy-=1.35*v*ny;}
    }
    const speed2=b.vx*b.vx+b.vy*b.vy;if(speed2>650*650){const scale=650/Math.sqrt(speed2);b.vx*=scale;b.vy*=scale;}
  }
  get capacity(){return Math.min(this.settings.limit,Math.floor(.84*(CLAW_RING.r/this.radius)**2));}
  separateBalls(){
    const balls=this.balls,diameter=this.radius*2,side=Math.ceil(460/diameter)+3;
    if(!this.contacts||this.contacts.side!==side||this.contacts.next.length<balls.length)this.contacts={side,heads:new Int32Array(side*side),next:new Int32Array(Math.max(2048,balls.length*2))};
    const {heads,next}=this.contacts,bound=CLAW_RING.r-this.radius;
    for(let pass=0;pass<4;pass++){
      heads.fill(-1);
      for(let i=0;i<balls.length;i++){const b=balls[i],x=Math.max(0,Math.min(side-1,Math.floor((b.x-40)/diameter)+1)),y=Math.max(0,Math.min(side-1,Math.floor((b.y-255)/diameter)+1)),cell=y*side+x;next[i]=heads[cell];heads[cell]=i;}
      for(let i=0;i<balls.length;i++){
        const a=balls[i],gx=Math.max(1,Math.min(side-2,Math.floor((a.x-40)/diameter)+1)),gy=Math.max(1,Math.min(side-2,Math.floor((a.y-255)/diameter)+1));
        for(let y=gy-1;y<=gy+1;y++)for(let x=gx-1;x<=gx+1;x++)for(let j=heads[y*side+x];j>=0;j=next[j]){
          if(j<=i)continue;const b=balls[j];let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2>=diameter*diameter)continue;
          const d=Math.sqrt(d2),nx=d>1e-8?dx/d:((i+j)%2?1:-1),ny=d>1e-8?dy/d:0,wa=a.trapped?0:1,wb=b.trapped?0:1,w=wa+wb;if(!w)continue;
          const correction=Math.max(0,diameter-d-.015)*.8/w;a.x-=nx*correction*wa;a.y-=ny*correction*wa;b.x+=nx*correction*wb;b.y+=ny*correction*wb;
          const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny,bias=Math.min(80,Math.max(0,diameter-d-.15)*24);if(relative<bias){const impulse=(bias-(1+(relative < -30?.45:0))*relative)/w;a.vx-=nx*impulse*wa;a.vy-=ny*impulse*wa;b.vx+=nx*impulse*wb;b.vy+=ny*impulse*wb;}
        }
      }
      for(const b of balls){const dx=b.x-270,dy=b.y-485,d=Math.hypot(dx,dy);if(d>bound){const nx=dx/d,ny=dy/d,v=b.vx*nx+b.vy*ny;b.x=270+nx*bound;b.y=485+ny*bound;if(v>0){b.vx-=1.5*v*nx;b.vy-=1.5*v*ny;}}}
    }
  }
  step(){
    if(this.state==='finishing'){this.finalTime+=1/120;if(this.finalTime>=4){this.state='finished';return;}}
    if(this.state==='finished')return;
    const dt=1/120,s=this.settings;this.time=++this.ticks*dt;
    // Ball size stays identical from the first ball through the finale.
    this.radius=s.radius;
    const radius=this.radius;

    // Resolve moving solid hooks in substeps. A touch only reflects the ball.
    const maxSpeed=650*650;
    const samples=Math.max(1,Math.ceil((Math.sqrt(maxSpeed)+this.rpm*Math.PI/30*CLAW_RING.r)*dt/(radius+2))),subdt=dt/samples,children=[];
    let previous=this.pocket(this.claws(this.time-dt));
    for(let sample=1;sample<=samples;sample++){
    const time=this.time-dt+sample*subdt,claws=this.claws(time),pocket=this.pocket(claws),segments=this.segments(claws,time);
    for(const b of this.balls){b.vy+=s.gravity*subdt;b.x+=b.vx*subdt;b.y+=b.vy*subdt;b.cooldown=Math.max(0,b.cooldown-subdt);
      let crushed=false;
      if((!pocket||this.limited)&&b.trapped){b.trapped=false;b.vx=b.capture?.vx||0;b.vy=b.capture?.vy||-180;b.capture=null;}
      else if(pocket&&!this.limited) {
        if(!b.cooldown&&!b.trapped&&this.inside(b,pocket)&&pocket.clearance>radius+2){b.trapped=true;b.capture={x:(b.x-pocket.x)/pocket.clearance,y:(b.y-pocket.y)/pocket.clearance,vx:b.vx,vy:b.vy};}
        if(b.trapped){
          // Once enclosed, the ball stays between the four arms until they crush it.
          b.x=pocket.x+b.capture.x*pocket.clearance;b.y=pocket.y+b.capture.y*pocket.clearance;b.vx=0;b.vy=0;
          crushed=!!previous&&pocket.clearance<previous.clearance&&pocket.clearance<=radius+2;
        }
      }
      if(!b.trapped)this.collide(b,segments);
      let dx=b.x-270,dy=b.y-485,d2=dx*dx+dy*dy,bound=CLAW_RING.r-radius;
      if(d2>bound*bound){const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,v=b.vx*nx+b.vy*ny;b.x=270+nx*bound;b.y=485+ny*bound;if(v>0){b.vx-=1.99*v*nx;b.vy-=1.99*v*ny;}}
      if(crushed){
        b.trapped=false;
        if(this.balls.length+children.length>=this.capacity){const speed=180,angle=Math.atan2(485-b.y,270-b.x);b.vx=Math.cos(angle)*speed;b.vy=Math.sin(angle)*speed;b.cooldown=.35;b.capture=null;continue;}
        const angle=Math.atan2(485-b.y,270-b.x),nx=Math.cos(angle),ny=Math.sin(angle),tx=-ny,ty=nx;
        
        const x=270,y=485;
        const spread=.35+this.random()*.6,bias=(this.random()-.5)*.5;
        const fragment=side=>{const a=Math.PI/2+bias*.35+side*spread*.55,v=220+this.random()*180;return {x:x+tx*side*(radius+2),y:y+ty*side*(radius+2),vx:Math.cos(a)*v,vy:Math.sin(a)*v,cooldown:.35,trapped:false,capture:null};};
        // Launch siblings downward from the center with varied speeds.
        // Seeded variation prevents every capture from restarting the same orbit.
        Object.assign(b,fragment(-1));b.capture=null;
        children.push(fragment(1));this.splits++;this.onSplit?.(b);
        if(this.particles.length<90)for(let i=0;i<3;i++){const a=this.random()*Math.PI*2;this.particles.push({x:b.x,y:b.y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,life:.35,hue:this.hue+(this.splits%7-3)*16,size:2,angle:a});}
      }
    }
    this.separateBalls();
    previous=pocket;
    }
    this.balls.push(...children);this.limited=this.balls.length>=this.capacity;if(children.length)this.separateBalls();
    for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
    // Sample occupied spatial cells, not just population: a pile is not a full ring.
    if(this.ticks%30===0){
      const cells=this.coverage;let occupied=0,total=0;
      for(const b of this.balls){const x=Math.floor((b.x-40)/460*24),y=Math.floor((b.y-255)/460*24);if(x>=0&&x<24&&y>=0&&y<24)cells[y*24+x]=this.ticks;}
      for(let y=0;y<24;y++)for(let x=0;x<24;x++){if((x-11.5)**2+(y-11.5)**2<11.5**2){total++;occupied+=Number(this.ticks-cells[y*24+x]===0);}}
      this.fill=occupied/total;
      const full=this.fill>=.90&&this.balls.length*this.radius*this.radius>=CLAW_RING.r**2*.76;
      this.fillTicks=full?this.fillTicks+1:Math.max(0,this.fillTicks-.25);
      if(this.fillTicks>=4&&this.fullSince===null)this.fullSince=this.time;
      // Keep the dense phase moving long enough to enjoy the evolving pattern.
      if(this.state==='running'&&this.time>=55&&this.fullSince!==null&&this.time-this.fullSince>=16&&this.fill>=.87)this.state='finishing';
    }
  }
}
export function renderClaw(ctx,game){
  ctx.setTransform(ctx.canvas.width/540,0,0,ctx.canvas.height/960,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,540,960);ctx.textAlign='center';ctx.font='24px Arial';ctx.fillStyle='#fff';ctx.fillText('Each broken ball splits into two,',270,160);ctx.fillText('Watch the rhythm multiply.',270,192);
  const r=game.radius,hue=game.hue;
  const richness=Math.min(1,game.balls.length/game.capacity),wave=game.time*.28;
  const buckets=Array.from({length:12},()=>[]),cx=Math.cos(wave),sy=Math.sin(wave);
  const visible=game.balls;
  for(const b of visible){const band=Math.max(0,Math.min(11,Math.floor(6+((b.x-270)*cx+(b.y-485)*sy)/40)));buckets[band].push(b);}
  for(let band=0;band<12;band++){ctx.fillStyle=`hsl(${hue+band*(8+richness*16)} 92% ${59+Math.sin(band*.55+wave)*7}%)`;ctx.beginPath();for(const b of buckets[band]){ctx.moveTo(b.x+r,b.y);ctx.arc(b.x,b.y,r,0,Math.PI*2);}ctx.fill();}
  ctx.globalAlpha=.18;ctx.lineWidth=1.5;ctx.strokeStyle=`hsl(${hue+70} 100% 82%)`;ctx.beginPath();
  const stride=Math.max(1,Math.ceil(game.balls.length/240));for(let i=0;i<game.balls.length;i+=stride){const b=game.balls[i];ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.022,b.y-b.vy*.022);}ctx.stroke();ctx.globalAlpha=1;
  for(const p of game.particles){ctx.globalAlpha=p.life/.35;ctx.fillStyle=`hsl(${p.hue} 90% 70%)`;ctx.fillRect(p.x,p.y,2,3);}ctx.globalAlpha=1;
  ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(270,485,230,0,Math.PI*2);ctx.stroke();ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';for(const points of game.claws()){ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);ctx.lineTo(points[1].x,points[1].y);ctx.lineTo(points[2].x,points[2].y);ctx.stroke();}
  if(game.state==='finishing'||game.state==='finished'){
    const t=Math.min(1,game.finalTime/1.2);ctx.globalAlpha=t;
    ctx.strokeStyle=`hsl(${hue} 100% 75%)`;ctx.lineWidth=3+Math.sin(Math.min(1,game.finalTime/3)*Math.PI)*5;
    ctx.beginPath();ctx.arc(270,485,236,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 28px Arial';ctx.fillText('FULL CIRCLE',270,835);
    ctx.font='16px Arial';ctx.fillText('One ball. Thousands of possibilities.',270,865);ctx.globalAlpha=1;
  }
  ctx.font='14px Arial';ctx.fillStyle='#bdbdbd';ctx.fillText('Balls:',200,744);ctx.fillText('RPM:',340,744);ctx.font='22px Arial';ctx.fillStyle=`hsl(${hue} 100% 78%)`;ctx.fillText(game.balls.length.toLocaleString('en-US'),200,775);ctx.fillText(Math.round(game.rpm),340,775);
}
