import {EpisodeRace,drawEpisode} from './episode-race.js';
import {prepareCatalogImage} from './image-catalog.js';
import {Race} from './physics.js';
import {Spiral} from './spiral.js';
import {Arena} from './arena.js';
import {renderRace} from './renderer.js';
import {renderSpiral} from './spiral-renderer.js';
import {renderArena} from './arena-renderer.js';
import {createCameraDirector} from './presentation.js';
import {loadBallImage} from './ball-images.js';
import {createStatistics} from './statistics.js';
import {parseStatistics,statisticsAt} from './statistics-data.js';
import {qualityReport} from './production-quality.js';

const canvas=document.querySelector('#render'),ctx=canvas.getContext('2d');
const source=document.createElement('canvas');source.width=1080;source.height=1920;const sourceCtx=source.getContext('2d');
const create=(r,onHit=()=>{})=>{const race=new (r.episode?EpisodeRace:({track:Race,spiral:Spiral,arena:Arena}[r.mode]))({...r,onHit});race.language=r.language??'en';return race;};
const ended=(r,mode,exact=false)=>mode==='track'&&!exact&&!r.episode?r.finished.length>0:r.state==='finished';
let race,config,steps=0,cameraY=0,director,hits=[],lastHit=new Map(),musicEvents=[],lastLeader=null,statistics;
function statisticsView(){if(!statistics){const root=document.createElement('div');root.id='statistics-view';root.hidden=true;document.body.append(root);statistics=createStatistics({notify:()=>{},onRecordingChange:()=>{}});}return statistics;}
function statsResult(r){const data=parseStatistics(r.statistics.csv);return {complete:true,simulationSeconds:Number(r.statistics.duration),winner:statisticsAt(data,data.frames.at(-1).year)[0].name,hits:0,rescues:0,finite:true,score:100,coverTime:Number(r.statistics.duration)*.75};}
window.factoryRenderer={
  async prepareRoster(items){return Promise.all(items.map(prepareCatalogImage));},
  probe(recipe){
    if(recipe.mode==='statistics')return statsResult(recipe);
    const eventTimes=[];let clock=0,changes=0,last=null,previous=new Map(),viewY=0;
    const samples=[],camera=createCameraDirector(),r=create(recipe,(_strength,_x,event)=>{if(event?.type!=='drop')eventTimes.push(clock);});r.start();
    const maxSteps=recipe.exact?120*600:120*240;
    for(let i=0;i<maxSteps&&!ended(r,recipe.mode,recipe.exact);i++){
      const round=r.round;r.step(1000/120);clock=r.time;
      if(round!==r.round){viewY=0;previous=new Map();last=null;}
      if(recipe.mode==='track'){const aim=camera.target(r.current??r,recipe.presentation?.camera??'smart',1/120);viewY+=(aim-viewY)*(1-Math.exp(-4/120));}
      if(i%30===0){
        const ranked=r.ranking(),leader=ranked[0],active=ranked.filter(b=>b.eliminatedAt==null);
        if(recipe.mode!=='spiral'&&last!==null&&leader?.id!==last)changes++;last=leader?.id;
        let motion=0,observed=0;for(const b of active){const p=b.body.position,old=previous.get(b.id);if(old){motion+=Math.hypot(p.x-old.x,p.y-old.y);observed++;}}
        previous=new Map(active.map(b=>[b.id,{...b.body.position}]));
        const visible=active.filter(b=>b.body.position.y>=viewY&&b.body.position.y<=viewY+960).length/Math.max(1,active.length);
        const close=recipe.mode==='track'?ranked.length>1&&Math.abs(ranked[0].body.position.y-ranked[1].body.position.y)<100:active.length>=2&&active.length<=4;
        const recent=eventTimes.filter(t=>clock-t<1).length;
        samples.push({time:clock,motion:observed?motion/observed:2,visible,close,events:recent});
      }
    }
    const finite=r.balls.every(b=>Number.isFinite(b.body.position.x)&&Number.isFinite(b.body.position.y));
    const complete=ended(r,recipe.mode,recipe.exact)&&(recipe.mode!=='arena'||r.winners?.length>0);
    const coverSamples=samples.filter(s=>s.time>=r.time*.2&&s.time<=r.time*.85&&s.visible>.25);
    const coverScore=s=>Math.min(20,s.events)+Math.min(20,s.motion)+s.visible*20+(s.close?10:0);
    coverSamples.sort((a,b)=>coverScore(b)-coverScore(a));
    const report=qualityReport({mode:recipe.mode,seconds:r.time,eventTimes,samples,leadChanges:changes,coverTime:coverSamples[0]?.time??r.time*.5});
    const result={complete,simulationSeconds:r.time,hits:eventTimes.length,rescues:r.rescues??0,winner:r.finished[0]?.name??null,finite,...report,...(r.episode?{episode:r.summary()}:{} )};
    r.dispose();return result;
  },
  async begin(job){
    race?.dispose();race=null;config=job;steps=0;cameraY=0;hits=[];lastHit=new Map();musicEvents=[];lastLeader=null;director=createCameraDirector();
    canvas.width=job.width??1080;canvas.height=job.height??1920;
    if(job.recipe.mode==='statistics'){statisticsView().loadSnapshot(job.recipe.statistics);return;}
    await Promise.all((job.recipe.ballImages??[]).map(loadBallImage));
    race=create(job.recipe,(strength,x,effect={type:'impact'})=>{const t=(job.intro??0)+steps/120/job.speed,previous=lastHit.get(effect.type)??-1;if(t-previous>(effect.type==='ice'?.035:.025)){hits.push({time:t,strength,x,...effect});lastHit.set(effect.type,t);}});musicEvents.push({time:0,id:(race.ranking()[0]?.entrantId??race.ranking()[0]?.id)});lastLeader=(race.ranking()[0]?.entrantId??race.ranking()[0]?.id);race.start();
  },
  frame(index){
    const elapsed=index/config.fps,mode=config.recipe.mode;
    let picture;
    if(mode==='statistics')picture=statisticsView().renderFrame(elapsed/config.analysis.simulationSeconds,1/config.fps);
    else{
      const target=Math.ceil(Math.min(Math.max(0,elapsed-(config.intro??0))*config.speed,config.analysis.simulationSeconds)*120);
      while(steps<target&&!ended(race,mode,config.recipe.exact)){
        const leader=(race.ranking()[0]?.entrantId??race.ranking()[0]?.id);
        if(leader!==lastLeader){musicEvents.push({time:(config.intro??0)+steps/120/config.speed,id:leader});lastLeader=leader;}
        const round=race.round;race.step(1000/120);steps++;
        if(round!==race.round){cameraY=0;director=createCameraDirector();}
        if(mode==='track'){const aim=director.target(race.current??race,config.recipe.presentation?.camera??'smart',1/120);cameraY+=(aim-cameraY)*(1-Math.exp(-4/120));}
      }
      ({track:renderRace,spiral:renderSpiral,arena:renderArena}[mode])(sourceCtx,race.current??race,{cameraY,countdown:Math.max(0,(config.intro??0)-elapsed),paused:false,trails:config.recipe.trails??true,preview:null,suppressFinale:!!race.episode});if(race.episode)drawEpisode(sourceCtx,race);picture=source;
    }
    const w=canvas.width,h=canvas.height,scale=Math.min(w/picture.width,h/picture.height);
    ctx.fillStyle=config.template==='cinema'?'#030507':'#0b1018';ctx.fillRect(0,0,w,h);
    ctx.drawImage(picture,(w-picture.width*scale)/2,(h-picture.height*scale)/2,picture.width*scale,picture.height*scale);
    const unit=Math.min(w,h)/1080,pad=48*unit,font=38*unit;
    const band=(text,y,accent='#bbed83',compact=false)=>{
      ctx.fillStyle='#080d16ed';ctx.fillRect(pad,y,w-pad*2,(compact?70:100)*unit);ctx.fillStyle=accent;ctx.font=`600 ${compact?32*unit:font}px Segoe UI`;ctx.textAlign='center';ctx.fillText(text,w/2,y+(compact?45:63)*unit,w-pad*3);
    };
    if(mode!=='statistics'&&elapsed<3.5)band(config.copy.hook,330*unit,'#bbed83',true);
    if(config.template==='broadcast'){
      ctx.fillStyle='#a7e2cc';ctx.fillRect(0,0,w,6*unit);ctx.fillStyle='#e9fff4';ctx.font=`600 ${25*unit}px Segoe UI`;ctx.textAlign='left';ctx.fillText(config.channel??'',pad,45*unit,w-pad*2);
    }
    if(config.template==='cinema'&&config.channel){ctx.fillStyle='#eee';ctx.font=`500 ${24*unit}px Segoe UI`;ctx.textAlign='center';ctx.fillText(config.channel,w/2,50*unit,w-pad*2);}
    if(elapsed>=(config.intro??0)+config.analysis.simulationSeconds/config.speed){
      const name=mode==='statistics'?config.analysis.winner:race.finished[0]?.name??'';
      const result=mode==='spiral'?(config.copy.language==='tr'?'Merkez açıldı!':'The center is clear!'):(config.copy.language==='tr'?'Kazanan: ':'Winner: ')+name;
      if(mode!=='statistics')band(result,h-180*unit);
      if(config.outro){ctx.fillStyle='#eff8ff';ctx.font=`500 ${26*unit}px Segoe UI`;ctx.textAlign='center';ctx.fillText(config.outro,w/2,h-35*unit,w-pad*2);}
    }
    return canvas.toDataURL('image/jpeg',.92).split(',')[1];
  },
  audio(){return {effects:hits,leaders:musicEvents};},
  result(){return config.recipe.mode==='statistics'?{complete:true,winner:config.analysis.winner}:{complete:ended(race,config.recipe.mode,config.recipe.exact),winner:race.finished[0]?.name??null,...(race.episode?{episode:race.summary()}:{} )};},
};
