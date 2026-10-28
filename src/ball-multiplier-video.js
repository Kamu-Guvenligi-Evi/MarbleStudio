import {BallMultiplier,normalizeMultiplier} from './ball-multiplier.js';
export const normalizeMultiplierSnapshot=raw=>({mode:'ball-multiplier',project:normalizeMultiplier(raw.project)});
export function probeMultiplier(recipe){
  const game=new BallMultiplier(recipe);let first=null,last=0,quiet=0;
  game.onEvent=e=>{if(e.type!=='multiply')return;first??=e.time;quiet=Math.max(quiet,e.time-last);last=e.time;};
  while(game.state==='running')game.step();
  const seconds=game.ticks/(120*game.settings.speed);
  return {complete:true,simulationSeconds:seconds,winner:null,balls:game.balls.length,finite:game.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)),hits:game.births,rescues:0,score:100,coverTime:seconds*.8,firstEventSeconds:first??seconds,longestQuietSeconds:Math.max(quiet,seconds-last)};
}
