// Original synthesized instruments: no recordings, downloads or random detuning.
export const SOFT_INSTRUMENTS={
  kalimba:'Yumuşak kalimba',marimba:'Yumuşak marimba',piano:'Keçe piyano',chime:'İpeksi çan',
  musicbox:'Minik müzik kutusu',harp:'Yumuşak arp',celesta:'Masalsı celesta',
  bubble:'Damla notası',vibes:'Kadife vibrafon',crystal:'Kristal dokunuş'
};
// Original motifs, expressed as scale degrees (not fixed pitches). Time is seconds.
export const SOFT_PHRASES={
  'soft-hop':{name:'Sekerek yükseliş',instrument:'marimba',steps:[0,2,1,3,2,5],times:[0,.12,.24,.36,.48,.64],hint:'Kısa geri adımlar ve yukarı sıçrama; seri kırılmalar.'},
  'soft-question':{name:'Meraklı iki nota',instrument:'musicbox',steps:[0,3,2],times:[0,.18,.46],hint:'Yükselir, bir adım geri döner; bekleme ve yakın kaçış.'},
  'soft-answer':{name:'Tatlı cevap',instrument:'celesta',steps:[3,2,0,5],times:[0,.12,.24,.43],hint:'Aşağı iner, üst Do ile cevap verir; küçük ödül.'},
  'soft-accelerate':{name:'Hızlanan merdiven',instrument:'kalimba',steps:[0,1,2,3,4,5,7],times:[0,.22,.4,.54,.65,.74,.81],hint:'Nota araları kısalır; artan kombo ve yükseliş.'},
  'soft-harp-cascade':{name:'Arp dalgası',instrument:'harp',steps:[0,2,3,5,7,5,3],times:[0,.065,.13,.195,.26,.325,.39],hint:'Yukarı süzülüp geri döner; halka geçişi.'},
  'soft-bubbles':{name:'Üç damla',instrument:'bubble',steps:[0,2,5],times:[0,.14,.32],hint:'Üç kısa ve yuvarlak nota; hafif temas ve toplama.'},
  'soft-treasure':{name:'Minik hazine',instrument:'musicbox',steps:[0,2,3,5,7],times:[0,.06,.12,.28,.38],hint:'Küçük arpej ve parlak kapanış; bonus.'},
  'soft-orbit':{name:'Dönen notalar',instrument:'vibes',steps:[0,3,1,4,2,5],times:[0,.12,.24,.36,.48,.6],hint:'Alt ve üst notalar dönüşümlü; spiral ilerleme.'},
  'soft-sparkle':{name:'Kristal parıltı',instrument:'crystal',steps:[0,5,2,7],times:[0,.09,.22,.34],hint:'Oktav sıçramaları; cam kırılması ve özel vuruş.'},
  'soft-heartbeat':{name:'Çift vuruşlu yükseliş',instrument:'piano',steps:[0,0,2,2,5,5],times:[0,.08,.28,.36,.56,.64],hint:'İkişer vuruşla yükselir; ritimli sekmeler.'}
};
export const SOFT_SOUNDS=Object.fromEntries([
  ...Object.entries(SOFT_INSTRUMENTS).flatMap(([id,name])=>[[`soft-${id}`,name],[`soft-${id}-rise`,`${name} · yükseliş`]]),
  ...Object.entries(SOFT_PHRASES).map(([id,phrase])=>[id,phrase.name]),
  ['soft-resolve','Yumuşak final akoru']
]);
export const isSoftSound=voice=>Object.hasOwn(SOFT_SOUNDS,voice);
export const isSoftNote=voice=>typeof voice==='string'&&Object.hasOwn(SOFT_INSTRUMENTS,voice.slice(5))&&voice.startsWith('soft-');

// Hold at the upper octave; only a pause restarts the phrase, never a loud jump.
export function createNoteClimb(){
  let degree=-1,last=-Infinity;
  return time=>{degree=time-last>1.4||time<last?0:Math.min(10,degree+1);last=time;return degree;};
}

const timbres={
  kalimba:{duration:.62,attack:.007,decay:7,partials:[[1,1],[2,.25],[3,.09],[4,.035]]},
  marimba:{duration:.43,attack:.009,decay:10,partials:[[1,1],[2,.045],[4,.22],[8,.025]]},
  piano:{duration:.92,attack:.014,decay:5.5,partials:[[1,1],[2,.29],[3,.13],[4,.06],[5,.025]]},
  chime:{duration:1.1,attack:.018,decay:4.8,partials:[[1,1],[2,.1],[3,.025]]},
  musicbox:{duration:.76,attack:.004,decay:6.8,partials:[[1,1],[2,.16],[3,.32],[6,.07]]},
  harp:{duration:.84,attack:.012,decay:6.4,partials:[[1,1],[2,.44],[3,.22],[4,.1],[5,.04]]},
  celesta:{duration:.86,attack:.008,decay:5.8,partials:[[1,1],[2,.035],[3,.26],[5,.095]]},
  bubble:{duration:.34,attack:.024,decay:11,partials:[[1,1],[2,.055]]},
  vibes:{duration:1.04,attack:.016,decay:4.5,tremolo:5.4,partials:[[1,1],[2,.04],[3,.14],[4,.025]]},
  crystal:{duration:.8,attack:.006,decay:7.2,partials:[[1,1],[2,.37],[4,.15],[6,.06]]}
};
const cache=new Map();
export function softSamples(voice,pitch,degree=0,gain=.45,rate=48000){
  if(!isSoftSound(voice))return null;
  const chord=voice==='soft-resolve',rise=voice.endsWith('-rise'),phrase=SOFT_PHRASES[voice];
  degree=chord?0:Math.max(0,Math.min(phrase?3:rise?5:10,degree));
  const name=phrase?.instrument??(chord?'piano':voice.slice(5).replace(/-rise$/,''));
  const timbre=timbres[name],steps=phrase?.steps??(chord?[0,2,3,5]:rise?[0,1,2,3,4,5]:[0]);
  const spacing=chord?.025:rise?.085:0;
  const times=phrase?.times??steps.map((_,i)=>i*spacing);
  const frequencies=steps.map(step=>pitch(degree+step));
  const key=[voice,...frequencies,gain,rate].join('|');
  if(cache.has(key))return cache.get(key);
  const out=new Float32Array(Math.ceil((timbre.duration+times.at(-1))*rate));
  const weight=timbre.partials.reduce((sum,[,amp])=>sum+amp,0);
  for(let note=0;note<steps.length;note++){
    const start=Math.round(times[note]*rate),f=frequencies[note];
    for(let i=0;i<Math.floor(timbre.duration*rate)&&start+i<out.length;i++){
      const t=i/rate,attack=Math.sin(Math.min(1,t/timbre.attack)*Math.PI/2)**2;
      const fade=Math.min(1,(timbre.duration-t)/.045),env=attack*fade*Math.exp(-t*timbre.decay);
      let sample=0;
      for(const [harmonic,amp] of timbre.partials){
        if(f*harmonic>=rate*.45)continue;
        sample+=amp*Math.sin(2*Math.PI*f*harmonic*t)*Math.exp(-t*(harmonic-1)*2.2);
      }
      const tremolo=timbre.tremolo?1-.14*Math.sin(Math.PI*timbre.tremolo*t)**2:1;
      out[start+i]+=sample/weight*env*tremolo*gain*(chord ? .4 : (rise||steps.length>3) ? .63 : 1);
    }
  }
  // Overlapping tails must not make an arpeggio louder than a single contact.
  let peak=0;for(const sample of out)peak=Math.max(peak,Math.abs(sample));
  if(peak>gain*.95){const scale=gain*.95/peak;for(let i=0;i<out.length;i++)out[i]*=scale;}
  if(cache.size>=128)cache.delete(cache.keys().next().value);
  cache.set(key,out);return out;
}
