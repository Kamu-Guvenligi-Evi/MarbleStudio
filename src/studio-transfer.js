import {normalizeProject} from './projects.js';
import {parseStatistics} from './statistics-data.js';

export function normalizeSnapshot(raw) {
  if(!raw||typeof raw!=='object')throw new Error('Studio çalışması geçersiz.');
  if(raw.mode==='statistics'){
    const s=raw.statistics;if(!s)throw new Error('İstatistik tablosu eksik.');parseStatistics(s.csv);
    const statistics={csv:s.csv};
    if(s.dataset&&typeof s.dataset.id==='string'&&Array.isArray(s.dataset.sources)&&JSON.stringify(s.dataset).length<20000)statistics.dataset=structuredClone(s.dataset);
    for(const [key,max] of [['heading',60],['unit',24],['source',120]])statistics[key]=String(s[key]??'').slice(0,max);
    statistics.duration=['15','30','60','120'].includes(String(s.duration))?String(s.duration):'30';
    statistics.top=['5','10','15'].includes(String(s.top))?String(s.top):'10';
    statistics.interpolation=s.interpolation==='step'?'step':'linear';
    return {mode:'statistics',statistics};
  }
  if(!['track','arena','spiral'].includes(raw.mode))throw new Error('Yarış türü geçersiz.');
  const project=normalizeProject({...raw.project,mode:raw.mode});
  const music=raw.music??{},mode=music.mode==='leader'&&raw.mode==='track'?'leader':'fixed';
  const cleanTrack=t=>{if(t==null||t==='')return '';if(typeof t!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(t))throw new Error('Müzik kimliği geçersiz.');return t;};
  const roster=Array.isArray(music.roster)?music.roster.slice(0,20).map(x=>({track:cleanTrack(x?.track),entity:String(x?.entity??'').slice(0,100)})):[];
  return {mode:raw.mode,project,music:{mode,track:cleanTrack(music.track),volume:Math.max(0,Math.min(100,Number(music.volume)||0)),roster}};
}

const prefix='marble-studio-';
export function createBackup(storage){
  const entries={};for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key.startsWith(prefix))entries[key]=storage.getItem(key);}
  return {format:'marble-studio-backup',version:1,createdAt:new Date().toISOString(),entries};
}
export function parseBackup(text){
  if(typeof text!=='string'||text.length>64000000)throw new Error('Yedek en fazla 64 MB olabilir.');
  let b;try{b=JSON.parse(text);}catch{throw new Error('Yedek dosyası okunamadı.');}
  if(b?.format!=='marble-studio-backup'||b.version!==1||!b.entries||typeof b.entries!=='object'||Array.isArray(b.entries))throw new Error('Desteklenmeyen Studio yedeği.');
  for(const [key,value] of Object.entries(b.entries)){
    if(!/^marble-studio-[a-z0-9-]+$/.test(key)||typeof value!=='string')throw new Error('Yedekte geçersiz kayıt var.');
    let data;try{data=JSON.parse(value);}catch{throw new Error('Yedekte okunamayan ayar: '+key);}
    if(/^marble-studio-(track|arena|spiral)-v1$/.test(key))normalizeProject(data);
    if(key==='marble-studio-statistics-v1')normalizeSnapshot({mode:'statistics',statistics:data});
  }
  return b;
}
export function restoreBackup(storage,backup){
  const validated=parseBackup(JSON.stringify(backup)),previous=createBackup(storage).entries;
  try{
    for(const key of Object.keys(previous))storage.removeItem(key);
    for(const [key,value] of Object.entries(validated.entries))storage.setItem(key,value);
  }catch(error){
    for(const key of Object.keys(validated.entries))storage.removeItem(key);
    for(const [key,value] of Object.entries(previous))storage.setItem(key,value);
    throw new Error('Yedek yüklenemedi; önceki ayarlar korundu. '+error.message);
  }
}

export function downloadJSON(value,name){
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
