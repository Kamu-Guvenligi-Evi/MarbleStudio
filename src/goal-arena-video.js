import {GoalArena,normalizeGoalArena} from './goal-arena.js';
export const normalizeGoalSnapshot=raw=>({mode:'goal-arena',project:normalizeGoalArena(raw.project)});
export function probeGoalArena(recipe){
  const game=new GoalArena(recipe);while(game.state==='running')game.step();
  const seconds=game.ticks/(120*game.settings.speed),goals=game.goals;
  const times=[0,...goals.map(g=>g.time/game.settings.speed),seconds];
  return {complete:true,simulationSeconds:seconds,winner:game.winner,scores:[...game.scores],goals:[...goals],
    finite:game.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)),hits:game.hits,rescues:0,score:100,
    coverTime:goals.length?Math.min(seconds,(goals.at(-1).time+.2)/game.settings.speed):seconds*.65,
    firstEventSeconds:times[1],longestQuietSeconds:Math.max(...times.slice(1).map((t,i)=>t-times[i]))};
}
