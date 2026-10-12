import {SECTION_SETTINGS} from './section-settings.js';
import {random} from './physics.js';
import {normalizeSection} from './section-settings.js';

export const EPISODE_FORMATS=['sprint','elimination','teams','championship'];
export const FORMAT_NAMES={tr:{sprint:'Sprint',elimination:'Eleme kupası',teams:'Takım mücadelesi',championship:'Üç etaplı şampiyona'},en:{sprint:'Sprint',elimination:'Elimination cup',teams:'Team challenge',championship:'Three-stage championship'}};
const pools=[['crossramps','slalom','fork','shortcut','drift','funnel'],['pegs','wheels','funnel','drift','crossramps','shortcut'],['pulse','pendulum','wheels','fork','slalom','drift']];

// Rules are fixed per format. Randomness changes courses, never the scoring contract.
export function withEpisode(recipe,format){
  if(recipe.mode!=='track'||!EPISODE_FORMATS.includes(format))throw new Error('Invalid episode format');
  const rng=random(recipe.seed^0x193a),rounds=['elimination','championship'].includes(format)?3:1;
  const heats=Array.from({length:rounds},(_,index)=>{
    const preferred=pools[rounds===1?(format==='teams'?1:0):index];
    const pool=[...new Set([...preferred,...Object.keys(SECTION_SETTINGS)])];
    const sequence=Array.from({length:rounds===1?12+Math.floor(rng()*5):3+Math.floor(rng()*5)},()=>{
      const type=pool.splice(Math.floor(rng()*pool.length),1)[0];
      return normalizeSection(recipe.sequence?.find(s=>s.type===type)??type);
    });
    return {seed:1+(recipe.seed+index*104729)%999999,sequence};
  });
  return {...recipe,count:12,sequence:heats[0].sequence,episode:{version:1,format,heats}};
}

export function episodeCopy(r,language){
  language='en';
  const format=r.episode.format,name=FORMAT_NAMES[language][format];
  const rules={
    sprint:'First across the finish wins.',
    elimination:'12 racers → 8 → 4. First across the final wins.',
    teams:'3 teams of 4. First 6 finishers score 6–1. Highest team total wins.',
    championship:'3 different stages. First 6 score 6–1 each stage. Highest total wins.',
  };
  const tie=' Ties compare finish places from the last stage backwards.';
  return {hook:name,title:name+' · Can your favorite win?',description:rules[format]+(['teams','championship'].includes(format)?tie:''),rules:rules[format],tags:['shorts','marble race','physics simulation',format],language};
}
