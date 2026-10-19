// Original canvas drawings based on the linked museum equipment.
const ink='#273239', steel='#b4c3ca', bright='#e8edef';
function pens(g){
  const path=p=>{g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,p)=>{path(p);g.strokeStyle=c;g.lineWidth=w;g.lineJoin='round';g.stroke();};
  const poly=(c,p)=>{path(p);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=ink;g.lineWidth=.55;g.stroke();};
  return {line,poly};
}
export function drawLateCavalryArmor(g,p){
  if(!p.teutonic&&!p.gothicKnight)return false;
  const {line,poly}=pens(g);
  if(p.teutonic){
    // Mail sleeves and chausses remain visible beneath the white cloth.
    poly('#899a9e',[[-5,-22],[4,-22],[6,-17],[4,-8],[-5,-8],[-6,-17]]);
    for(let y=-21;y<-7;y+=1.4)for(let x=-5;x<5;x+=1.6)line('#4a5b61',.4,[[x,y],[x+.6,y+.5],[x+1.1,y]]);
    for(const x of [-4,4]){line('#84969b',2.7,[[x,-9],[x*1.3,-4],[x*1.3,-1]]);for(let y=-8;y<-1;y+=1.3)line('#44585e',.45,[[x-1,y],[x+1,y+.4]]);}
    poly('#e8e8db',[[-3,-22],[2,-22],[3,-14],[5,-5],[1,-4],[0,-9],[-2,-4],[-5,-5],[-3,-14]]);
    line('#aeb5ac',.6,[[-2,-20],[-2,-13],[-4,-6]]);
    line('#202a2e',1.7,[[0,-21],[0,-14]]);line('#202a2e',1.7,[[-2,-18.5],[2,-18.5]]);
    line('#202a2e',1.2,[[-6,-17],[-6,-9]]);line('#202a2e',1.2,[[-8,-14],[-4,-14]]);
    line('#675343',1.1,[[-3,-12],[3,-12]]);return true;
  }
  poly('#91a3ae',[[-4,-22],[3,-22],[5,-18],[3,-12],[0,-10],[-4,-12],[-5,-18]]);
  poly(steel,[[-4,-21],[0,-22],[3,-20],[2,-15],[0,-12],[-3,-15]]);
  for(const d of [-1,1]){
    poly(steel,[[d*3,-22],[d*6,-24],[d*8,-20],[d*6,-17],[d*4,-18]]);
    for(let n=0;n<3;n++)line(bright,.45,[[d*(4+n*.6),-21],[d*(5+n*.6),-19]]);
    for(let n=0;n<3;n++)line('#e2e7e5',.45,[[d*(1+n*.8),-20],[d*(1.5+n*.6),-16],[0,-12]]);
    poly(steel,[[d,-11],[d*5,-11],[d*6,-7],[d*3,-5],[d,-7]]);
    line(bright,.6,[[d*2,-10],[d*3,-6]]);
    poly(steel,[[d*4,-5],[d*6,-4],[d*6,-1],[d*8,0],[d*4,0]]);
  }
  for(let y=-13;y<=-10;y+=1.2)line(bright,.5,[[-4,y],[0,y+1],[4,y]]);
  return true;
}
export function drawLateCavalryHead(g,p){
  if(!p.gothicKnight)return false;
  const {line,poly}=pens(g);
  poly('#8f9fa8',[[-4,-28],[-2,-31],[2,-31],[4,-28],[5,-25],[1,-23],[-3,-24],[-7,-23]]);
  poly(steel,[[-4,-28],[-2,-30],[2,-30],[4,-28],[4,-26],[-5,-26]]);
  line(bright,.6,[[-3,-28],[-1,-30],[2,-29]]);
  line('#17252d',.9,[[-1,-26],[4,-26]]);
  poly('#a8b9c0',[[-2,-23],[4,-24],[4,-21],[1,-20],[-3,-21]]);
  line(bright,.5,[[-2,-22],[2,-21],[4,-23]]);return true;
}
export function drawLateCavalryHorse(g,p){
  if(!p.condotta&&!p.gothicKnight)return;
  const {line,poly}=pens(g);
  if(p.condotta){
    for(const x of [-13,-8,4,8]){line('#d8bd78',.7,[[x,-19],[x+1,-14],[x,-10]]);poly('#d8bd78',[[x,-16],[x+1,-14],[x,-12],[x-1,-14]]);}
    for(let x=-15;x<10;x+=2.5)line('#d8bd78',.6,[[x,-8],[x,-6.5]]);
  }else{
    poly('#879ba6',[[-17,-20],[-9,-23],[-7,-19],[-9,-12],[-17,-11]]);
    poly(steel,[[5,-22],[10,-24],[13,-19],[11,-12],[6,-13]]);
    for(let x=-15;x<-8;x+=2)line(bright,.55,[[x,-20],[x-1,-13]]);
    for(let y=-29;y<-18;y+=2)poly('#9bafb8',[[12,y],[16,y-1],[17,y+1],[12,y+2]]);
    poly(steel,[[16,-32],[19,-33],[21,-29],[24,-27],[23,-25],[20,-27],[18,-28]]);
    line(bright,.7,[[18,-32],[20,-29],[23,-26]]);
  }
}
