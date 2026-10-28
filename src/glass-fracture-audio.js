// Short impact, brittle fracture bursts and scattered shard tinkles.
// Seeded PCM is shared by live playback and offline video; no asset download.
const cache=new Map();
export function glassFractureSamples(event={},rate=48000){
  const energy=Number.isFinite(event.energy)?Math.max(0,event.energy):200;
  const strength=Math.min(3,Math.floor(energy/180));
  const variant=((event.cue?.degree??0)%4+4)%4;
  const key=`${rate}|${strength}|${variant}`;
  if(cache.has(key))return cache.get(key);
  const duration=.36+strength*.025,out=new Float32Array(Math.ceil(rate*duration));
  let state=7919+variant*337+strength*101;
  const rand=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
  const shards=Array.from({length:12},(_,i)=>({start:.012+i*.017+rand()*.012,f:1550+rand()*4800,decay:.012+rand()*.034,amp:.018+rand()*.025}));
  const level=.7+strength*.13;let previous=0,low=0;
  for(let i=0;i<out.length;i++){
    const t=i/rate,n=rand()*2-1;low+=.32*(n-low);
    const high=n-low,diff=n-previous;previous=n;
    const attack=Math.min(1,t/.0007);
    const crack=Math.exp(-t/.011)+.48*Math.exp(-Math.abs(t-.019)/.005)+.25*Math.exp(-Math.abs(t-.041)/.008);
    let s=(high*.29+diff*.07)*crack*attack;
    s+=Math.sin(2*Math.PI*(580+variant*37)*t)*Math.exp(-t/.009)*.10*attack;
    s+=high*.045*Math.exp(-t/.075)*attack;
    for(const shard of shards){const d=t-shard.start;if(d>=0&&d<.15){const env=Math.min(1,d/.001)*Math.exp(-d/shard.decay);s+=shard.amp*env*(Math.sin(2*Math.PI*shard.f*d)+.3*Math.sin(2*Math.PI*shard.f*1.43*d));}}
    out[i]=Math.tanh(s*level)*Math.min(1,(duration-t)/.018);
  }
  if(cache.size>=48)cache.delete(cache.keys().next().value);
  cache.set(key,out);return out;
}
