import {RockPaperScissors,normalizeRps} from './rock-paper-scissors.js';
import {normalizeSoundStyle} from './game-sound-director.js';
import {normalizeSoundOverrides} from './game-sound-settings.js';

export function normalizeRpsSnapshot(raw){
  const project=normalizeRps(raw.project);
  return {mode:'rock-paper-scissors',project:{...project,name:'Taş Kâğıt Makas',soundStyle:normalizeSoundStyle(project.soundStyle),soundOverrides:normalizeSoundOverrides('rock-paper-scissors',project.soundOverrides)}};
}
export const rpsOutcome=game=>game.winner?game.winner[0].toUpperCase()+game.winner.slice(1):'Draw';
export function probeRps(recipe){
  const game=new RockPaperScissors(recipe);
  let steps=0,first=null,last=0,quiet=0;
  game.onEvent=event=>{if(event.type!=='hit')return;const time=steps/120/game.settings.speed;first??=time;quiet=Math.max(quiet,time-last);last=time;};
  while(game.state==='running'&&steps<120*181){game.step(1/120);steps++;}
  const seconds=steps/120/game.settings.speed;
  return {complete:game.state!=='running',simulationSeconds:seconds,winner:rpsOutcome(game),finite:game.pieces.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),hits:game.conversions,rescues:0,score:100,coverTime:seconds*.6,firstEventSeconds:first??seconds,longestQuietSeconds:Math.max(quiet,seconds-last)};
}
