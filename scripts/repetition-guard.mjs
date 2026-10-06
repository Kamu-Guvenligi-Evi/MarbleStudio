import {createHash} from 'node:crypto';
import {readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {parseStatistics} from '../src/statistics-data.js';

export const REPEAT_DAYS=90,REPEAT_COUNT=300;
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,canonical(value[k])])):value;
const hash=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export function contentKeys(r){
  if(r.mode==='statistics'){
    const parsed=parseStatistics(r.statistics.csv);
    const columns=parsed.names.map((name,index)=>({name:name.normalize('NFC').toLocaleLowerCase('tr-TR'),index})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
    const data={names:columns.map(c=>c.name),frames:parsed.frames.map(f=>({year:f.year,values:columns.map(c=>f.values[c.index])}))};
    const key=hash({mode:r.mode,data});return {exact:key,similar:key};
  }
  const count=r.count??12,images=(r.ballImages??[]).slice(0,count).map(x=>x?hash(x):null);
  const roster=Array.from({length:count},(_,i)=>images[i]??'color-'+i);
  const physical={mode:r.mode,seed:r.seed,count,roster,...(r.mode==='track'?{sequence:r.sequence}:r.mode==='arena'?{energy:r.energy??1}:{theme:r.theme??r.spiralTheme??'ice',variant:r.variant??'classic'})};
  if(r.episode)physical.episode={version:r.episode.version,format:r.episode.format,heats:r.episode.heats.map(h=>({seed:h.seed,sequence:h.sequence}))};
  const similar={...physical};delete similar.seed;similar.roster=[...roster].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if(r.mode==='track')similar.sequence=(r.sequence??[]).map(s=>typeof s==='string'?s:s.type);
  if(r.episode)similar.episode={version:r.episode.version,format:r.episode.format,heats:r.episode.heats.map(h=>({sequence:h.sequence.map(s=>s.type)}))};
  // Spiral's visible identity is its material and breaking behavior, not its random seed.
  if(r.mode==='spiral'){delete similar.roster;delete similar.count;}
  return {exact:hash(physical),similar:hash(similar)};
}
export function repetitionError(message='Uzun süreli tekrar korumasını geçen yeni içerik bulunamadı. Başka bir tür seç veya içerik kütüphanesini genişlet.'){
  const error=new Error(message);error.code='REPETITION_LIMIT';error.nonRetryable=true;return error;
}
export function repetitionEntry(job,now=Date.now()){
  return {id:job.id,...contentKeys(job.recipe),mode:job.recipe.mode,...(job.recipe.episode?{episodeFormat:job.recipe.episode.format}:{}),completedAt:job.completedAt??new Date(now).toISOString()};
}
export function createRepetitionGuard(history=[],ledger=[],now=Date.now(),ownId=null){
  const records=new Map(ledger.map(row=>[row.id,row]));
  for(const job of history)if(job.recipe&&job.id&&!records.has(job.id))records.set(job.id,repetitionEntry(job,now));
  const all=[...records.values()].filter(r=>r.id!==ownId).sort((a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt));
  const exact=new Set(all.map(r=>r.exact)),similar=new Set(all.filter((r,i)=>i>=all.length-REPEAT_COUNT||now-Date.parse(r.completedAt)<REPEAT_DAYS*86400000).map(r=>r.similar));
  return {recentFormats:all.filter(r=>r.mode==='track').slice(-300).map(r=>r.episodeFormat??'sprint'),check(recipe){const keys=contentKeys(recipe);return {allowed:!exact.has(keys.exact)&&!similar.has(keys.similar),reason:exact.has(keys.exact)?'Aynı içerik daha önce üretildi.':similar.has(keys.similar)?'Benzer içerik 90 gün / son 300 video korumasında.':null,keys};},size:all.length};
}

export async function openRepetitionLedger(root,history=[]){
  const file=path.join(root,'repetition-ledger.json');let entries=[];
  const valid=data=>{if(data?.version!==1||!Array.isArray(data.entries)||data.entries.some(r=>!r.id||!/^[a-f0-9]{64}$/.test(r.exact)||!/^[a-f0-9]{64}$/.test(r.similar)||!Number.isFinite(Date.parse(r.completedAt))))throw new Error('Tekrar hafızası okunamadı.');return data.entries;};
  try{entries=valid(JSON.parse(await readFile(file,'utf8')));}
  catch(error){
    try{entries=valid(JSON.parse(await readFile(file+'.bak','utf8')));}
    catch(backup){if(error.code!=='ENOENT'||backup.code!=='ENOENT')throw new Error('Tekrar hafızası ve yedeği okunamadı; güvenli üretim için kayıtları onar.');}
  }
  async function persist(next){
    await writeFile(file+'.tmp',JSON.stringify({version:1,entries:next}));
    // Back up known-valid in-memory data, never a damaged file recovered on startup.
    await rename(file+'.tmp',file);entries=next;
    await writeFile(file+'.bak.tmp',JSON.stringify({version:1,entries:next}));
    await rename(file+'.bak.tmp',file+'.bak');
  }
  const merged=new Map(entries.map(r=>[r.id,r]));for(const job of history)if(job.recipe&&!merged.has(job.id))merged.set(job.id,repetitionEntry(job));
  if(merged.size!==entries.length)await persist([...merged.values()]);
  return {entries:()=>entries.map(r=>({...r})),async remember(job){const row=repetitionEntry(job),next=entries.filter(r=>r.id!==row.id);next.push(row);await persist(next);}};
}
