import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
export async function sharedVideos(project,{enabled=true,onUnavailable=()=>{}}={}){
  if(!enabled)return [];
  let manifest;
  try{manifest=JSON.parse(await readFile(path.join(project,'work-videos/manifest.json'),'utf8'));}
  catch(error){if(error.code==='ENOENT')return [];throw error;}
  if(manifest.version!==1||!Array.isArray(manifest.jobs))throw new Error('Ortak video listesi geçersiz.');
  const ids=new Set(),jobs=[];
  for(const entry of manifest.jobs){
    if(!/^shared-[a-f0-9]{16}$/.test(entry.id)||ids.has(entry.id)||!['video.mp4','video.webm'].includes(entry.videoFile)||!['track','arena','spiral','statistics','pi','territory','glass-breaker','spiral-breaker','ball-duel','ring-escape','rock-paper-scissors','ball-multiplier','goal-arena'].includes(entry.mode))throw new Error('Ortak video kaydı geçersiz.');
    ids.add(entry.id);
    let info;
    try{info=await stat(path.join(project,'work-videos',entry.id,entry.videoFile));}
    catch(error){if(error.code!=='ENOENT')throw error;}
    // A checkout can contain LFS pointers or only some videos. Local production
    // and downloaded videos must remain available while the archive is incomplete.
    if(!info?.isFile()||info.size!==entry.bytes){onUnavailable(entry.id);continue;}
    let contentKind=entry.contentKind??entry.mode;
    if(entry.mode==='arena'&&!entry.contentKind){
      try{const metadata=JSON.parse(await readFile(path.join(project,'work-videos',entry.id,'metadata.json'),'utf8'));if(metadata.recipe?.arenaGame==='territory')contentKind='territory';}
      catch{ /* Missing legacy metadata does not prevent video playback. */ }
    }
    jobs.push({...entry,contentKind,files:[entry.videoFile,'cover.jpg','metadata.json'],shared:true,state:'done',stage:'Ortak çalışma videosu',progress:100});
  }
  return jobs;
}
