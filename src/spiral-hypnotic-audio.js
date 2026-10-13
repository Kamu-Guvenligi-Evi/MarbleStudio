// Only sound synthesis lives here. The engine never writes to the game state.
// MIDI scale degrees repeat over three octaves: C3, D3, E3, G3, A3 ... C6.
export const CONFIG={
  bpm:65,scaleNotes:[48,50,52,55,57],octaves:3,
  maxDelay:.12,gridSubdivisions:4,arpeggioWindow:.42,arpeggioSteps:4,
  maxVoices:8,masterVolume:.42,noteVolume:.18,overtoneRatio:.12,
  attack:.008,noteDecay:.82,envelopeFloor:.0001,voiceFade:.025,
  eighthAccent:1,subdivisionAccent:.72,panRange:.6,
  thumpFrequency:72,thumpEndFrequency:60,thumpVolume:.035,thumpDuration:.15,
  padNotes:[48,55],padTypes:['sine','triangle'],padDetune:[-5,5],
  padVolume:.032,padFilter:600,padLfoHz:.07,padFilterDepth:140,padVolumeDepth:.006,
  padFade:1.8,wet:.35,reverbSeconds:2.6,reverbDecay:3.8,reverbSeed:0x51ac0de,
  outputLowpass:6000,compressorThreshold:-20,compressorKnee:24,
  compressorRatio:3,compressorAttack:.015,compressorRelease:.25,
  muteFade:.04,outputRate:48000,
};
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
export const midiFrequency=midi=>440*2**((midi-69)/12);

// At this tempo an eighth note is ~462 ms. Use its quieter 32nd-note
// subdivisions when the next eighth would exceed the requested 120 ms delay.
export function quantizeNote(time,origin=0){
  const eighth=60/CONFIG.bpm/2,step=eighth/Math.max(CONFIG.gridSubdivisions,Math.ceil(eighth/CONFIG.maxDelay));
  const eighthTime=origin+Math.ceil((time-origin)/eighth-1e-9)*eighth;
  const when=eighthTime-time<=CONFIG.maxDelay?eighthTime:origin+Math.ceil((time-origin)/step-1e-9)*step;
  const accented=Math.abs((when-origin)/eighth-Math.round((when-origin)/eighth))<1e-6;
  return {when:Math.max(time,when),delay:Math.max(0,when-time),accent:accented?CONFIG.eighthAccent:CONFIG.subdivisionAccent};
}

// Rapid hits rise through a small pentatonic arpeggio. Its base pitch follows
// spatial progress, so a busy entrance cannot immediately climb three octaves.
export function createNotePlanner(){
  let last=-Infinity,arpeggio=0;
  return {
    reset(){last=-Infinity;arpeggio=0;},
    plan(event,time,origin=0){
      arpeggio=time-last<CONFIG.arpeggioWindow?(arpeggio+1)%CONFIG.arpeggioSteps:0;last=time;
      const degrees=CONFIG.scaleNotes.length*CONFIG.octaves;
      const base=Math.floor(clamp(Number(event.progress)||0,0,1)*degrees);
      const degree=Math.min(degrees,base+arpeggio);
      const midi=CONFIG.scaleNotes[degree%CONFIG.scaleNotes.length]+12*Math.floor(degree/CONFIG.scaleNotes.length);
      return {...quantizeNote(time,origin),midi,frequency:midiFrequency(midi),degree,
        pan:clamp(((Number.isFinite(event.x)?event.x:270)/540-.5)*2*CONFIG.panRange,-CONFIG.panRange,CONFIG.panRange)};
    },
  };
}

// A reproducible noise impulse response is generated in memory: no audio files.
function impulse(context){
  const buffer=context.createBuffer(2,Math.ceil(context.sampleRate*CONFIG.reverbSeconds),context.sampleRate);
  let seed=CONFIG.reverbSeed;
  for(let channel=0;channel<2;channel++){
    const data=buffer.getChannelData(channel);
    for(let i=0;i<data.length;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      data[i]=(seed/2147483648-1)*(1-i/data.length)**CONFIG.reverbDecay;
    }
  }
  return buffer;
}

export class SpiralHypnoticAudio{
  constructor(context,{destinations=[context.destination],offline=false}={}){
    this.context=context;this.offline=offline;this.enabled=false;this.active=false;
    this.voices=[];this.peakVoices=0;this.stolenVoices=0;this.played=0;
    this.planner=createNotePlanner();this.nodes=[];this.padOscillators=[];
    const node=(type)=>{const n=context[type]();this.nodes.push(n);return n;};
    this.noteBus=node('createGain');this.mix=node('createGain');
    const dry=node('createGain'),wet=node('createGain'),reverb=node('createConvolver');
    dry.gain.value=1-CONFIG.wet;wet.gain.value=CONFIG.wet;reverb.buffer=impulse(context);
    this.noteBus.connect(dry);dry.connect(this.mix);this.noteBus.connect(reverb);reverb.connect(wet);wet.connect(this.mix);
    const lowpass=node('createBiquadFilter'),compressor=node('createDynamicsCompressor');
    lowpass.type='lowpass';lowpass.frequency.value=CONFIG.outputLowpass;lowpass.Q.value=.4;
    compressor.threshold.value=CONFIG.compressorThreshold;compressor.knee.value=CONFIG.compressorKnee;
    compressor.ratio.value=CONFIG.compressorRatio;compressor.attack.value=CONFIG.compressorAttack;compressor.release.value=CONFIG.compressorRelease;
    this.master=node('createGain');this.master.gain.value=0;
    this.mix.connect(lowpass);lowpass.connect(compressor);compressor.connect(this.master);
    for(const destination of destinations)this.master.connect(destination);

    // The pad uses C/G and one slow LFO for a barely audible breathing layer.
    const padFilter=node('createBiquadFilter'),padLevel=node('createGain');
    this.padEnvelope=node('createGain');this.padEnvelope.gain.value=0;
    padFilter.type='lowpass';padFilter.frequency.value=CONFIG.padFilter;padFilter.Q.value=.3;
    padLevel.gain.value=CONFIG.padVolume;padFilter.connect(padLevel);padLevel.connect(this.padEnvelope);this.padEnvelope.connect(this.mix);
    CONFIG.padNotes.forEach((midi,index)=>{
      const oscillator=node('createOscillator');oscillator.type=CONFIG.padTypes[index];
      oscillator.frequency.value=midiFrequency(midi);oscillator.detune.value=CONFIG.padDetune[index];
      oscillator.connect(padFilter);oscillator.start();this.padOscillators.push(oscillator);
    });
    const lfo=node('createOscillator'),filterDepth=node('createGain'),volumeDepth=node('createGain');
    lfo.frequency.value=CONFIG.padLfoHz;filterDepth.gain.value=CONFIG.padFilterDepth;volumeDepth.gain.value=CONFIG.padVolumeDepth;
    lfo.connect(filterDepth);filterDepth.connect(padFilter.frequency);lfo.connect(volumeDepth);volumeDepth.connect(padLevel.gain);
    lfo.start();this.padOscillators.push(lfo);
  }
  setEnabled(value){this.enabled=Boolean(value);if(!this.enabled)this.setActive(false);}
  setActive(value){
    const active=Boolean(value)&&this.enabled;if(active===this.active)return;
    this.active=active;const now=this.context.currentTime;
    this.master.gain.cancelAndHoldAtTime(now);this.master.gain.setTargetAtTime(active?CONFIG.masterVolume:0,now,CONFIG.muteFade);
    this.padEnvelope.gain.cancelAndHoldAtTime(now);this.padEnvelope.gain.setTargetAtTime(active?1:0,now,active?CONFIG.padFade:CONFIG.muteFade);
    if(!active){for(const voice of this.voices)this.fadeVoice(voice,now);this.voices=[];}
  }
  reset(){this.planner.reset();for(const voice of this.voices)this.fadeVoice(voice,this.context.currentTime);this.voices=[];}
  fadeVoice(voice,at){
    if(voice.end<=at)return;
    for(const gain of voice.envelopes){gain.gain.cancelAndHoldAtTime(at);gain.gain.linearRampToValueAtTime(0,at+CONFIG.voiceFade);}
    for(const oscillator of voice.oscillators){try{oscillator.stop(at+CONFIG.voiceFade);}catch{}}
    voice.end=at+CONFIG.voiceFade;
  }
  hit(event,time=this.context.currentTime){
    if(!this.enabled||!this.active||(!this.offline&&this.context.state!=='running'))return null;
    if(!['ice','impact'].includes(event.type))return null;
    const note=event.type==='ice'?this.planner.plan(event,time):null;
    const when=note?.when??time;
    this.voices=this.voices.filter(voice=>voice.end>when);
    if(this.voices.length>=CONFIG.maxVoices){this.fadeVoice(this.voices.shift(),when);this.stolenVoices++;}
    const context=this.context,pan=context.createStereoPanner(),voice={when,end:when+CONFIG.thumpDuration,oscillators:[],envelopes:[],nodes:[pan]};
    pan.pan.value=note?.pan??clamp(((event.x??270)/540-.5)*2*CONFIG.panRange,-CONFIG.panRange,CONFIG.panRange);pan.connect(this.noteBus);
    const envelope=(volume,duration)=>{
      const gain=context.createGain();gain.gain.setValueAtTime(0,when);
      gain.gain.linearRampToValueAtTime(volume,when+CONFIG.attack);
      gain.gain.exponentialRampToValueAtTime(CONFIG.envelopeFloor,when+duration);
      gain.gain.linearRampToValueAtTime(0,when+duration+CONFIG.voiceFade);
      gain.connect(pan);voice.envelopes.push(gain);voice.nodes.push(gain);return gain;
    };
    const start=(type,frequency,gain,duration)=>{
      const oscillator=context.createOscillator();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,when);
      oscillator.connect(gain);oscillator.start(when);oscillator.stop(when+duration+CONFIG.voiceFade);
      voice.oscillators.push(oscillator);voice.nodes.push(oscillator);return oscillator;
    };
    if(note){
      const gain=envelope(CONFIG.noteVolume*note.accent,CONFIG.noteDecay);
      start('sine',note.frequency,gain,CONFIG.noteDecay);
      const upper=context.createGain();upper.gain.value=CONFIG.overtoneRatio;upper.connect(gain);voice.nodes.push(upper);
      start('triangle',note.frequency*2,upper,CONFIG.noteDecay);voice.end=when+CONFIG.noteDecay+CONFIG.voiceFade;
    }
    const thump=start('sine',CONFIG.thumpFrequency,envelope(CONFIG.thumpVolume,CONFIG.thumpDuration),CONFIG.thumpDuration);
    thump.frequency.exponentialRampToValueAtTime(CONFIG.thumpEndFrequency,when+CONFIG.thumpDuration);
    // All oscillators in a voice are cleaned up, including stolen/queued voices.
    let remaining=voice.oscillators.length;
    for(const oscillator of voice.oscillators)oscillator.onended=()=>{
      if(--remaining)return;
      // Offline rendering runs faster than JS event delivery. Disconnect there
      // only after rendering, keeping callback timing out of the audio signal.
      if(!this.offline)for(const node of voice.nodes)node.disconnect();
      this.voices=this.voices.filter(v=>v!==voice);
    };
    if(this.offline)this.nodes.push(...voice.nodes);
    this.voices.push(voice);this.peakVoices=Math.max(this.peakVoices,this.voices.length);this.played++;
    return note?{...note,voices:this.voices.length}:null;
  }
  state(){return {enabled:this.enabled,active:this.active,voices:this.voices.length,peakVoices:this.peakVoices,stolenVoices:this.stolenVoices,played:this.played};}
  dispose(){
    this.setEnabled(false);for(const oscillator of this.padOscillators){try{oscillator.stop();}catch{}}
    for(const node of this.nodes)node.disconnect();
  }
}

// MP4 export uses exactly the same Web Audio graph in an OfflineAudioContext.
// The resulting stereo WAV is generated in memory and handed to the encoder.
export async function renderHypnoticWav(events,duration,{effects=true}={}){
  const rate=CONFIG.outputRate,frames=Math.ceil(duration*rate);
  const context=new OfflineAudioContext(2,frames,rate),engine=new SpiralHypnoticAudio(context,{offline:true});
  engine.setEnabled(true);engine.setActive(true);
  if(effects)for(const event of [...events].sort((a,b)=>a.time-b.time))if(event.time<duration)engine.hit(event,event.time);
  engine.master.gain.setTargetAtTime(0,Math.max(0,duration-.2),CONFIG.muteFade);
  const rendered=await context.startRendering();engine.dispose();
  const bytes=new Uint8Array(44+frames*4),view=new DataView(bytes.buffer);
  const text=(offset,value)=>{for(let i=0;i<value.length;i++)bytes[offset+i]=value.charCodeAt(i);};
  text(0,'RIFF');view.setUint32(4,36+frames*4,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);
  view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,rate,true);view.setUint32(28,rate*4,true);
  view.setUint16(32,4,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,frames*4,true);
  const left=rendered.getChannelData(0),right=rendered.getChannelData(1);
  for(let i=0;i<frames;i++){view.setInt16(44+i*4,Math.round(clamp(left[i],-1,1)*32767),true);view.setInt16(46+i*4,Math.round(clamp(right[i],-1,1)*32767),true);}
  let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return btoa(binary);
}
