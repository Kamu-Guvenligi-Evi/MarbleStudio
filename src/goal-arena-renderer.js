import {FIELD,GOAL_TIMING} from './goal-arena.js';
import {drawChannelTitle} from './channel-branding.js';
import {ballImage} from './ball-images.js';

export function renderGoalArena(ctx,game,{channel,alpha=1}={}){
  const {settings:s}=game,{x:cx,y:cy,radius:R,ballRadius:r,goalDepth:depth}=FIELD;
  const colors=[s.homeColor,s.awayColor],codes=[s.homeCode,s.awayCode];
  const accent=game.lastScorer===null?'#72e7fa':colors[game.lastScorer];
  const goalAge=game.time-game.lastGoalTime,flash=Math.max(0,1-goalAge/.65);
  const celebrating=game.phase==='goal',restarting=game.phase==='kickoff';
  const angle=game.previousGoalAngle+(game.goalAngle-game.previousGoalAngle)*alpha;
  const circle=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);};
  const text=(value,x,y,size,color='#f2f6ff',weight=700,maxWidth=480)=>{
    ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Segoe UI",sans-serif`;ctx.fillText(value,x,y,maxWidth);
  };
  ctx.save();ctx.scale(ctx.canvas.width/540,ctx.canvas.height/960);
  ctx.fillStyle='#080d1b';ctx.fillRect(0,0,540,960);ctx.textAlign='center';ctx.textBaseline='middle';
  drawChannelTitle(ctx,channel,270,58,13);
  text(`${game.minute}′`,270,144,35);
  ctx.lineCap='round';ctx.fillStyle='#263348';ctx.fillRect(64,184,412,2);
  ctx.fillStyle=accent;ctx.fillRect(64,184,412*game.minute/90,2);
  for(const g of game.goals){circle(64+412*g.minute/90,185,3);ctx.fillStyle=colors[g.team];ctx.fill();}
  const recent=game.goals.slice(-5);
  recent.forEach((g,i)=>text(`${codes[g.team]} ${g.minute}′`,270+(i-(recent.length-1)/2)*82,209,10,colors[g.team],600,78));
  // One open ring and a net attached to it; both use the same physics angle.
  ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);
  const half=s.goalWidth/2,line=Math.sqrt(R*R-half*half);
  ctx.fillStyle='#101d30';ctx.fillRect(line,-half,depth,half*2);
  ctx.strokeStyle='#7393aa';ctx.lineWidth=.6;ctx.globalAlpha=.5;
  ctx.beginPath();for(let x=line+6;x<line+depth;x+=6){ctx.moveTo(x,-half);ctx.lineTo(x,half);}
  for(let y=-half+6;y<half;y+=6){ctx.moveTo(line,y);ctx.lineTo(line+depth,y);}ctx.stroke();
  ctx.globalAlpha=1;ctx.lineWidth=2.2;ctx.strokeStyle='#e6f8ff';
  ctx.beginPath();ctx.moveTo(line,-half);ctx.lineTo(line+depth,-half);ctx.lineTo(line+depth,half);ctx.lineTo(line,half);ctx.stroke();ctx.restore();
  ctx.shadowColor=accent;ctx.shadowBlur=9+flash*9;ctx.strokeStyle=accent;ctx.lineWidth=2.3;
  ctx.beginPath();ctx.arc(cx,cy,R,angle+game.halfOpening,angle+Math.PI*2-game.halfOpening);ctx.stroke();ctx.shadowBlur=0;
  if(flash>0){
    const g=game.goals.at(-1);ctx.fillStyle=accent;
    ctx.save();ctx.beginPath();ctx.rect(8,220,524,520);ctx.clip();
    circle(g.x,g.y,18+goalAge*180);ctx.strokeStyle=accent;ctx.lineWidth=4*flash;ctx.globalAlpha=flash;ctx.stroke();
    for(let i=0;i<40;i++){const a=i*2.39996,dist=goalAge*(80+(i%7)*22);ctx.globalAlpha=flash;
      circle(g.x+Math.cos(a)*dist,g.y+Math.sin(a)*dist+goalAge*goalAge*65,2+(i%3));ctx.fill();}
    ctx.restore();
    ctx.globalAlpha=1;
  }
  for(const b of game.balls){
    for(let i=0;i<b.trail.length;i++){const p=b.trail[i];ctx.globalAlpha=(i+1)/b.trail.length*.12;
      circle(p.x,p.y,r*(.35+.55*i/b.trail.length));ctx.fillStyle=colors[b.id];ctx.fill();}
    ctx.globalAlpha=1;const x=b.px+(b.x-b.px)*alpha,y=b.py+(b.y-b.py)*alpha;
    circle(x,y,r);ctx.fillStyle=b.id===0?'#111827':colors[1];ctx.fill();
    const portrait=ballImage(s.ballImages[b.id]);
    if(portrait){ctx.save();circle(x,y,r);ctx.clip();ctx.drawImage(portrait,x-r,y-r,r*2,r*2);ctx.restore();}
    else text(codes[b.id],x,y+.3,codes[b.id].length>3?13:16,'#fff',800,r*1.75);
    circle(x,y,r);ctx.strokeStyle=colors[b.id];ctx.lineWidth=2.5;ctx.stroke();
  }
  if(celebrating){
    const reveal=Math.min(1,goalAge/.16),fade=Math.min(1,(GOAL_TIMING.hold-goalAge)/.22);
    ctx.save();ctx.globalAlpha=fade;
    circle(cx,cy,R-5);ctx.fillStyle='#050a16f2';ctx.fill();
    circle(cx,cy,R-11);ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();
    // A single expanding impact, then a readable hold; no repeating flashes.
    ctx.save();ctx.globalAlpha*=Math.max(0,1-goalAge/.8)*.5;
    circle(cx,cy,70+Math.min(1,goalAge/.8)*120);ctx.lineWidth=7;ctx.stroke();ctx.restore();
    const portrait=ballImage(s.ballImages[game.lastScorer]);
    circle(cx,352,39);ctx.fillStyle=colors[game.lastScorer];ctx.fill();
    if(portrait){ctx.save();circle(cx,352,36);ctx.clip();ctx.drawImage(portrait,cx-36,316,72,72);ctx.restore();}
    else text(codes[game.lastScorer],cx,353,21,'#080d1b',900,67);
    ctx.save();ctx.translate(cx,439);const scale=.8+.2*(1-(1-reveal)**3);ctx.scale(scale,scale);
    text('GOAL!',0,0,76,accent,900,370);ctx.restore();
    text(game.lastScorer===0?s.home:s.away,cx,500,22,'#fff',700,330);
    text(`${game.scores[0]} – ${game.scores[1]}`,cx,568,68,'#fff',900,340);
    const own=game.scores[game.lastScorer],other=game.scores[1-game.lastScorer];
    text(own===other?'ALL SQUARE':own===other+1?'TAKES THE LEAD':`${codes[game.lastScorer]} SCORES`,cx,626,14,accent,800,310);
    ctx.restore();
  }else if(restarting){
    const progress=Math.min(1,(goalAge-GOAL_TIMING.hold)/GOAL_TIMING.restart);
    ctx.save();ctx.globalAlpha=1-progress;
    circle(cx,cy,64+progress*34);ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();
    text('KICK OFF',cx,cy-102,20,'#fff',800);ctx.restore();
  }
  const scoreY=780;
  ctx.fillStyle='#02050c';ctx.fillRect(58,scoreY-30,424,60);
  ctx.fillStyle=colors[0];ctx.fillRect(58,scoreY-30,4,60);ctx.fillStyle=colors[1];ctx.fillRect(478,scoreY-30,4,60);
  text(codes[0],134,scoreY,20,colors[0],800,110);text(codes[1],406,scoreY,20,colors[1],800,110);
  for(let i=0;i<2;i++)text(String(game.scores[i]),i?301:239,scoreY,32+(game.lastScorer===i?10*flash:0),game.lastScorer===i&&celebrating?accent:'#f2f6ff');
  text('–',270,scoreY,18,'#64758b');
  if(game.state==='finished'){
    ctx.fillStyle='#050a16de';ctx.fillRect(0,260,540,465);
    text('FULL TIME',270,389,17,'#aab6cd',700);
    text(codes[0],196,444,22,colors[0],800,130);text(codes[1],344,444,22,colors[1],800,130);
    text(`${game.scores[0]} – ${game.scores[1]}`,270,503,63,'#fff',800);
    const winner=game.scores[0]===game.scores[1]?null:game.scores[0]>game.scores[1]?0:1;
    text(winner===null?'DRAW':`${codes[winner]} WINS`,270,572,25,winner===null?'#72e7fa':colors[winner],800);
  }
  ctx.restore();
}
