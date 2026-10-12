import {random} from '../src/physics.js';
import {normalizeSection,SECTION_SETTINGS} from '../src/section-settings.js';
import {videoTiming} from './video-timing.mjs';

// Resize a deterministic course, retaining its seed, roster and race rules.
// The first 24 sections form a stable prefix across calibration passes.
export function resizeTrack(r,lengths){
  const heats=r.episode?.heats??[{seed:r.seed,sequence:r.sequence}];
  const resized=heats.map((heat,index)=>{
    const sequence=structuredClone(heat.sequence),rng=random(heat.seed^0x517cc1b7);
    const types=Object.keys(SECTION_SETTINGS);
    while(sequence.length<24){
      const available=types.filter(type=>type!==sequence.at(-1)?.type);
      const type=available[Math.floor(rng()*available.length)];
      sequence.push(normalizeSection(r.sequence?.find(s=>s.type===type)??type));
    }
    return {...heat,sequence:sequence.slice(0,Math.max(1,Math.min(24,lengths[index])))};
  });
  return {...r,sequence:resized[0].sequence,...(r.episode?{episode:{...r.episode,heats:resized}}:{})};
}

export async function fitTrackDuration(original,target,probe,{intro=0,outro=2,check=()=>{},onPass=async()=>{}}={}){
  const heats=original.episode?.heats??[{sequence:original.sequence}];
  const desired=Math.max(38,Math.min(160,target));
  const initial=Math.max(1,Math.min(24,Math.ceil((desired-intro-outro-(heats.length-1)*2)/heats.length/2.2)));
  let r=resizeTrack(original,heats.map(()=>initial));
  const passes=[],seen=new Set();
  for(let pass=0;pass<6;pass++){
    check();await onPass(pass+1);
    const analysis=await probe(r);
    const current=(r.episode?.heats??[{sequence:r.sequence}]).map(h=>h.sequence.length);
    passes.push({sections:current,seconds:analysis.simulationSeconds,complete:analysis.complete});
    const timing=videoTiming(analysis.simulationSeconds,target,{intro,outro,bounded:true});
    if(analysis.complete&&analysis.finite&&timing)return {recipe:r,analysis,timing,passes};
    if(!analysis.finite)throw new Error('Parkur simülasyonunda geçersiz konum oluştu.');
    const tooShort=analysis.complete&&analysis.simulationSeconds+intro+outro<30;
    const ratio=(desired-intro-outro)/Math.max(1,analysis.simulationSeconds);
    const lengths=current.map(n=>Math.max(1,Math.min(24,tooShort?Math.max(n+2,Math.ceil(n*ratio)):Math.min(n-1,Math.floor(n*ratio)))));
    const key=lengths.join(',');
    if(key===current.join(',')||seen.has(key))break;
    seen.add(current.join(','));r=resizeTrack(original,lengths);
  }
  throw new Error('Parkur uzunluğu 30–180 saniyeye ayarlanamadı.');
}
