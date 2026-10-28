const TAU=Math.PI*2;
function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();}
function pearl(c,x,y,r){
  const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r);
  g.addColorStop(0,'#ffffff');g.addColorStop(.3,'#fff8df');g.addColorStop(.7,'#e1c9e4');g.addColorStop(1,'#867da8');
  oval(c,x,y,r,r,g);
}
function shell(c){
  c.beginPath();c.moveTo(-11,0);c.bezierCurveTo(-5,-24,19,-20,18,0);c.bezierCurveTo(19,20,-5,24,-11,0);
  const g=c.createLinearGradient(-12,-15,18,15);g.addColorStop(0,'#fff5dc');g.addColorStop(.5,'#d09eaf');g.addColorStop(1,'#ffe3dd');c.fillStyle=g;c.fill();
  c.strokeStyle='#fff1e3';c.lineWidth=.8;
  for(let i=-4;i<=4;i++){c.beginPath();c.moveTo(-10,0);c.quadraticCurveTo(0,i*1.7,16-Math.abs(i)*1.3,i*3.4);c.stroke();}
  oval(c,2,0,7,7,'#8b6987');pearl(c,2,-1,5.5);
}
function seed(c,x,y,r,variant=0){
  const g=c.createLinearGradient(x-r,y-r,x+r,y+r);g.addColorStop(0,'#ffb9bf');g.addColorStop(.3,variant?'#f55778':'#f8758c');g.addColorStop(1,'#941a49');
  c.beginPath();c.moveTo(x-r,y-r*.5);c.quadraticCurveTo(x,y-r*1.4,x+r*.8,y-r*.5);c.quadraticCurveTo(x+r*1.2,y+r*.8,x,y+r);c.quadraticCurveTo(x-r*1.2,y+r*.5,x-r,y-r*.5);c.fillStyle=g;c.fill();
  oval(c,x-r*.25,y-r*.45,r*.35,r*.16,'#ffe1d0');
}
function bubble(c,x,y,r){
  const g=c.createRadialGradient(x-r*.3,y-r*.4,0,x,y,r);g.addColorStop(0,'#98d1df');g.addColorStop(.7,'#476581');g.addColorStop(.88,'#a5e1df');g.addColorStop(1,'#eac2ed');
  oval(c,x,y,r,r,g);c.lineWidth=1;c.strokeStyle='#eaffff';c.beginPath();c.arc(x,y,r*.83,3.6,5.2);c.stroke();c.strokeStyle='#f7b7db';c.beginPath();c.arc(x,y,r*.82,.2,1.8);c.stroke();
}
// Draw once into the existing HD material cache. Motifs follow the actual spiral.
export function paintOrganicSurface(c,id,points){
  let last=-100,index=0;
  for(let i=1;i<points.length-1;i++){
    const p=points[i],spacing=id==='pearlShells'?29:22;
    if(p.s-last<spacing)continue;last=p.s;index++;
    const next=points[i+1];c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(next.y-p.y,next.x-p.x));
    if(id==='pearlShells')shell(c);
    else if(id==='pomegranate'){
      for(let row=-1;row<=1;row++){seed(c,-5+(row===0?4:0),row*10,5.3,index%2);seed(c,6+(row===0?4:0),row*10,5.1,(index+1)%2);}
      if(index%4===0){c.strokeStyle='#ffe9c2';c.lineWidth=2.3;c.beginPath();c.moveTo(-10,-17);c.quadraticCurveTo(-2,0,-10,17);c.stroke();}
    }else{bubble(c,-3,0,10);bubble(c,8,-11,5.5);bubble(c,9,11,5);bubble(c,-10,12,3);}
    c.restore();
  }
}
export function drawOrganicFragment(c,id,size,white){
  if(id==='pomegranate')seed(c,0,0,size,white?0:1);
  else if(id==='pearlShells'){
    if(white)pearl(c,0,0,size*.8);
    else{c.beginPath();c.moveTo(-size,size*.6);c.quadraticCurveTo(-size,-size*1.3,size,-size*.4);c.lineTo(size*.4,size);c.closePath();c.fillStyle='#edc7d7';c.fill();c.strokeStyle='#fff3de';c.lineWidth=.7;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-size,size*.6);c.lineTo(size*.6,-size*.4+i*size*.4);c.stroke();}}
  }else{c.lineWidth=1.1;c.strokeStyle=white?'#eaffff':'#f1bfeb';c.beginPath();c.arc(0,0,size,0,TAU);c.stroke();c.strokeStyle='#a6e6ff';c.beginPath();c.arc(0,0,size*.75,3.5,5);c.stroke();}
}
