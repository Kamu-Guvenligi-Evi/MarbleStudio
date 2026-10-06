import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
import {effectSamples} from '../src/impact-audio.js';

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
export async function productionAudio({events,recipe,duration,audio,project,signal}){
  const rate=48000,samples=new Float32Array(Math.ceil(duration*rate)),credits=[];
  if(audio==='all'||audio==='effects')for(const e of events.effects){
    const start=Math.max(0,Math.floor(e.time*rate)),effect=effectSamples(e,rate);
    for(let i=0;i<effect.length&&start+i<samples.length;i++)samples[start+i]+=effect[i]*.35;
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
