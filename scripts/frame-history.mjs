import fs from 'node:fs/promises';
const path='public/catalog/manifest.json',m=JSON.parse(await fs.readFile(path,'utf8'));
// Normalized image coordinates: center x/y and square width. Art is not altered.
const frames={
 'Mimar Sinan':[.52,.32,.65],'Hacı Bektaş Veli':[.39,.31,.25],
 'Jeanne d’Arc':[.46,.24,.70],'Nene Hatun':[.51,.30,.60],
 'Yunus Emre':[.43,.27,.65],'Augustus':[.54,.16,.65],
 'Melikşah':[.52,.33,.32],'Yıldırım Bayezid':[.45,.40,.60],
 'Konfüçyüs':[.57,.40,.65],'Şah İsmail':[.40,.40,.65],
 'Büyük Kiros':[.48,.30,.65],'İbn Battuta':[.44,.32,.65],
 'Ekber Şah':[.48,.23,.65],'Ömer Hayyam':[.53,.24,.65],
 'Hatşepsut':[.50,.23,.75],'Marcus Aurelius':[.50,.25,.75],
 'Barbaros Hayreddin Paşa':[.48,.25,.70],'Uluğ Bey':[.48,.24,.80],
 'Isaac Newton':[.50,.26,.75],'Büyük Petro':[.51,.28,.65],
 'Johannes Kepler':[.46,.23,.65],'Johann Sebastian Bach':[.50,.25,.75],
 'Fyodor Dostoyevski':[.55,.30,.70],'Rabindranath Tagore':[.52,.25,.70],
};
const fields={
 'Mustafa Kemal Atatürk':'Türkiye · devlet insanı', 'Fatih Sultan Mehmet':'Osmanlı · hükümdar',
 'Kanuni Sultan Süleyman':'Osmanlı · hükümdar', 'Napolyon Bonapart':'Fransa · komutan ve hükümdar',
 'Jül Sezar':'Roma · devlet insanı', 'Büyük İskender':'Makedonya · komutan ve hükümdar',
 'Cengiz Han':'Moğolistan · hükümdar', 'Kleopatra':'Mısır · hükümdar',
 'Kraliçe Victoria':'İngiltere · hükümdar','Abraham Lincoln':'ABD · devlet insanı',
 'Albert Einstein':'Almanya · fizikçi ve bilim insanı','Nikola Tesla':'Sırp · mucit ve elektrik mühendisi',
 'Isaac Newton':'İngiltere · fizikçi ve matematikçi','Marie Curie':'Polonya · kimyager ve fizikçi',
 'Leonardo da Vinci':'İtalya · ressam ve mucit','İbn Sina':'Orta Asya · hekim ve filozof',
};
for(const item of m.items.filter(x=>x.category==='history')){
 if(frames[item.name])item.portraitFrame=frames[item.name];
 if(fields[item.name]){item.historicalNote=fields[item.name];item.keywords=fields[item.name];}
 await fs.writeFile('public/catalog/'+item.id+'.json',JSON.stringify(item,null,2)+'\n');
}
await fs.writeFile(path,JSON.stringify(m,null,2)+'\n');
console.log('History descriptions and portrait framing updated.');
