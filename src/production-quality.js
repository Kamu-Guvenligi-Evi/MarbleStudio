// These are editorial heuristics, not predictions of audience retention.
export function qualityReport({mode,seconds,eventTimes,samples,leadChanges=0,coverTime=0}){
  const firstEvent=eventTimes[0]??seconds;
  const idle=samples.filter(s=>s.motion<2).length/Math.max(1,samples.length);
  const visibility=samples.reduce((sum,s)=>sum+s.visible,0)/Math.max(1,samples.length);
  const late=samples.filter(s=>s.time>=seconds*.7);
  const tension=late.filter(s=>s.close).length/Math.max(1,late.length);
  const early=Math.exp(-firstEvent/2.5);
  const gaps=[0,...eventTimes,seconds].slice(1).map((t,i)=>t-[0,...eventTimes][i]);
  const longestQuiet=Math.max(0,...gaps);
  const rhythm=Math.exp(-longestQuiet/4);
  const score=100*(.2*early+.25*(1-idle)+.2*visibility+.2*rhythm+.15*(mode==='spiral'?rhythm:Math.min(1,tension*.7+leadChanges/15*.3)));
  return {score:Math.round(score*100)/100,firstEventSeconds:firstEvent,idleRatio:idle,visibleRatio:visibility,lateCompetitionRatio:mode==='spiral'?null:tension,longestQuietSeconds:longestQuiet,leadChanges:mode==='spiral'?0:leadChanges,coverTime};
}

export function visualSimilarity(a,b){
  if(!a||!b||a.mode!==b.mode)return 0;
  if(a.mode==='spiral')return (a.theme===b.theme?0.6:0)+((a.variant??'classic')===(b.variant??'classic')?0.4:0);
  if(a.mode==='arena'&&(a.arenaGame==='territory'||b.arenaGame==='territory')){if(a.arenaGame!==b.arenaGame)return 0;return ((a.arenaShape??'triangle')===(b.arenaShape??'triangle')?0.6:0)+(a.count===b.count?0.2:0)+((a.territoryDuration??45)===(b.territoryDuration??45)?0.2:0);}
  if(a.mode==='arena')return (a.count===b.count?0.6:0)+((a.energy??1)===(b.energy??1)?0.4:0);
  if(a.mode==='statistics')return a.statistics?.csv===b.statistics?.csv?1:0;
  if(a.episode||b.episode){
    const format=(a.episode?.format??'sprint')===(b.episode?.format??'sprint')?1:0;
    const ax=a.episode?.heats??[{sequence:a.sequence}],bx=b.episode?.heats??[{sequence:b.sequence}];
    const courses=ax.reduce((sum,h,i)=>sum+visualSimilarity({mode:'track',sequence:h.sequence},{mode:'track',sequence:bx[i]?.sequence}),0)/Math.max(ax.length,bx.length);
    return .4*format+.6*courses;
  }
  const x=(a.sequence??[]).map(s=>s.type),y=(b.sequence??[]).map(s=>s.type);
  if(!x.length||!y.length)return 0;
  const positional=x.reduce((n,t,i)=>n+(t===y[i]?1:0),0)/Math.max(x.length,y.length);
  const ax=new Set(x),by=new Set(y),overlap=[...ax].filter(t=>by.has(t)).length/new Set([...ax,...by]).size;
  return positional*.7+overlap*.3;
}
