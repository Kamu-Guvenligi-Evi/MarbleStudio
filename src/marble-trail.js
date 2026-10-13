// Shared by the live studio and video renderer. Draw before the marble faces.
export function drawMarbleTrail(ctx,ball) {
  const points=ball.trail;
  if(points.length<2)return;
  const r=ball.body.circleRadius,first=points[0],last=points[points.length-1];
  ctx.save();
  ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';
  const fade=ctx.createLinearGradient(first.x,first.y,last.x,last.y);
  fade.addColorStop(0,ball.color+'00');fade.addColorStop(.45,ball.color+'60');fade.addColorStop(1,ball.color);
  // Blur one continuous stroke instead of applying a costly shadow to every segment.
  const transform=ctx.getTransform();
  ctx.shadowColor=ball.color;ctx.shadowBlur=r*1.5*Math.hypot(transform.a,transform.b);
  ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.globalAlpha=.65;ctx.strokeStyle=fade;ctx.lineWidth=r*.65;
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
  ctx.shadowBlur=0;
  for(let i=1;i<points.length;i++) {
    const strength=i/(points.length-1);
    ctx.beginPath();ctx.moveTo(points[i-1].x,points[i-1].y);ctx.lineTo(points[i].x,points[i].y);
    ctx.globalAlpha=strength*.8;ctx.strokeStyle=ball.color;ctx.lineWidth=strength*r*.5;ctx.stroke();
    ctx.globalAlpha=strength*strength*.7;ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(.5,strength*r*.14);ctx.stroke();
  }
  ctx.restore();
}
