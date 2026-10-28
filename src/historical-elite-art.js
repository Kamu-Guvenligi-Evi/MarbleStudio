// Readable original game silhouettes informed by the catalogue references.
// Colours and simplified equipment are art direction, not exact uniform claims.
export function drawEliteDetails(g, type, teamColor) {
  const line = (c, w, points) => { g.beginPath(); points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke(); };
  const poly = (c, points, rim='#354039') => { g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=c;g.fill();if(rim){g.strokeStyle=rim;g.lineWidth=.5;g.stroke();} };
  const oval = (c,x,y,rx,ry) => {g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();};
  const gold='#d5b675', ivory='#e1ddc4', steel='#a7b3ac';
  const cross = (c,x,y,s=1) => {line(c,1.4*s,[[x,y-3*s],[x,y+3*s]]);line(c,1.4*s,[[x-2*s,y-1*s],[x+2*s,y-1*s]]);};
  if(type==='ottoman_solak') {
    poly('#a68434',[[-4,-18],[3,-18],[4,-5],[0,-3],[-4,-5]]);
    poly('#315c73',[[-4,-18],[-1,-17],[-2,-5],[-5,-6]]);
    line(gold,.7,[[0,-17],[0,-6],[3,-6]]);
    poly('#d8d4b9',[[-4,-21],[-3,-27],[2,-27],[4,-21]]);
    poly('#d7d5bc',[[-2,-27],[-3,-37],[0,-38],[2,-28]]);
    for(let x=-2;x<=1;x++)line('#8e947f',.4,[[x,-36],[x+.7,-28]]);
    line(gold,1.2,[[-3,-22],[3,-22]]);
  } else if(type==='macedon_hypaspists') {
    poly('#9b4436',[[-5,-18],[2,-18],[4,-4],[-5,-5]]);
    oval('#a89763',0,-22,3.8,3.1);
    poly('#bdab77',[[-3,-23],[-2,-27],[2,-29],[3,-26],[1,-25],[3,-21]]);
    oval('#a48b51',0,-9,6.5,7.5);oval('#465c5a',0,-9,5.6,6.5);
    oval('#bda76f',0,-9,2,2.3);line(gold,.7,[[-4,-12],[-2,-14],[2,-14],[4,-12]]);
  } else if(type==='england_housecarl') {
    poly('#7c8982',[[-4,-18],[3,-18],[4,-5],[-4,-5]]);
    for(let y=-16;y<-5;y+=2)line('#b5b7a4',.5,[[-3,y],[3,y]]);
    poly(steel,[[-4,-21],[-2,-26],[1,-27],[4,-21]]);
    line('#e2dfc4',.8,[[0,-26],[0,-21],[1,-18]]);
    oval('#997243',0,-9,6.3,7.2);oval('#714e33',0,-9,5.5,6.3);
    for(const x of [-3,0,3])line('#b48d58',.5,[[x,-14],[x,-4]]);
    oval(steel,0,-9,2,2.2);oval('#d8dbcb',-.5,-9.5,.7,.7);
  } else if(type==='mexica_eagle') {
    poly('#a77742',[[-5,-18],[4,-18],[4,-4],[-4,-4]]);
    for(let y=-17;y<-6;y+=2.5)for(let x=-3;x<4;x+=2)line('#5d452e',.6,[[x,y],[x+.5,y+1]]);
    poly('#ad7e43',[[-4,-20],[-5,-25],[-2,-29],[2,-28],[4,-24],[3,-20]]);
    poly('#ddbb73',[[2,-27],[8,-24],[4,-22],[3,-24]]);
    oval('#242b25',1,-26,.6,.6);oval('#bc986b',0,-21,2.1,2.5);
    for(let n=0;n<5;n++)line(n%2?'#ab573b':'#d6ad62',1.5,[[-4,-18],[-8-n*.5,-22+n*2]]);
    oval('#c0a16a',0,-9,6.2,7);oval('#b65539',0,-9,5.3,5.9);
    for(let x=-4;x<=4;x+=2)line('#d6b36c',.7,[[x,-4],[x,-1]]);
    oval(gold,0,-9,1.4,1.5);
  } else if(['templar_knight','teutonic_knight','hospitaller_knight'].includes(type)) {
    const dark=type==='hospitaller_knight', badge=type==='templar_knight'?'#aa382d':dark?ivory:'#29322d';
    poly(dark?'#323b36':ivory,[[-5,-18],[3,-18],[5,-5],[-5,-5]]);
    poly(steel,[[-4,-26],[3,-26],[4,-19],[-3,-18]]);
    line('#34443f',.8,[[-3,-22],[3,-22]]);line('#dadcca',.6,[[0,-25],[0,-19]]);
    poly(dark?'#3f4941':'#d8d3bb',[[-5,-14],[0,-16],[5,-14],[4,-6],[0,-2],[-4,-6]],gold);
    cross(badge,0,-9.5);line(badge,.8,[[-4,-17],[-4,-12]]);
  } else if(type==='japan_mounted_samurai') {
    for(let y=-18;y<=-6;y+=3){poly('#454f3d',[[-4,y],[4,y],[5,y+2],[-5,y+2]]);line('#bc9a5a',.6,[[-4,y+1],[4,y+1]]);}
    for(const x of [-6,4])poly('#596446',[[x,-19],[x+3,-19],[x+3,-11],[x,-11]],gold);
    poly('#444d39',[[-4,-21],[-3,-26],[2,-26],[4,-21]]);
    line(gold,1,[[0,-26],[0,-23]]);poly('#6e6541',[[-4,-22],[-5,-18],[-2,-18]]);
  } else if(type==='mamluk_bahri') {
    poly('#d8c8a0',[[-4,-18],[3,-18],[5,-5],[-4,-5]]);
    line('#8d4840',1,[[-2,-17],[2,-6]]);line('#987a45',1,[[-4,-9],[4,-9]]);
    poly('#b0b6a5',[[-4,-21],[-2,-28],[1,-30],[3,-23],[4,-21]]);
    line(ivory,1.8,[[-4,-22],[3,-22]]);
    oval('#876d44',0,-9,5.8,6.5);oval('#bea774',0,-9,4.8,5.5);
    oval('#7f774c',0,-9,1.4,1.6);
  } else return;
  // Army colour stays visible without changing the unit's emblem.
  line(teamColor,1.5,[[-5,-17],[-5,-14]]);
}
