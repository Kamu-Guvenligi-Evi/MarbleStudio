import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1260,height:1120}});
 if(process.argv.includes('--fallback'))await page.route('**/warrior-sprites/middle-earth/*.webp',r=>r.abort());
 await page.route('**/size-audit',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#30443b"></body>'}));
 await page.goto('http://127.0.0.1:5173/size-audit');
 const result=await page.evaluate(async(quick)=>{
  await(await import('/src/middle-earth-painted-art.js')).middleEarthArtReady;
  const {SpriteLibrary}=await import('/src/crown-battle-art.js');
  const {BattleSpriteCache}=await import('/src/crown-battle-sprite-cache.js');
  const {UNIT_TYPES}=await import('/src/crown-battle.js');
  const {MIDDLE_EARTH_UNITS}=await import('/src/middle-earth-units.js');
  const ids=['samurai','janissary','spartan','viking','varangian','kipchak','cavalry',...MIDDLE_EARTH_UNITS.map(u=>u.id)].filter(id=>UNIT_TYPES[id]);
  const lib=new SpriteLibrary(),cache=new BattleSpriteCache(),out={};
  const c=document.createElement('canvas');c.width=1260;c.height=Math.ceil(ids.length/7)*175;document.body.append(c);
  const g=c.getContext('2d');g.fillStyle='#30443b';g.fillRect(0,0,c.width,c.height);
  for(const [i,id]of ids.entries()){
   const s=UNIT_TYPES[id].visualScale||1,source=lib.get(id,0,0,'idle',0),b=cache.boundsOf(source);
   const h=(b.bottom-b.top)*s,w=(b.right-b.left)*s;
   const ranges=[];
   for(const action of quick?['idle']:['idle','walk','attack'])for(let f=0;f<(quick?1:8);f++){
    const bb=cache.boundsOf(lib.get(id,0,f,action,0));ranges.push((bb.bottom-bb.top)*s);
   }
   out[id]={h,w,scale:s,base:b.bottom-b.top,min:Math.min(...ranges),max:Math.max(...ranges)};
   const x=i%7*180+80,y=Math.floor(i/7)*175+140;
   g.fillStyle='#82917b';g.fillRect(x-75,y+1,150,1);
   g.save();g.translate(x,y);g.scale(s*.85,s*.85);g.drawImage(source,-30,-61,80,76);g.restore();
   g.fillStyle='#efe8cf';g.font='11px sans-serif';g.fillText(id.replace('me_',''),x-75,y+16);g.fillText(`${h.toFixed(1)} x ${w.toFixed(1)}`,x-75,y+29);
  }return out;
 },process.argv.includes('--quick'));
 const tag=process.argv[2]||'before';
 await fs.writeFile(`artifacts/middle-earth/size-audit-${tag}.json`,JSON.stringify(result,null,2));
 await page.locator('canvas').screenshot({path:`artifacts/middle-earth/size-audit-${tag}.jpg`,type:'jpeg',quality:80});
 console.log(Object.entries(result).map(([id,v])=>`${id}: ${v.h.toFixed(1)}x${v.w.toFixed(1)} max=${v.max.toFixed(1)}`).join('\n'));
}finally{await browser.close();}
