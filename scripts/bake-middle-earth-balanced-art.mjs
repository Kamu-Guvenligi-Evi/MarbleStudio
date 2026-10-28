// Local, deterministic native-canvas art. No network images or extra dependencies.
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const directory='public/warrior-sprites/middle-earth';
const backup='artifacts/middle-earth/before-balanced-style';
await fs.mkdir(backup,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.route('**/balanced-art-bake',r=>r.fulfill({contentType:'text/html',body:'<body></body>'}));
 await page.goto('http://127.0.0.1:5173/balanced-art-bake');
 const ids=await page.evaluate(async()=>(await import('/src/middle-earth-units.js')).MIDDLE_EARTH_UNITS.map(u=>u.id));
 const metadata={};let total=0;
 for(const id of ids){
  const result=await page.evaluate(async id=>{
   const {stylizedMiddleEarthSprite}=await import('/src/middle-earth-stylized-base.js');
   const poses=[['idle',0],['walk',2],['walk',6],['attack',2],['attack',4],['attack',6]];
   // Draw paths at final export density; never enlarge a small raster sprite.
   const sources=poses.map(([a,f])=>stylizedMiddleEarthSprite(id,0,f,a,{density:9}));
   const bounds=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let l=c.width,t=c.height,r=0,b=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>24){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);}return{l,t,r,b};};
   const boxes=sources.map(s=>Object.fromEntries(Object.entries(bounds(s)).map(([k,v])=>[k,v/3]))),b={l:Math.min(...boxes.map(b=>b.l)),t:Math.min(...boxes.map(b=>b.t)),r:Math.max(...boxes.map(b=>b.r)),b:Math.max(...boxes.map(b=>b.b))};
   if(b.l<2||b.r>238||b.t<2||b.b>226)throw Error(`${id}: raw silhouette reaches edge ${JSON.stringify(b)}`);
   const factor=Math.min(230/Math.max(90-b.l,1),230/Math.max(b.r-90,1),430/Math.max(183-b.t,1),48/Math.max(b.b-183,1),370/(boxes[0].b-boxes[0].t));
   const sheet=document.createElement('canvas');sheet.width=1536;sheet.height=1024;const g=sheet.getContext('2d');
   sources.forEach((s,i)=>g.drawImage(s,(i%3)*512+256-90*factor,Math.floor(i/3)*512+450-183*factor,s.width*factor/3,s.height*factor/3));
   const portrait=document.createElement('canvas');portrait.width=portrait.height=360;
   portrait.getContext('2d').drawImage(sheet,0,0,512,512,0,0,360,360);
   const url=sheet.toDataURL('image/webp',.94);
   const {VISUAL_SCALES}=await import('/src/middle-earth-visual-profiles.js');
   const density=VISUAL_SCALES[id]>1.5?6:3;
   const runtime=stylizedMiddleEarthSprite(id,0,0,'idle',{density,scale:factor*58/512*3});
   // Include SpriteLibrary's fixed edge shadow in the same historical size metric.
   const framed=document.createElement('canvas');framed.width=runtime.width;framed.height=runtime.height;
   const fg=framed.getContext('2d');fg.shadowColor='#12231ed9';fg.shadowBlur=2;fg.shadowOffsetX=1;fg.shadowOffsetY=2;fg.drawImage(runtime,0,0);
   const pixels=fg.getImageData(0,0,framed.width,framed.height).data;let top=framed.height,bottom=0;
   for(let y=0;y<framed.height;y++)for(let x=0;x<framed.width;x++)if(pixels[(y*framed.width+x)*4+3]){top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
   return{sheet:url.split(',')[1],portrait:portrait.toDataURL('image/webp',.94).split(',')[1],factor,bounds:b,baseHeight:(bottom-top)/density};
  },id);
  const name=id.slice(3).replaceAll('_','-');
  for(const[key,suffix]of [['sheet',''],['portrait','-portrait']]){
   const file=`${name}${suffix}.webp`;
   try{await fs.copyFile(`${directory}/${file}`,`${backup}/${file}`,fs.constants.COPYFILE_EXCL);}catch(e){if(!['EEXIST','ENOENT'].includes(e.code))throw e;}
   const data=Buffer.from(result[key],'base64');await fs.writeFile(`${directory}/${file}`,data);total+=data.length;
  }
  metadata[id]={file:name,factor:result.factor,bounds:result.bounds,baseHeight:result.baseHeight};
 }
 await fs.writeFile('artifacts/middle-earth/balanced-bake.json',JSON.stringify(metadata,null,2));
 console.log(`Baked ${ids.length} six-pose sheets + portraits; ${total} local bytes (not network traffic).`);
}finally{await browser.close();}
