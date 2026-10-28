import {GOAL_CROWD} from './goal-arena-audio-data.js';

export const GOAL_SOUND_DURATION=GOAL_CROWD.duration;
let decoded;
const resampled=new Map();
// The same recorded goal notification for live playback and offline rendering.
export function goalCrowdSamples(gain=.65,rate=48000){
  if(!decoded){
    const bytes=atob(GOAL_CROWD.pcm);
    decoded=new Float32Array(bytes.length/2);
    for(let i=0;i<decoded.length;i++){
      let value=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8);
      if(value>=32768)value-=65536;
      decoded[i]=value/32768;
    }
  }
  if(!resampled.has(rate)){
    const out=new Float32Array(Math.ceil(rate*GOAL_SOUND_DURATION));
    for(let i=0;i<out.length;i++){
      const position=i*GOAL_CROWD.rate/rate,index=Math.floor(position),fraction=position-index;
      out[i]=(decoded[index]??0)*(1-fraction)+(decoded[index+1]??0)*fraction;
    }
    resampled.set(rate,out);
  }
  return resampled.get(rate).map(sample=>sample*gain);
}
