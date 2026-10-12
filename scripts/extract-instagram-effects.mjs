import {mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

// Local source only: no network downloads or source-separation model required.
const source=process.argv[2]??'artifacts/instagram-DeUvaLwMp3o-audio.mp4';
const folder='public/audio/instagram-DeUvaLwMp3o';
const regions=[[2.925,3.596],[4.826,5.922],[9.357,10.524],[13.353,14.746],[14.793,15.997],[51.16,53.072]];
mkdirSync(folder,{recursive:true});
const clips=regions.map(([start,end],i)=>{
  const duration=end-start,id=`effect-${i+1}`,file=`${id}.wav`;
  const filter=`afade=t=in:d=0.008,afade=t=out:st=${duration-.02}:d=0.02,alimiter=limit=0.85:level=false`;
  const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(start),'-i',source,'-t',String(duration),'-vn','-ac','1','-ar','24000','-af',filter,'-c:a','pcm_s16le','-y',`${folder}/${file}`],{encoding:'utf8'});
  if(result.status!==0)throw new Error(result.stderr||'Audio extraction failed');
  return {id,file,start,end,duration};
});
writeFileSync(`${folder}/source.json`,JSON.stringify({source:'https://www.instagram.com/p/DeUvaLwMp3o/',method:'Clips cut at silence boundaries; overlapping sounds within a clip have not been isolated into stems.',clips},null,2)+'\n');
console.log(`Extracted ${clips.length} clips (${clips.reduce((sum,c)=>sum+c.duration,0).toFixed(2)} seconds).`);
