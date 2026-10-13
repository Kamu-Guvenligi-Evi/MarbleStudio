import {FLOW_PRESETS} from './ring-escape.js';
const TAU=Math.PI*2;
function arc(c,x,y,r,start,end,color,width){c.beginPath();c.arc(x,y,Math.max(1,r),start,end);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function text(c,value,x,y,size,color,weight=600){c.fillStyle=color;c.font=`${weight} ${size}px "Segoe UI",sans-serif`;c.fillText(value,x,y);}
function blend(a,b,t){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');}
export function renderRingEscape(c,g,{paused=false,image=null}={}){
  const p=g.settings,w=c.canvas.width,h=c.canvas.height,progress=g.broken/p.count;
  c.save();c.scale(w/540,h/960);c.fillStyle=p.background;c.fillRect(0,0,540,960);c.textAlign='center';
  const halo=c.createRadialGradient(g.cx,g.cy,25,g.cx,g.cy,340);halo.addColorStop(0,p.ring+'1c');halo.addColorStop(.65,p.ring+'09');halo.addColorStop(1,p.ring+'00');c.fillStyle=halo;c.fillRect(0,150,540,630);
  // Quiet, stationary texture keeps attention on the moving gates.
  c.fillStyle=p.ring+'13';for(let y=210;y<740;y+=24)for(let x=18;x<540;x+=24)c.fillRect(x,y,1,1);
  c.letterSpacing='3px';text(c,'M A R B L E  /  S T U D I O',270,49,9,p.ring,500);c.letterSpacing='0px';
  c.save();c.font='800 29px "Segoe UI",sans-serif';c.fillStyle='#f4fff8';c.fillText(p.title||'SON HALKADAN KAÇ',270,99,480);c.restore();
  const label=g.state==='won'?'MÜKEMMEL KAÇIŞ':g.state==='timeout'?'BİR TUR DAHA?':g.remaining<=10?'SON HALKALAR. GÖZÜNÜ AYIRMA.':progress>.45?'AKIŞ HIZLANIYOR':`${p.count} HALKA. TEK BİR ÇIKIŞ.`;
  text(c,label,270,129,11,p.accent,600);
  c.textAlign='left';text(c,FLOW_PRESETS[p.layout]?.name.toLocaleUpperCase('tr')??'KLASİK AKIŞ',31,175,10,p.ring,700);
  c.textAlign='right';text(c,`${Math.ceil(g.secondsLeft).toString().padStart(2,'0')} sn`,509,175,15,g.secondsLeft<=5?p.accent:'#eef8f0',700);c.textAlign='center';
  arc(c,g.cx,g.cy,253,-Math.PI/2,TAU-Math.PI/2,'#ffffff0d',2);
  if(progress>0)arc(c,g.cx,g.cy,253,-Math.PI/2,TAU*progress-Math.PI/2,p.accent,2.5);
  // Offscreen rings remain in the simulation. Only the camera window is drawn.
  let visible=g.rings.length;
  if(g.dynamic){visible=0;while(visible<g.rings.length&&g.rings[visible].r<=247)visible++;}
  for(let i=visible-1;i>=0;i--){
    // Keep dense physical layers distinct at video resolution; always draw
    // the active boundary so its disappearance is visible on a crossing.
    if(g.dynamic&&i>0&&g.rings[i].id%Math.ceil(2/g.spacing)!==0)continue;
    const ring=g.rings[i],start=ring.angle+ring.gap/2,end=ring.angle+TAU-ring.gap/2;
    const guideStep=Math.max(1,Math.ceil(3.5/g.spacing)),guide=ring.id%guideStep===0;
    const band=Math.floor(ring.id/guideStep)%4,color=g.dynamic?blend(p.ring,p.accent,(Math.sin(ring.id*(p.layout==='rush'?.065:.035))+1)*.5):band===1?p.accent:p.ring;
    const edge=g.dynamic?Math.min(1,Math.max(0,(247-ring.r)/14)):1;
    c.globalAlpha=edge*(i===0?1:g.dynamic?.78:guide?.7:.12+.12*(1-i/Math.max(1,g.rings.length)));
    arc(c,g.cx,g.cy,ring.r,start,end,i===0?'#f2fff8':color,i===0?2.8:g.dynamic?1.15:guide?.7:Math.min(1.55,g.spacing*.4));
    if(i===0){c.globalAlpha=.13;arc(c,g.cx,g.cy,ring.r,start,end,p.ring,8);}
    c.globalAlpha=edge*(i===0?1:g.dynamic?.9:guide?.65:.18);c.fillStyle=i===0?'#ffffff':color;
    for(const a of [start,end]){c.beginPath();c.arc(g.cx+Math.cos(a)*ring.r,g.cy+Math.sin(a)*ring.r,i===0?2.7:Math.min(1.35,g.spacing*.55),0,TAU);c.fill();}
  }
  c.globalAlpha=1;
  if(g.state==='running'){
    if(g.impact>0&&g.rings.length){c.globalAlpha=g.impact/.12;arc(c,g.cx,g.cy,g.rings[0].r,g.impactAngle-.12,g.impactAngle+.12,p.accent,4);c.globalAlpha=1;}
  }
  if(p.particles){
    for(const ripple of g.ripples){c.globalAlpha=ripple.life*.4;arc(c,g.cx,g.cy,ripple.r,0,TAU,p.accent,1);}
    for(const pt of g.particles){c.globalAlpha=Math.min(1,pt.life*1.6);c.fillStyle=p.accent;c.fillRect(pt.x,pt.y,pt.size,pt.size);}
  }c.globalAlpha=1;
  const b=g.ball;
  if(g.state!=='won'){
    if(p.trail&&b.trail.length>1){c.lineCap='round';for(let i=1;i<b.trail.length;i++){const a=b.trail[i-1],d=b.trail[i];c.globalAlpha=(i/b.trail.length)**2*.65;c.strokeStyle=i>b.trail.length*.7?p.ball:p.ring;c.lineWidth=p.shape==='comet'?1+i/b.trail.length*4:1.5;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(d.x,d.y);c.stroke();}c.globalAlpha=1;}
    c.shadowColor=p.ball;c.shadowBlur=16;c.fillStyle=p.ball;c.beginPath();
    if(p.shape==='diamond'){c.moveTo(b.x,b.y-b.r*1.35);c.lineTo(b.x+b.r*1.35,b.y);c.lineTo(b.x,b.y+b.r*1.35);c.lineTo(b.x-b.r*1.35,b.y);c.closePath();}else c.arc(b.x,b.y,b.r,0,TAU);c.fill();c.shadowBlur=0;
    if(image?.complete&&image.naturalWidth){c.save();c.beginPath();c.arc(b.x,b.y,b.r,0,TAU);c.clip();c.drawImage(image,b.x-b.r,b.y-b.r,b.r*2,b.r*2);c.restore();}
  }
  if(g.state==='won'){
    arc(c,g.cx,g.cy,102,0,TAU,p.ring+'30',1);arc(c,g.cx,g.cy,112,0,TAU,p.accent+'70',1);
    text(c,'KAÇTI!',g.cx,g.cy+4,49,'#f4fff8',800);text(c,`${p.count} HALKANIN HEPSİ`,g.cx,g.cy+38,12,p.accent,600);
  }
  const chain=g.combo>=3&&g.time-g.lastBreak<1.25;
  const headline=g.state==='won'?'TAMAMLANDI':g.remaining.toLocaleString('tr-TR');
  // A brief size lift celebrates a break without screen shake or full-screen flashes.
  const lift=chain?g.flash/.32*5:0;
  text(c,headline,270,779,g.state==='won'?32:48,p.accent,800);
  text(c,g.state==='won'?`${p.count.toLocaleString('tr-TR')} HALKANIN HEPSİ`:g.state==='timeout'?'SÜRE DOLDU':'HALKA KALDI',270,805,10,p.ring,600);
  if(chain&&g.state==='running')text(c,`×${g.combo} SERİ`,270,713,15+lift*.2,p.accent,700);
  c.fillStyle='#ffffff12';c.fillRect(70,836,400,4);c.fillStyle=p.ring;c.fillRect(70,836,400*progress,4);
  c.textAlign='left';text(c,`${g.broken} / ${p.count} GEÇİLDİ`,70,864,10,p.ring,600);c.textAlign='right';text(c,`EN İYİ SERİ  ×${g.bestCombo}`,470,864,10,p.accent,600);c.textAlign='center';
  text(c,g.state==='won'?'AÇIKLIĞI BUL. AKIŞA KAPIL.':'BİR SONRAKİ AÇIKLIĞI YAKALAYABİLİR Mİ?',270,917,9,p.ring+'88',500);
  if(paused){c.fillStyle='#020807ba';c.fillRect(0,0,540,960);text(c,'DURAKLATILDI',270,456,22,'#f4fff8');}
  c.restore();
}
