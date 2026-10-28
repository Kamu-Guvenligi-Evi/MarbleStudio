// Locally synthesized pentatonic glass tones; bounded work regardless of ball count.
const ROOTS=[0,-4,3,-2]; // A minor / F / C / G, relative to A3.
const PHRASES=[
  [12,15,19,22,24,22,19,15,12,19,15,22,19,15,12,7],
  [12,15,19,20,24,20,19,15,8,12,15,19,20,19,15,12],
  [15,19,22,24,27,24,22,19,15,22,19,24,22,19,15,10],
  [10,14,17,22,24,22,17,14,10,17,14,22,17,14,10,7]
];
export class EscapeAudio {
  constructor(context){
    this.context=context;this.enabled=false;this.volume=.55;this.cache=new Map();this.voices=new Set();
    this.bus=context.createGain();this.bus.gain.value=.65;
    this.echo=context.createDelay(1);this.echo.delayTime.value=.12;
    this.feedback=context.createGain();this.feedback.gain.value=.14;
    this.wet=context.createGain();this.wet.gain.value=.06;
    this.filter=context.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=3400;
    this.compressor=context.createDynamicsCompressor();this.compressor.threshold.value=-18;this.compressor.knee.value=18;this.compressor.ratio.value=5;this.compressor.attack.value=.005;this.compressor.release.value=.18;
    this.master=context.createGain();this.master.gain.value=0;
    this.bus.connect(this.compressor);this.bus.connect(this.echo);this.echo.connect(this.filter);this.filter.connect(this.feedback);this.feedback.connect(this.echo);this.filter.connect(this.wet);this.wet.connect(this.compressor);
    this.compressor.connect(this.master);this.master.connect(context.destination);
    this.recording=context.createMediaStreamDestination?.();if(this.recording)this.master.connect(this.recording);
    this.reset();
  }
  reset(){
    for(const source of this.voices)source.stop();this.voices.clear();
    this.lastCount=0;this.lastEnergy=0;this.lastX=0;this.index=0;this.next=0;this.listening=false;this.peakInside=0;this.stage=0;this.drainStart=0;this.resolved=false;this.tailUntil=0;
  }
  setEnabled(enabled){this.enabled=enabled;this.listening=false;this.gate(enabled);}
  setVolume(value){this.volume=Math.max(0,Math.min(1,value));this.gate(this.enabled&&this.active);}
  gate(active){this.active=active;this.master.gain.setTargetAtTime(this.enabled&&active?this.volume:0,this.context.currentTime,.025);}
  buffer(semitone,ending=false){
    const key=semitone+":"+ending;
    if(this.cache.has(key))return this.cache.get(key);
    const rate=this.context.sampleRate,duration=ending?1.1:.4,buffer=this.context.createBuffer(1,Math.ceil(rate*duration),rate),data=buffer.getChannelData(0),frequency=220*2**(semitone/12);
    for(let i=0;i<data.length;i++){const t=i/rate,attack=Math.min(1,t/(ending?.012:.003)),tail=Math.min(1,(duration-t)/.04),phase=2*Math.PI*frequency*t;
      data[i]=attack*tail*(Math.sin(phase)*Math.exp(-t*(ending?4.5:11))+.23*Math.sin(phase*2)*Math.exp(-t*12)+.08*Math.sin(phase*3)*Math.exp(-t*20))*.45;
    }
    this.cache.set(key,buffer);return buffer;
  }
  note(semitone,gain=.3,pan=0,ending=false,delay=0){
    if(this.voices.size>=18)return;
    const source=this.context.createBufferSource(),level=this.context.createGain(),stereo=this.context.createStereoPanner();
    source.buffer=this.buffer(semitone,ending);level.gain.value=gain;stereo.pan.value=pan;
    source.connect(level);level.connect(stereo);stereo.connect(this.bus);this.voices.add(source);
    source.onended=()=>{this.voices.delete(source);source.disconnect();level.disconnect();stereo.disconnect();};source.start(this.context.currentTime+delay);
  }
  update(game,active=true){
    this.gate(active);
    this.peakInside=Math.max(this.peakInside,Math.max(0,(game.created||0)-(game.escaped||0)));
    this.stage=this.peakInside>=1500?3:this.peakInside>=256?2:this.peakInside>=32?1:0;
    const count=game.impactCount||0,energy=game.impactEnergy||0,x=game.impactX||0;
    const hits=Math.max(0,count-this.lastCount),strength=hits?Math.max(0,energy-this.lastEnergy)/hits:0;
    const pan=hits?Math.max(-.8,Math.min(.8,(x-this.lastX)/hits)) : 0;
    this.lastCount=count;this.lastEnergy=energy;this.lastX=x;
    if(!this.enabled||!active||this.context.state!=='running'){this.listening=false;return;}
    // Sync when enabling/resuming: old collisions must never play back later.
    if(!this.listening){this.listening=true;return;}
    const now=this.context.currentTime;
    if(game.finalizing&&game.balls?.length===0){
      if(!this.resolved){
        this.resolved=true;this.tailUntil=now+1.4;
        // The last visible ball resolves the collision melody into its home chord.
        this.note(-12,.22,0,true);this.note(0,.25,-.2,true,.025);
        this.note(3,.14,.2,true,.06);this.note(7,.18,-.15,true,.095);
        this.note(12,.20,.15,true,.13);
      }
      return;
    }
    if(game.bursting&&!this.drainStart)this.drainStart=Math.max(1,game.created-game.escaped);
    if(!hits||now<this.next)return;
    // Simultaneous impacts share a note; every note still needs a fresh impact.
    const stage=this.stage,index=this.index++,beat=index%16,chord=Math.floor(index/16)%4,root=ROOTS[chord];
    this.next=now+[.12,.10,.085,.075][stage];
    // Growing population reveals longer phrases and chord layers, all on impact.
    let tone=stage===0?root+[0,7,12,7][beat%4]:PHRASES[chord][beat]-(stage===1?12:0);
    const remaining=Math.max(0,(game.created||0)-(game.escaped||0));
    const progress=game.bursting?Math.max(0,Math.min(1,1-remaining/this.drainStart)):0;
    if(game.bursting)tone=[24,22,19,15,12,7,3,0][Math.min(7,Math.floor(progress*8))];
    const gain=(.22+.35*strength)*(stage>=2?.82:1)*(1-progress*.3);
    this.note(tone,gain,pan);
    if(game.bursting){
      if(beat%4===0)this.note(0,.12,0);
      return;
    }
    if(stage>=1&&beat%8===0)this.note(root-12,.20,0);
    if(stage>=2&&beat%4===0)this.note(root+(chord===0?3:4),.16,-pan*.5);
    if(stage===3&&beat%4===0)this.note(root+7,.13,pan*.5);
    if(stage===3&&beat%4===2)this.note(root+12,.11,-pan*.5);
  }
}
