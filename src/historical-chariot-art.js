import { drawHistoricalWarrior } from './historical-warrior-art.js';

// Original Canvas art. Two-horse Egyptian and four-horse Qin teams; no riders,
// saddles or stirrups. Perspective is compressed to fit the shared sprite atlas.
export function drawHistoricalChariot(g, p, team, frame, action, variant = 0) {
  const moving = ['walk', 'charge', 'charge-ready'].includes(action);
  const phase = frame % 8 / 8 * Math.PI * 2;
  const gait = moving ? Math.sin(phase) : 0;
  const qin = p.chariot === 'qin', accent = team ? '#bd5147' : '#527fa7';
  const line = (color, width, pts) => { g.beginPath(); pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke(); };
  const oval = (color,x,y,rx,ry) => {g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=color;g.fill();};
  const poly = (color,pts) => {g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();g.strokeStyle='#423b2d';g.lineWidth=.5;g.stroke();};
  const wheel = (x,y,far=false) => {
    g.save();g.translate(x,y);g.rotate(moving?phase:0);
    g.beginPath();g.arc(0,0,5.5,0,Math.PI*2);g.strokeStyle=far?'#685639':'#b79755';g.lineWidth=1.7;g.stroke();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;line('#9d7b46',.8,[[0,0],[Math.cos(a)*5,Math.sin(a)*5]]);}
    oval('#d6b969',0,0,1.2,1.2);g.restore();
  };
  const horse = (x,y,index) => {
    g.save();g.translate(x,y);
    const dark = index%2?'#71503c':'#8b6d49', light = index%2?'#ac8059':'#c1a275';
    line(dark,1.6,[[-7,-13],[-11,-10],[-12,-7]]);
    for(const [lx,sign] of [[-6,1],[5,-1],[-4,-1],[7,1]]){
      const s=gait*sign*2.3;line(dark,1.5,[[lx,-10],[lx+s*.5,-5],[lx-s,0]]);line('#3e392f',1.7,[[lx-s,0],[lx-s+1,0]]);
    }
    oval(light,0,-12,9,4);
    poly(light,[[3,-14],[6,-22],[9,-24],[12,-20],[9,-13],[7,-10]]);
    poly(light,[[8,-24],[13,-23],[16,-19],[15,-17],[10,-18],[7,-21]]);
    poly(dark,[[7,-22],[7,-26],[8,-25],[9,-22]]);line(dark,1.4,[[6,-22],[4,-17],[3,-14]]);
    oval('#242b28',12,-21,.45,.45);line('#695637',.6,[[12,-23],[10,-19],[15,-18]]);
    line(accent,1.1,[[5,-17],[7,-12]]);line('#685437',.8,[[-3,-15],[-3,-9]]);
    g.restore();
  };
  wheel(-12,-3,true);
  // Far horses first, with individually visible heads and legs.
  const offsets = qin ? [[20,-10],[23,-6],[17,-2],[20,2]] : [[20,-5],[16,1]];
  offsets.forEach(([x,y],i)=>horse(x,y,i+variant));
  line('#9e7b43',1.6,[[-12,-5],[9,-6],[24,-9]]);
  line('#ab8b56',1.2,[[17,-15],[26,-14]]);
  if(qin){g.save();g.translate(-22,-10);g.scale(.54,.54);drawHistoricalWarrior(g,{...p,weapon:'spear'}, {role:'sword'},team,frame,'idle',variant);g.restore();}
  g.save();g.translate(qin?-15:-19,-9);g.scale(.65,.65);drawHistoricalWarrior(g,p,{role:'sword'},team,frame,action==='attack'?'attack':'idle',variant);g.restore();
  g.save();g.translate(-7,-8);g.scale(.6,.6);drawHistoricalWarrior(g,{...p,weapon:'chariotReins'},{role:'sword'},team,frame,'idle',variant);g.restore();
  line('#706044',.5,[[0,-19],[13,-21],[32,-23]]);
  line('#706044',.5,[[0,-17],[13,-15],[28,-18]]);
  poly(qin?'#805c37':'#b29358',[[-26,-11],[-3,-11],[-2,-2],[-24,-2]]);
  for(const x of [-23,-17,-11,-5])line('#d0b47c',.7,[[x,-10],[x,-3]]);
  line(accent,1.7,[[-25,-10],[-3,-10]]);
  line('#685032',1.3,[[-25,-2],[-2,-2]]);
  wheel(-17,1);
}
