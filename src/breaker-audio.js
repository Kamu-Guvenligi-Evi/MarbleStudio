export const REFERENCE_CLIPS=[
  ['effect-1','Efekt 1 · 0,7 sn'],['effect-2','Efekt 2 · 1,1 sn'],
  ['effect-3','Efekt 3 · 1,2 sn'],['effect-4','Efekt 4 · 1,4 sn'],
  ['effect-5','Efekt 5 · 1,2 sn'],['effect-6','Efekt 6 · 1,9 sn'],
];
export const AUDIO_EVENTS={brick:'Duvara çarpma',paddle:'Çubuktan sekme',break:'Blok kırılma',finish:'Yolu tamamlama',multiply:'×3 bonusu',bonus:'Diğer bonuslar',lost:'Topların bitmesi',won:'Harita tamamlandı'};
const defaults={brick:'effect-1',paddle:'effect-2',break:'effect-3',finish:'effect-4',multiply:'effect-5',bonus:'effect-2',lost:'effect-6',won:'effect-6'};
const storageKey='marble-breaker-reference-audio-v1';
export class BreakerAudio{
  constructor(){
    this.mapping={...defaults};this.volume=.5;this.muted=true;
    this.buffers=new Map();this.active=new Set();this.last=new Map();this.played=0;
    try{const saved=JSON.parse(localStorage.getItem(storageKey));
      for(const key of Object.keys(defaults))if(saved?.mapping?.[key]==='off'||REFERENCE_CLIPS.some(([id])=>id===saved?.mapping?.[key]))this.mapping[key]=saved.mapping[key];
      if(Number.isFinite(saved?.volume))this.volume=Math.max(0,Math.min(1,saved.volume));
    }catch{}
  }
  save(){try{localStorage.setItem(storageKey,JSON.stringify({mapping:this.mapping,volume:this.volume}));}catch{}}
  async prepare(){
    this.context??=new AudioContext();
    if(!this.bus){this.bus=this.context.createGain();this.bus.gain.value=this.volume;this.bus.connect(this.context.destination);}
    await this.context.resume();
    if(!this.loading)this.loading=Promise.all(REFERENCE_CLIPS.map(async([id])=>{
      if(this.buffers.has(id))return;
      const response=await fetch(`${import.meta.env.BASE_URL}audio/instagram-DeUvaLwMp3o/${id}.wav`);
      if(!response.ok)throw new Error('Ses dosyası yüklenemedi.');
      this.buffers.set(id,await this.context.decodeAudioData(await response.arrayBuffer()));
    })).catch(error=>{this.loading=null;throw error;});
    await this.loading;
  }
  async enable(){await this.prepare();this.muted=false;}
  mute(){this.muted=true;this.stop();}
  setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.bus)this.bus.gain.setTargetAtTime(this.volume,this.context.currentTime,.015);this.save();}
  assign(event,id){if(Object.hasOwn(defaults,event)&&(id==='off'||REFERENCE_CLIPS.some(([clip])=>clip===id))){this.mapping[event]=id;this.save();}}
  stop(){for(const voice of this.active)this.end(voice);this.last.clear();}
  end(voice){try{voice.source.stop();}catch{}voice.source.disconnect();voice.gain.disconnect();this.active.delete(voice);}
  play(event,{preview=false}={}){
    if(this.muted||this.context?.state!=='running')return false;
    const id=this.mapping[event],buffer=this.buffers.get(id);if(!buffer)return false;
    const priority=['finish','multiply','bonus','lost','won'].includes(event)?2:1;
    const now=this.context.currentTime;
    if(preview)this.stop();
    else{
      // Share one collision voice; a crowd of balls must not become a chorus.
      const group=priority===1?'collision':event;
      const interval=priority===1?Math.max(.75,buffer.duration):Math.max(1.5,buffer.duration);
      if(now-(this.last.get(group)??-Infinity)<interval)return false;
      if(priority===1&&[...this.active].some(v=>v.priority===1))return false;
      if([...this.active].some(v=>v.event===event))return false;
      if(priority===2)for(const voice of this.active)if(voice.priority===1)this.end(voice);
      if(this.active.size>=3)return false;
      this.last.set(group,now);
    }
    const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;
    gain.gain.value=preview ? .8 : priority===2 ? .7 : event==='brick' ? .24 : .4;
    source.connect(gain);gain.connect(this.bus);
    const voice={source,gain,event,priority};this.active.add(voice);
    source.onended=()=>{source.disconnect();gain.disconnect();this.active.delete(voice);};
    source.start();this.played++;return true;
  }
  getState(){return {muted:this.muted,loaded:this.buffers.size,active:this.active.size,played:this.played,volume:this.volume,mapping:{...this.mapping}};}
}

export function setupBreakerAudio(audio,{onChange,onError}){
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
    preview.onclick=async()=>{preview.disabled=true;try{await audio.enable();onChange();audio.play(event,{preview:true});}catch(error){onError(error);}finally{preview.disabled=false;}};
    row.append(name,select,preview);panel.querySelector('.sound-events').append(row);
  }
  document.getElementById('status').before(panel);
}
