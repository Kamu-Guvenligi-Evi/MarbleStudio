import {PCM_CLIPS} from './meme-audio-data.js';
import {MEME_SOUNDS} from './meme-catalog.js';
export {MEME_SOUNDS,MEME_INTERVALS} from './meme-catalog.js';
const decoded=new Map();
const resampled=new Map();
export function memeSamples(id,rate=48000){
  if(!Object.hasOwn(MEME_SOUNDS,id))return null;
  const key=id+'|'+rate;if(resampled.has(key))return resampled.get(key);
  const clip=PCM_CLIPS[id];
  if(!decoded.has(id)){
    const bytes=Uint8Array.from(atob(clip.pcm),c=>c.charCodeAt(0));
    const view=new DataView(bytes.buffer),samples=new Float32Array(bytes.length/2);
    for(let i=0;i<samples.length;i++)samples[i]=view.getInt16(i*2,true)/32768;
    decoded.set(id,samples);
  }
  const input=decoded.get(id),out=new Float32Array(Math.ceil(input.length*rate/clip.rate));
  for(let i=0;i<out.length;i++){
    const position=i*clip.rate/rate,index=Math.floor(position),fraction=position-index;
    out[i]=(input[index]??0)*(1-fraction)+(input[index+1]??0)*fraction;
  }
  if(resampled.size>=24)resampled.delete(resampled.keys().next().value);
  resampled.set(key,out);return out;
}
