import {GameSoundPlayer,normalizeSoundStyle,createGameSoundDirector} from './game-sound-director.js';
import {mountGameSoundPanel} from './game-sound-panel.js';
import {normalizeSoundOverrides} from './game-sound-settings.js';
import {EffectVoicePlayer} from './effect-voices.js';
export const REFERENCE_CLIPS=[
  ['effect-1','Efekt 1 · 0,7 sn'],['effect-2','Efekt 2 · 1,1 sn'],
  ['effect-3','Efekt 3 · 1,2 sn'],['effect-4','Efekt 4 · 1,4 sn'],
  ['effect-5','Efekt 5 · 1,2 sn'],['effect-6','Efekt 6 · 1,9 sn'],
];
export const AUDIO_EVENTS={brick:'Duvara çarpma',paddle:'Çubuktan sekme',break:'Blok kırılma',finish:'Yolu tamamlama',multiply:'×3 bonusu',bonus:'Diğer bonuslar',lost:'Topların bitmesi',won:'Harita tamamlandı'};
const defaults={brick:'effect-1',paddle:'effect-2',break:'effect-3',finish:'effect-4',multiply:'effect-5',bonus:'effect-2',lost:'effect-6',won:'effect-6'};
const storageKey='marble-breaker-reference-audio-v1';
export class BreakerAudio{
  constructor({automatic=false}={}){
    this.mapping={...defaults};this.volume=.5;this.muted=true;this.overrides={};
    this.soundStyle=automatic?'balanced':'reference';
    this.buffers=new Map();this.active=new Set();this.played=0;
    try{const saved=JSON.parse(localStorage.getItem(storageKey));
      this.overrides=normalizeSoundOverrides('spiral-breaker',saved?.soundOverrides);
      for(const key of Object.keys(defaults))if(saved?.mapping?.[key]==='off'||REFERENCE_CLIPS.some(([id])=>id===saved?.mapping?.[key]))this.mapping[key]=saved.mapping[key];
      if(Number.isFinite(saved?.volume))this.volume=Math.max(0,Math.min(1,saved.volume));
      if(automatic&&saved?.soundStyle)this.soundStyle=saved.soundStyle==='reference'?'reference':normalizeSoundStyle(saved.soundStyle);
    }catch{}
    this.director=new GameSoundPlayer('spiral-breaker',this.soundStyle==='reference'?'original':this.soundStyle,this.overrides);this.director.setVolume(this.volume);
  }
  save(){try{localStorage.setItem(storageKey,JSON.stringify({mapping:this.mapping,volume:this.volume,soundStyle:this.soundStyle,soundOverrides:this.overrides}));}catch{}}
  async prepare(){
    this.context??=new AudioContext();
    if(!this.bus){this.bus=this.context.createGain();this.bus.gain.value=this.volume;this.bus.connect(this.context.destination);this.referencePlayer=new EffectVoicePlayer(this.context,this.bus);this.active=this.referencePlayer.voices;}
    await this.context.resume();
    if(!this.loading)this.loading=Promise.all(REFERENCE_CLIPS.map(async([id])=>{
      if(this.buffers.has(id))return;
      const response=await fetch(`${import.meta.env.BASE_URL}audio/instagram-DeUvaLwMp3o/${id}.wav`);
      if(!response.ok)throw new Error('Ses dosyası yüklenemedi.');
      this.buffers.set(id,await this.context.decodeAudioData(await response.arrayBuffer()));
    })).catch(error=>{this.loading=null;throw error;});
    await this.loading;
  }
  async enable(reference=false){if(reference||['reference','original'].includes(this.soundStyle)||Object.values(this.overrides).includes('original'))await this.prepare();await this.director.unlock();this.muted=false;}
  mute(){this.muted=true;this.stop();}
  setVolume(value){this.volume=Math.max(0,Math.min(1,value));this.director.setVolume(this.volume);if(this.bus)this.bus.gain.setTargetAtTime(this.volume,this.context.currentTime,.015);this.save();}
  assign(event,id){if(Object.hasOwn(defaults,event)&&(id==='off'||REFERENCE_CLIPS.some(([clip])=>clip===id))){this.mapping[event]=id;this.save();}}
  stop(){this.director.stop();this.referencePlayer?.stop();}
  reset(){this.stop();this.director.reset();}
  async setStyle(style){this.stop();this.soundStyle=style==='reference'?style:normalizeSoundStyle(style);this.director.setStyle(this.soundStyle==='reference'?'original':this.soundStyle);this.save();if(!this.muted)await this.enable();}
  async setOverrides(choices){this.stop();this.overrides=normalizeSoundOverrides('spiral-breaker',choices);this.director.setOverrides(this.overrides);this.save();if(!this.muted)await this.enable();}
  async previewEvent(type){
    const decision=createGameSoundDirector('spiral-breaker',this.director.style,this.overrides)({type},0);
    if(!decision)return false;
    if(decision.type==='original'){await this.prepare();return this.play(type,{preview:true});}
    await this.director.unlock();this.stop();return this.director.play(decision);
  }
  play(event,{preview=false,x}={}){
    if(!preview){
      if(this.muted)return false;
      const decision=this.director.decide({type:event,x},this.director.context?.currentTime??0);
      if(!decision)return false;
      if(decision.priority===3)this.stop();
      if(decision.type!=='original')return this.director.play(decision);
    }
    if((this.muted&&!preview)||this.context?.state!=='running')return false;
    const id=this.mapping[event],buffer=this.buffers.get(id);if(!buffer)return false;
    const priority=['lost','won'].includes(event)?3:['finish','multiply','bonus'].includes(event)?2:1;
    if(preview)this.stop();
    const level=preview?.8:priority>1?.7:event==='brick'?.24:.4;
    // Keep clip loudness separate from the shared overlap envelope.
    this.scaledBuffers??=new Map();const key=id+'|'+level;
    if(!this.scaledBuffers.has(key)){
      const scaled=this.context.createBuffer(buffer.numberOfChannels,buffer.length,buffer.sampleRate);
      for(let c=0;c<buffer.numberOfChannels;c++)scaled.copyToChannel(buffer.getChannelData(c).map(v=>v*level),c);
      this.scaledBuffers.set(key,scaled);
    }
    const played=this.referencePlayer.play({type:event,clip:id,priority,x},this.scaledBuffers.get(key));
    if(played)this.played++;return played;
  }
  getState(){return {muted:this.muted,loaded:this.buffers.size,active:this.active.size+this.director.voices.size,played:this.played+this.director.played,volume:this.volume,mapping:{...this.mapping},soundStyle:this.soundStyle,director:this.director.state()};}
}

export function setupBreakerAudio(audio,{onChange,onError}){
  mountGameSoundPanel({mode:'spiral-breaker',style:audio.soundStyle,reference:true,onChange:style=>audio.setStyle(style).catch(onError),overrides:audio.overrides,onOverrides:choices=>audio.setOverrides(choices).catch(onError),onPreview:type=>audio.previewEvent(type)});
  const panel=document.createElement('details');panel.className='breaker-sounds';
  panel.innerHTML='<summary>Videodaki sesler</summary><p>Her olayın sesini ayrı seç ve dinle.</p><label class="sound-volume">Ses düzeyi <input type="range" min="0" max="100" aria-label="Efekt ses düzeyi"></label><div class="sound-events"></div><small>Videodan kesilmiş 6 klip. Bazı kliplerde üst üste binen sesler bulunabilir.</small>';
  const slider=panel.querySelector('input');slider.value=String(Math.round(audio.volume*100));slider.oninput=()=>audio.setVolume(Number(slider.value)/100);
  for(const [event,label] of Object.entries(AUDIO_EVENTS)){
    const row=document.createElement('div');row.className='sound-event';
    const name=document.createElement('label');name.textContent=label;name.htmlFor=`sound-${event}`;
    const select=document.createElement('select');select.id=name.htmlFor;
    select.add(new Option('Kapalı','off'));for(const [id,title] of REFERENCE_CLIPS)select.add(new Option(title,id));select.value=audio.mapping[event];
    select.onchange=()=>audio.assign(event,select.value);
    const preview=document.createElement('button');preview.type='button';preview.textContent='▶';preview.setAttribute('aria-label',`${label} sesini dinle`);
    preview.onclick=async()=>{preview.disabled=true;try{await audio.enable(true);onChange();audio.play(event,{preview:true});}catch(error){onError(error);}finally{preview.disabled=false;}};
    row.append(name,select,preview);panel.querySelector('.sound-events').append(row);
  }
  document.getElementById('status').before(panel);
}
