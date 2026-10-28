import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {MERGE_IMAGES} from '../src/merge-image-manifest.js';
const dir='public/merge-art';await fs.mkdir(dir,{recursive:true});
const names=['Piyon','At','Fil','Kale','Vezir','Şah'];
MERGE_IMAGES.chess=[];
for(const [i,piece] of ['P','N','B','R','Q','K'].entries()){
 const src=`/merge-art/chess-w${piece}.svg`,url=`https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/w${piece}.svg`;
 try{await fs.access('public'+src);}catch{const r=await fetch(url);if(!r.ok)throw Error(`${piece}: ${r.status}`);const svg=await r.text();if(!svg.includes('<svg'))throw Error('Invalid SVG');await fs.writeFile('public'+src,svg);}
 MERGE_IMAGES.chess.push({src,subject:names[i],source:'https://github.com/lichess-org/lila/tree/master/public/piece/cburnett',file:'Colin M. L. Burnett — CC BY-SA 3.0',cutout:true});
}
// Extract the supplied recording's actual symbols, not unrelated character photos.
const video='C:/Users/yigit/Videos/Ekran Kayıtları/Ekran Kaydı 2026-10-28 112031.mp4';
const crops=[['skull',45,250,92,36,36],['lantern',45,307,342,54,54],['spider',45,400,352,60,60],['batman',45,140,342,82,82],['iron',45,80,434,100,100],['hulk',45,159,485,126,126],['superman',50,283,413,161,201],['gauntlet',58,109,369,252,252]];
MERGE_IMAGES.reference=crops.map(([id,time,x,y,w,h],i)=>{
 const src=`/merge-art/reference-${id}.png`;
 execFileSync('node_modules/ffmpeg-static/ffmpeg.exe',['-hide_banner','-loglevel','error','-ss',String(time),'-i',video,'-frames:v','1','-vf',`crop=${w}:${h}:${x}:${y}`,'-y','public'+src]);
 return {src,subject:id,source:'',file:'Kullanıcının referans videosu',reference:true};
});
await fs.writeFile('src/merge-image-manifest.js','// Local artwork and source credits.\nexport const MERGE_IMAGES='+JSON.stringify(MERGE_IMAGES,null,2)+';\n');
console.log('6 transparent chess pieces and 8 reference symbols installed.');
