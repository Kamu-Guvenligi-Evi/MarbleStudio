// One fresh attack, two quiet tails. Live playback and video use the same fades.
export const EFFECT_FADE=.018;
export const effectVoiceKey=e=>e.duelSound??e.clip??e.cue?.voice??e.collisionSound??e.type;
export function effectVoiceUpdates(voices,event){
  const active=[...voices],updates=new Map();
  const matching=active.filter(v=>v.key===effectVoiceKey(event)).reverse();
  matching.forEach((voice,i)=>updates.set(voice,[.28,.08][i]??0));
  const remaining=active.filter(v=>updates.get(v)!==0);
  if(remaining.length>=8){
    const victim=remaining.reduce((a,b)=>b.priority<a.priority?b:a);
    updates.set(victim,0);
  }
  return [...updates].map(([voice,level])=>({voice,level}));
}
export function effectLevelAt(voice,time){
  for(let i=voice.ramps.length-1;i>=0;i--){
    const ramp=voice.ramps[i];
    if(time>=ramp.time)return ramp.from+(ramp.to-ramp.from)*Math.min(1,(time-ramp.time)/EFFECT_FADE);
  }
  return 1;
}
export function rampEffectVoice(voice,level,time){
  const from=effectLevelAt(voice,time);
  voice.ramps.push({time,from,to:level});
  if(level===0)voice.endsAt=Math.min(voice.endsAt,time+EFFECT_FADE);
  return from;
}
export class EffectVoicePlayer{
  constructor(context,destination){this.context=context;this.destination=destination;this.voices=new Set();this.releasing=new Set();}
  end(voice){try{voice.source.stop();}catch{}voice.source.disconnect();voice.pan.disconnect();voice.gain.disconnect();this.voices.delete(voice);this.releasing.delete(voice);}
  stop(){for(const voice of [...this.voices,...this.releasing])this.end(voice);}
  play(event,samples){
    const context=this.context;
    // Offline contexts accept scheduled nodes before rendering starts.
    if(context.state!=='running'&&typeof context.startRendering!=='function')return false;
    const now=context.currentTime;
    if(event.priority===3)this.stop();
    for(const voice of this.voices)if(voice.endsAt<=now)this.end(voice);
    for(const {voice,level} of effectVoiceUpdates(this.voices,event)){
      const from=rampEffectVoice(voice,level,now),gain=voice.gain.gain;
      gain.cancelScheduledValues(now);gain.setValueAtTime(from,now);gain.linearRampToValueAtTime(level,now+EFFECT_FADE);
      if(level===0){
        this.voices.delete(voice);this.releasing.add(voice);voice.source.stop(now+EFFECT_FADE);
        // Also bound the brief release tails if a caller sends a synchronous burst.
        if(this.releasing.size>8)this.end(this.releasing.values().next().value);
      }
    }
    const buffer=samples instanceof Float32Array?context.createBuffer(1,samples.length,context.sampleRate):samples;
    if(samples instanceof Float32Array)buffer.copyToChannel(samples,0);
    const source=context.createBufferSource(),pan=context.createStereoPanner(),gain=context.createGain();source.buffer=buffer;
    pan.pan.value=Math.max(-.75,Math.min(.75,(event.x??270)/270-1));
    source.connect(gain);gain.connect(pan);pan.connect(this.destination);
    const voice={source,pan,gain,key:effectVoiceKey(event),priority:event.priority??1,ramps:[],endsAt:now+buffer.duration};
    this.voices.add(voice);source.onended=()=>this.end(voice);source.start(now);return true;
  }
}
