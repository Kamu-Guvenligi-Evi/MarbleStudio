import {VOICES} from './sound-plan.js';

export const SOUND_EVENTS={
  'rock-paper-scissors':{wall:'Duvara çarpma',bounce:'Aynı türlerin çarpışması',hit:'Tür dönüşümü',win:'Zafer',timeout:'Süre doldu'},
  'spiral-breaker':{brick:'Duvara çarpma',paddle:'Çubuktan sekme',break:'Blok kırılma',finish:'Yolu tamamlama',multiply:'×3 bonusu',bonus:'Diğer bonuslar',lost:'Topların bitmesi',won:'Harita tamamlandı'},
  'glass-breaker':{ice:'Cam kırılma',wave:'Yeni dalga',won:'Final'},
  'ball-duel':{wall:'Duvara çarpma',bounce:'Topların çarpışması',hit:'Hasar',shot:'Silah atışı',pickup:'Silah toplama',heal:'Can kazanma',win:'Zafer',timeout:'Süre doldu'},
  'ring-escape':{hit:'Halkaya çarpma',break:'Halka kırılma',win:'Kaçış tamamlandı',timeout:'Süre doldu'},
};
export const ORIGINAL_CLIPS={brick:'effect-1',paddle:'effect-2',break:'effect-3',finish:'effect-4',multiply:'effect-5',bonus:'effect-2',lost:'effect-6',won:'effect-6'};
export function normalizeSoundOverrides(mode,raw){
  const result={};
  for(const event of Object.keys(SOUND_EVENTS[mode]??{})){
    const value=raw?.[event];
    if(['original','off',...VOICES].includes(value))result[event]=value;
  }
  return result;
}
export function normalizeReferenceMapping(raw){
  return Object.fromEntries(Object.entries(ORIGINAL_CLIPS).map(([event,fallback])=>[event,raw?.[event]==='off'||/^effect-[1-6]$/.test(raw?.[event]??'')?raw[event]:fallback]));
}

// Original glass impact: decaying high-passed noise and an energy-pitched sine.
// Deterministic noise keeps the preview and offline render on the same instrument.
export function originalGlassSamples(event,rate){
  const out=new Float32Array(Math.ceil(rate*.13)),energy=Number.isFinite(event.energy)?event.energy:200;
  const gain=Math.min(.16,Math.max(0,energy)/2400),w=2*Math.PI*2200/rate,c=Math.cos(w),a=Math.sin(w)/(2*Math.SQRT1_2);
  const b0=(1+c)/2/(1+a),b1=-(1+c)/(1+a),b2=b0,a1=-2*c/(1+a),a2=(1-a)/(1+a);
  let seed=17,x1=0,x2=0,y1=0,y2=0;
  for(let i=0;i<out.length;i++){
    const t=i/rate;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
    const x=t<.105?((seed>>>0)/2147483648-1)*Math.exp(-t/.105*7):0;
    const y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;
    out[i]=y*gain+Math.sin(2*Math.PI*(2600+energy*3)*t)*.022*Math.pow(.001/.022,Math.min(t/.12,1));
  }
  return out;
}
