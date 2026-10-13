import {breakerOutcome} from './breaker-video.js';
import {createGameSoundDirector} from './game-sound-director.js';
import {normalizeReferenceMapping} from './game-sound-settings.js';
let frame,view,job,steps=0,effects=[],lastEffect=-1,capture;
export async function beginBreaker(config){
  frame?.remove();job=config;steps=0;effects=[];lastEffect=-1;
  frame=document.createElement('iframe');frame.hidden=true;
  const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=()=>reject(new Error('Kırıcı görüntüsü yüklenemedi.'));});
  frame.src=`/${config.recipe.mode}.html?video-render=1`;document.body.append(frame);await loaded;
  view=frame.contentWindow.breakerVideo;
  if(!view)throw new Error('Kırıcı video görüntüsü hazır değil.');
  const direct=createGameSoundDirector(job.recipe.mode,job.recipe.soundStyle==='reference'?'original':job.recipe.soundStyle,job.recipe.soundOverrides);
  const mapping=normalizeReferenceMapping(job.recipe.referenceMapping);
  capture=event=>{
    const time=(job.intro??0)+steps/120/job.recipe.playbackSpeed/job.speed;
    const effect=direct(event,time);if(!effect)return;
    if(effect.type==='original'&&job.recipe.mode==='spiral-breaker'){
      const clip=mapping[event.type];if(!clip||clip==='off')return;
      effects.push({...effect,type:'reference',clip,gain:effect.priority>1?.7:event.type==='brick'?.24:.4});
    }else effects.push(effect);
  };
  view.reset(config.recipe,capture,config.channel);
}
export function breakerFrame(elapsed){
  const time=Math.min(Math.max(0,elapsed-(job.intro??0))*job.speed,job.analysis.simulationSeconds);
  const target=Math.ceil(time*job.recipe.playbackSpeed*120);
  while(steps<target&&view.state()==='running'){view.step(1/120);steps++;if(['won','lost'].includes(view.state()))capture({type:view.state()});}
  return view.draw(time);
}
export const breakerAudio=()=>({effects,leaders:[]});
export const breakerResult=()=>({complete:['won','lost'].includes(view.state())||(job.recipe.mode==='spiral-breaker'&&steps>=Math.round(job.analysis.simulationSeconds*job.recipe.playbackSpeed*120)),winner:breakerOutcome(view.state())});
