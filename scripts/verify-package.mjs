import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(process.argv[2]??fileURLToPath(new URL('../',import.meta.url)));
const json=async file=>JSON.parse((await readFile(path.join(root,file),'utf8')).replace(/^\uFEFF/,''));
const required=['index.html','factory.html','factory-render.html','spiral-breaker.html','glass-breaker.html','ball-duel.html','Baslat.cmd','Start-Studio.ps1','vite.config.js','public/catalog/legacy-padding.json','public/music/countries.json','public/music/people.json'];
const catalog=await json('public/catalog/manifest.json');
if(!catalog.items?.length||!catalog.categories?.length)throw new Error('Görsel kütüphanesi boş.');
const music=await json('public/music/manifest.json');
const statistics=await json('public/statistics/manifest.json');
for(const src of [...catalog.items.map(i=>i.src),...music.map(i=>i.src),...statistics.items.map(i=>i.csv)]){
  if(!src.startsWith('/')||src.includes('..'))throw new Error('Geçersiz paket dosyası: '+src);
  required.push('public'+src);
}
for(const file of new Set(required)){
  if(!(await stat(path.join(root,file))).isFile())throw new Error('Paket dosyası eksik: '+file);
}
console.log(`PASS: all game pages, ${catalog.items.length} images, ${music.length} music files and ${statistics.items.length} datasets are present.`);
