import {createGameSoundDirector} from './game-sound-director.js';
// The preview and exported video use the same lightweight, deterministic sounds.
const durations={wall:.09,bounce:.14,hit:.19,blaster:.14,burst:.09,scatter:.18,rocket:.3,blade:.2,laser:.24,pickup:.3,heal:.42};

export function createDuelSoundEvents(style='classic',overrides={}){
  const previous=new Map();
  const direct=style==='classic'?null:createGameSoundDirector('ball-duel',style,overrides);
  return (event,game,time=event.time)=>{
    const directed=direct?.({...event,x:(event.x??300)*.9},time);
    if(direct&&!directed)return null;
    if(directed&&directed.type!=='original'&&(directed.manual||(!directed.weapon&&(!['wall','bounce','hit','pickup','heal'].includes(event.type)||style!=='balanced'))))return directed;
    const sound=event.type==='shot'?(game.balls[event.owner]?.weapon??'blaster'):event.type;
    if(!Object.hasOwn(durations,sound))return null;
    // Separate channels let a hit and a reward remain audible in the same frame.
    const key=sound+'|'+event.owner,interval=sound==='wall'?.08:.045;
    if(time-(previous.get(key)??-Infinity)<interval)return null;
    previous.set(key,time);
    return {type:'duel',duelSound:sound,time,x:event.x*.9,strength:event.strength??1,seed:17+Math.round(event.time*120)+(event.owner??0)*991,...(directed?{priority:directed.priority,cue:directed.cue}: {})};
  };
}

export function duelEffectSamples(event,rate=48000){
  const kind=event.duelSound,duration=durations[kind]??.14;
  const out=new Float32Array(Math.ceil(rate*duration));
  const force=Math.max(1,Math.min(3,event.strength??1));
  let noise=(event.seed??17)|0,filtered=0,phase=0;
  for(let i=0;i<out.length;i++){
    const t=i/rate,u=t/duration;
    noise^=noise<<13;noise^=noise>>>17;noise^=noise<<5;
    const white=(noise>>>0)/2147483648-1;
    filtered=filtered*.82+white*.18;
    let sample=0;
    if(kind==='pickup'||kind==='heal'){
      const notes=kind==='heal'?[660,880,1320]:[880,1175];
      for(let n=0;n<notes.length;n++){
        const age=t-n*.065;
        if(age>=0)sample+=.38*Math.sin(2*Math.PI*notes[n]*age)*Math.exp(-age*15)*Math.min(1,age/.003);
      }
    }else if(kind==='wall'||kind==='bounce'){
      const bounce=kind==='bounce';
      sample=((bounce?.48:.3)*Math.sin(2*Math.PI*(bounce?240:650)*t)+.1*white)*Math.exp(-t*(bounce?32:55));
    }else if(kind==='hit'){
      phase+=2*Math.PI*(180-40*u-15*(force-1))/rate;
      sample=(.5*Math.sin(phase)+.35*filtered+.12*white)*Math.exp(-t*24)*(1+(force-1)*.15);
    }else if(kind==='laser'){
      phase+=2*Math.PI*(2200*Math.exp(-u*3)+180)/rate;
      sample=(.44*Math.sin(phase)+.16*Math.sin(phase*2.01))*Math.exp(-t*13);
    }else if(kind==='blade'){
      sample=(.38*white*Math.sin(Math.PI*u)+.24*Math.sin(2*Math.PI*1850*t)*Math.exp(-t*30))*Math.exp(-t*10);
    }else if(kind==='rocket'){
      phase+=2*Math.PI*(150-95*u)/rate;
      sample=(.5*Math.sin(phase)+.6*filtered)*Math.exp(-t*11);
    }else if(kind==='scatter'){
      sample=(.42*white+.35*Math.sin(2*Math.PI*150*t))*Math.exp(-t*26);
    }else{
      const burst=kind==='burst';
      phase+=2*Math.PI*((burst?850:1100)*(1-u)+120)/rate;
      sample=(.4*Math.sin(phase)+.12*white)*Math.exp(-t*(burst?40:25));
    }
    out[i]=sample*Math.min(1,t/.002)*Math.min(1,(duration-t)/.018);
  }
  return out;
}
