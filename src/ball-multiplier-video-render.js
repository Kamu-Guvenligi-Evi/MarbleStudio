import {BallMultiplier} from './ball-multiplier.js';
import {renderMultiplier} from './ball-multiplier-renderer.js';
import {createGameSoundDirector} from './game-sound-director.js';
let game,job,canvas,ctx,effects;
export function beginMultiplier(config){
  job=config;effects=[];game=new BallMultiplier(config.recipe);
  canvas??=document.createElement('canvas');canvas.width=1080;canvas.height=1920;ctx=canvas.getContext('2d');
  const direct=createGameSoundDirector('ball-multiplier',game.settings.soundStyle,game.settings.soundOverrides);
  game.onEvent=e=>{if(!game.settings.sound)return;const cue=direct(e,(job.intro??0)+e.time/job.speed);if(cue)effects.push(cue);};
}
export function multiplierFrame(elapsed){
  const time=Math.min(Math.max(0,elapsed-(job.intro??0))*job.speed,job.analysis.simulationSeconds)*game.settings.speed;
  const target=Math.ceil(time*120);
  while(game.ticks<target&&game.state==='running')game.step();
  renderMultiplier(ctx,game,{channel:job.channel,alpha:game.state==='finished'?1:Math.max(0,Math.min(1,time*120-(game.ticks-1)))});return canvas;
}
export const multiplierAudio=()=>({effects,leaders:[]});
export const multiplierResult=()=>({complete:game.state==='finished',winner:null,balls:game.balls.length});
