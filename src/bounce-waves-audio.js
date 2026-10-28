import {playEffect,stopEffects} from './impact-audio.js';

// Summarize the dense floor contacts into gentle, bounded marimba touches.
// Keep the chosen contact's exact time; never generate sounds from frame rate.
export function wavesSoundEvents(game,{speed=game.settings.speed,intro=0}={}){
  if(!game.settings.sound)return [];
  const buckets=new Map(),spacing=.14,end=game.settings.duration;
  for(const ball of game.balls){
    for(let cycle=0;;cycle++){
      const contact=ball.dropTime+cycle*ball.period;
      if(contact>=end)break;
      const time=contact/speed,key=Math.floor(time/spacing),previous=buckets.get(key);
      if(!previous||time<previous.time)buckets.set(key,{time,ball});
    }
  }
  const events=[];let last=-Infinity;
  for(const {time,ball} of [...buckets.values()].sort((a,b)=>a.time-b.time)){
    if(time-last<.115)continue;
    last=time;
    events.push({type:'directed',time:intro+time,x:270+ball.x*90,priority:1,
      cue:{voice:'soft-marimba',degree:Math.min(4,Math.floor(ball.r*5)),gain:.38,reason:'Soft floor contact'}});
  }
  return events;
}

export class WavesSoundPlayer{
  async unlock(){
    if(!this.context){
      this.context=new AudioContext();this.bus=this.context.createGain();
      this.bus.gain.value=.35;this.bus.connect(this.context.destination);
    }
    await this.context.resume();
  }
  stop(){if(this.bus)stopEffects(this.bus);}
  reset(game,from=0){
    this.stop();this.speed=game.settings.speed;this.events=wavesSoundEvents(game);
    this.cursor=0;while(this.events[this.cursor]?.time<from/this.speed)this.cursor++;
  }
  update(game,enabled){
    if(this.speed!==game.settings.speed)this.reset(game,game.time);
    const now=game.time/this.speed;
    while(this.events[this.cursor]?.time<=now){
      const event=this.events[this.cursor++];
      // Skip missed sounds after a stalled frame instead of playing a burst.
      if(enabled&&now-event.time<.12&&this.context?.state==='running'){
        playEffect(this.context,this.bus,event);
      }
    }
  }
}
