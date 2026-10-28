// Shared, deterministic pentatonic arrangement for preview and exported video.
export function createMergeSound(stages=6){
  const motif=[0,2,4,2,1,3,4,3];
  let note=0,ended=false,lastPulse=-Infinity,lastMerge=-Infinity;
  return (event,time=event.time)=>{
    if(ended)return null;
    let voice,degree,gain,priority,originalType;
    if(event.type==='final'){
      ended=true;voice='soft-resolve';degree=0;gain=.46;priority=3;originalType='complete';
    }else if(event.type==='spawn'){
      if(time-lastPulse<.22)return null;
      lastPulse=time;voice='soft-vibes';degree=motif[note++%motif.length];gain=.14;priority=1;originalType='pulse';
    }else if(event.type==='merge'&&event.level<stages-1){
      if(time-lastMerge<.09)return null;
      lastMerge=time;voice='soft-kalimba';degree=Math.min(9,event.level*2);gain=.34;priority=2;originalType='multiply';
    }else return null;
    return {...event,type:'directed',originalType,mode:'ball-multiplier',time,x:270,priority,
      cue:{voice,degree,gain,duck:0,reason:'Merge pentatonic motif'}};
  };
}
