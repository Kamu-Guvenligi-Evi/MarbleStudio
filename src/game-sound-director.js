import {cueSamples} from './sound-plan.js';
import {EffectVoicePlayer} from './effect-voices.js';
import {normalizeSoundOverrides,originalGlassSamples} from './game-sound-settings.js';
import {SOFT_INSTRUMENTS,isSoftSound,createNoteClimb} from './soft-audio.js';

export const GAME_SOUND_STYLES={original:'Orijinal oyun sesleri',balanced:'Otomatik · dengeli',...Object.fromEntries(Object.entries(SOFT_INSTRUMENTS).map(([id,name])=>['melodic-'+id,name+' · yükselen temaslar'])),meme:'Meme efektleri',reactions:'Sözlü tepkiler'};
export const normalizeSoundStyle=value=>Object.hasOwn(GAME_SOUND_STYLES,value)?value:'balanced';
const instrument={root:48,scale:'pentatonic'};
const endings=new Set(['won','win','complete','lost','timeout']);

// Stateful decisions use presentation seconds, so fast games cannot flood the mix.
// The same event processor and PCM instruments run in previews and video exports.
export function createGameSoundDirector(mode,style='balanced',overrides={}){
  style=normalizeSoundStyle(style);
  overrides=normalizeSoundOverrides(mode,overrides);
  let index=0,ending=false;
  const climb=createNoteClimb();let lastNote=-Infinity;
  const previous=new Map();
  return (event,time=event.time??0)=>{
    const type=event.type,final=endings.has(type),failed=['lost','timeout'].includes(type);
    const reward=['finish','multiply','bonus','pickup','heal','wave'].includes(type);
    const fracture=['break','ice'].includes(type),damage=mode==='ball-duel'&&type==='hit';
    const contact=['brick','paddle','wall','bounce','hit','shot'].includes(type);
    if(!final&&!reward&&!fracture&&!contact)return null;
    if(ending)return null;
    const choice=overrides[type]??(style==='original'?'original':null);
    if(choice==='off'){if(final)ending=true;return null;}
    if(choice==='original'&&mode==='glass-breaker'&&type!=='ice'){if(final)ending=true;return null;}
    const priority=final?3:reward||damage?2:1;
    // A wall, a shot and a ball contact must not suppress one another.
    // Merge only near-simultaneous repeats, never wait for a recording to finish.
    const group=type+'|'+(event.owner??'');
    const interval=final?0:reward?.12:type==='wall'?.08:.055;
    if(!final&&time-(previous.get(group)??-Infinity)<interval)return null;
    let voice=final?(failed?'thump':'resolve'):reward?'sparkle':fracture?(mode==='glass-breaker'?'glass':'sparkle'):damage?'thump':type==='paddle'?'pluck':'tick';
    let reason=final?'Final vurgusu':reward?'Bonus ve ilerleme':fracture?'Kırılma':damage?'Hasar':'Kısa temas';
    let gain=final?.65:reward?.48:fracture?.32:damage?.4:.22;
    // Keep weapon identity in every style. Longer reactions leave space for play.
    const weapon=mode==='ball-duel'&&type==='shot';
    if(choice&&choice!=='original'){
      voice=choice;reason='Manuel seçilen efekt';
    }else if(!choice&&style.startsWith('melodic-')&&!weapon){
      if(!final&&time-lastNote<.095)return null;
      voice=final?'soft-resolve':'soft-'+style.slice(8);
      gain=.42;reason=final?'Yumuşak kapanış':'Aynı gamda yükselen temas';
      lastNote=time;
    }else if(!choice&&['meme','reactions'].includes(style)&&!weapon){
      voice=final?(style==='reactions'?(failed?'oh-no':'yippee'):'vine-boom'):reward?(style==='reactions'?'anime-wow':'meme-meow'):damage?(style==='reactions'?'bruh':'bonk'):fracture?'bonk':'bubble-pop';
      gain=final?.6:.4;reason=final?'Final tepkisi':reward?'Bonus tepkisi':'Oyun tepkisi';
    }
    previous.set(group,time);if(final)ending=true;
    const soft=isSoftSound(voice);
    const cue={voice,degree:final?0:soft?climb(time):(index++%8),gain:soft?.42:gain,duck:soft?0:priority>1?.55:.12,reason};
    return {...event,type:choice==='original'?'original':'directed',originalType:type,mode,time,x:event.x??270,cue,priority,weapon:weapon&&!choice,manual:!!choice&&choice!=='original'};
  };
}

const sampleCache=new Map();
export function directedSamples(event,rate=48000){
  if(event.type==='original'&&event.mode==='glass-breaker')return originalGlassSamples(event,rate);
  const {voice,degree,gain}=event.cue,key=[voice,degree,gain,rate].join('|');
  if(!sampleCache.has(key)){
    if(sampleCache.size>=64)sampleCache.delete(sampleCache.keys().next().value);
    sampleCache.set(key,cueSamples(instrument,event.cue,rate));
  }
  return sampleCache.get(key);
}

// Bounded voices, priority-aware interruption, and one stop path for pause/mute/reset.
export class GameSoundPlayer{
  constructor(mode,style='balanced',overrides={}){
    this.overrides=normalizeSoundOverrides(mode,overrides);
    this.mode=mode;this.style=normalizeSoundStyle(style);this.voices=new Set();this.played=0;this.skipped=0;this.volume=.65;this.reset();
  }
  async unlock(){
    if(!this.context){
      this.context=new AudioContext();this.bus=this.context.createGain();this.bus.gain.value=this.volume;
      this.compressor=this.context.createDynamicsCompressor();this.compressor.threshold.value=-12;this.compressor.ratio.value=8;
      this.bus.connect(this.compressor);this.compressor.connect(this.context.destination);
      this.player=new EffectVoicePlayer(this.context,this.bus);this.voices=this.player.voices;
    }
    await this.context.resume();
  }
  setVolume(value){this.volume=value;if(this.bus)this.bus.gain.setTargetAtTime(value,this.context.currentTime,.01);}
  setStyle(style){this.style=normalizeSoundStyle(style);this.reset();}
  setOverrides(overrides){this.overrides=normalizeSoundOverrides(this.mode,overrides);this.reset();}
  reset(){this.stop();this.decide=createGameSoundDirector(this.mode,this.style,this.overrides);}
  async preview(voice){await this.unlock();this.stop();return this.play({type:'directed',cue:{voice,degree:0,gain:.45,reason:'Ön dinleme'},priority:2});}
  stop(){this.player?.stop();}
  event(event){
    if(this.context?.state!=='running')return false;
    const decision=this.decide(event,this.context.currentTime);
    return decision?this.play(decision):false;
  }
  play(event,samples=null){
    if(this.context?.state!=='running')return false;
    const played=this.player.play(event,samples??directedSamples(event,this.context.sampleRate));
    if(played){this.played++;this.lastCue=event.cue?.reason??event.duelSound;}else this.skipped++;
    return played;
  }
  state(){return {style:this.style,overrides:{...this.overrides},active:this.voices.size,played:this.played,skipped:this.skipped,lastCue:this.lastCue};}
}
