import {breakerOutcome} from './breaker-video.js';
let frame,view,job,steps=0,effects=[],lastEffect=-1;
export async function beginBreaker(config){
  frame?.remove();job=config;steps=0;effects=[];lastEffect=-1;
  frame=document.createElement('iframe');frame.hidden=true;
  const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=()=>reject(new Error('Kırıcı görüntüsü yüklenemedi.'));});
  frame.src=`/${config.recipe.mode}.html?video-render=1`;document.body.append(frame);await loaded;
  view=frame.contentWindow.breakerVideo;
  if(!view)throw new Error('Kırıcı video görüntüsü hazır değil.');
  view.reset(config.recipe,event=>{
    const time=(job.intro??0)+steps/120/job.recipe.playbackSpeed/job.speed;
    if(time-lastEffect<.035)return;lastEffect=time;
    effects.push({time,type:job.recipe.mode==='glass-breaker'?'ice':'impact',strength:Math.min(5,event?.energy/100||2),x:event?.x??270});
  },config.channel);
}
export function breakerFrame(elapsed){
  const time=Math.min(Math.max(0,elapsed-(job.intro??0))*job.speed,job.analysis.simulationSeconds);
  const target=Math.ceil(time*job.recipe.playbackSpeed*120);
  while(steps<target&&view.state()==='running'){view.step(1/120);steps++;}
  return view.draw(time);
}
export const breakerAudio=()=>({effects,leaders:[]});
export const breakerResult=()=>({complete:['won','lost'].includes(view.state())||(job.recipe.mode==='spiral-breaker'&&steps>=Math.round(job.analysis.simulationSeconds*job.recipe.playbackSpeed*120)),winner:breakerOutcome(view.state())});
