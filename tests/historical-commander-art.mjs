import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import commanders from '../src/historical-commanders.json' with {type:'json'};
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:780,height:690}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__commander-art',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#1b2823;color:#eee;font:13px Arial"><main style="display:grid;grid-template-columns:repeat(3,260px)"></main></body>'}));
  await page.goto('http://127.0.0.1:5173/__commander-art');
  const result=await page.evaluate(async()=>{
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');
    const {COMMANDER_TYPES}=await import('/src/historical-commander-types.js');
    const {COMMANDER_ART_PROFILES}=await import('/src/historical-commander-art.js');
    const lib=new SpriteLibrary(),failures=[],hashes=new Map(),silhouettes=new Map();let frames=0;
    const hash=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',a))).join(',');
    const generic=await hash(lib.get('cavalry',0,0,'idle',0).getContext('2d').getImageData(0,0,240,228).data);
    for(const [type,cfg] of Object.entries(COMMANDER_TYPES)){
      if(!COMMANDER_ART_PROFILES[cfg.commanderId])failures.push(`${type}: profile missing`);
      for(const team of [0,1])for(const action of ['idle','walk','attack'])for(let frame=0;frame<8;frame++){
        const c=lib.get(type,team,frame,action,0),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let pixels=0,clipped=false;
        for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>20){pixels++;if(x===0||y===0||x===c.width-1||y===c.height-1)clipped=true;}
        if(!pixels||clipped)failures.push(`${type}/${team}/${action}/${frame}: ${pixels?'clipped':'empty'}`);
        if(team===0&&action==='idle'&&frame===0){
          const h=await hash(d),alpha=new Uint8Array(c.width*c.height);for(let i=0;i<alpha.length;i++)alpha[i]=d[i*4+3]>=128?1:0;
          const s=await hash(alpha);
          if(h===generic||hashes.has(h)||silhouettes.has(s))failures.push(`${type}: duplicate/generic drawing`);
          hashes.set(h,type);silhouettes.set(s,type);
        }
        frames++;
      }
      const card=document.createElement('section');card.style='height:230px;text-align:center;border:1px solid #475649;box-sizing:border-box';
      const label=document.createElement('p');label.textContent=cfg.name;label.style='margin:8px 0 0';
      const c=document.createElement('canvas');c.width=240;c.height=200;
      c.getContext('2d').drawImage(lib.get(type,0,0,'idle',0),0,0,210,199.5);card.append(label,c);document.querySelector('main').append(card);
      lib.cache.clear();
    }
    return {frames,leaders:hashes.size,failures};
  });
  await fs.mkdir('artifacts/historical-commanders',{recursive:true});
  await page.screenshot({path:'artifacts/historical-commanders/commander-game-art.jpg',type:'jpeg',quality:75,fullPage:true});
  await fs.writeFile('artifacts/historical-commanders/art-checks.json',JSON.stringify(result,null,2));
  await page.setViewportSize({width:800,height:490});
  const portraits=await page.evaluate(async()=>{
    const {commanderPortrait}=await import('/src/historical-commander-art.js');
    const {default:catalogue}=await import('/src/historical-commanders.json');
    document.body.innerHTML='<main style="display:grid;grid-template-columns:repeat(5,160px)"></main>';
    const hashes=new Set();let count=0;
    for(const commander of catalogue.filter(c=>c.portrait==='game')){
      const card=document.createElement('section');card.style='text-align:center;height:245px';
      const name=document.createElement('p');name.textContent=commander.name;name.style='height:28px;margin:4px;font-size:12px';
      const canvas=commanderPortrait(commander.id);canvas.style='width:150px;height:180px';
      card.append(name,canvas);document.querySelector('main').append(card);
      hashes.add(canvas.toDataURL());count++;
    }
    return {count,unique:hashes.size};
  });
  assert.equal(portraits.count,commanders.filter(c=>c.portrait==='game').length);
  assert.equal(portraits.unique,portraits.count,'Each new portrait must be distinct');
  await page.screenshot({path:'artifacts/historical-commanders/new-leader-portraits.jpg',type:'jpeg',quality:75});
  // One close-up and the actual small sprite, beside the already-local reference.
  await page.setViewportSize({width:600,height:290});
  await page.evaluate(async()=>{
    const {SpriteLibrary}=await import('/src/crown-battle-art.js'),lib=new SpriteLibrary();
    document.body.innerHTML='<main style="display:flex;align-items:center;gap:12px;padding:10px"><img src="/warrior-references/elite-kipchak-mask.jpg" style="width:180px;height:200px;object-fit:contain"><section id="mask"></section><section id="unit"></section></main>';
    const s=lib.get('kipchak_masked_swordsman',0,0,'idle',0),c=document.createElement('canvas');c.width=128;c.height=240;
    c.getContext('2d').drawImage(s,74,22,34,64,0,0,128,240);document.querySelector('#mask').append(c);
    const full=document.createElement('canvas');full.width=240;full.height=210;const g=full.getContext('2d');g.drawImage(s,0,0,160,152);g.drawImage(s,155,130,80,76);document.querySelector('#unit').append(full);
    await document.querySelector('img').decode();
  });
  await page.screenshot({path:'artifacts/historical-combat/kipchak-mask-comparison.jpg',type:'jpeg',quality:84});
  assert.deepEqual(result.failures,[]);assert.deepEqual(errors,[]);assert.equal(result.leaders,commanders.length);
  console.log(`PASS: ${result.leaders} distinct leader drawings, ${result.frames} frames; no generic cavalry, identical silhouettes, empty or clipped frames.`);
}finally{await browser.close();}
