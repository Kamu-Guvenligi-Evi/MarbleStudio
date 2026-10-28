// Distinguish named formations from equipment roles; sources do not imply uniforms.
const make=(id,name,faction,period,kind,role,note,source,visualNote,combat)=>({
  id,name,faction,period,kind,role,note:`${period} · ${note}`,source,combat,color:'#89775c',
  sources:[{title:name+' — tarih ve donanım',url:source}],
  credit:'Tarihî kaynaklardan hareketle özgün oyun çizimi',
  visualNote:visualNote+' Renk ve oranlar oyun yorumudur; standart üniforma iddiası değildir.',
});
export const ADDITIONAL_HISTORICAL_UNITS=[
  make('japan_odachi_samurai','Japon ōdachi samurayı','Japonya','14–15. yy','sword','İki elli uzun kılıçlı samuray',
    'Tokyo Ulusal Müzesi F-19995, Kanemitsu imzalı 1359 tarihli uzun kılıçtır. Bu kart bir silah uzmanlığını temsil eder; ayrı bir samuray tarikatı değildir.',
    'https://emuseum.nich.go.jp/detail?content_base_id=100493&content_part_id=0&content_pict_id=0&langId=en',
    'Uzun, hafif kavisli tek ağızlı ōdachi; iki elli tutuş, bağcıklı gövde zırhı, parçalı etek ve boyun korumalı kabuto. Zırh 14–15. yüzyıl yorumudur.',
    {hp:151,damage:35,reach:28,cooldown:1.55,speed:23,armor:.21}),
  make('polish_medieval_knight','Leh ortaçağ şövalyesi','Polonya Krallığı','14. yy sonu–15. yy başı','cavalry','Mızraklı soylu süvari',
    'Polonya Tarih Müzesi şövalyenin zincir ve levha korumasını, yüzü kapatan miğferini, kılıcını ve atlı mızrağını açıklar. Sonraki yüzyılların kanatlı hussarı değildir.',
    'https://muzhp.pl/wiedza-on-line/rycerz',
    'Sivri vizörlü bascinet, zincir boyunluk, levha göğüslük, mızrak ve küçük kalkan. Kırmızı üstlük ile arma temsili; kanat kullanılmadı.',
    {hp:212,damage:29,reach:30,cooldown:1.35,speed:35,armor:.25,chargeDamage:58}),
  make('macedon_sarissa_phalangite','Makedon sarissa piyadesi','Makedonya Krallığı','MÖ 3–2. yy','spear','Uzun mızraklı falanks piyadesi',
    'Polybios 18.29 iki elle kullanılan uzun sarissayı ve sık düzeni anlatır. Hipaspistlerden farklı bir silah rolüdür; her falanks askeri seçkin muhafız sayılmaz.',
    'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/18*.html#29',
    'İki elli sarissa, omuz askılı küçük yuvarlak kalkan, yanaklıklı miğfer ve etek şeritli gövde zırhı. Silah ekrana sığması için kısaltıldı; tam falanks düzeni mekaniği yoktur.',
    {hp:123,damage:27,reach:40,cooldown:1.45,speed:20,armor:.16}),
  make('byzantine_menavlatos','Bizans menavlatos piyadesi','Bizans İmparatorluğu','10. yy','spear','Ağır süvariye karşı uzman piyade',
    'Sylloge Tacticorum menavlatoi adıyla ağır süvari hücumunu karşılayan uzman piyadeyi kaydeder. Kartın rolü tarihîdir; oyunda özel süvari hasar çarpanı yoktur.',
    'https://archives.maryjahariscenter.org/blog/a-tenth-century-byzantine-military-manual',
    'Kalın saplı, uzun demir uçlu menavlion; iki elli tutuş ve sade uzun kollu tunik. Zırh ve başlık ayrıntıları kesin bir menavlatoi üniforması olarak sunulmaz.',
    {hp:132,damage:30,reach:35,cooldown:1.5,speed:22,armor:.08}),
  make('khmer_crossbowman','Khmer arbaletçisi','Khmer İmparatorluğu','12. yy sonu–13. yy başı','ranged','Arbaletli piyade',
    'Bayon kabartmasında yaylıların yanında arbaletçiler de gösterilir. Bir silah rolüdür; ayrı bir saray muhafız alayı olarak adlandırılmaz.',
    'https://cambodianess.com/article/picture-of-the-day-khmer-archers-and-crossbowmen-at-bayon',
    'Ahşap yay kollu arbalet, belden sarılı kumaş, bezemeli omuz yakası ve göğüste çapraz kayışlar. Bayon kabartması renk ve malzeme bilgisi vermez; açık karın ve omuz süsleri çizimde ayrıştırıldı.',
    {hp:88,damage:31,reach:183,cooldown:2.5,speed:24,armor:.03,projectile:'bolt'}),
  make('irish_kern_spearman','İrlanda kern mızraklısı','İrlanda Gal lordlukları','16. yy başı','spear','Hafif piyade',
    'İrlanda Millî Kütüphanesi kernleri hafif silahlı piyade olarak tanımlar. Dürer’in 1521 çizimindeki zırhsız, mızraklı figür donanım referansıdır. Seçkin gallowglass ile aynı birlik değildir.',
    'https://catalogue.nli.ie/Record/vtls000171614',
    'Uzun gömlek, kısa omuz örtüsü, öne düşen saç ve yalın mızrak. Dürer çizimi bütün İrlandalı askerlerin üniformasını belgelemez; burada mızrak yakın dövüşte kullanılır.',
    {hp:93,damage:22,reach:30,cooldown:1.2,speed:29,armor:.03}),
];
const kern=ADDITIONAL_HISTORICAL_UNITS.at(-1);
Object.assign(kern,{image:'/warrior-references/irish-durer-1521.png',license:'Kamu malı; Albrecht Dürer, 1521. Wikimedia Commons kopyası.',credit:'Albrecht Dürer — Irish Soldiers and Peasants (1521), Kupferstichkabinett Berlin'});
kern.sources.push({title:'Dürer 1521 — görsel kaynak ve lisans',url:'https://commons.wikimedia.org/wiki/File:Gallowglass_-_D%C3%BCrer.png'});
ADDITIONAL_HISTORICAL_UNITS[0].sources.push({title:'Tokyo Ulusal Müzesi — dōmaru zırhı',url:'https://emuseum.nich.go.jp/detail?content_base_id=100513&content_part_id=1&content_pict_id=0&langId=en'});
export const ADDITIONAL_HISTORICAL_PROFILES={
  japan_odachi_samurai:{head:'ahKabuto',armor:'ahDomaru',weapon:'ahOdachi',cloth:'#435b70',trim:'#c6a773'},
  polish_medieval_knight:{head:'ahBascinet',armor:'ahKnight',weapon:'lance',shield:'heater',shieldColor:'#b7b49b',cloth:'#965049',horse:'bay',bard:'cloth'},
  macedon_sarissa_phalangite:{head:'ahHellenistic',armor:'ahPhalangite',weapon:'ahSarissa',cloth:'#d2c8a1',bareLegs:true},
  byzantine_menavlatos:{head:'ahClothCap',armor:'ahTunic',weapon:'ahMenavlion',cloth:'#947749',legWraps:true,beard:true},
  khmer_crossbowman:{head:'ahKhmerHair',armor:'ahSampot',weapon:'ahCrossbow',cloth:'#a67b57',skin:'#ab7b50',bareLegs:true,bareFeet:true},
  irish_kern_spearman:{head:'ahKernHair',armor:'ahLeine',weapon:'ahSpear',cloth:'#c4b48a',bareLegs:true,bareFeet:true},
};
