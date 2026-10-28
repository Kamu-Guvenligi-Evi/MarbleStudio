import {VOICES} from './sound-plan.js';

export const SOUND_EVENTS={
  'goal-arena':{wall:'Wall / post',bounce:'Ball collision',goal:'Goal',complete:'Full time'},
  'ball-multiplier':{wall:'Wall bounce',bounce:'Ball collision',multiply:'New ball',complete:'Complete'},
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

// Shared glass fracture instrument for original playback and video export.
export {glassFractureSamples as originalGlassSamples} from './glass-fracture-audio.js';
