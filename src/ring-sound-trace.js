import {RingEscape,normalizeRing} from './ring-escape.js';
export function ringSignature(settings) {
  const s=normalizeRing(settings);
  return `ring-physics-8:${s.seed}:${s.count}:${s.duration}:${s.layout}:${s.speed}`;
}
export function ringSoundTrace(settings) {
  const s=normalizeRing(settings),game=new RingEscape(s),events=[];
  game.onEvent=e=>events.push({id:events.length,type:e.type,time:+e.time.toFixed(4),x:+(e.x??270).toFixed(1),combo:e.combo??0});
  while(game.state==='running')game.step(1/120);
  return {version:1,mode:'ring',signature:ringSignature(s),duration:+game.time.toFixed(4),speed:s.speed,events};
}
