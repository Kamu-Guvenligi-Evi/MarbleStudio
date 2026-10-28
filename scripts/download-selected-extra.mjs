import fs from 'node:fs/promises';
const subjects=['mercury','venus','saturn','uranus','neptune','ukulele','mandolin','clarinet','trumpet','tuba','harp','viola','double-bass','cymbal','bongo','timpani','marimba','medieval-helmet'];
const report=[];
for(const slug of subjects){const file=`public/merge-cutouts/extra-${slug}.png`;try{await fs.access(file);continue;}catch{}try{const source=`https://pnggallery.com/${slug}/`;const r=await fetch(source,{signal:AbortSignal.timeout(15000)});if(!r.ok){console.log(slug,r.status);continue;}const html=await r.text();const urls=[...new Set(html.match(/https:\/\/pnggallery\.com\/wp-content\/uploads\/[^"\s<>]+\.png/g)||[])];const url=urls.find(u=>u.endsWith(`/${slug}-01.png`))||urls.find(u=>u.endsWith(`/${slug}.png`));if(!url){console.log(slug,'no asset');continue;}let img=await fetch(url,{signal:AbortSignal.timeout(20000)});if(img.ok){const b=Buffer.from(await img.arrayBuffer());await fs.writeFile(file,b);report.push({slug,source,url,bytes:b.length});console.log(slug,b.length);}}catch(e){console.log(slug,e.message);}}
await fs.writeFile('artifacts/selected-extra-sources.json',JSON.stringify(report,null,2));

