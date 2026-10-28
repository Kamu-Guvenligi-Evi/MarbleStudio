import {GLASS_THEMES} from './glass-themes.js';
import {BREAKER_MAPS} from './breaker-maps.js';
import {GlassBreaker} from './glass-breaker.js';
import {SpiralBreaker} from './spiral-breaker.js';
import {CollapseArena,normalizeCollapse} from './collapse-arena.js';
import {normalizeSoundStyle} from './game-sound-director.js';
import {normalizeSoundOverrides,normalizeReferenceMapping} from './game-sound-settings.js';

export const isBreaker=mode=>['glass-breaker','spiral-breaker','collapse-arena'].includes(mode);
export function normalizeBreaker(raw){
  if(raw.mode==='collapse-arena')return {mode:raw.mode,project:normalizeCollapse(raw.project)};
  const p=raw.project??{},glass=raw.mode==='glass-breaker';
  const seed=Number(p.seed??42),speed=Number(p.playbackSpeed??1);
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new Error('Oyun tohumu geçersiz.');
  if(!(glass?[1,3,10,25]:[1,1.5,2]).includes(speed))throw new Error('Oyun hızı geçersiz.');
  const theme=p.theme??'spectrum',mapId=p.mapId??'spiral';
  if(glass&&!Object.hasOwn(GLASS_THEMES,theme))throw new Error('Cam teması geçersiz.');
  if(!glass&&!BREAKER_MAPS.some(m=>m.id===mapId))throw new Error('Kırıcı haritası geçersiz.');
  return {mode:raw.mode,project:{name:glass?'Cam Kırıcı':'Spiral Kırıcı',seed,playbackSpeed:speed,sound:p.sound===true,soundStyle:!glass&&p.soundStyle==='reference'?'reference':normalizeSoundStyle(p.soundStyle),soundOverrides:normalizeSoundOverrides(raw.mode,p.soundOverrides),...(glass?{theme,liveColors:p.liveColors===true}:{mapId,referenceMapping:normalizeReferenceMapping(p.referenceMapping)})}};
}
export function probeBreaker(recipe){
  if(recipe.mode==='collapse-arena'){
    const game=new CollapseArena(recipe);let steps=0,first=null,last=0,quiet=0;
    game.onEvent=e=>{if(e.type!=='break')return;const t=game.time/recipe.playbackSpeed;first??=t;quiet=Math.max(quiet,t-last);last=t;};
    while(game.state==='running'&&steps<120*240){game.step();steps++;}
    const seconds=game.time/recipe.playbackSpeed,complete=game.state==='won';
    return {complete,gameComplete:complete,simulationSeconds:seconds,winner:breakerOutcome(game.state),finite:[game.radius,...game.sparks.flatMap(s=>[s.x,s.y])].every(Number.isFinite),hits:game.hits,rescues:0,score:100,coverTime:seconds*.65,firstEventSeconds:first??seconds,longestQuietSeconds:Math.max(quiet,seconds-last)};
  }
  const game=recipe.mode==='glass-breaker'?new GlassBreaker({seed:recipe.seed}):new SpiralBreaker({mapId:recipe.mapId});
  const timed=recipe.mode==='spiral-breaker',limit=Math.ceil(120*(timed?(recipe.clipSeconds??53)*recipe.playbackSpeed:600));
  let steps=0,first=null,last=0,quiet=0;
  const hit=()=>{const t=steps/120/recipe.playbackSpeed;first??=t;quiet=Math.max(quiet,t-last);last=t;};
  if(timed)game.onHit=hit;else game.onImpact=hit;
  while(game.state==='running'&&steps<limit){game.step(1/120);steps++;}
  const seconds=steps/120/recipe.playbackSpeed,gameComplete=['won','lost'].includes(game.state);
  return {complete:gameComplete||timed,gameComplete,simulationSeconds:seconds,winner:breakerOutcome(game.state),finite:game.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)),hits:game.hits,rescues:0,score:100,coverTime:seconds*.6,firstEventSeconds:first??seconds,longestQuietSeconds:Math.max(quiet,seconds-last)};
}
export const breakerOutcome=state=>state==='won'?'Cleared':state==='lost'?'Out of balls':'In progress';
