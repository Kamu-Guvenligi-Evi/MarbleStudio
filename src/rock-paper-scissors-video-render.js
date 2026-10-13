import {RockPaperScissors} from './rock-paper-scissors.js';
import {renderRps} from './rock-paper-scissors-renderer.js';
import {createGameSoundDirector} from './game-sound-director.js';
import {rpsOutcome} from './rock-paper-scissors-video.js';

let game,job,canvas,ctx,steps=0,effects=[];
export function beginRps(config){
  job=config;steps=0;effects=[];game=new RockPaperScissors(config.recipe);
  canvas??=document.createElement('canvas');canvas.width=1080;canvas.height=1920;ctx=canvas.getContext('2d');
  const direct=createGameSoundDirector('rock-paper-scissors',game.settings.soundStyle,game.settings.soundOverrides);
  game.onEvent=event=>{const time=(job.intro??0)+(steps+1)/120/game.settings.speed/job.speed,cue=direct(event,time);if(cue)effects.push(cue);};
}
export function rpsFrame(elapsed){
  const time=Math.min(Math.max(0,elapsed-(job.intro??0))*job.speed,job.analysis.simulationSeconds),target=Math.ceil(time*game.settings.speed*120);
  while(steps<target&&game.state==='running'){game.step(1/120);steps++;}
  renderRps(ctx,game,game.settings,{channel:job.channel});return canvas;
}
export const rpsAudio=()=>({effects,leaders:[]});
export const rpsResult=()=>({complete:game.state!=='running',winner:rpsOutcome(game)});
