import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
export async function sharedVideos(project,{enabled=true}={}){
  if(!enabled)return [];
  let manifest;
  try{manifest=JSON.parse(await readFile(path.join(project,'work-videos/manifest.json'),'utf8'));}
  catch(error){if(error.code==='ENOENT')return [];throw error;}
  if(manifest.version!==1||!Array.isArray(manifest.jobs))throw new Error('Ortak video listesi geçersiz.');
  const ids=new Set(),jobs=[];
  for(const entry of manifest.jobs){
    if(!/^shared-[a-f0-9]{16}$/.test(entry.id)||ids.has(entry.id)||!['video.mp4','video.webm'].includes(entry.videoFile)||!['track','arena','spiral','statistics'].includes(entry.mode))throw new Error('Ortak video kaydı geçersiz.');
    ids.add(entry.id);
    const info=await stat(path.join(project,'work-videos',entry.id,entry.videoFile));
    if(info.size!==entry.bytes)throw new Error('Ortak videolar henüz indirilmedi. GitHub Desktop üzerinden Pull işlemini tamamlayın.');
    jobs.push({...entry,files:[entry.videoFile,'cover.jpg','metadata.json'],shared:true,state:'done',stage:'Ortak çalışma videosu',progress:100});
  }
  return jobs;
}
