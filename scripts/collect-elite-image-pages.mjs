import fs from 'node:fs/promises';
const dir='artifacts/elite-visual-research';
await fs.mkdir(dir,{recursive:true});
for(const title of process.argv.slice(2)){
 const file=dir+'/'+title.replace(/[^a-z0-9_-]/gi,'_')+'.html';
 let html;try{html=await fs.readFile(file,'utf8')}catch{
  const r=await fetch('https://commons.wikimedia.org/wiki/'+encodeURIComponent(title.replaceAll(' ','_')),{signal:AbortSignal.timeout(20000)});
  if(!r.ok){console.log(title+': HTTP '+r.status);continue;}
  html=await r.text();await fs.writeFile(file,html);
 }
 const names=[...html.matchAll(/href="\/wiki\/(File:[^"]+)"/g)].map(x=>decodeURIComponent(x[1]).replaceAll('_',' '));
 console.log(JSON.stringify({title,files:[...new Set(names)].filter(x=>!/^File:(Commons|Wikimedia|OOjs|Symbol|Info|Question|Lock|PD-|Ambox|Wikidata|Nuvola|Crystal|CC|Cc|Gnome|Wikipedia)/.test(x)).slice(0,45)}));
}
