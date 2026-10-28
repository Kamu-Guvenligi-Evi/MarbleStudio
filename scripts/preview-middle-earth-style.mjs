import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const tag=process.argv[2]||'current';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage();
 await page.route('**/style-preview',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#30443b"></body>'}));
 await page.goto('http://127.0.0.1:5173/style-preview');
 await page.evaluate(async poses=>{
  await(await import('/src/middle-earth-painted-art.js')).middleEarthArtReady;
  const {SpriteLibrary}=await import('/src/crown-battle-art.js');
  const {UNIT_TYPES}=await import('/src/crown-battle.js');
  const lib=new SpriteLibrary(),c=document.createElement('canvas');c.width=900;c.height=poses?660:440;document.body.append(c);
  const g=c.getContext('2d');g.fillStyle='#30443b';g.fillRect(0,0,c.width,c.height);
  const entries=poses?['me_aragorn','me_legolas','me_gimli'].flatMap(id=>[['idle',0],['walk',2],['attack',4],['attack',4,true]].map(([action,frame,mirror])=>({id,action,frame,mirror}))):['viking','samurai','janissary','me_aragorn','me_legolas','me_gimli'].map(id=>({id,action:'idle',frame:0}));
  const cols=poses?4:3,width=c.width/cols;
  for(const [i,{id,action,frame,mirror}]of entries.entries()){
   const x=i%cols*width+width/2,y=Math.floor(i/cols)*220+180,s=UNIT_TYPES[id].visualScale||1;
   g.save();g.translate(x,y);g.scale(s*3.3*(mirror?-1:1),s*3.3);g.drawImage(lib.get(id,0,frame,action,0),-30,-61,80,76);g.restore();
   g.fillStyle='#eee8d4';g.font='14px sans-serif';g.textAlign='center';g.fillText(`${UNIT_TYPES[id].name}${poses?' / '+action+(mirror?' ←':' →'):''}`,x,y+28);
  }
 },process.argv.includes('--poses'));
 await fs.mkdir('artifacts/middle-earth',{recursive:true});
 const path=`artifacts/middle-earth/style-${tag}.jpg`;
 await page.locator('canvas').screenshot({path,type:'jpeg',quality:85});
 console.log(path);
}finally{await browser.close();}
