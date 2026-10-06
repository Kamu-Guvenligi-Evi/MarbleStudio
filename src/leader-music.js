// A separate cursor for every catalog entity, even when they share an audio file.
export class LeaderMusic {
  constructor(getAudio) {
    this.getAudio=getAudio;this.buffers=new Map();this.pending=new Map();
    this.cursors=new Map();this.current=null;this.volume=.35;
  }
  connect() {
    if(this.context)return;
    const {context,destination}=this.getAudio();this.context=context;
    this.gain=context.createGain();this.gain.gain.value=this.volume;
    this.gain.connect(context.destination);this.gain.connect(destination);
  }
  setVolume(value){this.volume=value;if(this.gain)this.gain.gain.value=value;}
  retain(tracks) {
    const sources=new Set(tracks.map(track=>track.src));
    for(const src of this.buffers.keys())if(!sources.has(src))this.buffers.delete(src);
  }
  async load(track) {
    if(this.buffers.has(track.src))return;
    if(!this.pending.has(track.src)) {
      const task=(async()=>{
        this.connect();
        const response=await fetch(track.src,{signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw new Error(`Müzik yüklenemedi: ${track.title}`);
        const buffer=await this.context.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(track.src,buffer);
      })().finally(()=>this.pending.delete(track.src));
      this.pending.set(track.src,task);
    }
    await this.pending.get(track.src);
  }
  pause() {
    const active=this.current;if(!active)return;
    this.cursors.set(active.country,{src:active.src,offset:this.position()});
    active.node.stop();active.node.disconnect();this.current=null;
  }
  position() {
    const active=this.current;
    return active?(active.offset+this.context.currentTime-active.started)%active.duration:0;
  }
  switchTo(country,track) {
    if(this.current?.country===country&&this.current?.src===track?.src)return;
    this.pause();
    const buffer=track&&this.buffers.get(track.src);
    if(!country||!buffer)return;
    this.connect();
    const cursor=this.cursors.get(country);
    const offset=cursor?.src===track.src?cursor.offset%buffer.duration:0;
    const node=this.context.createBufferSource();node.buffer=buffer;node.loop=true;node.connect(this.gain);
    // Stop/start on this audio clock tick: no debounce, fades or overlapping tracks.
    const started=this.context.currentTime;node.start(started,offset);
    this.current={country,src:track.src,node,offset,started,duration:buffer.duration};
  }
  reset(){this.pause();this.cursors.clear();}
  state(){return {country:this.current?.country??null,position:this.position(),cursors:Object.fromEntries([...this.cursors].map(([id,c])=>[id,c.offset]))};}
}
