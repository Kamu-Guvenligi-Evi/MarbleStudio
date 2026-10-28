import { MYTHOLOGICAL_BY_ID } from './mythological-units.js';

// Painted at atlas creation time, never in the per-soldier render loop.
// Logical bounds: x [-30,50], y [-61,15]. Renderer owns facing and shadows.
export function drawMythologicalCreature(g, type, team, frame, action) {
  if (!MYTHOLOGICAL_BY_ID[type]) throw new Error(`Unknown mythological creature: ${type}`);
  const id = type.slice(5), phase = frame / 8 * Math.PI * 2;
  const walk = action === 'walk' ? Math.sin(phase) : 0;
  const strike = action === 'attack' ? Math.sin(frame / 7 * Math.PI) : 0;
  const breathe = action === 'idle' ? Math.sin(phase) * .28 : 0;
  const ink = '#252922', gold = '#c5a468', ivory = '#ead8aa';
  const cloth = team ? ['#b95c48','#78312d','#3a2428'] : ['#6797aa','#345c72','#22333e'];
  function grad(colors,x=0,y=-48,xx=16,yy=0) {
    const p=g.createLinearGradient(x,y,xx,yy);
    colors.forEach((c,i)=>p.addColorStop(i/(colors.length-1),c)); return p;
  }
  function path(d,fill,edge=ink,width=.45) {
    const p=new Path2D(d);g.fillStyle=fill;g.fill(p);
    if(edge){g.strokeStyle=edge;g.lineWidth=width;g.lineJoin='round';g.stroke(p);} return p;
  }
  function line(d,color,width=.6) {
    g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke(new Path2D(d));
  }
  function oval(x,y,rx,ry,color,edge=null) {
    g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=color;g.fill();
    if(edge){g.lineWidth=.4;g.strokeStyle=edge;g.stroke();}
  }
  function texture(p,x,y,w,h,kind,color,step=2.1) {
    g.save();g.clip(p);g.strokeStyle=color;g.lineWidth=.32;g.beginPath();
    for(let row=0,yy=y;yy<y+h;row++,yy+=step) {
      for(let xx=x+(row%2)*step*.5;xx<x+w;xx+=step) {
        const n=Math.sin(xx*5.7+yy*3.1);
        g.moveTo(xx,yy);
        if(kind==='scales')g.quadraticCurveTo(xx+step*.45,yy+step*.8,xx+step*.9,yy);
        else g.quadraticCurveTo(xx-.2,yy+.8,xx+.55+n*.5,yy+step*.75);
      }
    }g.stroke();g.restore();
  }
  function eye(x,y,color='#dcba66',s=.7) {
    line(`M${x-1.5*s} ${y-.6*s} Q${x} ${y-1.3*s} ${x+1.7*s} ${y-.3*s}`,ink,.65);
    path(`M${x-1.1*s} ${y} Q${x} ${y-1*s} ${x+1.3*s} ${y} Q${x} ${y+.8*s} ${x-1.1*s} ${y}`,color,null);
    oval(x+.3*s,y,.23*s,.65*s,ink);oval(x+.1*s,y-.22*s,.16*s,.15*s,'#fff6d2');
  }
  function gem(x,y) {path(`M${x} ${y-1.6} L${x+1.5} ${y} ${x} ${y+1.6} ${x-1.5} ${y} Z`,grad(cloth,x-1,y-1,x+1,y+1),gold,.45);}
  function strap(d,w=2) {line(d,'#322f27',w+.8);line(d,grad(cloth),w);}
  function cuff(x,y,a=0) {
    g.save();g.translate(x,y);g.rotate(a);
    path('M-2 -2 L3 -1 2.6 3 -2.2 2 Z',grad(['#dbc086','#8b703e','#51432b'],-2,-2,3,3),gold,.35);
    line('M-1 -1 L-1 1.7 M1 -1 L1 2',ivory,.3);g.restore();
  }
  function legs(colors,kind,front=false) {
    for(let i=0;i<2;i++) {
      const x=i?12:-15, offset=walk*(i?1:-1)*(front?3:-3), far=front?0:3;
      g.save();g.translate(x+far,0);
      const limb=id==='ammit'
        ? `M-5 -20 Q-7 -14 -4 -7 L${-4+offset} -1 Q${offset} 1 ${5+offset} 0 L${5+offset} -3 ${3+offset} -5 5 -17 Z`
        : id==='nidhogg'
          ? `M-4 -21 Q-7 -17 -4 -13 L${3+offset*.5} -9 ${1+offset} -3 ${-1+offset} -1 ${6+offset} 0 ${7+offset} -2 ${4+offset} -4 ${6+offset*.5} -11 1 -17 3 -21 Z`
          : `M-3 -20 C-5 -14 -3 -10 ${-1+offset*.45} -8 L${-2+offset} -1 Q${offset} 1 ${4+offset} 0 L${4+offset} -1.5 ${1+offset} -2 ${2+offset*.45} -9 Q5 -14 3 -20 Z`;
      const p=path(limb,front?grad(colors,-4,-19,4,0):colors[2]);
      if(front){line(`M-2 -17 Q-3 -12 ${offset*.45} -10 L${offset} -4`,colors[0],.8);texture(p,-5,-19,13,16,kind==='scales'?'scales':'fur',colors[1],1.9);}
      if(kind==='hoof')path(`M${-2+offset} -2 L${3+offset} -2 ${4+offset} 0 ${-2+offset} 0 Z`,'#32312b');
      else for(let k=0;k<3;k++)path(`M${offset+k*.95} -.9 L${offset+k*.95+1} -.8 ${offset+k*.95+1.6} .4 Z`,ivory,null);
      g.restore();
    }
  }
  function body(colors,kind='fur') {
    const outline=id==='ammit'
      ? 'M-23 -26 C-20 -34 -5 -35 7 -30 C17 -33 22 -27 22 -20 Q21 -10 12 -9 C0 -6 -16 -7 -21 -13 Q-27 -17 -23 -26 Z'
      : id==='nidhogg'
        ? 'M-22 -22 C-13 -28 -6 -25 2 -27 Q13 -33 20 -27 L22 -20 Q17 -14 9 -14 L-6 -14 Q-21 -11 -22 -22 Z'
        : id==='fenrir'
          ? 'M-21 -23 Q-17 -30 -8 -27 L3 -29 Q9 -34 16 -30 Q22 -25 19 -19 Q15 -12 9 -13 L0 -18 Q-9 -14 -16 -15 Q-23 -17 -21 -23 Z'
          : 'M-20 -23 C-16 -30 -7 -28 2 -28 C9 -34 18 -29 20 -22 C23 -14 13 -11 6 -12 C-1 -9 -11 -10 -17 -14 C-23 -15 -24 -19 -20 -23 Z';
    const p=path(outline,grad(colors,-7,-31,3,-10));
    texture(p,-25,-35,48,29,kind,kind==='scales'?'#b6be9159':'#efdfba38',id==='ammit'?3:2.1);
    line('M-14 -24 Q-7 -27 0 -24 M4 -25 Q12 -29 15 -22 M-11 -14 Q-2 -11 4 -15',colors[0],.6);
    line('M-16 -19 Q-12 -23 -9 -18 M7 -23 Q4 -18 9 -14',colors[2],.65);
    if(id==='ammit')line('M-19 -27 Q-15 -31 -10 -28 M-18 -12 Q-10 -8 0 -10 M-21 -25 Q-25 -19 -20 -15',colors[0],.75);
  }
  g.save();g.translate(strike*1.6,breathe-Math.abs(walk)*.55);

  if(['minotaur','cyclops','jotun'].includes(id)) {
    const bull=id==='minotaur', frost=id==='jotun';
    const skin=bull?['#b28252','#765039','#3c3027']:frost?['#afc8ce','#668797','#344c60']:['#cfb38c','#9b7c5c','#574c3e'];
    for(let i=0;i<2;i++) {
      const x=i?7:-8, step=walk*(i?3:-3);
      const p=path(`M${x-4} -21 Q${x-6} -14 ${x-3+step*.5} -9 L${x-4+step} -1 Q${x+step} 1 ${x+6+step} 0 L${x+5+step} -2 ${x+1+step} -3 ${x+2+step*.5} -11 Q${x+6} -17 ${x+4} -21 Z`,grad(skin,x-4,-20,x+4,0));
      if(bull)texture(p,x-6,-20,17,18,'fur','#dfb98661',1.7);
      line(`M${x-2} -17 Q${x-3} -13 ${x+step*.5} -10 L${x-1+step} -5`,skin[0],.6);
      if(bull){path(`M${x-4+step} -3 L${x+4+step} -3 ${x+6+step} 0 ${x-4+step} 0 Z`,'#282b27');line(`M${x+step} -2 L${x+step} 0`,'#aea17c',.4);}
      else for(let k=0;k<3;k++)line(`M${x-3+step} ${-7+k*1.5} L${x+2+step} ${-6+k*1.5}`,frost?'#929f9f':'#d0b998',.9);
    }
    // Tapered torso, separate pectoral planes and overlapping leather skirt.
    const torso=path('M-11 -43 Q-18 -40 -14 -30 L-10 -21 Q0 -17 10 -22 L14 -34 Q16 -42 9 -44 Q1 -47 -11 -43 Z',grad(skin,-8,-44,8,-20));
    if(bull)texture(torso,-17,-45,34,26,'fur','#d1a57755',1.6);
    path('M-9 -40 Q-3 -43 0 -37 Q-3 -32 -10 -35 Z',grad([skin[0],skin[1]],-8,-41,-3,-34),null);
    path('M1 -38 Q7 -43 11 -39 L9 -34 Q3 -33 1 -38 Z',grad([skin[0],skin[1]],3,-40,8,-33),null);
    line('M0 -35 L0 -25 M-6 -31 Q-3 -33 -1 -30 M2 -30 Q5 -32 8 -30 M-5 -27 L-1 -27 M2 -27 L6 -27',skin[2],.6);
    path('M-11 -22 Q0 -19 11 -22 L14 -12 8 -10 4 -12 0 -10 -4 -12 -11 -10 -14 -12 Z',grad(['#887355','#463e33','#2f302a'],-7,-22,8,-10));
    for(let x=-10;x<12;x+=4)line(`M${x} -20 L${x+1} -12`,'#b094625e',.6);
    strap('M-11 -22 Q0 -19 11 -22',2);gem(0,-20.5);
    const arm=path('M-12 -41 Q-20 -40 -20 -34 L-19 -27 Q-23 -23 -20 -19 L-15 -18 -13 -22 -14 -28 -12 -33 Z',grad(skin,-19,-40,-14,-20));
    if(bull)texture(arm,-22,-41,12,24,'fur','#d3b18b66',1.6);
    cuff(-17,-24,.1);line('M-19 -22 L-18 -19 M-17 -22 L-16 -19',skin[2],.45);
    g.save();g.translate(11,-32);g.rotate(-.25+strike*1.15);
    path('M-2 -4 Q4 -4 5 1 L11 5 15 2 18 6 Q15 12 10 10 L1 6 Q-3 3 -2 -4 Z',grad(skin,-1,-4,12,10));
    line('M1 -2 Q3 0 3 3 L10 7',skin[0],.7);
    line('M14 13 L14 -16','#392e21',2.7);line('M13.5 12 L13.5 -16','#ae8853',1.2);
    if(bull) {
      path('M14 -17 Q20 -18 23 -21 Q27 -12 22 -5 Q18 -7 14 -8 Z',grad(['#dbe0d7','#83918e','#35474a'],15,-20,23,-5));
      path('M14 -17 L8 -20 Q4 -14 8 -8 L14 -9 Z',grad(['#9eada7','#51646a'],7,-20,14,-8));
      line('M23 -20 Q26 -12 22 -6','#f0eacb',.8);line('M8 -19 Q5 -14 8 -9','#c0cbc4',.6);
      path('M12 -18 L16 -18 16 -7 12 -7 Z','#b3975c');oval(14,-13,1,1,'#efe1a7');
      line('M18 -15 L21 -13 18 -10','#bbc3b1',.5);
    } else if(frost) {
      path('M5 -19 L18 -22 23 -17 21 -8 7 -7 Z',grad(['#e0f2e9','#85b5c7','#3c647f'],6,-22,21,-7));
      path('M5 -19 L18 -22 23 -17 10 -14 Z','#bbddd9');line('M10 -14 L7 -7 M10 -14 L23 -17','#f1f6dc',.65);
      line('M15 -17 L14 -13 17 -12 14 -8 M19 -15 L20 -12','#44728b',.7);
    } else {
      path('M10 -20 Q14 -23 19 -20 L19 -12 17 -6 11 -7 Z',grad(['#aa8b5e','#6a5036','#3c3629'],10,-20,18,-6));
      line('M13 -19 L12 -11 M16 -20 L16 -14 14 -9','#c4a773',.65);
      path('M10 -12 L18 -13 18 -10 10 -9 Z','#6c7065');oval(14,-11, .7,.7,'#cec4a0');
    }
    cuff(10,7,.5);path('M13 3 Q18 2 18 6 L16 9 13 8 Z',skin[1]);line('M14 4 L17 4 M14 6 L17 6',skin[2],.4);g.restore();
    if(bull) {
      const mane=path('M-9 -49 L-14 -46 -11 -42 -14 -39 -10 -35 -8 -30 -4 -32 0 -30 3 -36 8 -39 7 -48 Z',grad(['#6b5036','#372d26'],-7,-49,4,-30));
      texture(mane,-14,-49,24,20,'fur','#be946272',1.4);
      path('M-6 -49 Q-13 -46 -15 -54 Q-17 -49 -13 -44 L-6 -43 Z',grad([ivory,'#aa9066','#514635'],-14,-54,-6,-43));
      path('M4 -49 Q11 -48 12 -57 Q17 -49 9 -44 L5 -44 Z',grad([ivory,'#b79b6f','#514635'],11,-57,5,-44));
      const head=path('M-6 -51 Q1 -54 7 -49 L8 -43 15 -41 Q18 -38 14 -35 L6 -35 0 -39 -5 -40 Z',grad(['#bb8f5d','#805237','#49362b'],-5,-51,14,-35));
      texture(head,-6,-51,24,17,'fur','#e1bc8266',1.55);
      path('M5 -41 Q12 -43 16 -40 L16 -37 Q10 -34 5 -38 Z','#9c7856');
      line('M-2 -46 L4 -45 M6 -44 L10 -43','#3a2d24',1.2);eye(6,-44,'#dcac4f',.65);
      oval(13,-39,.9,.6,'#392b22');line('M7 -37 Q12 -36 15 -38','#463124',.6);
      g.beginPath();g.arc(13.2,-36.3,1.6,-.2,Math.PI*1.4);g.strokeStyle=gold;g.lineWidth=.65;g.stroke();
    } else if(frost) {
      path('M-8 -45 L-10 -52 -7 -50 -5 -57 -2 -52 1 -58 4 -51 7 -55 9 -47 Z',grad(['#e5f4e7','#719aac'],-4,-57,3,-44));
      path('M-6 -49 Q1 -53 8 -48 L9 -40 4 -35 -4 -38 Z',grad(skin,-5,-49,8,-36));
      line('M-4 -44 L0 -45 M3 -45 L7 -44',ink,.7);eye(-1,-43,'#b6edee',.6);eye(6,-43,'#b6edee',.55);
      path('M2 -44 L4 -40 1 -39 Z','#c1d8d5',null);
      const beard=path('M-7 -42 L-4 -39 0 -39 2 -37 5 -39 9 -41 8 -33 3 -26 -1 -29 -5 -27 -9 -36 Z',grad(['#e5e3ca','#a5b7b7','#5a7b8b'],-5,-41,4,-26));
      texture(beard,-9,-42,19,18,'fur','#3e64787a',1.35);line('M-1 -37 L4 -37','#53636b',.6);
      line('M-10 -35 L-7 -32 -9 -29 M8 -33 L5 -29 6 -26','#cee3dd',.65);
    } else {
      path('M-7 -47 Q-6 -55 2 -55 Q10 -54 11 -46 L10 -39 5 -35 -3 -37 -7 -42 Z',grad(skin,-6,-54,10,-36));
      line('M-4 -48 Q2 -51 8 -48 M-4 -50 Q1 -52 6 -50','#6a5945',.45);
      path('M-3 -45 Q2 -49 8 -45 Q3 -42 -3 -45 Z','#dbd0ac','#514532',.6);
      oval(3,-45,1.35,1.5,'#7a8146');oval(3.3,-45,.65,1.1,ink);oval(2.9,-45.6,.35,.35,'#f8efcb');
      path('M2 -42 L5 -39 1 -39 Z','#be9f76',null);line('M0 -37.8 Q5 -39 8 -38','#4a3f32',.7);
      for(let k=0;k<8;k++)line(`M${-3+k*1.4} ${-39+(k%3)} l.3 1`,'#594d3a',.5);
      line('M-4 -44 L-5 -41 -3 -40','#dfc8a0',.6);oval(9,-42,1.2,2,skin[1]);
    }
  } else if(id==='centaur') {
    const coat=['#be9161','#856044','#45382d'];
    legs(coat,'hoof',false);
    path('M-19 -24 Q-27 -26 -25 -15 Q-23 -10 -26 -5 Q-19 -9 -21 -17 L-17 -21 Z',grad(['#66503b','#292a26'],-24,-25,-22,-5));
    body(coat);legs(coat,'hoof',true);
    const skin=['#d5b18a','#ac815b','#694d38'];
    path('M3 -23 Q0 -29 1 -37 L4 -44 12 -43 Q17 -39 16 -33 L14 -24 Z',grad(skin,2,-43,15,-23));
    line('M4 -38 Q8 -35 12 -38 M6 -33 L6 -29 M8 -29 L12 -29','#805d41',.6);
    path('M2 -25 L14 -26 18 -19 10 -17 3 -20 Z',grad(cloth,2,-26,16,-17));strap('M2 -25 L14 -26',1.8);gem(9,-25.5);
    path('M3 -46 Q4 -53 11 -53 L16 -49 15 -43 11 -40 6 -42 Z',grad(skin,5,-52,14,-41));
    path('M2 -47 Q1 -54 8 -55 Q15 -55 17 -49 L13 -49 10 -51 7 -48 6 -43 2 -40 Z','#42372b');
    line('M3 -50 Q6 -54 12 -52 M3 -46 L4 -42','#8f7050',.6);eye(13,-47,'#c9c4a0',.48);
    line('M15 -45 L16 -44 14 -43 M11 -42 L14 -42','#704c35',.45);
    path('M-1 -34 L-4 -45 -1 -47 3 -35 Z','#705439');
    for(let i=0;i<3;i++){line(`M${-3+i*1.4} -42 L${-5+i*1.4} -53`,'#d8c294',.45);path(`M${-5+i*1.4} -53 l-1.4 2.5 1.8 -.3 Z`,'#dddac4',null);}
    const nock=20-strike*5;
    path('M13 -40 Q17 -40 19 -36 L27 -35 27 -32 17 -32 11 -36 Z',grad(skin,12,-40,25,-32));
    path(`M5 -40 Q0 -37 5 -33 L${nock} -34 ${nock} -36 8 -37 Z`,grad(skin,5,-40,nock,-33));
    cuff(24,-34,.2);
    line('M28 -49 C39 -44 38 -27 28 -20','#41382b',1.9);
    line('M28 -49 C38 -44 37 -27 28 -20','#c9ac75',1.15);
    line(`M28 -49 L${nock} -35 28 -20`,'#e2d6b8',.4);
    line(`M${nock-1} -35 L40 -35`,'#ddc596',.65);path('M40 -35 L36.5 -36.4 37 -33.7 Z','#c6d1c8');
    line(`M${nock+1} -35 L${nock-1} -37 M${nock+2} -35 L${nock} -37`,'#ece4c5',.6);
  } else if(id==='uraeus') {
    const snake=['#d3bd77','#9a8743','#46492b'];
    const coil=path('M-23 2 C-29 -5 -15 -11 -6 -9 L8 -12 Q21 -12 23 -4 C27 6 10 9 -7 7 C-22 8 -26 6 -23 2 Z',grad(snake,-12,-11,1,8));
    texture(coil,-27,-12,53,21,'scales','#ece0a868',1.7);
    line('M-21 2 C-13 -3 4 3 15 -2 Q22 -6 13 -8 M-18 5 Q-4 3 8 5','#454728',1.2);
    line('M-20 0 C-12 -4 3 1 14 -3','#e5d08d',.7);
    const hood=path('M0 -7 C-5 -16 -13 -24 -12 -36 Q-11 -49 0 -53 Q12 -57 20 -45 C28 -33 21 -20 12 -13 L9 -6 Z',grad(snake,-9,-47,18,-14));
    texture(hood,-13,-54,40,50,'scales','#f1dfa47d',1.8);
    path('M4 -11 Q-1 -26 0 -44 L7 -49 Q13 -31 10 -12 Z',grad(['#efdf9c','#a79c65'],2,-43,9,-12),'#7e7745',.4);
    for(let y=-42;y<-11;y+=2.2)line(`M1 ${y} Q5 ${y+1.3} 10 ${y}`,'#817b48',.5);
    path('M-6 -42 Q-12 -37 -7 -27 Q-1 -31 -6 -42 Z','#5b5c35');path('M17 -43 Q23 -36 17 -27 Q12 -32 17 -43 Z','#5b5c35');
    line('M-6 -38 Q-9 -34 -6 -31 M17 -39 Q20 -34 17 -31','#b5a359',1.1);
    g.save();g.translate(strike*4,0);
    const head=path('M1 -52 Q6 -56 13 -53 L19 -49 17 -45 8 -43 2 -47 Z',grad(snake,3,-54,16,-44));
    texture(head,0,-55,20,13,'scales','#f0dfa67d',1.5);eye(13,-49,'#e9b04b',.75);
    line('M10 -45 Q15 -45 18 -47','#323725',.65);oval(17,-49,.55,.4,ink);
    if(strike>.3){line('M17 -45 L24 -44 27 -46 M24 -44 L27 -43','#b36b63',.55);}
    g.restore();
    oval(1,-56,2.5,2.5,grad(['#ecd9a0','#b18c46'],0,-59,2,-53),gold);line('M-1 -55 L3 -57','#f8e9b9',.45);
    strap('M-1 -15 Q5 -12 12 -15',1.9);gem(6,-13.5);
  } else {
    const wolf=id==='fenrir', dragon=id==='nidhogg', ammit=id==='ammit';
    const coat=wolf?['#b0b5ad','#737f7b','#394944']:dragon?['#9aab7b','#62754e','#344835']:ammit?['#afa27a','#7d8057','#414b36']:['#d8b87c','#b18b52','#655536'];
    legs(coat,dragon||ammit?'scales':'fur',false);
    if(wolf) {
      const tail=path('M-17 -24 Q-23 -27 -27 -20 L-25 -17 -27 -12 -24 -10 -26 -6 Q-17 -11 -18 -17 L-14 -21 Z',grad(coat,-24,-24,-20,-6));
      texture(tail,-28,-27,15,23,'fur','#d8d7be83',1.4);
    } else if(dragon) {
      const tail=path('M-17 -14 Q-28 -15 -27 -29 Q-27 -37 -22 -41 Q-26 -30 -22 -25 L-13 -23 Z',grad(coat,-26,-37,-16,-17));
      texture(tail,-28,-40,17,26,'scales','#c1ca9c80',1.8);
      const wing=path('M2 -22 Q-7 -43 -22 -55 L-20 -40 Q-13 -43 -9 -30 Q-5 -34 -1 -25 L8 -22 Z',grad(['#b4a87d','#6a7353','#3d5140'],-17,-53,1,-24));
      line('M2 -23 Q-9 -43 -22 -55 M-22 -55 L-20 -40 M-22 -55 L-9 -30','#d1c292',.9);
      const frontWing=path('M4 -24 Q6 -44 17 -57 L19 -43 Q12 -43 13 -32 Q8 -34 8 -23 Z',grad(['#adab7b','#64754c','#334c3b'],15,-54,5,-24));
      line('M6 -24 Q7 -44 17 -57 L19 -43 M17 -57 L13 -32','#c3bd8e',1);
      texture(wing,-23,-55,33,34,'fur','#a9b08c33',3.1);texture(frontWing,4,-57,16,35,'fur','#c2bf8d33',2.8);
    } else {
      line('M-18 -22 Q-27 -27 -25 -12 Q-24 -7 -27 -6',coat[2],2.5);
      line('M-18 -22 Q-27 -27 -25 -12',coat[0],1.3);
      if(!ammit)path('M-27 -10 Q-23 -9 -25 -4 L-28 -2 -28 -7 Z','#6d573b');
    }
    body(coat,dragon||ammit?'scales':'fur');legs(coat,dragon||ammit?'scales':'fur',true);
    if(wolf) {
      const neck=path('M1 -22 L4 -31 3 -34 8 -33 9 -39 13 -36 17 -41 19 -36 23 -33 27 -30 26 -27 33 -25 35 -22 31 -19 24 -19 21 -15 18 -17 14 -12 10 -18 6 -16 Z',grad(coat,9,-37,22,-15));
      texture(neck,1,-40,35,30,'fur','#d7d9c187',1.4);
      path('M15 -35 L16 -44 21 -37 Z',grad(coat,16,-44,20,-35));path('M18 -38 L18 -41 20 -37 Z','#544c43',null);
      path('M23 -32 L25 -40 28 -32 Z',grad(coat,25,-40,26,-32));path('M25 -34 L25 -38 27 -33 Z','#544c43',null);
      path(`M24 -24 L34 -22 32 ${-18+strike*3} 24 ${-18+strike*2} 21 -21 Z`,'#3f4137');
      path('M26 -29 Q30 -26 35 -25 L36 -23 32 -21 25 -23 Z',grad(['#c0c4b1','#829087','#44584d'],27,-29,34,-21));
      path('M33 -25 L36 -24 35 -22 33 -22 Z','#232c29');eye(26,-29,'#e4bb58',.65);
      line('M23 -30 L27 -31 M17 -27 L20 -25 M13 -28 L15 -25','#34453c',.7);
      path('M30 -22 L30.4 -19.8 31.5 -22 Z',ivory,null);path('M25 -22 L25.5 -19.5 26.5 -22 Z',ivory,null);
      strap('M13 -30 Q15 -23 21 -19',1.7);
      for(let i=0;i<4;i++){g.beginPath();g.ellipse(17+i*1.6,-19+i*1.4,1.2,.7,.7,0,Math.PI*2);g.strokeStyle='#a8a895';g.lineWidth=.5;g.stroke();}
    } else if(dragon||ammit) {
      if(ammit){const mane=path('M7 -32 L11 -35 14 -33 18 -35 19 -31 23 -29 20 -24 23 -20 18 -16 15 -13 11 -17 7 -17 8 -23 5 -27 Z',grad(['#b9a16b','#78643e','#484b31'],10,-34,19,-15));texture(mane,5,-35,19,23,'fur','#e0c28b88',1.35);}
      const head=path('M12 -33 Q16 -37 22 -33 L25 -29 34 -28 39 -25 38 -22 31 -20 19 -22 14 -25 Z',grad(coat,17,-34,31,-20));
      texture(head,11,-36,29,18,'scales','#d6d5a875',1.55);
      path(`M20 -23 L37 -23 35 ${-18+strike*4} Q27 ${-16+strike*3} 19 -20 Z`,grad(['#aaa17a','#65714a'],20,-23,33,-15));
      path(`M22 -23 L36 -23 34 ${-20+strike*4} 24 -20 Z`,'#3b332b',null);
      for(let x=23;x<36;x+=2.5){path(`M${x} -23 l.7 2.4 1 -2.4 Z`,ivory,null);if(strike>.4)path(`M${x} ${-18+strike*3} l.5 -1.7 1 1.7 Z`,ivory,null);}
      eye(22,-30,'#e5bb5e',.75);line('M19 -32 L24 -32','#40513a',.9);oval(36,-26,.7,.5,ink);
      for(let x=-16;x<13;x+=4)path(`M${x} -27 l1.5 ${dragon?-5:-3} 3 3 -1 2 Z`,grad([ivory,coat[2]],x,-32,x+3,-26));
      if(dragon){
        path('M14 -32 Q8 -35 10 -42 L17 -34 Z',grad([ivory,'#948d66','#4f533a'],10,-41,17,-33));
        path('M20 -34 Q21 -40 26 -43 L24 -34 Z',grad([ivory,'#918e63'],25,-43,22,-33));
        path('M12 -28 L6 -31 8 -26 5 -22 13 -23 Z',coat[1]);line('M12 -27 L7 -29 M12 -25 L7 -23',coat[0],.5);
      }
      strap('M10 -28 Q10 -21 16 -17',2);gem(12,-20);
    } else {
      path('M7 -29 Q6 -36 9 -44 L14 -49 24 -47 Q30 -40 28 -28 L25 -22 18 -24 12 -23 Z',grad(['#b89e65','#395b69','#223c48'],9,-46,27,-23));
      const hood=path('M9 -45 Q10 -52 19 -52 Q26 -51 28 -44 L27 -27 23 -23 20 -38 14 -38 13 -23 8 -27 Z',grad(['#dcbd75','#a28a52','#665b3c'],11,-51,26,-24));
      g.save();g.clip(hood);for(let y=-49;y<-23;y+=2.2)line(`M8 ${y} Q18 ${y+1.1} 29 ${y}`,'#2d5261',1.15);g.restore();
      path('M15 -47 Q21 -49 25 -44 L25 -39 28 -37 25 -35 24 -31 19 -30 15 -34 14 -41 Z',grad(['#e2c895','#ba975e','#846b43'],15,-46,25,-31));
      eye(23,-41,'#494c35',.55);line('M20 -42 L24 -43 M24 -40 L25 -37 23 -37 M22 -34 L25 -34','#6f5939',.5);
      path('M20 -32 L24 -32 23 -25 21 -24 Z','#334b4b');for(let y=-31;y<-25;y+=1.3)line(`M21 ${y} L23 ${y}`,gold,.45);
      line('M12 -46 Q18 -49 26 -45',gold,1.1);
      path('M18 -48 Q16 -52 19 -54 Q22 -53 20 -49 Z','#e1c380');eye(19.5,-52,'#413d2a',.3);
      path('M12 -31 Q17 -26 25 -29 L25 -25 Q16 -21 11 -27 Z',grad(cloth,12,-31,24,-24),gold,.5);
      for(let x=13;x<25;x+=2)line(`M${x} -27 L${x} -25`,gold,.5);gem(20,-26);
    }
  }
  g.restore();
}
