import {chromium} from 'playwright';
const b=await chromium.launch({channel:'chrome',headless:true});
try{const p=await b.newPage({viewport:{width:1000,height:1000}});await p.route('**/api/matches?**',r=>r.fulfill({json:{events:[]}}));await p.goto('http://127.0.0.1:5173');await p.evaluate(async()=>{
const names=['Mimar Sinan','Hacı Bektaş Veli','Jeanne d’Arc','Nene Hatun','Yunus Emre','Augustus','Melikşah','Yıldırım Bayezid','Konfüçyüs','Şah İsmail','Büyük Kiros','İbn Battuta'];
const m=await(await fetch('/catalog/manifest.json')).json(),s=document.createElement('canvas');s.width=1000;s.height=750;const c=s.getContext('2d');c.fillStyle='#aaa';c.fillRect(0,0,1000,750);
for(let i=0;i<names.length;i++){const a=m.items.find(x=>x.name===names[i]),im=new Image();im.src=a.src;await im.decode();const x=i%4*250,y=Math.floor(i/4)*250,scale=Math.min(230/im.width,220/im.height);c.drawImage(im,x,y,im.width*scale,im.height*scale);c.fillStyle='black';c.font='13px sans-serif';c.fillText(names[i],x,y+240);}s.id='framing';document.body.append(s);
});await p.locator('#framing').screenshot({path:'artifacts/history-framing.png'});}finally{await b.close();}
