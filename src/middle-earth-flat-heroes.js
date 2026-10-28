// Editable source art for the three Fellowship heroes. Baked to WebP by
// scripts/bake-middle-earth-flat-heroes.mjs, never drawn per soldier/frame.
// Match historical-warrior-art: .6 outlines, flat muted colours, simple faces.
export function drawFlatHero(g, name, frame=0, action='idle') {
 const dwarf=name==='gimli', elf=name==='legolas';
 const ink='#242b29',skin='#c5a17c',steel='#aebcba',gold='#c5a268';
 const cloth=elf?'#78816a':dwarf?'#80583c':'#615649';
 const hair=elf?'#c9b478':dwarf?'#a45f37':'#403a31';
 const walk=action==='walk'?Math.sin(frame/8*Math.PI*2):0;
 const hit=action==='attack'?Math.sin(frame/7*Math.PI):0;
 const line=(color,width,pts)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke();};
 const poly=(color,pts,edge=true)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();if(edge){g.strokeStyle=ink;g.lineWidth=.6;g.lineJoin='round';g.stroke();}};
 const oval=(color,x,y,rx,ry,edge=true)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=color;g.fill();if(edge){g.strokeStyle=ink;g.lineWidth=.6;g.stroke();}};
 g.save();
 // Dwarf keeps the same head/hand sizes with a broad torso and shorter limbs.
 const top=dwarf?-22:-33,shoulder=dwarf?-14:-24,hip=dwarf?-5:-10;
 const bob=action==='walk'?-Math.abs(walk)*.55:Math.sin(frame/8*Math.PI*2)*.08;
 g.translate(hit*.9,bob);
 if(!dwarf)poly('#4b6050',[[-3,shoulder-1],[-7,shoulder+2],[-9-walk*.7,-5],[-4,-7],[0,hip],[-1,shoulder]]);
 if(elf){
  poly('#69563d',[[-6,-24],[-3,-23],[-4,-13],[-7,-14]]);
  for(let i=0;i<3;i++){line('#ad9670',.55,[[-6+i*.9,-23],[-7+i*.9,-29]]);line('#ded7bb',.8,[[-7+i*.9,-29],[-7.7+i*.9,-30]]);}
 }
 for(const [side,far]of [[-1,true],[1,false]]){
  const x=side*(dwarf?3:2.3),step=walk*side*(dwarf?1.5:2.2);
  poly(far?'#49473b':'#615c49',[[x-1.6,hip],[x+1.6,hip],[x+1.4+step,-1],[x-1.5+step,-1]]);
  poly('#464237',[[x-1.5+step,-3],[x+1.3+step,-3],[x+1.5+step,-.6],[x+3+step,0],[x-1.6+step,0]]);
 }
 const w=dwarf?5.5:4.3;
 poly(cloth,[[-w,shoulder],[-2,shoulder-1],[2.5,shoulder-1],[w,shoulder+1],[w-.6,hip],[w+1,hip+2],[.5,hip+1],[-1,hip+2],[-w-.5,hip+1]]);
 // One inset colour panel rather than painted folds or textile hatching.
 poly(dwarf?'#a3a79a':elf?'#949777':'#786953',[[-w+.8,shoulder+.8],[-.7,shoulder],[0,hip-1],[-w+.7,hip]],false);
 if(dwarf){
  poly(steel,[[-6,shoulder],[-3,shoulder-1],[-3,shoulder+2],[-6,shoulder+3]]);
  poly(steel,[[3,shoulder-1],[6,shoulder],[6,shoulder+3],[3,shoulder+2]]);
  for(let y=shoulder+4;y<hip-1;y+=2)line('#584735',.6,[[-4,y],[4,y]]);
 }else{
  line('#a18b62',.7,[[3,shoulder],[-2,hip]]);
  oval('#c5c5a1',-2,shoulder+1,.7,.7,false);
 }
 line('#473b2e',1.4,[[-w,hip],[w,hip]]);
 poly(gold,[[-.8,hip-.8],[.9,hip-.8],[.9,hip+.8],[-.8,hip+.8]],false);
 // Back arm stays relaxed; bow hand rises only during the draw/release cycle.
 const handY=elf?shoulder+8-hit*5:shoulder+9;
 line(ink,3.5,[[-w,shoulder+2],[-w-1,shoulder+6],[-w+.5,shoulder+9]]);
 line(cloth,2.2,[[-w,shoulder+2],[-w-1,shoulder+6],[-w+.5,shoulder+9]]);
 oval(skin,-w+.5,shoulder+9,1.1,1.25);
 line(ink,3.6,[[w,shoulder+2],[w+1,shoulder+5],[elf?9:6,handY]]);
 line(cloth,2.3,[[w,shoulder+2],[w+1,shoulder+5],[elf?9:6,handY]]);
 if(elf){
  const bx=10,by=handY;
  g.beginPath();g.moveTo(bx,by-8);g.quadraticCurveTo(bx+6,by,bx,by+8);g.strokeStyle=ink;g.lineWidth=1.6;g.stroke();g.strokeStyle='#9c8055';g.lineWidth=.8;g.stroke();
  line('#c4bc9d',.45,[[bx,by-8],[bx-hit*4,by],[bx,by+8]]);
  if(action==='attack'){
   line('#d3c6a1',.6,[[bx-5,by],[bx+11,by]]);
   poly(steel,[[bx+11,by-1],[bx+13,by],[bx+11,by+1]],false);
   line(ink,3.2,[[-w,shoulder+2],[-2,shoulder+5],[bx-4*hit,by]]);
   line(cloth,2,[[ -w,shoulder+2],[-2,shoulder+5],[bx-4*hit,by]]);
   oval(skin,bx-4*hit,by,1,1.1);
  }
  oval(skin,9,by,1.1,1.2);
 }else{
  g.save();g.translate(6,handY);g.rotate(dwarf?-.25+hit*1.6:1.8-hit*2.4);
  if(dwarf){
   line(ink,1.8,[[0,3],[0,-12]]);line('#96764e',1,[[0,3],[0,-12]]);
   poly(steel,[[0,-12],[4,-14],[6,-12],[6,-8],[2,-8],[0,-10]]);
   line('#d8dbcb',.6,[[5.5,-12],[5.5,-8.5],[2,-8.5]]);
  }else{
   poly(steel,[[-.8,-2],[-.8,-15],[0,-18],[1,-15],[.8,-2]]);
   line('#d9ded0',.5,[[0,-3],[0,-15]]);
   line('#887651',1.1,[[-2.5,-2],[2.5,-2]]);line('#44392c',1.2,[[0,-1],[0,3]]);
  }
  oval(skin,0,0,1.2,1.3);g.restore();
 }
 // Simple profile: single eye and nose, no portrait-style facial shading.
 poly(hair,[[-4,top+2],[-2,top],[2,top],[4,top+3],[3,top+9],[-5,top+10]]);
 poly(skin,[[-2.8,top+2],[2.8,top+2],[3.1,top+4],[4,top+5],[3,top+6],[2.7,top+8],[-1.3,top+8],[-3,top+6]]);
 poly(hair,[[-3.5,top+1],[-1,top],[2,top+.5],[3.1,top+2.5],[-1,top+2],[-2,top+5],[-3.8,top+8]]);
 oval(ink,2.2,top+4.2,.38,.38,false);
 if(elf){
  poly(skin,[[-2.5,top+4],[-5,top+2.5],[-3.4,top+6]]);
  poly(hair,[[-4,top+3],[-3,top+8],[-4,top+12],[-6,top+11],[-5,top+6]]);
  line('#e0cc91',.55,[[-3.3,top+1.5],[-.5,top+1],[1.5,top+1.4]]);
 }else if(dwarf){
  poly(hair,[[-3.5,top+5],[-1,top+6],[1,top+5.5],[3.3,top+6],[3,top+11],[.8,top+13],[-.7,top+11],[-2.3,top+13],[-4,top+10]]);
  line('#704732',.6,[[-1,top+7],[-1,top+10]]);
  poly('#947c57',[[-4.5,top+3],[-4,top],[-1,top-2],[2.5,top-1],[4,top+2],[3.5,top+3]]);
  line(gold,.8,[[-3.8,top+2],[3.4,top+2]]);
  poly('#b8a47d',[[-.7,top-1.5],[.4,top-1.5],[.8,top+4],[-.4,top+4]],false);
 }else{
  poly(hair,[[-1.7,top+6],[0,top+6.8],[2.8,top+6],[2.4,top+8],[-.6,top+9],[-2,top+7]],false);
 }
 g.restore();
}
