// Deterministic, cached sky: camera parallax without affecting the physics RNG.
let nebula;
const stars=Array.from({length:150},(_,i)=>({x:(i*173.73+29)%540,y:(i*97.31+11)%1100,r:i%11===0?1.6:i%3===0?1:.55,depth:.07+(i%3)*.07}));
export function drawSpace(ctx,cameraY=0,time=0) {
  if(!nebula) {
    nebula=document.createElement('canvas');nebula.width=540;nebula.height=1100;
    const sky=nebula.getContext('2d');sky.fillStyle='#050918';sky.fillRect(0,0,540,1100);
    for(const [x,y,r,color] of [[90,270,360,'#612fad'],[480,520,350,'#125e91'],[190,930,290,'#442873']]) {
      const g=sky.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'50');g.addColorStop(.45,color+'22');g.addColorStop(1,color+'00');
      sky.fillStyle=g;sky.fillRect(0,0,540,1100);
    }
  }
  ctx.save();
  const offset=((cameraY*.035)%1100+1100)%1100;
  ctx.drawImage(nebula,0,-offset);ctx.drawImage(nebula,0,1100-offset);
  for(const star of stars) {
    const y=((star.y-cameraY*star.depth)%1100+1100)%1100-40;
    ctx.globalAlpha=.42+Math.sin(time*.65+star.x)*.18;
    ctx.fillStyle=star.r>1?'#d5dcff':'#9cbfe3';ctx.fillRect(star.x,y,star.r,star.r);
    if(star.r>1) {ctx.globalAlpha=.18;ctx.fillRect(star.x-2,y+.6,5.5,.6);ctx.fillRect(star.x+.6,y-2,.6,5.5);}
  }
  ctx.globalAlpha=1;
  // A distant ringed planet, visible once near the launch area.
  const py=168-cameraY*.11;
  if(py>-140&&py<1100) {
    ctx.save();ctx.translate(431,py);ctx.rotate(-.4);
    ctx.strokeStyle='#958ccc28';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(0,0,92,24,0,0,Math.PI*2);ctx.stroke();
    const planet=ctx.createRadialGradient(-20,-22,2,12,16,62);planet.addColorStop(0,'#555880');planet.addColorStop(.55,'#202d4c');planet.addColorStop(1,'#080e20');
    ctx.fillStyle=planet;ctx.beginPath();ctx.arc(0,0,48,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#b2a4ff35';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,92,24,0,0,Math.PI);ctx.stroke();ctx.restore();
  }
  ctx.restore();
}
