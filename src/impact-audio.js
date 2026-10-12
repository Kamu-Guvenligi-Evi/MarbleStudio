import {RECORDED_SOUNDS,recordedSamples} from './recorded-sounds.js';
// Shared deterministic synthesis and recorded PCM for live and offline exports.
export const COLLISION_SOUNDS={classic:'Klasik',meow:'Miyav',woof:'Havlama',squeak:'Lastik oyuncak',pop:'Baloncuk',laser:'Lazer',bell:'Zil',wood:'Tahta tıkırtısı',...Object.fromEntries(Object.entries(RECORDED_SOUNDS).map(([id,clip])=>[id,clip.name]))};
export const normalizeCollisionSound=value=>Object.hasOwn(COLLISION_SOUNDS,value)?value:'classic';
export function collisionEvent(event={},sound='classic'){
  const collision=['impact','ice'].includes(event.type??'impact');
  return collision?{...event,collisionSound:normalizeCollisionSound(sound)}:event;
}
export function effectInterval(event={}){
  const sound=normalizeCollisionSound(event.collisionSound);
  if(RECORDED_SOUNDS[sound])return RECORDED_SOUNDS[sound].duration;
  return ({meow:.22,woof:.18,squeak:.12,bell:.1})[sound]??(sound==='classic'?(event.type==='ice'?.035:.045):.07);
}
export function effectSamples(event={},rate=48000){
  const type=event.type??'impact',sound=['impact','ice'].includes(type)?normalizeCollisionSound(event.collisionSound):'classic';
  const recorded=recordedSamples(sound,rate);if(recorded)return recorded;
  const duration=sound==='classic'?({ice:.24,multiply:.36,drop:.16,complete:.7,impact:.09})[type]??.09:({meow:.42,woof:.26,squeak:.22,pop:.1,laser:.2,bell:.48,wood:.08})[sound];
  const out=new Float32Array(Math.ceil(rate*duration));
  let noise=(event.seed??17)|0,previous=0;
  const pitch=({lava:.7,gold:1.12,candy:1.35,cosmic:.85,aurora:1.18})[event.theme]??1;
  let phase=0,filtered=0;
  for(let i=0;i<out.length;i++){
    const t=i/rate,attack=Math.min(1,t/.002),fade=Math.min(1,(duration-t)/.018);
    noise^=noise<<13;noise^=noise>>>17;noise^=noise<<5;
    const white=(noise>>>0)/2147483648-1,high=white-previous;previous=white;
    let sample;
    const u=t/duration,variation=.92+Math.max(0,Math.min(540,event.x??270))/540*.16;
    if(sound==='meow'){
      const f=(u<.22?460+u/.22*330:790-(u-.22)/.78*440)*variation;
      phase+=2*Math.PI*f/rate;
      sample=(.19*Math.sin(phase)+.1*Math.sin(phase*2)+.07*Math.sin(phase*3)+.035*Math.sin(phase*5))*Math.sin(Math.PI*u)**.7;
    }else if(sound==='woof'){
      filtered=filtered*.88+white*.12;phase+=2*Math.PI*(170-65*u)*variation/rate;
      sample=(.22*Math.sin(phase)+.1*Math.sin(phase*2)+.38*filtered)*Math.sin(Math.PI*u)*Math.exp(-u*2);
    }else if(sound==='squeak'){
      phase+=2*Math.PI*(900+950*Math.sin(Math.PI*u))*variation/rate;
      sample=.22*(Math.sin(phase)+.2*Math.sin(phase*3))*Math.sin(Math.PI*u);
    }else if(sound==='pop')sample=.38*Math.sin(2*Math.PI*(650*t-2500*t*t))*Math.exp(-t*55)+.08*white*Math.exp(-t*90);
    else if(sound==='laser')sample=.27*Math.sin(2*Math.PI*(1400*t-3000*t*t))*Math.exp(-t*18);
    else if(sound==='bell')sample=(.2*Math.sin(2*Math.PI*880*variation*t)+.1*Math.sin(2*Math.PI*2244*variation*t)+.05*Math.sin(2*Math.PI*3520*variation*t))*Math.exp(-t*12);
    else if(sound==='wood')sample=(.3*Math.sin(2*Math.PI*420*t)+.14*Math.sin(2*Math.PI*930*t)+.12*white)*Math.exp(-t*70);
    else if(type==='ice')sample=.27*high*Math.exp(-t*29)+.2*Math.sin(2*Math.PI*1850*pitch*t)*Math.exp(-t*38)+.16*Math.sin(2*Math.PI*155*t)*Math.exp(-t*36);
    else if(type==='multiply'||type==='complete'){
      const notes=type==='complete'?[523,659,784,1047]:[660,880,1320];sample=0;
      for(let n=0;n<notes.length;n++){const u=t-n*(type==='complete'?.085:.05);if(u>=0)sample+=.16*Math.sin(2*Math.PI*notes[n]*pitch*u)*Math.exp(-u*14);}
    }else if(type==='drop')sample=.12*white*Math.sin(Math.PI*t/duration)+.12*Math.sin(2*Math.PI*(900*t-2200*t*t))*Math.exp(-t*20);
    else sample=.23*Math.sin(2*Math.PI*(280+(event.x??270)*1.2)*pitch*t)*Math.exp(-t*55);
    out[i]=sample*attack*fade;
  }
  return out;
}
export function playEffect(context,destination,event){
  const samples=effectSamples(event,context.sampleRate),buffer=context.createBuffer(1,samples.length,context.sampleRate);
  buffer.copyToChannel(samples,0);const source=context.createBufferSource(),pan=context.createStereoPanner();
  source.buffer=buffer;pan.pan.value=Math.max(-.8,Math.min(.8,((event.x??270)/540-.5)*1.4));
  source.connect(pan);pan.connect(destination);source.onended=()=>{source.disconnect();pan.disconnect();};source.start();
}
