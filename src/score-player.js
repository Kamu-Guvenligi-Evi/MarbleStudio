import {cueSamples,sectionAt,validatePlan} from './sound-plan.js';

// The model plans once. Playback is entirely local and tied to simulation events.
export class ScorePlayer {
  constructor(){this.score=null;this.voices=new Set();this.buffers=new Map();this.reset();}
  connect(context,fx,music,duck){Object.assign(this,{context,fx,music,duck});}
  setScore(score,trace) {
    this.stop();this.buffers.clear();this.score=score?{...score,plan:validatePlan(score.plan,trace)}:null;
    this.trace=trace;this.cues=new Map(score?.plan.cues.map(c=>[c.eventId,c])??[]);this.reset();
  }
  reset(){this.stop();this.eventIndex=0;this.beat=-1;this.played=0;this.skipped=0;this.lastCue=null;this.active=false;}
  stop(){for(const v of this.voices){try{v.source.stop();}catch{}v.source.disconnect();v.pan.disconnect();}this.voices.clear();this.active=false;if(this.duck){const t=this.context.currentTime;this.duck.gain.cancelScheduledValues(t);this.duck.gain.setTargetAtTime(1,t,.04);}}
  sync(time,playing,speed=1) {this.stop();this.active=playing;this.speed=speed;this.anchor=time;this.clock=this.context?.currentTime??0;this.beat=this.score?Math.ceil(time*this.score.plan.bpm/60*2)-1:-1;}
  play(cue,bus,pan=0,when=this.context?.currentTime,priority=1) {
    if(!this.context||this.context.state!=='running'||!this.active)return;
    if(this.voices.size>=24){const oldest=[...this.voices].find(v=>v.priority<priority)??[...this.voices].find(v=>v.priority===priority);if(!oldest)return;oldest.source.stop();oldest.source.disconnect();oldest.pan.disconnect();this.voices.delete(oldest);}
    const key=JSON.stringify([cue.voice,cue.degree,cue.gain]);
    let buffer=this.buffers.get(key);
    if(!buffer){const samples=cueSamples(this.score.plan,cue,this.context.sampleRate);buffer=this.context.createBuffer(1,samples.length,this.context.sampleRate);buffer.copyToChannel(samples,0);if(this.buffers.size>300)this.buffers.clear();this.buffers.set(key,buffer);}
    const source=this.context.createBufferSource(),panner=this.context.createStereoPanner();source.buffer=buffer;panner.pan.value=Math.max(-.75,Math.min(.75,pan));source.connect(panner);panner.connect(bus);
    const startsAt=Math.max(this.context.currentTime,when),voice={source,pan:panner,priority,endsAt:startsAt+buffer.duration};this.voices.add(voice);source.onended=()=>{this.voices.delete(voice);source.disconnect();panner.disconnect();};source.start(startsAt);
  }
  event(event,enabled) {
    const id=this.eventIndex++,cue=this.cues.get(id);
    if(!this.score)return false;
    // Silence is a deliberate model choice, never replaced with a default hit.
    if(!cue||!enabled||!this.active){this.skipped++;return true;}
    const expected=this.trace.events[id];
    if(!expected||expected.type!==event.type||Math.abs(expected.time-event.time)>.02){this.skipped++;return true;}
    const priority=['win','timeout'].includes(event.type)?3:event.type==='break'?2:1;
    this.play(cue,this.fx,(event.x??270)/270-1,undefined,priority);this.played++;this.lastCue=cue;
    if(this.duck&&cue.duck>0){const t=this.context.currentTime,p=this.duck.gain;p.cancelAndHoldAtTime(t);p.linearRampToValueAtTime(1-cue.duck,t+.012);p.setTargetAtTime(1,t+.09,priority===3?.28:.12);}
    return true;
  }
  tick(time,enabled,musicEnabled) {
    if(!this.score||!enabled||!this.active||!musicEnabled)return;
    const plan=this.score.plan,step=30/plan.bpm,upTo=Math.floor((time+.055*this.speed)/step);
    // Schedule a short horizon against the audio clock, not render frame intervals.
    for(let b=this.beat+1;b<=upTo;b++){
      const at=b*step;if(at>=this.trace.duration)break;
      const section=sectionAt(plan,at),when=this.clock+(at-this.anchor)/this.speed;
      if(when<this.context.currentTime-.08){this.beat=b;continue;}
      if(b%2===0||section.energy>.45)this.play({voice:'pluck',degree:plan.motif[b%plan.motif.length],gain:.15*section.musicGain*(.5+section.energy*.5)},this.music,b%2?.2:-.2,when,0);
      if(b%8===0)this.play({voice:'thump',degree:0,gain:.2*section.musicGain*section.energy},this.music,0,when,0);
      this.beat=b;
    }
  }
}
