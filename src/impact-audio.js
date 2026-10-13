// Shared deterministic synthesis for live Web Audio and offline video exports.
import {duelEffectSamples} from './ball-duel-audio.js';
import {directedSamples} from './game-sound-director.js';
import {memeSamples} from './meme-audio.js';
import {cueSamples} from './sound-plan.js';
import {isSoftSound,isSoftNote,createNoteClimb} from './soft-audio.js';
import {EffectVoicePlayer} from './effect-voices.js';
import {normalizeCollisionSound} from './collision-sound-settings.js';
export {COLLISION_SOUNDS,normalizeCollisionSound} from './collision-sound-settings.js';
import {RECORDED_SOUNDS,recordedSamples} from './recorded-sounds.js';
export function collisionEvent(event={},sound='classic'){
  const collision=['impact','ice'].includes(event.type??'impact');
  return collision?{...event,collisionSound:normalizeCollisionSound(sound)}:event;
}
export function effectInterval(event={}){
  const sound=normalizeCollisionSound(event.collisionSound);
  if(isSoftSound(sound))return .095;
  return sound==='classic'?(event.type==='ice'?.035:.045):.055;
}
export function effectSamples(event={},rate=48000){
  if(event.type==='directed'||event.type==='original')return directedSamples(event,rate);
  if(event.type==='duel')return duelEffectSamples(event,rate);
  const type=event.type??'impact',sound=['impact','ice'].includes(type)?normalizeCollisionSound(event.collisionSound):'classic';
  if(isSoftSound(sound))return cueSamples({root:48,scale:'pentatonic'},{voice:sound,degree:event.noteDegree??0,gain:.42},rate);
  const recorded=memeSamples(sound,rate)??recordedSamples(sound,rate);if(recorded)return recorded;
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
const players=new WeakMap();
export function createCollisionNotes(){
  const climb=createNoteClimb();
  return (event,time)=>isSoftNote(event.collisionSound)?{...event,noteDegree:event.noteDegree??climb(time)}:event;
}
export function stopEffects(destination){players.get(destination)?.stop();}
export function playEffect(context,destination,event){
  let player=players.get(destination);
  if(!player){player=new EffectVoicePlayer(context,destination);players.set(destination,player);}
  return player.play(event,effectSamples(event,context.sampleRate));
}
