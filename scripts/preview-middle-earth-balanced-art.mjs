import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const targets=JSON.parse(await fs.readFile('artifacts/middle-earth/before-balanced-style/size-checks.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1080,height:870}});
 await page.route('**/balanced-art-preview',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#30443b"></body>'}));
 await page.goto('http://127.0.0.1:5173/balanced-art-preview');
 await page.evaluate(async targets=>{
  const{stylizedMiddleEarthSprite}=await import('/src/middle-earth-stylized-base.js');
  const{MIDDLE_EARTH_UNITS}=await import('/src/middle-earth-units.js');
  const{SpriteLibrary}=await import('/src/crown-battle-art.js');const lib=new SpriteLibrary();
  const ids=['viking','kipchak',...MIDDLE_EARTH_UNITS.map(u=>u.id)];
  const c=document.createElement('canvas');c.width=1080;c.height=1040;document.body.append(c);const g=c.getContext('2d');
  g.fillStyle='#30443b';g.fillRect(0,0,c.width,c.height);
  for(const[i,id]of ids.entries()){
   const s=id.startsWith('me_')?stylizedMiddleEarthSprite(id,0,0,'idle'):lib.get(id,0,0,'idle',0);
   const data=s.getContext('2d').getImageData(0,0,s.width,s.height).data;let t=s.height,b=0;
   for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)if(data[(y*s.width+x)*4+3]>24){t=Math.min(t,y);b=Math.max(b,y+1);}
   const height=targets[id].height,scale=Math.min(height*1.9,112)/(b-t),x=i%6*180+78,y=Math.floor(i/6)*145+117;
   g.fillStyle='#71816b';g.fillRect(x-65,y+2,140,1);
   g.drawImage(s,x-s.width*30/80*scale,y-s.height*61/76*scale,s.width*scale,s.height*scale);
   g.fillStyle='#f0e7d1';g.font='12px sans-serif';g.fillText(id.replace('me_','').replaceAll('_',' '),x-65,y+22);
  }
 },targets);
 await page.locator('canvas').screenshot({path:'artifacts/middle-earth/balanced-source-preview.jpg',type:'jpeg',quality:83});
 console.log('Saved balanced-source-preview.jpg; giant display heights capped for this detail sheet.');
}finally{await browser.close();}
