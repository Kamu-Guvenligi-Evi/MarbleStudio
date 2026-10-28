import fs from 'node:fs';
const researchPath='docs/historical-elite-research-2026-10-14.json';
const visualsPath='src/historical-unit-visuals.json';
const research=JSON.parse(fs.readFileSync(researchPath,'utf8'));
const visuals=JSON.parse(fs.readFileSync(visualsPath,'utf8'));
const sources={
  kipchak_helmets:{title:'Samet İkibeş — Kuman/Kıpçak Miğferleri (2025)',url:'https://dergipark.org.tr/en/pub/turkiyat/article/1598769',kind:'akademik araştırma'},
  kipchak_weapons:{title:'Yazgı Tuğçe Kurt Öteleş — Codex Cumanicus askerî terminolojisi (2023)',url:'https://dergipark.org.tr/tr/pub/turklad/article/1366953',kind:'akademik araştırma'},
  kipchak_mask_photo:{title:'Jim Kelly — Mysterious Mask, Saint Petersburg Museum (2009)',url:'https://commons.wikimedia.org/wiki/File:Mysterious_Mask,_Saint_Petersburg_Museum.jpg',kind:'müze nesnesi fotoğrafı; CC BY 2.0'},
};
for(const [id,source]of Object.entries(sources))research.sources[id]={...source,access:'2026-10-14'};
const unit={id:'kipchak_masked_swordsman',faction:'Kıpçak / Kuman',name:'Maskeli Kıpçak kılıçlısı',period:'12.–14. yy; buluntu atıfları tartışmalı',kind:'zırhlı süvarinin oyun temsili',mount:'horse',status:'ana',historicalNote:'Kıpçak soylularının ağır süvarileri ve yüz maskeli miğfer buluntularından esinlenen yakın dövüş temsili. Bu adla belgelenmiş müstakil bir alay değildir. Maskelerin Kıpçak veya Altın Orda atfı, tarihlemesi ve savaşta mı törende mi kullanıldığı tartışmalıdır.',equipmentDraft:'Konik miğfer, insan yüzlü bıyıklı metal maske, zincir zırh, eğri kılıç, yuvarlak kalkan; atlı yakın dövüş. Birleştirilen donanım bir rekonstrüksiyon yorumudur.',sourceIds:['kipchak_helmets','kipchak_weapons'],visualSourceIds:['kipchak_mask_photo']};
const index=research.units.findIndex(x=>x.id===unit.id);if(index<0)research.units.push(unit);else research.units[index]=unit;
visuals[unit.id]={image:'/warrior-references/elite-kipchak-mask.jpg',credit:sources.kipchak_mask_photo.title,source:sources.kipchak_mask_photo.url,visualNote:'Lipovets kökenli yüz maskeli miğferin müze fotoğrafı. Yalnız baş donanımı için referans; bütün savaşçı kıyafetini göstermez. Tarihleme ve kültürel atıf tartışmalıdır. Oyun çizimi özgün ve stilizedir.',license:'Jim Kelly, CC BY 2.0 — https://creativecommons.org/licenses/by/2.0/. Commons üzerinden 330 piksel önizleme; yalnız boyutlandırılmıştır.'};
fs.writeFileSync(researchPath,JSON.stringify(research,null,2)+'\n');fs.writeFileSync(visualsPath,JSON.stringify(visuals,null,2)+'\n');
console.log('Kipchak melee cavalry, three sources, local image and attribution added.');
