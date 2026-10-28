import path from 'node:path';
import {rm} from 'node:fs/promises';

export function assertManualExport(options){
  if(!options?.source||options.automatic||(options.strategy&&options.strategy!=='exact')||Number(options.count??1)!==1)
    throw new Error('Otomatik üretim kaldırıldı. Stüdyodaki çalışmanı Video oluştur ile renderla.');
}

// Only new exports opt in. Existing video folders are never removed here.
export function recordDownload(job,{start,end,size}){
  if(!job.transient||job.state!=='done')return;
  const ranges=[...(job.downloadRanges??[]),[start,end]].sort((a,b)=>a[0]-b[0]),merged=[];
  for(const range of ranges){const last=merged.at(-1);if(last&&range[0]<=last[1]+1)last[1]=Math.max(last[1],range[1]);else merged.push([...range]);}
  job.downloadRanges=merged;
  if(merged.length===1&&merged[0][0]===0&&merged[0][1]===size-1)job.downloadedAt??=new Date().toISOString();
}

export async function cleanDownloadedVideo(root,job){
  if(!job.transient||!job.downloadedAt||job.state!=='done')return false;
  // A manually requested YouTube upload still needs its source file.
  if(job.youtube&&job.youtube.state!=='done')return false;
  const base=path.resolve(root),target=path.resolve(base,job.id);
  if(!/^[a-zA-Z0-9-]+$/.test(job.id)||path.dirname(target)!==base)throw new Error('Geçersiz geçici video yolu.');
  await rm(target,{recursive:true,force:true});
  job.state='downloaded';job.stage='İndirildi · Geçici dosya silindi';job.files=[];
  delete job.downloadRanges;
  return true;
}
