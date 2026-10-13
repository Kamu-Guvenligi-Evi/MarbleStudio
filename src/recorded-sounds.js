import {RECORDED_SOUNDS} from './recorded-sound-data.js';
export {RECORDED_SOUNDS};
const decoded=new Map(),resampled=new Map();
export function recordedSamples(id,rate){
  const clip=RECORDED_SOUNDS[id];if(!clip)return null;
  const key=id+':'+rate;if(resampled.has(key))return resampled.get(key);
  let source=decoded.get(id);
  if(!source){
    const bytes=atob(clip.pcm);source=new Float32Array(bytes.length/2);
    for(let i=0;i<source.length;i++){
      let value=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8);
      if(value>=32768)value-=65536;source[i]=value/32768;
    }
    decoded.set(id,source);
  }
  const out=new Float32Array(Math.ceil(source.length*rate/clip.rate));
  for(let i=0;i<out.length;i++){
    const position=i*clip.rate/rate,index=Math.floor(position),fraction=position-index;
    out[i]=(source[index]??0)*(1-fraction)+(source[index+1]??0)*fraction;
  }
  resampled.set(key,out);return out;
}
