import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
import {effectSamples,collisionEvent,effectInterval,createCollisionNotes} from '../src/impact-audio.js';
import {effectVoiceKey,effectVoiceUpdates,effectLevelAt,rampEffectVoice} from '../src/effect-voices.js';

export function musicSegments(music,leaders,duration){
  if(!music)return [];
  if(music.mode==='fixed')return music.track?[{start:0,end:duration,track:music.track,entity:'fixed'}]:[];
  return leaders.map((entry,i)=>({start:entry.time,end:leaders[i+1]?.time??duration,...music.roster[entry.id]})).filter(s=>s.track&&s.end>s.start);
}
async function decode(file,signal){
  const child=spawn(ffmpeg,['-v','error','-i',file,'-t','600','-f','f32le','-ar','48000','-ac','1','pipe:1'],{windowsHide:true,signal,stdio:['ignore','pipe','pipe']});
  const chunks=[];let log='',size=0;
  child.stdout.on('data',data=>{size+=data.length;if(size>120000000)child.kill();else chunks.push(data);});child.stderr.on('data',data=>{log=(log+data).slice(-2000);});
  await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('Müzik çözülemedi: '+log)));});
  const data=Buffer.concat(chunks),samples=new Float32Array(data.length/4);for(let i=0;i<samples.length;i++)samples[i]=data.readFloatLE(i*4);
  if(!samples.length)throw new Error('Müzik dosyası boş.');return samples;
}
export async function productionAudio({events,recipe,duration,audio,project,signal,generatedAudio}){
  if((recipe.mode==='escape-multiply'&&recipe.sound!==false||recipe.mode==='spiral'&&recipe.spiralHypnotic&&!recipe.spiralHypnoticMuted)&&audio!=='none'){
    if(!generatedAudio)throw new Error('Hipnotik ses Web Audio ile oluşturulamadı.');
    const buffer=Buffer.from(generatedAudio,'base64');
    if(buffer.length<44||buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE'||buffer.readUInt16LE(22)!==2||buffer.readUInt32LE(24)!==48000||buffer.length!==44+Math.ceil(duration*48000)*4)throw new Error('Hipnotik ses verisi geçersiz.');
    return {buffer,credits:[]};
  }
  const rate=48000,samples=new Float32Array(Math.ceil(duration*rate)),credits=[];
  if(recipe.mode==='spiral'&&recipe.spiralHypnotic)audio='none';
  const lastEffects=new Map(),referenceCache=new Map(),voices=new Set(),mix=[];
  const collisionNotes=createCollisionNotes();
  async function samplesFor(event){
    if(event.type!=='reference')return effectSamples(event,rate);
    if(!/^effect-[1-6]$/.test(event.clip??''))throw new Error('Geçersiz referans ses klibi.');
    if(!referenceCache.has(event.clip))referenceCache.set(event.clip,await decode(path.join(project,'public/audio/instagram-DeUvaLwMp3o',event.clip+'.wav'),signal));
    return referenceCache.get(event.clip).map(value=>value*(event.gain??.4));
  }
  if(audio==='all'||audio==='effects')for(const e of [...events.effects].sort((a,b)=>a.time-b.time)){
    let event=collisionEvent(e,recipe.collisionSound);const key=event.type+'|'+event.collisionSound;
    if(event.collisionSound&&event.collisionSound!=='classic'){
      if(e.time-(lastEffects.get(key)??-Infinity)<effectInterval(event))continue;
      lastEffects.set(key,e.time);
    }
    event=collisionNotes(event,e.time);
    for(const voice of voices)if(voice.endsAt<=e.time)voices.delete(voice);
    if(event.priority===3){for(const voice of mix)voice.endsAt=Math.min(voice.endsAt,e.time);voices.clear();}
    for(const {voice,level} of effectVoiceUpdates(voices,event)){
      rampEffectVoice(voice,level,e.time);if(level===0)voices.delete(voice);
    }
    const length=(await samplesFor(event)).length;
    const voice={event,key:effectVoiceKey(event),priority:event.priority??1,ramps:[],endsAt:e.time+length/rate};
    voices.add(voice);mix.push(voice);
  }
  // Store envelopes, not a full PCM copy per collision, even for long games.
  for(const voice of mix){
    const effect=await samplesFor(voice.event),start=Math.max(0,Math.floor(voice.event.time*rate));
    const end=Math.min(samples.length,Math.floor(voice.endsAt*rate));
    for(let i=0;i<effect.length&&start+i<end;i++)samples[start+i]+=effect[i]*effectLevelAt(voice,voice.event.time+i/rate)*.35;
  }
  if(audio==='all'||audio==='music'){
    const segments=musicSegments(recipe.music,events.leaders,duration),manifest=JSON.parse(await readFile(path.join(project,'public/music/manifest.json'),'utf8'));
    const cursors=new Map();
    for(const id of new Set(segments.map(s=>s.track))){
      const track=manifest.find(t=>t.id===id);
      if(!track||!/^\/music\/[a-zA-Z0-9_.-]+\.mp3$/.test(track.src))throw new Error('Müzik kütüphanesinde bulunamadı: '+id);
      const decoded=await decode(path.join(project,'public',track.src.slice(1)),signal);
      for(const segment of segments.filter(s=>s.track===id)){
        const start=Math.max(0,Math.floor(segment.start*rate)),end=Math.min(samples.length,Math.floor(segment.end*rate)),key=segment.entity+'|'+id;
        let cursor=cursors.get(key)??0;
        for(let i=start;i<end;i++){samples[i]+=decoded[cursor%decoded.length]*(recipe.music.volume/100);cursor++;}
        cursors.set(key,cursor);
      }
      credits.push([track.title+' — '+track.artist,track.source,track.license,track.licenseUrl].filter(Boolean).join('\n'));
    }
  }
  const out=Buffer.alloc(44+samples.length*2);out.write('RIFF');out.writeUInt32LE(36+samples.length*2,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(samples.length*2,40);
  for(let i=0;i<samples.length;i++)out.writeInt16LE(Math.round(Math.tanh(samples[i])*30000),44+i*2);
  return {buffer:out,credits};
}
