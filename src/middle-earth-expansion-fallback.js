// Lightweight, local silhouettes for the interval before the painted sheets decode.
// The actual game art replaces these automatically through paintedArtVersion.
const mounts={me_nazgul:'horse',me_rohirrim:'horse',me_gondor_cavalry:'horse',me_dwarf_ram_rider:'ram',me_elf_stag_rider:'stag',me_azog_warg:'warg',me_theoden:'horse',me_eomer:'horse',me_thranduil:'stag',me_dain:'boar'};
export function expansionFallback(type,team,frame,action){
 const mount=mounts[type];if(!mount&&!['me_ent','me_shelob','me_mumakil'].includes(type))return null;
 const canvas=document.createElement('canvas');canvas.width=240;canvas.height=228;
 const g=canvas.getContext('2d',{willReadFrequently:true});g.setTransform(3,0,0,3,90,183);
 // Preserve small dwarf mounts even while the painted asset is unavailable.
 if(mount==='ram')g.scale(.68,.68);
 if(mount==='boar')g.scale(.74,.74);
 const phase=frame/8*Math.PI*2,walk=action==='walk'?Math.sin(phase):0,hit=action==='attack'?Math.sin(frame/7*Math.PI):0;
 g.translate(0,Math.sin(phase)*.12);g.lineJoin='round';g.lineCap='round';
 const teamColor=team?'#ae574a':'#578fbd';
 function path(d,color,width=.6){const p=new Path2D(d);g.fillStyle=color;g.fill(p);g.strokeStyle='#202a29';g.lineWidth=width;g.stroke(p);}
 function line(d,color,width=1){g.strokeStyle=color;g.lineWidth=width;g.stroke(new Path2D(d));}
 if(type==='me_shelob'){
  for(const side of [-1,1])for(let i=0;i<4;i++){
   const x=-12+i*8,swing=walk*(i%2?1:-1)*2;
   line(`M${x},-18L${x-8},${-30+side*10} ${x-13+swing},${-2+side*3}`,'#32323b',2.5);
  }
  path('M-19,-19Q-24,-38 -8,-39Q6,-38 6,-23L13,-25 24,-20 25,-12 15,-8 3,-15Z','#41414b');
  line(`M20,-14L${27+hit*4},-5M14,-12L${20+hit*4},-4`,'#dfd7b5',2);
  line('M19,-20L20,-20M14,-21L15,-21','#e7a04c',2);
 }else if(type==='me_mumakil'){
  for(const [x,side]of [[-14,1],[-9,-1],[10,-1],[15,1]])line(`M${x},-19L${x+walk*side*2},-2`,'#737777',5);
  path('M-19,-19L-20,-34Q-13,-41 7,-36L13,-32 20,-35 27,-29 26,-16 31,-8 27,-6 20,-17 13,-17 9,-12 -13,-13Z','#818585');
  path('M10,-33L19,-35 22,-27 17,-21 11,-25Z','#626c6b');
  line(`M23,-22Q${33+hit*3},-13 35,-18M20,-19Q28,-10 32,-12`,'#e0d7b4',2);
  path('M-14,-37V-48H7V-36Z','#846142');
  line('M-15,-49H8M-9,-48V-37M2,-48V-37','#c0a170',1.5);
  path('M-7,-46H2V-29L-3,-32 -7,-29Z',teamColor);
 }else if(type==='me_ent'){
  for(const side of [-1,1]){g.save();g.translate(side*5,-15);g.rotate(walk*side*.12);path('M-3,0L-4,12 -7,15 1,15 4,12 3,0Z','#695c38');g.restore();}
  path('M-8,-17L-10,-38 -5,-49 1,-51 7,-44 9,-20 4,-13Z','#82734a');
  path(`M-8,-38L-18,-29 -20,-14 -15,-16 -13,-27 -5,-29Z`,'#71643d');
  path(`M6,-39L${18+hit*7},${-32+hit*8} ${23+hit*7},${-19+hit*4} ${17+hit*7},${-20+hit*4} 12,-27 5,-30Z`,'#71643d');
  line('M-5,-45L-9,-54 -15,-57M0,-48L1,-58 7,-56M5,-44L12,-51 14,-57','#6f6542',2);
  line('M-5,-25L-3,-38 1,-42M2,-20L4,-34','#a99a66');line('M-4,-41H-2M2,-41H4','#e6c46f',1.4);
 }else{
  const body=mount==='warg'?'#d8d6c5':mount==='ram'?'#ada790':mount==='stag'?'#a38c62':type==='me_nazgul'?'#353b40':type==='me_gondor_cavalry'?'#aeb4b7':'#93623e';
  for(const [x,side]of [[-12,1],[-8,-1],[11,-1],[15,1]])line(`M${x},-15L${x+walk*side*3},-7 ${x+walk*side*5},0`,body,mount==='ram'?3.5:2.3);
  path('M-17,-17Q-19,-29 -7,-29L13,-27 18,-19 12,-12 -10,-13Z',body);
  path('M10,-25L16,-39 23,-37 30,-29 27,-24 20,-25 16,-15Z',body);
  path(mount==='warg'?'M-15,-26L-25,-17 -27,-12 -19,-15 -12,-22Z':'M-16,-26L-23,-21 -25,-9 -20,-16 -14,-22Z',body);
  if(mount==='warg'){path('M16,-37L17,-45 22,-38 27,-41 27,-34Z',body);line('M24,-28L29,-27','#343735',1.5);}
  if(mount==='ram'){g.strokeStyle='#746747';g.lineWidth=4;g.beginPath();g.arc(20,-34,6,0,Math.PI*1.8);g.stroke();}
  if(mount==='boar'){path('M17,-34L28,-31 31,-23 23,-22 16,-27Z','#68584a');line('M26,-23Q32,-20 31,-29','#e7ddbe',2);}
  if(mount==='stag')line('M20,-37L17,-46 13,-51M17,-46L21,-52M22,-37L27,-47 31,-49M27,-47L25,-53','#b5ab86',1.4);
  path('M-10,-29L8,-30 7,-17 -7,-16Z',teamColor);
  const dark=type==='me_nazgul',orc=mount==='warg';
  path('M-7,-42L4,-43 8,-31 4,-25 -9,-27Z',dark?'#282c32':orc?'#d6cebb':'#8d9b99');
  path('M-4,-43L-5,-49 1,-53 6,-49 5,-43Z',dark?'#20242b':orc?'#d6cebb':'#c5b28b');
  if(mount==='ram'){path('M-5,-48L-4,-52 1,-55 6,-52 7,-48Z','#697777');line('M-5,-48L7,-48','#b9a05e',1.5);path('M-5,-48L-4,-43 -1,-44 -1,-48Z','#a28b56');}
  path('M0,-29L6,-26 5,-14 1,-13 1,-24 -5,-25Z','#474842');
  if(type==='me_rohirrim'||type==='me_gondor_cavalry')line(`M5,-34L${13+hit*17},${-54+hit*23}`,'#ae9668',1.4);
  else if(mount==='ram'){line(`M5,-36L${19+hit*8},${-43+hit*15}`,'#625c50',2);path(`M${18+hit*8},${-47+hit*15}l7,-3q5,7 0,12l-7,-3Z`,'#a1b3b7');}
  else if(orc||mount==='boar'){line(`M5,-36L${19+hit*8},${-43+hit*15}`,'#625c50',2);path(`M${16+hit*8},${-48+hit*15}h7v8h-7Z`,'#768383');}
  else line(`M5,-35L${20+hit*10},${-49+hit*20}`,'#d2dbd7',2);
 }
 return canvas;
}
