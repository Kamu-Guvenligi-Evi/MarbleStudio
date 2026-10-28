import {BounceWaves} from './bounce-waves.js';
import {renderWaves} from './bounce-waves-renderer.js';
import {wavesSoundEvents} from './bounce-waves-audio.js';
let game,job,canvas,ctx;
export function beginWaves(config){
  job=config;game=new BounceWaves(config.recipe);canvas??=document.createElement('canvas');
  canvas.width=1080;canvas.height=1920;ctx=canvas.getContext('2d');
}
export function wavesFrame(elapsed){
  // Include the ending landing in the last frame when there is no outro.
  // Encoded frame indices stop one sample before the clip's end time.
  if(Number.isFinite(job.duration)&&job.fps>0&&
    elapsed>=(Math.ceil(job.duration*job.fps)-1)/job.fps&&elapsed<job.duration){
    elapsed=job.duration;
  }
  game.seek(Math.max(0,elapsed-(job.intro??0))*job.speed*game.settings.speed);
  renderWaves(ctx,game,{channel:job.channel});return canvas;
}
export const wavesAudio=()=>({effects:wavesSoundEvents(game,{speed:job.speed*game.settings.speed,intro:job.intro??0}),leaders:[]});
export const wavesResult=()=>({complete:game.state==='finished',winner:null});
