import {ScorePlayer} from './score-player.js';
import {memeSamples} from './meme-audio.js';
import {cueSamples} from './sound-plan.js';
import {createGameSoundDirector} from './game-sound-director.js';
import {EffectVoicePlayer} from './effect-voices.js';
// The reference file is one mixed soundtrack. Synthesized game effects have their own bus.
export class RingAudio{
  constructor(settings){this.settings=settings;this.context=null;this.lastHit=-1;this.lastBreakSound=-1;this.note=0;this.ambientBeat=-1;this.source=null;this.buffer=null;this.pending=null;this.musicToken=0;this.director=new ScorePlayer();this.tones=new Set();}
  setScore(score,trace){this.director.setScore(score,trace);}
  endingTail(){return Math.max(1.6,(this.manualEndsAt??0)-(this.context?.currentTime??0)+.12,...[...this.director.voices].map(v=>v.endsAt-this.context.currentTime+.12));}
  async preview(id){
    if(!this.settings.sound)return false;
    const token=this.musicToken;await this.unlock(false);
    if(token!==this.musicToken||!this.context||!this.settings.sound)return false;
    const samples=memeSamples(id,this.context.sampleRate)??cueSamples({root:48,scale:'pentatonic'},{voice:id,degree:0,gain:.5},this.context.sampleRate);if(!samples)return false;
    if(this.previewSource){try{this.previewSource.stop();}catch{}}
    const source=this.context.createBufferSource(),buffer=this.context.createBuffer(1,samples.length,this.context.sampleRate);
    buffer.copyToChannel(samples.map(s=>s*.6),0);source.buffer=buffer;source.connect(this.fx);
    this.previewSource=source;this.tones.add(source);
    source.onended=()=>{source.disconnect();this.tones.delete(source);if(this.previewSource===source)this.previewSource=null;};
    source.start();return true;
  }
  async unlock(loadMusic=true){
    if(!this.context){
      const C=globalThis.AudioContext??globalThis.webkitAudioContext;if(!C)return;this.context=new C();
      this.output=this.context.createGain();this.compressor=this.context.createDynamicsCompressor();
      this.compressor.threshold.value=-12;this.compressor.knee.value=8;this.compressor.ratio.value=8;this.compressor.attack.value=.003;this.compressor.release.value=.16;
      this.compressor.connect(this.output);this.output.connect(this.context.destination);
      this.music=this.context.createGain();this.fx=this.context.createGain();this.duck=this.context.createGain();
      this.music.connect(this.duck);this.duck.connect(this.compressor);this.fx.connect(this.compressor);
      this.capture=this.context.createMediaStreamDestination();this.output.connect(this.capture);
      this.director.connect(this.context,this.fx,this.music,this.duck);
      this.effects=new EffectVoicePlayer(this.context,this.fx);
    }
    await this.context.resume();this.apply();
    if(loadMusic&&this.settings.music==='reference'&&!this.buffer){this.pending??=fetch('/audio/ring-escape/reference.m4a').then(r=>{if(!r.ok)throw new Error('Referans sesi yüklenemedi.');return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b)).then(b=>this.buffer=b).catch(e=>{this.pending=null;throw e;});await this.pending;}
  }
  apply(){if(!this.context)return;const t=this.context.currentTime;this.output.gain.setTargetAtTime(this.settings.sound ? .85 : 0,t,.015);this.music.gain.setTargetAtTime(this.settings.musicVolume,t,.025);this.fx.gain.setTargetAtTime(this.settings.effectsVolume,t,.025);}
  stop(tails=false){this.musicToken++;if(this.source){try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}if(!tails){this.effects?.stop();this.director.stop();for(const osc of this.tones){try{osc.stop();}catch{}}this.tones.clear();}}
  async sync(time,playing){
    this.stop();if(!this.settings.sound||!playing)return;const token=this.musicToken;
    await this.unlock();if(token!==this.musicToken||!this.context||!this.settings.sound)return;
    this.director.sync(time,playing,this.settings.speed);
    if(this.settings.music==='reference'&&this.buffer){this.source=this.context.createBufferSource();this.source.buffer=this.buffer;this.source.loop=true;this.source.playbackRate.value=this.settings.speed;this.source.connect(this.music);this.source.start(0,time%this.buffer.duration);}
  }
  tone(freq,duration,bus,volume=.2,type='sine',delay=0){
    if(!this.context||this.context.state!=='running'||!this.settings.sound)return;const t=this.context.currentTime+delay,osc=this.context.createOscillator(),gain=this.context.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.005);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(bus);this.tones.add(osc);osc.start(t);osc.stop(t+duration+.01);osc.onended=()=>{this.tones.delete(osc);osc.disconnect();gain.disconnect();};
  }
  event(e){
    const choice=this.settings.soundOverrides?.[e.type];
    const handled=this.director.event(e,this.settings.sound&&!choice);
    if(choice==='off')return;
    if(choice&&choice!=='original'){
      if(!this.context||!this.settings.sound)return;
      this.manualDecide??=createGameSoundDirector('ring-escape','original',this.settings.soundOverrides);
      const event=this.manualDecide(e,this.context.currentTime);if(!event)return;
      if(event.priority===3){for(const source of this.tones){try{source.stop();}catch{}}this.tones.clear();this.director.stop();}
      const samples=cueSamples({root:48,scale:'pentatonic'},event.cue,this.context.sampleRate);
      this.effects.play(event,samples);this.manualEndsAt=Math.max(this.manualEndsAt??0,this.context.currentTime+samples.length/this.context.sampleRate);return;
    }
    if(handled&&!choice)return;
    this.originalEvent(e);
  }
  async previewEvent(type){
    if(!this.settings.sound)throw new Error('Ön dinleme için Sesleri aç düğmesine bas.');
    const choice=this.settings.soundOverrides?.[type];if(choice==='off')return false;
    if(choice&&choice!=='original')return this.preview(choice);
    if(!choice&&this.director.score){const cue=this.director.score.plan.cues.find(c=>this.director.trace.events[c.eventId]?.type===type);return cue?this.preview(cue.voice):false;}
    await this.unlock(false);const note=this.note,lastHit=this.lastHit,lastBreakSound=this.lastBreakSound;this.lastHit=-Infinity;this.lastBreakSound=-Infinity;this.originalEvent({type,combo:1});this.note=note;this.lastHit=lastHit;this.lastBreakSound=lastBreakSound;return true;
  }
  originalEvent(e){
    if(!this.context||!this.settings.sound)return;
    const melody=[0,7,12,7,4,9,12,9,2,7,11,7,0,4,7,12];
    if(e.type==='hit'&&this.context.currentTime-this.lastHit>.035){this.lastHit=this.context.currentTime;const n=melody[this.note++%melody.length],f=261.63*2**(n/12);this.tone(f,.23,this.fx,.27);this.tone(f*2,.09,this.fx,.045,'triangle');}
    if(e.type==='break'&&this.context.currentTime-this.lastBreakSound>.05){this.lastBreakSound=this.context.currentTime;const f=520*2**(melody[(Math.max(1,e.combo)-1)%melody.length]/12);this.tone(f,.14,this.fx,.2,'triangle');this.tone(f*1.5,.2,this.fx,.11,'sine',.025);}
    if(e.type==='win'){[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.tone(f,.7,this.fx,.2,'sine',i*.09));}
    if(e.type==='timeout')this.tone(196,.6,this.fx,.2);
  }
  tick(time){
    this.director.tick(time,this.settings.sound,this.settings.music==='adaptive');
    if(this.settings.music!=='ambient'||!this.settings.sound)return;const beat=Math.floor(time/.6);if(beat===this.ambientBeat)return;this.ambientBeat=beat;
    const seq=[0,7,12,16,12,7,4,7,2,9,14,17,14,9,5,9],f=130.81*2**(seq[beat%seq.length]/12);this.tone(f,.85,this.music,.17);this.tone(f*2,.6,this.music,.025);
  }
  reset(){this.note=0;this.lastHit=-1;this.lastBreakSound=-1;this.ambientBeat=-1;this.manualDecide=null;this.manualEndsAt=0;this.stop();this.director.reset();}
}
