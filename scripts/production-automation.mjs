import {EPISODE_FORMATS,withEpisode} from '../src/episode-plan.js';
import {createRepetitionGuard,repetitionError} from './repetition-guard.mjs';
import {SPIRAL_THEMES} from '../src/spiral-themes.js';
import {SPIRAL_VARIANTS} from '../src/spiral-variants.js';
import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {randomInt} from 'node:crypto';
import {recipe,structure} from '../src/factory-recipes.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {visualSimilarity} from '../src/production-quality.js';

export function leastRecent(values,used,pick=randomInt){
  if(!values.length)throw new Error('Otomatik seçim için seçenek yok.');
  const recent=used.slice(-300),scores=values.map(value=>({value,score:recent.reduce((sum,item,i)=>sum+(item===value?1+(i+1)/recent.length:0),0)+(recent.at(-1)===value?100:0)}));
  const min=Math.min(...scores.map(x=>x.score)),pool=scores.filter(x=>x.score===min);return pool[pick(pool.length)].value;
}
const recipeOf=job=>job.recipe??job.options?.source;
const zodiacTR={Aries:'Koç',Taurus:'Boğa',Gemini:'İkizler',Cancer:'Yengeç',Leo:'Aslan',Virgo:'Başak',Libra:'Terazi',Scorpio:'Akrep',Sagittarius:'Yay',Capricorn:'Oğlak',Aquarius:'Kova',Pisces:'Balık'};
export async function planAutomatic(options,history,project,guard=createRepetitionGuard(history)){
  const recent=history.slice(-300);
  const spiralAvailable=Object.keys(SPIRAL_THEMES).some(theme=>Object.keys(SPIRAL_VARIANTS).some(variant=>guard.check({mode:'spiral',seed:1,count:1,theme,variant}).allowed));
  const modes=spiralAvailable?['track','arena','spiral']:['track','arena'];
  if(options.automaticMode==='spiral'&&!spiralAvailable)throw repetitionError('Spiral tema ve davranışları tekrar korumasında. Başka bir tür seç; süre ve video aralığı dolunca spiral yeniden kullanılabilir.');
  const mode=options.automaticMode==='auto'?leastRecent(modes,recent.map(j=>j.mode)):options.automaticMode;
  const base={...options,modes:[mode],orientation:mode==='statistics'?'landscape':'portrait',audio:mode==='statistics'?'none':'all',strategy:mode==='statistics'?'exact':'variations'};
  if(mode==='statistics'){
    const {items}=JSON.parse(await readFile(path.join(project,'public/statistics/manifest.json'),'utf8'));
    const unused=[];
    for(const item of items){if(!/^\/statistics\/[a-zA-Z0-9_./-]+\.csv$/.test(item.csv)||item.csv.includes('..'))throw new Error('Veri dosyası yolu geçersiz.');const csv=await readFile(path.join(project,'public',item.csv.slice(1)),'utf8');if(guard.check({mode:'statistics',statistics:{csv}}).allowed)unused.push(item);}
    if(!unused.length)throw repetitionError('Hazır istatistik verilerinin tamamı daha önce kullanılmış. Yeni veya güncellenmiş veri eklenene kadar otomatik tekrar üretilmez.');
    const id=leastRecent(unused.map(i=>i.id),recent.map(j=>recipeOf(j)?.statistics?.dataset?.id));
    const item=unused.find(i=>i.id===id);
    if(!/^\/statistics\/[a-zA-Z0-9_./-]+\.csv$/.test(item.csv)||item.csv.includes('..'))throw new Error('Veri dosyası yolu geçersiz.');
    const csv=await readFile(path.join(project,'public',item.csv.slice(1)),'utf8');
    return {...base,source:normalizeSnapshot({mode,statistics:{csv,dataset:item,heading:item.title,source:item.source,unit:item.unit,duration:'30',top:'10',interpolation:item.interpolation}}),automation:{version:1,dataset:id,reason:'Son 300 üretimde en az kullanılan konu; son konu tekrarlanmaz.'}};
  }
  const manifest=JSON.parse(await readFile(path.join(project,'public/music/manifest.json'),'utf8'));
  const available=[];
  // General instrumental tracks suit every roster; country/person songs stay opt-in.
  for(const track of manifest.filter(t=>['monkeys','cipher','weasel'].includes(t.id))){try{await access(path.join(project,'public',track.src.slice(1)));available.push(track.id);}catch{}}
  const track=leastRecent(available,recent.map(j=>recipeOf(j)?.music?.track));
  const catalog=JSON.parse(await readFile(path.join(project,'public/catalog/manifest.json'),'utf8'));
  const category=mode==='spiral'?'colors':leastRecent(['countries','teams','zodiac'],recent.filter(j=>j.mode!=='spiral').map(j=>j.options?.automation?.rosterCategory));
  const items=catalog.items.filter(i=>i.category===category),used=recent.flatMap(j=>recipeOf(j)?.ballNames??[]),members=[];
  while(members.length<Math.min(20,items.length)){
    const name=leastRecent(items.filter(i=>!members.includes(i)).map(i=>i.name),used);members.push(items.find(i=>i.name===name));
  }
  for(const item of members)if(!/^\/catalog\/[a-zA-Z0-9-]+\.(png|webp|jpg|svg)$/.test(item.src))throw new Error('Kadro görseli yolu geçersiz.');
  return {...base,source:null,automation:{version:2,...(mode==='track'?{episodeFormat:leastRecent(EPISODE_FORMATS,guard.recentFormats??recent.filter(j=>j.mode==='track').map(j=>recipeOf(j)?.episode?.format??'sprint'))}:{}),rosterCategory:category,catalogItems:members,ballNames:members.map(i=>(options.language==='tr'&&category==='zodiac'?zodiacTR[i.name]??i.name:i.name).slice(0,24)),ballImages:[],music:{mode:'fixed',track,volume:25},reason:'Müzik ve kadro kategorisi son 300 üretime göre dönüşümlü seçilir; düzenler ayrıca karşılaştırılır.'}};
}

export function automaticCandidate(options,seed,history=[],attempted=[],guard=createRepetitionGuard(history)){
  const mode=options.modes[0],recent=history.slice(-300).map(recipeOf).filter(Boolean),pool=[];
  for(let i=0;i<96;i++){
    let r=recipe(1+(seed+i*7919)%999999,mode);const auto=options.automation;
    if(mode==='spiral'){r.theme=Object.keys(SPIRAL_THEMES)[i%6];r.variant=Object.keys(SPIRAL_VARIANTS)[Math.floor(i/6)%4];}
    if(mode==='arena'){r.count=6+2*(i%8);r.energy=[.85,1,1.15][Math.floor(i/8)%3];}
    if(mode!=='spiral'&&auto.ballNames.length)r.count=Math.min(r.count,Math.floor(auto.ballNames.length/2)*2);
    Object.assign(r,{language:options.language,rosterCategory:auto.rosterCategory,music:auto.music,ballNames:auto.ballNames,ballImages:auto.ballImages,sound:true,trails:true,presentation:{countdown:0,outro:2,camera:'smart'}});
    if(mode==='track')r=withEpisode(r,auto.episodeFormat??'sprint');
    const shape=structure(r);if(attempted.some(a=>structure(a)===shape))continue;
    if(!guard.check(r).allowed)continue;
    const similarity=recent.length?Math.max(...recent.map(p=>visualSimilarity(r,p))):0;
    const repetition=recent.filter(p=>visualSimilarity(r,p)>.95).length;
    pool.push({r,score:similarity*30+repetition*8});
  }
  pool.sort((a,b)=>a.score-b.score);if(!pool.length)throw repetitionError();return pool[0].r;
}

export function outputQuality(analysis,speed){
  if(analysis.hits===0)return {accepted:true,reasons:[],firstEventSeconds:0,longestQuietSeconds:0};
  const first=analysis.firstEventSeconds/speed,quiet=analysis.longestQuietSeconds/speed,reasons=[];
  if(first>3)reasons.push('İlk olay üç saniyeden geç');
  if(quiet>8)reasons.push('Sekiz saniyeden uzun olaysız bölüm');
  if(analysis.visibleRatio<.35)reasons.push('Yarışmacılar yeterince görünür değil');
  if(analysis.idleRatio>.65)reasons.push('Durağan bölüm oranı yüksek');
  return {accepted:!reasons.length,reasons,firstEventSeconds:first,longestQuietSeconds:quiet};
}
