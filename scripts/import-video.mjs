import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,stat,rm} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
export async function importVideo(request,{root,mode='track',title='Video'}){
  const type=String(request.headers['content-type']??'').split(';')[0];if(!['video/mp4','video/webm'].includes(type)||!['track','arena','spiral','statistics'].includes(mode))throw new Error('MP4 veya WebM video seçin.');
  const id=randomUUID(),dir=path.resolve(root,id),videoFile=type==='video/webm'?'video.webm':'video.mp4';
  if(path.dirname(dir)!==path.resolve(root))throw new Error('Video klasörü doğrulanamadı.');await mkdir(dir,{recursive:true});
  let bytes=0;
  try{
    await pipeline(request,new Transform({transform(chunk,_encoding,callback){bytes+=chunk.length;if(bytes>1024**3)callback(new Error('Video en fazla 1 GB olabilir.'));else callback(null,chunk);}}),createWriteStream(path.join(dir,videoFile)));
    if(bytes<100)throw new Error('Video dosyası boş veya geçersiz.');
    await new Promise((resolve,reject)=>{const child=spawn(ffmpeg,['-hide_banner','-loglevel','error','-i',path.join(dir,videoFile),'-frames:v','1','-vf','scale=360:-2','-y',path.join(dir,'cover.jpg')],{windowsHide:true,stdio:['ignore','ignore','pipe']});let error='';child.stderr.on('data',d=>error=(error+d).slice(-2000));const timer=setTimeout(()=>child.kill(),60000);child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);code===0?resolve():reject(new Error('Video açılamadı; dosyanın sağlam olduğunu kontrol edin.'));});});
    if((await stat(path.join(dir,'cover.jpg'))).size<100)throw new Error('Video görüntüsü okunamadı.');
    const name=String(title).trim().slice(0,160)||'Video',createdAt=new Date().toISOString();
    await writeFile(path.join(dir,'metadata.json'),JSON.stringify({id,title:name,recipe:{mode},video:{format:type},createdAt},null,2));
    return {id,mode,createdAt,completedAt:createdAt,state:'done',stage:'Hazır',progress:100,copy:{title:name},videoFile,files:[videoFile,'cover.jpg','metadata.json'],options:{channel:'Yüklenen videolar'},github:{state:'queued'}};
  }catch(error){await rm(dir,{recursive:true,force:true});throw error;}
}
