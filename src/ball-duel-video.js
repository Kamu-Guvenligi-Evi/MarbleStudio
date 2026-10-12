import {BallDuel} from './ball-duel.js';
import {renderDuel} from './ball-duel-renderer.js';
import {loadBallImage} from './ball-images.js';
import {englishOutput} from './output-language.js';

let game,job,canvas,ctx,steps=0,effects=[],lastEffect=-1;
export async function beginDuel(config){
  job=config;steps=0;effects=[];lastEffect=-1;
  game=new BallDuel({...config.recipe,names:config.recipe.names.map(englishOutput)});
  canvas??=document.createElement('canvas');canvas.width=1080;canvas.height=1920;ctx=canvas.getContext('2d');
  await Promise.all(game.settings.ballImages.map(loadBallImage));
  game.onEvent=e=>{if(!['hit','pickup','shot','heal'].includes(e.type))return;const time=(job.intro??0)+steps/120/game.settings.playbackSpeed/job.speed;if(time-lastEffect<.045)return;lastEffect=time;effects.push({time,type:'impact',strength:e.type==='hit'?Math.min(5,e.strength*2):.5,x:e.x*1080/600});};
}
export function duelFrame(elapsed){
  const time=Math.min(Math.max(0,elapsed-(job.intro??0))*job.speed,job.analysis.simulationSeconds),target=Math.ceil(time*game.settings.playbackSpeed*120);
  while(steps<target&&game.state==='running'){game.step(1/120);steps++;}
  renderDuel(ctx,game,{english:true});return canvas;
}
export const duelAudio=()=>({effects,leaders:[]});
export const duelResult=()=>({complete:game.state==='finished',winner:game.winner===null?'Draw':englishOutput(game.settings.names[game.winner])});
