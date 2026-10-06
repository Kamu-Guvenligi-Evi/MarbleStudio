import Matter from 'matter-js';
import {Race,COLORS,NAMES} from './physics.js';
import {EPISODE_FORMATS,FORMAT_NAMES} from './episode-plan.js';

// A production-only controller: the editor keeps its ordinary single-race behavior.
export class EpisodeRace {
  constructor(config){
    const e=config.episode;
    if(e?.version!==1||!EPISODE_FORMATS.includes(e.format)||config.count!==12||e.heats?.length!==(['elimination','championship'].includes(e.format)?3:1))throw new Error('Invalid episode rules');
    this.config=config;this.episode=e;this.language=config.language??'en';this.round=0;
    this.time=0;this.state='ready';this.finished=[];this.results=[];this.totalRescues=0;this.pause=0;
    this.entrants=Array.from({length:12},(_,id)=>({id,name:config.ballNames?.[id]??NAMES[id],imageSrc:config.ballImages?.[id],team:id%3,points:0,lastPlace:99,places:[],color:COLORS[id]}));
    this.active=[...this.entrants];this.openHeat();
  }
  openHeat(){
    const h=this.episode.heats[this.round];
    this.current=new Race({...this.config,...h,count:this.active.length,ballNames:this.active.map(e=>e.name),ballImages:this.active.map(e=>e.imageSrc)});
    // Race's editor minimum is six. Finals retain four without changing editor limits.
    for(const b of this.current.balls.splice(this.active.length))Matter.Composite.remove(this.current.engine.world,b.body);
    this.current.balls.forEach((b,i)=>{
      const entrant=this.active[i];b.entrantId=entrant.id;b.team=entrant.team;
      if(this.episode.format==='teams')b.name=`${['A','B','C'][entrant.team]} · ${entrant.name}`;
      Object.defineProperty(b,'color',{get:()=>this.episode.format==='teams'?['#71d8f2','#f080b4','#d8fa77'][entrant.team]:entrant.color});
    });
    this.current.language=this.language;
  }
  get balls(){return this.current.balls;}
  get rescues(){return this.totalRescues+this.current.rescues;}
  get finishY(){return this.current.finishY;}
  ranking(){return this.current.ranking();}
  start(){if(this.state==='ready'){this.state='running';this.current.start();}}
  target(){return this.episode.format==='elimination'?[8,4,1][this.round]:this.episode.format==='sprint'?1:6;}
  standings(){
    if(this.episode.format==='teams')return [0,1,2].map(team=>({id:team,name:(this.language==='tr'?'Takım ':'Team ')+['A','B','C'][team],points:this.entrants.filter(e=>e.team===team).reduce((s,e)=>s+e.points,0),lastPlace:Math.min(...this.entrants.filter(e=>e.team===team).map(e=>e.lastPlace))})).sort((a,b)=>b.points-a.points||a.lastPlace-b.lastPlace||a.id-b.id);
    return [...this.entrants].sort((a,b)=>b.points-a.points||this.results.reduceRight((tie,_,i)=>tie||(a.places[i]-b.places[i]),0)||a.id-b.id);
  }
  liveStandings(){
    const rows=this.standings().map(e=>({...e}));
    if(this.state==='running'&&this.pause<=0&&['teams','championship'].includes(this.episode.format)){
      this.current.finished.slice(0,6).forEach((b,i)=>{
        const id=this.episode.format==='teams'?b.team:b.entrantId;
        rows.find(e=>e.id===id).points+=6-i;
      });
    }
    return rows.sort((a,b)=>b.points-a.points);
  }
  step(dt=1000/120){
    if(this.state!=='running')return;
    this.time+=dt/1000;
    if(this.pause>0){this.pause-=dt/1000;if(this.pause<=0){this.totalRescues+=this.current.rescues;this.current.dispose();this.round++;this.openHeat();this.current.start();}return;}
    this.current.step(dt);
    if(this.current.finished.length<this.target())return;
    const finishers=this.current.finished.slice(0,this.target()),ids=finishers.map(b=>b.entrantId);
    this.entrants.forEach(e=>{e.lastPlace=ids.includes(e.id)?ids.indexOf(e.id):99;e.places.push(e.lastPlace);});
    if(['teams','championship'].includes(this.episode.format))ids.forEach((id,i)=>this.entrants[id].points+=6-i);
    this.results.push({round:this.round+1,time:this.time,finishers:ids,points:this.entrants.map(e=>e.points)});
    if(this.round<this.episode.heats.length-1){
      if(this.episode.format==='elimination')this.active=ids.map(id=>this.entrants[id]);
      this.pause=2;return;
    }
    const winner=['teams','championship'].includes(this.episode.format)?this.standings()[0]:this.entrants[ids[0]];
    this.finished=[{...winner,finishedAt:this.time}];this.state='finished';
  }
  summary(){return {format:this.episode.format,rounds:this.results,standings:this.standings().map(({id,name,team,points,lastPlace,places})=>({id,name,team,points,lastPlace,places})),winner:this.finished[0]?.name??null};}
  dispose(){this.current.dispose();}
}

export function drawEpisode(ctx,race){
  const tr=race.language==='tr',format=race.episode.format;
  ctx.save();ctx.setTransform(2,0,0,2,0,0);
  const text=(s,y,size=17,color='#edf7ff')=>{ctx.fillStyle=color;ctx.font=`600 ${size}px Segoe UI`;ctx.textAlign='center';ctx.fillText(s,270,y,470);};
  if(race.state==='finished'){
    ctx.fillStyle='#080e20f5';ctx.fillRect(0,0,540,960);
    text(FORMAT_NAMES[race.language][format],230,25);text(tr?'KAZANAN':'WINNER',300,18,'#bbed83');text(race.finished[0].name,355,32);
    if(['teams','championship'].includes(format))race.standings().slice(0,6).forEach((e,i)=>text(`${i+1}. ${e.name} · ${e.points} ${tr?'puan':'pts'}`,440+i*45,20));
    else text(tr?'Finiş sırasıyla belirlendi.':'Decided by finish order.',430,18);
  }else{
    ctx.fillStyle='#080e20ef';ctx.fillRect(25,800,490,138);
    text(`${FORMAT_NAMES[race.language][format]} · ${tr?'Tur':'Round'} ${race.round+1}/${race.episode.heats.length}`,831,19,'#bbed83');
    if(race.pause>0){
      text(tr?'Etap tamamlandı':'Stage complete',869);
      const last=race.results.at(-1);text(last.finishers.slice(0,3).map(id=>race.entrants[id].name).join(' · '),905,16);
    }else if(format==='elimination')text(race.round<2?(tr?`İlk ${race.target()} yarışmacı devam eder`:`First ${race.target()} qualify`):(tr?'Final: İlk finiş kazanır':'Final: first finish wins'),880);
    else if(['teams','championship'].includes(format)){
      text(tr?'İlk 6 finiş: 6–1 puan':'First 6 finishers: 6–1 points',866,16);
      text(race.liveStandings().slice(0,3).map(e=>`${e.name}: ${e.points}`).join(' · '),901,15);
    }else text(tr?'İlk finiş kazanır':'First across the finish wins',880);
  }
  ctx.restore();
}
