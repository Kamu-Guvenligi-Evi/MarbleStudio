import {SPIRAL} from './spiral.js';

// The guide and the visible rail use exactly the same sampled line.
export const SPIRAL_GUIDE_SECONDS=14;
export const spiralRail=[];
export let spiralRailLength=0;
for(let i=0;i<=2500;i++){
  const angle=i/2500*Math.PI*12,radius=SPIRAL.radius-angle*SPIRAL.pitch/(Math.PI*2);
  const point={x:SPIRAL.x+Math.cos(angle)*radius,y:SPIRAL.y+Math.sin(angle)*radius,s:0};
  const previous=spiralRail.at(-1);
  if(previous)spiralRailLength+=Math.hypot(point.x-previous.x,point.y-previous.y);
  point.s=spiralRailLength;spiralRail.push(point);
}

export function spiralRailPoint(distance){
  const s=Math.max(0,Math.min(spiralRailLength,distance));
  let lo=0,hi=spiralRail.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(spiralRail[mid].s<s)lo=mid;else hi=mid;}
  const a=spiralRail[lo],b=spiralRail[hi],t=(s-a.s)/(b.s-a.s||1);
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}

export function spiralGuide(time){
  const elapsed=Number.isFinite(time)?Math.max(0,time):0;
  const distance=Math.min(1,elapsed/SPIRAL_GUIDE_SECONDS)*spiralRailLength;
  return {head:spiralRailPoint(distance),distance,
    tailStart:Math.max(0,distance-110),
    tailOpacity:Math.max(0,Math.min(1,1-(elapsed-SPIRAL_GUIDE_SECONDS)/1.2)),
    glow:elapsed<SPIRAL_GUIDE_SECONDS?1:.85+.15*Math.cos((elapsed-SPIRAL_GUIDE_SECONDS)*2.4)};
}
