import {EscapeMultiply,normalizeEscape} from './escape-multiply.js';
export const normalizeEscapeSnapshot=raw=>({mode:'escape-multiply',project:{...normalizeEscape(raw.project),sound:raw.project?.sound!==false}});
export function probeEscape(recipe){
  const game=new EscapeMultiply(recipe);
  while(game.state==='running'&&game.time<600)game.step();
  const seconds=game.time/game.settings.speed;
  return {complete:game.state==='finished',simulationSeconds:seconds,winner:null,balls:game.created,finite:game.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)),hits:game.impactCount,rescues:0,score:100,coverTime:seconds*.65,firstEventSeconds:0,longestQuietSeconds:0};
}
