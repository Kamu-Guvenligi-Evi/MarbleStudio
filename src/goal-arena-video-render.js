import {GoalArena} from './goal-arena.js';
import {renderGoalArena} from './goal-arena-renderer.js';
import {createGameSoundDirector} from './game-sound-director.js';
import {loadBallImage} from './ball-images.js';
let game,job,canvas,ctx,effects;
export async function beginGoalArena(config){
  job=config;effects=[];game=new GoalArena(config.recipe);
  await Promise.all(game.settings.ballImages.map(loadBallImage));
  canvas??=document.createElement('canvas');canvas.width=1080;canvas.height=1920;ctx=canvas.getContext('2d');
  const direct=createGameSoundDirector('goal-arena',game.settings.soundStyle,game.settings.soundOverrides);
  game.onEvent=e=>{if(!game.settings.sound)return;const cue=direct(e,(job.intro??0)+e.time/(job.speed*game.settings.speed));if(cue)effects.push(cue);};
}
export function goalArenaFrame(elapsed){
  const time=Math.min(Math.max(0,elapsed-(job.intro??0))*job.speed,job.analysis.simulationSeconds)*game.settings.speed;
  const target=Math.ceil(time*120);
  while(game.ticks<target&&game.state==='running')game.step();
  renderGoalArena(ctx,game,{channel:job.channel,alpha:game.state==='finished'?1:Math.max(0,Math.min(1,time*120-(game.ticks-1)))});return canvas;
}
export const goalArenaAudio=()=>({effects,leaders:[]});
export const goalArenaResult=()=>({complete:game.state==='finished',winner:game.winner,scores:[...game.scores],goals:[...game.goals]});
