// Keep useful axis intervals so changes in value also change bar lengths.
export function statisticsScale(peak) {
  const padded=Math.max(peak*1.15,0.000001);
  const magnitude=10**Math.floor(Math.log10(padded/5));
  const step=[1,2,2.5,5,10].map(value=>value*magnitude).find(value=>value>=padded/5);
  return {max:Math.ceil(padded/step)*step,step};
}

export function animateStatisticsScale(current,target,peak,dt) {
  if(!current||!dt)return target;
  const next=current+(target-current)*(1-Math.exp(-dt*6));
  // Sudden annual jumps must remain visible while the axis catches up.
  return Math.max(peak*1.04,next);
}
