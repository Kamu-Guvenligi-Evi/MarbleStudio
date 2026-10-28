import fs from 'node:fs/promises';
const path = 'src/historical-commanders.json';
const data = JSON.parse(await fs.readFile(path, 'utf8'));
const cultures = {
  turkic:'Türkler', german:'Almanlar', english:'İngilizler', french:'Fransızlar',
  italian:'İtalyanlar / Roma', greek:'Yunanlar / Bizans', persian:'Farslar',
  japanese:'Japonlar', chinese:'Çinliler', mongol:'Moğollar', hun:'Hunlar',
  ayyubid:'Eyyûbîler', carthaginian:'Kartacalılar',
};
const existing = {
  mehmed_ii:['turkic','Osmanlı Devleti'], timur:['turkic','Timurlular'], attila:['hun','Avrupa Hun Devleti'],
  genghis_khan:['mongol','Moğol İmparatorluğu'], alexander_great:['greek','Makedonya Krallığı'],
  julius_caesar:['italian','Roma Cumhuriyeti'], alp_arslan:['turkic','Büyük Selçuklu Devleti'],
  saladin:['ayyubid','Eyyûbîler'], hannibal_barca:['carthaginian','Kartaca'],
};
for (const c of data) if (existing[c.id]) {
  const [cultureId, civilization] = existing[c.id];
  Object.assign(c,{cultureId,cultureName:cultures[cultureId],civilizations:[civilization],doctrineIds:c.doctrineIds||[]});
}
const additions = [
  ['georg_frundsberg','Georg von Frundsberg','german','Kutsal Roma İmparatorluğu','1473–1528','16. yüzyıl başları','Landsknecht komutanı','İmparatorluk hizmetinde Alman paralı piyadelerine komuta etti. İtalya savaşlarındaki Landsknecht birlikleriyle tanınır.','DE_PIKE','Deutsche Biographie — Georg von Frundsberg','https://www.deutsche-biographie.de/gnd118536524.html?language=en'],
  ['harold_godwinson','Harold Godwinson','english','Anglosakson İngiltere','Yaklaşık 1022–1066','1066','İngiltere kralı','1066 yılında taç giydi. Hastings Muharebesi sırasında öldü; İngiltere’nin son Anglosakson kralı olarak anılır.','EN_SHIELDWALL','English Heritage — Harold Godwinson','https://production.english-heritage.org.uk/learn/teaching-resources/story-of-1066/collectible-1/'],
  ['charles_vii','VII. Charles','french','Fransa Krallığı','1403–1461','1422–1461','Fransa kralı','1445 tarihli ordonnance ile düzenli süvari bölüklerinin kuruluşunu başlattı. Karttaki taktik, dönem ordusunun oyun uyarlamasıdır; kralın Patay’da şahsen komuta ettiği anlamına gelmez.','FR_OPPORTUNITY','Musée de l’Armée — Le temps des réformes','https://www.musee-armee.fr/ExpoChevaliersBombardes/temps-des-reformes.html'],
  ['francesco_sforza','Francesco Sforza','italian','Milano Dükalığı','1401–1466','1450–1466','Condottiere ve Milano dükü','Paralı asker komutanlığı yaptı; 1450’de Milano dükü oldu. Condotta düzenini temsil eden bir oyun lideridir.','IT_CONDOTTA','The Metropolitan Museum — Francesco Sforza','https://www.metmuseum.org/art/collection/search/191818'],
  ['leonidas','Leonidas','greek','Sparta','Doğum tarihi kesin değil; ö. MÖ 480','Sparta kralı; MÖ 480','Sparta kralı ve komutan','MÖ 480’de Thermopylai’de savaşan Yunan kuvvetlerinin başındaydı. Kendisine atfedilen heykelin kimliği kesin değildir.','GR_HOPLITE','Cambridge Museum of Classical Archaeology — Leonidas','https://museum.classics.cam.ac.uk/collections/casts/leonidas'],
  ['darius_i','I. Darius','persian','Ahameniş İmparatorluğu','Ö. MÖ 486','MÖ 522–486','Ahameniş hükümdarı','Ahameniş İmparatorluğu’nun yönetim yapısını pekiştirdi. Okçu ve mızraklı düzeni, dönem ordusundan esinlenen bir oyun uyarlamasıdır.','PE_ACHAEMENID','The Metropolitan Museum — The Achaemenid Persian Empire','https://www.metmuseum.org/es/essays/the-achaemenid-persian-empire-550-330-b-c'],
  ['takeda_shingen','Takeda Shingen','japanese','Japonya','1521–1573','16. yüzyıl, Sengoku dönemi','Daimyō ve komutan','Kai bölgesinin Sengoku dönemi savaş beyidir. Oyundaki yari ve yumi düzeni dönem uyumlu bir eşleştirmedir; bütün Japon piyade taktiklerinin ona ait olduğu iddia edilmez.','JP_INFANTRY','Kōfu Belediyesi — Takeda Shingen','https://www.city.kofu.yamanashi.jp/mobile/kanko/kanko/spot/shingenko.html'],
  ['qin_shi_huang','Qin Shi Huang','chinese','Qin Hanedanı','MÖ 259–210','MÖ 221–210','Qin imparatoru','Rakip devletlerin birleşmesinden sonra Çin’in ilk imparatoru unvanını aldı. Mezar kompleksindeki terrakotta ordu, dönem donanımı için önemli bir kaynaktır.','CN_QIN','The Metropolitan Museum — Qin Dynasty','https://www.metmuseum.org/essays/qin-dynasty-221-206-b-c'],
  ['qi_jiguang','Qi Jiguang','chinese','Ming Hanedanı','1528–1588','16. yüzyıl','Ming generali ve askerî yazar','Kıyı savunması ve birlik eğitimiyle tanınır. Jixiao Xinshu adlı askerî eserindeki küçük birlik düzenleri, oyunun Ming taktiğine kaynaklık eder.','CN_MING','Jixiao Xinshu — birinci bölüm','https://zh.wikisource.org/zh/紀效新書/卷一'],
  ['nikephoros_ii_phokas','II. Nikephoros Phokas','greek','Bizans İmparatorluğu','Yaklaşık 912–969','963–969','Bizans imparatoru ve komutan','10. yüzyılda komutanlık yaptı ve 963’te imparator oldu. Bu kart, oyundaki Orta Bizans birlikleriyle aynı dönemi temsil eder.',null,'John Skylitzes — Nikephoros II Phokas, 963–969','https://www.cambridge.org/core/books/abs/john-skylitzes-a-synopsis-of-byzantine-history-8111057/nikephoros-ii-phokas-963969/A10D19D2B1355F11D9E9D6D87C568CA8'],
];
for (const [id,name,cultureId,faction,life,rule,role,historicalNote,doctrine,title,url] of additions) {
  if (data.some(c => c.id === id)) continue;
  data.push({id,name,cultureId,cultureName:cultures[cultureId],faction,civilizations:[faction],doctrineIds:doctrine?[doctrine]:[],life,rule,role,historicalNote,
    portrait:'game',sources:[{title,url}],credit:'Marble Studio — yerel oyun çizimi',
    visualNote:'Dönem donanımından esinlenen stilize oyun tasviri; doğrulanmış yüz portresi değildir. Atlı gösterim ortak komutan sınıfının oyun tercihidir.',
    license:'Proje içinde üretilen özgün Canvas çizimi; dış görsel kullanılmadı.'});
}
await fs.writeFile(path,JSON.stringify(data,null,2)+'\n');
console.log(`${data.length} commanders updated.`);
