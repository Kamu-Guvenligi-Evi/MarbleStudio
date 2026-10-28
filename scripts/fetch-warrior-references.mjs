import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const units=JSON.parse(await fs.readFile('src/historical-units.json','utf8'));
units.push({id:'kipchak-alternate',image:'/warrior-references/kipchak.jpg',remote:'https://i.pinimg.com/736x/a5/76/87/a57687aa6adeff4ad401b9978977bebf.jpg'});
await fs.mkdir('public/warrior-references',{recursive:true});
for(const u of units){
 const dest='public'+u.image;
 try{await fs.access(dest);console.log(u.id+': cached');continue;}catch{}
 try{
  const r=await fetch(u.remote,{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'Mozilla/5.0'}});
  if(!r.ok)throw Error('HTTP '+r.status);
  if(Number(r.headers.get('content-length'))>2000000){await r.body.cancel();throw Error('over 2 MB cap');}
  let size=0;const chunks=[];for await(const b of r.body){size+=b.length;if(size>2000000)throw Error('over cap');chunks.push(b);}
  const tmp=dest+'.tmp';await fs.writeFile(tmp,Buffer.concat(chunks));
  const p=spawnSync('node_modules/ffmpeg-static/ffmpeg.exe',['-y','-v','error','-i',tmp,'-vf','scale=640:640:force_original_aspect_ratio=decrease','-frames:v','1','-q:v','5',dest],{encoding:'utf8'});
  await fs.rm(tmp);if(p.status!==0)throw Error(p.stderr.slice(0,180));
  console.log(u.id+': '+(await fs.stat(dest)).size+' local bytes');
 }catch(e){console.log(u.id+': FAILED '+e.message);}
}
