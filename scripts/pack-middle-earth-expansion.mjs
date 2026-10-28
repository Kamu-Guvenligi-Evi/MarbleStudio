// Technical sprite-sheet slicing: isolate six connected poses, retain their
// antialiased edges, and pack at one shared scale with aligned ground contacts.
// No creative redraws; source sheets remain unchanged in artifacts.
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const ground=process.argv.includes('--ground');
const heroes=process.argv.includes('--heroes');
const single=process.argv.find(a=>a.startsWith('--only='))?.slice(7);
const names=single?[single]:heroes?['aragorn','legolas','gimli']:ground?['theoden','eomer','boromir','faramir','saruman','thranduil','haldir','dain','shelob','mumakil']:['elrond','ent','nazgul','rohirrim','gondor-cavalry','dwarf-ram-rider','elf-stag-rider','azog-warg'];
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');
 const report={};
 for(const name of names){
  const result=await page.evaluate(async name=>{
   const image=new Image();image.src=`/artifacts/middle-earth/source/${name}.png`;await image.decode();
   const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
   const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
   const w=c.width,h=c.height,data=g.getImageData(0,0,w,h),seen=new Uint8Array(w*h),parts=[];
   for(let i=0;i<seen.length;i++)if(!seen[i]&&data.data[i*4+3]>40){
    const pixels=[i];seen[i]=1;let left=w,right=0,top=h,bottom=0;
    for(let k=0;k<pixels.length;k++){const p=pixels[k],x=p%w,y=Math.floor(p/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
     for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,p-w,p+w])if(n>=0&&n<seen.length&&!seen[n]&&data.data[n*4+3]>40){seen[n]=1;pixels.push(n);}
    }
    if(pixels.length>10000)parts.push({pixels,left,right,top,bottom});
   }
   if(parts.length!==6)throw Error(`${name}: expected 6 separate poses, found ${parts.length}`);
   parts.sort((a,b)=>((a.top<400?0:1)-(b.top<400?0:1))||a.left-b.left);
   const scale=Math.min(...parts.map((p,i)=>Math.min(216/Math.max(Math.abs(p.left-i%3*512-256),Math.abs(p.right-i%3*512-256)),406/(p.bottom-p.top))));
   const atlas=document.createElement('canvas');atlas.width=1536;atlas.height=1024;const ag=atlas.getContext('2d');
   for(const [i,p]of parts.entries()){
    // A small gutter around each connected pose keeps original edge alpha while
    // excluding the neighboring pose where long swords cross the nominal grid.
    const mask=new Uint8Array(w*h);
    for(const n of p.pixels){const x=n%w,y=Math.floor(n/w);for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h)mask[yy*w+xx]=1;}}
    const isolated=g.createImageData(w,h);
    for(let n=0;n<mask.length;n++)if(mask[n])isolated.data.set(data.data.subarray(n*4,n*4+4),n*4);
    g.putImageData(isolated,0,0);
    ag.save();ag.beginPath();ag.rect(i%3*512,Math.floor(i/3)*512,512,512);ag.clip();
    ag.translate(i%3*512+256,Math.floor(i/3)*512+450);ag.scale(scale,scale);
    ag.drawImage(c,-(i%3*512+256),-p.bottom);ag.restore();
   }
   const portrait=document.createElement('canvas');portrait.width=portrait.height=384;
   portrait.getContext('2d').drawImage(atlas,0,0,512,512,0,0,384,384);
   return {sheet:atlas.toDataURL('image/webp',.9).split(',')[1],portrait:portrait.toDataURL('image/webp',.88).split(',')[1],scale,rects:parts.map(p=>[p.left,p.top,p.right,p.bottom])};
  },name);
  const sheet=Buffer.from(result.sheet,'base64'),portrait=Buffer.from(result.portrait,'base64');
  await fs.writeFile(`public/warrior-sprites/middle-earth/${name}.webp`,sheet);
  await fs.writeFile(`public/warrior-sprites/middle-earth/${name}-portrait.webp`,portrait);
  report[name]={bytes:sheet.length,portraitBytes:portrait.length,scale:result.scale,rects:result.rects};
 }
 await fs.writeFile(`artifacts/middle-earth/${single|| (heroes?'heroes':ground?'ground':'expansion')}-pack.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([name,v])=>[name,{bytes:v.bytes,scale:v.scale}]))));
}finally{await browser.close()}
