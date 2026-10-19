// Equipment is reconstructed from the cited objects/texts, not a universal uniform.
const mingManual = 'https://zh.wikisource.org/zh/紀效新書/卷十一';
const mingImages = 'https://tplafightingwords.com/2021/09/02/shield-wubei-zhi-%E7%89%8C%EF%BC%9A%E6%AD%A6%E5%82%99%E5%BF%97/';
export const FRONTIER_WARRIOR_UNITS = [
  {
    id: 'byzantine_kataphraktos', name: 'Bizans katafraktı', faction: 'Bizans İmparatorluğu',
    period: '10. yy ikinci yarısı–11. yy başı', kind: 'cavalry', role: 'Topuzlu ağır hücum süvarisi', color: '#865044',
    note: 'Nikephoros Phokas ve Nikephoros Ouranos askerî metinlerindeki katafraktların topuzlu temsili. Binicide lamelli zırh, kalın dış giysi, kol ve etek korumaları; atta deri ve keçe koruma kullanılır. Aynı düzen içinde mızraklı ve okçular da bulunabilirdi; bu kayıt topuzlu savaşçıyı temsil eder. Oyunda tarihî kama düzeni için ayrı bir komut bulunmaz.',
    source: 'https://ebrary.net/242454/sociology/analysis_sources_archaeology',
    sources: [
      { title: 'Nikephoros Ouranos, Taktika — zırh tarifi; arkeolojik bulgularla karşılaştırma ve şekil 14.17', url: 'https://ebrary.net/242454/sociology/analysis_sources_archaeology' },
      { title: 'K. Sinclair, War Writing in Middle Byzantine Historiography — s. 144, not 734; Taktika 61 ve Praecepta III topuz tarifi', url: 'https://etheses.bham.ac.uk/3977/1/Sinclair13PhD.pdf' },
    ],
    credit: 'Ouranos zırh tarifi ve Graham Sumner rekonstrüksiyonuyla karşılaştırılan özgün çizim',
    visualNote: 'Şekil 14.17 modern ve varsayımsal bir rekonstrüksiyondur. Giysi renkleri ve topuz başı biçimi yorumdur. Atın örtüsü metal levha gibi değil, kaynakta anılan deri parçalı koruma seçeneğiyle çizildi.',
    combat: { hp: 240, damage: 32, reach: 22, cooldown: 1.45, speed: 30, armor: .34, chargeDamage: 51 },
  },
  {
    id: 'sogdian_cakar', name: 'Soğd çakar süvarisi', faction: 'Soğd şehir devletleri',
    period: '7–8. yy', kind: 'cavalry', role: 'Zırhlı maiyet süvarisi', color: '#9b7352',
    note: 'Soğd hükümdar ve soylularının çakar adlı şahsî savaşçı maiyetinden süvari temsili. Uzun zırh, örgü boyun koruması ve mızrak, Pencikent savaşçı tasvirleriyle karşılaştırılarak çizildi. Duvar resmindeki kişinin çakar olduğu kesin değildir; bütün Soğd askerlerinin aynı üniformayı giydiği iddia edilmez.',
    source: 'https://www.iranicaonline.org/articles/cakar/',
    sources: [
      { title: 'Étienne de la Vaissière / Encyclopaedia Iranica — ČĀKAR', url: 'https://www.iranicaonline.org/articles/cakar/' },
      { title: 'Encyclopaedia Iranica — ARMOR; Pencikent zırhı ve zırhsız atlar', url: 'https://www.iranicaonline.org/articles/armor/' },
      { title: 'Pencikent duvar resmi — Hermitage; Nicolle 2016, fotoğraf 57 aktarımı', url: 'https://warfare.x10host.com/6-10/Sogdian_murals_from_Panjakent-Warrior_in_armour_assisting_a_prostrate_man.htm' },
    ],
    credit: 'Pencikent zırh tasvirinden özgün oyun çizimi',
    visualNote: 'Uzun zırh gövdesi, örgü baş-boyun koruması ve kolçaklar dönem karşılaştırmasıdır. Renkler, at ve yüz yorumdur. At zırhı eklenmedi.',
    combat: { hp: 200, damage: 28, reach: 31, cooldown: 1.3, speed: 36, armor: .23, chargeDamage: 47 },
  },
  {
    id: 'scots_schiltron', name: 'İskoç schiltron mızraklısı', faction: 'İskoçya Krallığı',
    period: '13–14. yy', kind: 'spear', role: 'Uzun mızraklı düzen piyadesi', color: '#88876a',
    note: 'Bannockburn’de (1314) süvariye karşı kullanılan sık mızrak düzeninin piyade temsili. Schiltron bir düzen adıdır, daimi seçkin muhafız alayı değildir. Kapitone giysi, küçük miğfer ve örgü boyunluk, National Trust for Scotland eğitim rekonstrüksiyonuna dayanır. Oyunda ayrı bir schiltron düzeni komutu bulunmaz.',
    source: 'https://portal.historicenvironment.scot/apex/f?p=1505:300::::VIEWTYPE,VIEWREF:designation,BTL4',
    sources: [
      { title: 'Historic Environment Scotland — Bannockburn, BTL4', url: 'https://portal.historicenvironment.scot/apex/f?p=1505:300::::VIEWTYPE,VIEWREF:designation,BTL4' },
      { title: 'National Trust for Scotland — Bannockburn zırhları, Aketon rekonstrüksiyonu', url: 'https://www.nts.org.uk/schools/learning-at-bannockburn/armour' },
    ],
    credit: 'NTS Bannockburn eğitim görselinden özgün çizim',
    visualNote: 'Modern müze rekonstrüksiyonu temel alınır; dönem portresi değildir. Kilt, yüz boyası ve boynuz kullanılmaz.',
    combat: { hp: 118, damage: 25, reach: 39, cooldown: 1.3, speed: 21, armor: .12 },
  },
  {
    id: 'ming_langxian', name: 'Ming langxian piyadesi', faction: 'Ming Hanedanı',
    period: '16. yy', kind: 'spear', role: 'Dallı bambu silahlı destek piyadesi', color: '#8b9484',
    note: 'Qi Jiguang’ın Jixiao Xinshu eserindeki langxian: sık ve sağlam dallı bambu gövde, uçta metal bıçak. Kalkanlıların arkasında, mızraklılarla birlikte kullanılan savunma silahıdır. Seçkin saray muhafızı değildir. Oyunda düşük hasarlı uzun erişimle temsil edilir; gerçek düzene ait takım desteği ayrı bir yetenek değildir.',
    source: mingManual,
    sources: [{ title: 'Qi Jiguang — Jixiao Xinshu, bölüm 11; langxian anlatımı', url: mingManual }, { title: 'Wubei Zhi eski basım görsellerinin aktarımı — kalkan ve birlik düzeni', url: mingImages }],
    credit: 'Dönem askerî el kitabı silah tasvirlerinden özgün çizim',
    visualNote: 'Bambu dalları ve uç bıçağı dönem tarifidir. Sade giysi ve baş bağı karşılaştırmalı yorum; renkler üniforma kanıtı değildir.',
    combat: { hp: 114, damage: 16, reach: 42, cooldown: 1.4, speed: 20, armor: .05 },
  },
  {
    id: 'ming_rattan_shield', name: 'Ming rattan kalkanlısı', faction: 'Ming Hanedanı',
    period: '16. yy', kind: 'sword', role: 'Örgü kalkanlı dao piyadesi', color: '#a17e62',
    note: 'Qi Jiguang’ın eğitim düzeninde ön safta kullanılan çevik kalkanlı savaşçı. Hafif, sık örülmüş rattan kalkan ve bel kılıcıyla temsil edilir. Kaynaktaki cirit atışı için ayrı menzilli saldırı eklenmedi. Sonraki Qing döneminin kaplan kıyafeti bu Ming askerine uygulanmaz.',
    source: mingManual,
    sources: [{ title: 'Qi Jiguang — Jixiao Xinshu, bölüm 11; rattan kalkan ve bel kılıcı', url: mingManual }, { title: 'Wubei Zhi — dairesel örgü kalkan çiziminin aktarımı', url: mingImages }],
    credit: 'Wubei Zhi kalkan çiziminden özgün oyun çizimi',
    visualNote: 'Kalkanın örgü ve dairesel biçimi eski basım çizimine dayanır. Giysi rengi ve yüz yorumdur; kaplan maskesi yoktur.',
    combat: { hp: 123, damage: 23, reach: 19, cooldown: 1.05, speed: 28, armor: .14 },
  },
];
export const FRONTIER_WARRIOR_PROFILES = {
  byzantine_kataphraktos: { head: 'byzantineMailHelm', armor: 'byzantinePaddedArmor', weapon: 'byzantineMace', shield: 'round', shieldColor: '#68473d', cloth: '#865044', horse: 'black', byzantineBarding: true },
  sogdian_cakar: { head: 'sogdAventail', armor: 'sogdLongArmor', weapon: 'sogdLance', shield: null, cloth: '#9b7352', horse: 'bay' },
  scots_schiltron: { head: 'bannockburnBascinet', armor: 'scotsAketon', weapon: 'schiltronSpear', shield: null, cloth: '#88876a', trousers: '#b2aa8c' },
  ming_langxian: { head: 'mingHeadwrap', armor: 'mingShortCoat', weapon: 'langxian', shield: null, cloth: '#8b9484', trousers: '#92917b', legWraps: true },
  ming_rattan_shield: { head: 'mingHeadwrap', armor: 'mingShortCoat', weapon: 'mingDao', shield: 'mingRattan', cloth: '#a17e62', trousers: '#9a927c', legWraps: true },
};
