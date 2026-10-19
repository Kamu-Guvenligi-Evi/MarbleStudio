// Dated equipment selections: militia and weapon roles are not invented elite corps.
const rus='Kiev Rus ve Rus Prenslikleri',france='Fransa Krallığı';
const bows='https://novgorodmuseum.ru/visit/sobytiya/«letyat-strely-kalyonye…»';
const axe='https://novgorodmuseum.ru/o-muzee-zapovednike/novosti/v-fondy-muzeya-postupil-unikalnyj-topor-x–xi-veka';
const druzhina='https://www.encyclopediaofukraine.com/display.asp?linkpath=pages%5CD%5CR%5CDruzhynaIT.htm';
const warfare='https://royalarmouries.org/objects-and-stories/stories/the-hundred-years-war-1337-1453';
const make=(id,name,faction,period,kind,role,note,source,visualNote,combat)=>({
  id,name,faction,period,kind,role,note:`${period} · ${note}`,source,combat,color:'#85755d',
  sources:[{title:name+' — tarihî kaynak',url:source}],
  credit:'Kaynak donanımına göre özgün oyun çizimi',
  visualNote:visualNote+' Kıyafet renkleri, oranlar ve hareketler oyun yorumudur; tek tip tarihî üniforma iddiası yoktur.',
});
export const RUS_FRENCH_UNITS=[
  make('rus_foot_archer','Rus yaya okçusu',rus,'11–13. yy','ranged','Bileşik yaylı piyade',
    'Novgorod buluntuları Eski Rus topraklarında yay ve okun yaygın kullanımını gösterir. Bu kart yaya okçu donanımıdır; ayrı bir seçkin alay adı değildir.',bows,
    'Bileşik yayın geri kıvrılan uçları, sadak, keçe başlık ve kuşaklı tunik. Müze buluntuları yay ve ok kullanımını destekler; kıyafet temsili.',
    {hp:83,damage:20,reach:182,cooldown:1.65,speed:26,armor:.04}),
  make('rus_retinue_spearman','Rus mızraklı maiyet savaşçısı',rus,'11–13. yy','spear','Mızrak ve uzun kalkan',
    'Druzhina, knezin askerî maiyetidir. Bu kart onun mızraklı yaya donanım seçkisidir; ayrı bir tarihî birlik veya bütün maiyetin yaya olduğu iddiası değildir.',druzhina,
    'Konik miğfer, uzun zincir gömlek, damla biçimli ahşap kalkan ve yaprak uçlu mızrak. Mevcut atlı druzhinadan yaya rolüyle ayrılır.',
    {hp:132,damage:24,reach:32,cooldown:1.25,speed:22,armor:.2}),
  make('rus_axe_warrior','Rus baltalı savaşçı',rus,'11–12. yy','sword','Tek elli balta ve yuvarlak kalkan',
    'Novgorod Müzesi, 10.–11. yy başına ait tip IV baltayı tanımlar; bu biçim 10–12. yy boyunca yaygındır. Kart bir silah rolüdür; müzedeki gümüş bezemeli seçkin örnek bütün askerlere genellenmedi.',axe,
    'Müze fotoğrafındaki aşağı uzayan balta ağzı ve kısa boyun örnek alındı. Zincir gömlek, açık konik miğfer ve yuvarlak kalkan dönem yorumu; gümüş bezeme kopyalanmadı.',
    {hp:124,damage:29,reach:18,cooldown:1.15,speed:24,armor:.17}),
  make('french_franc_archer','Fransız Franc-archer',france,'1448–15. yy sonu','ranged','Yerel askerlik yükümlüsü okçu',
    'VII. Charles döneminde 1448 kararıyla oluşturuldu. Yerel topluluklar yay veya arbalet, kılıç, hançer, jaque ve sallet sağlıyordu. Burada yaylı seçenek gösterilir; kraliyet muhafızı değildir.',
    'https://www.musee-archerie-valois.fr/wp-content/uploads/2021/09/dossier_de_presse_expo_traditions_d_archers.pdf',
    'Archerie du Valois müzesinin belgelediği sallet ve dikili koruyucu jaque; uzun yay, sadak ve yan kılıç. İskoç muhafızın üstlüğü kullanılmadı.',
    {hp:91,damage:21,reach:190,cooldown:1.8,speed:24,armor:.1}),
  make('french_royal_crossbow_guard','Fransız kraliyet arbaletçisi',france,'1386–1388','ranged','Kralın arbaletli muhafızı',
    'BnF katalog kaydı 1386, 1387 ve 1388 yıllarında kralın korumasındaki 24 Fransız arbaletçiyi belgeleyen listeleri tanımlar. Bu kayıt kesin kıyafet veya arbalet modeli vermez.',
    'https://ccfr.bnf.fr/portailccfr/ark%3A/16871/004D48012728',
    'Açık bascinet, zincir boyun koruması, kısa üstlük ve kundaklı arbalet dönem yorumudur. Sonraki yüzyılın büyük pavisi veya ateşli silahı kullanılmadı.',
    {hp:117,damage:28,reach:186,cooldown:2.45,speed:21,armor:.2,projectile:'bolt'}),
  make('french_dismounted_man_at_arms','Fransız zırhlı yaya savaşçı',france,'14. yy sonu–15. yy başı','sword','Kılıçlı zırhlı piyade',
    'Yüz Yıl Savaşları döneminin men-at-arms donanımını temsil eder. Yaya ve kılıçlı bir oyun seçkisidir; ayrı bir alay adı veya bütün Fransız savaşçılarının aynı donanımı kullandığı iddiası değildir.',warfare,
    'Öne uzayan vizörlü bascinet, zincir boyunluk, zırh üstünde dar jupon ve levha bacak korumaları. Kılıçlı silueti, mevcut atlı gendarme ve İngiliz pollaxeli piyadeden ayrılır.',
    {hp:159,damage:29,reach:21,cooldown:1.2,speed:21,armor:.27}),
];
export const RUS_FRENCH_PROFILES={
  rus_foot_archer:{head:'rfFeltCap',armor:'rfTunic',weapon:'rfCompositeBow',cloth:'#8c6b44',trim:'#c5ae7a',quiver:true,legWraps:true,beard:true},
  rus_retinue_spearman:{head:'rfNasalCone',armor:'rfLongMail',weapon:'spear',shield:'kite',cloth:'#635c42',shieldColor:'#8c6546',legWraps:true},
  rus_axe_warrior:{head:'rfOpenCone',armor:'mail',weapon:'rfBeardedAxe',shield:'round',cloth:'#795644',shieldColor:'#687d66',beard:true,legWraps:true},
  french_franc_archer:{head:'ecSallet',armor:'rfJack',weapon:'longbow',cloth:'#b8a884',trim:'#746749',quiver:true},
  french_royal_crossbow_guard:{head:'rfOpenBascinet',armor:'rfGuardCoat',weapon:'ecEarlyCrossbow',cloth:'#455e78',trim:'#c7b77f'},
  french_dismounted_man_at_arms:{head:'rfVisoredBascinet',armor:'plate',rfJupon:true,weapon:'rfArmingSword',cloth:'#854a3e',trim:'#baa16e'},
};
