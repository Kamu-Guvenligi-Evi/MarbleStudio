import {BallDuel} from './ball-duel.js';
import {renderDuel} from './ball-duel-renderer.js';
import {loadBallImage} from './ball-images.js';
import {englishOutput} from './output-language.js';
import {createDuelSoundEvents} from './ball-duel-audio.js';

let game,job,canvas,ctx,steps=0,effects=[];
export async function beginDuel(config){
  job=config;steps=0;effects=[];
  game=new BallDuel({...config.recipe,names:config.recipe.names.map(englishOutput)});
  canvas??=document.createElement('canvas');canvas.width=1080;canvas.height=1920;ctx=canvas.getContext('2d');
  await Promise.all(game.settings.ballImages.map(loadBallImage));
  const soundEvent=createDuelSoundEvents(game.settings.soundStyle,game.settings.soundOverrides);
  game.onEvent=e=>{const time=(job.intro??0)+steps/120/game.settings.playbackSpeed/job.speed,event=soundEvent(e,game,time);if(event)effects.push(event);};
}
export function duelFrame(elapsed){
  const time=Math.min(Math.max(0,elapsed-(job.intro??0))*job.speed,job.analysis.simulationSeconds),target=Math.ceil(time*game.settings.playbackSpeed*120);
  while(steps<target&&game.state==='running'){game.step(1/120);steps++;}
  renderDuel(ctx,game,{english:true});return canvas;
}
export const duelAudio=()=>({effects,leaders:[]});
export const duelResult=()=>({complete:game.state==='finished',winner:game.winner===null?'Draw':englishOutput(game.settings.names[game.winner])});
