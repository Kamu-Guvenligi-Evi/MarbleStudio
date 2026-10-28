// Equipment variants, not invented elite regiments. Stats are game balance.
const warfare='https://royalarmouries.org/objects-and-stories/stories/the-hundred-years-war-1337-1453';
const xenophon='https://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Aabo%3Atlg%2C0032%2C006%3A3';
const latin='https://journals.azbuki.bg/history/on-the-armament-in-the-military-conflicts-in-latin-romania-at-the-beginning-of-the-13-th-century/view';
const make=(id,name,faction,period,kind,role,note,source,visualNote,combat)=>({
  id,name,faction,period,kind,role,note:`${period} · ${note}`,source,combat,color:'#88765b',
  sources:[{title:name+' — tarihî kaynak',url:source}],credit:'Kaynak donanımına göre özgün oyun çizimi',
  visualNote:visualNote+' Renkler, oranlar ve hareketler oyun yorumudur; evrensel üniforma iddiası yoktur.',
});
export const EUROPE_CRUSADER_UNITS=[
  make('german_pavise_crossbowman','Alman pavisli arbaletçi','Alman Toprakları','15. yy','ranged','Pavisli arbaletçi',
    'Pavis, arbaletin yeniden kurulması sırasında koruma sağlayan büyük kalkandır. Bir askerî uzmanlık temsilidir; bütün arbaletçiler elit değildi.',warfare,
    'Büyük, ortası omurgalı pavis; demir kenarlı başlık ve yatay arbalet. Met 21940 arbaletinin mekanizması incelendi; av silahının süslemesi savaş donanımı sayılmadı.',
    {hp:112,damage:27,reach:185,cooldown:2.4,speed:20,armor:.21,projectile:'bolt'}),
  make('german_halberdier','Alman teberci','Alman Toprakları','15. yy sonu–16. yy başı','spear','Teberli piyade',
    'Alman ve İsviçre piyadelerinde kullanılan teber, uç mızrak, balta ağzı ve arka kancayı birleştirir. Ayrı bir elit alay adı değildir.',
    'https://wallacelive.wallacecollection.org/eMP/eMuseumPlus?module=collection&objectId=61449&service=ExternalInterface',
    'Wallace A952 müze fotoğrafındaki uzun uç, eğik balta ağzı ve arka kanca sadeleştirildi. Sallet ve koruyucu yelek dönem yorumudur.',
    {hp:132,damage:33,reach:31,cooldown:1.4,speed:22,armor:.18}),
  make('english_billman','İngiliz bill piyadesi','İngiltere Krallığı','15. yy','spear','Kancalı bill piyadesi',
    'Bill, kesici ağız ve çekmeye yarayan kancası olan uzun saplı silahtır. İngiliz piyadesinin silah rolünü temsil eder; seçkin muhafız teşkilatı değildir.',warfare,
    'Uzun sap üzerinde öne kıvrılan bill kancası; sade demir başlık ve dikili koruyucu ceket. Belirli bir askerî üniformanın kopyası değildir.',
    {hp:116,damage:29,reach:34,cooldown:1.3,speed:23,armor:.12}),
  make('english_dismounted_man_at_arms','İngiliz zırhlı yaya savaşçı','İngiltere Krallığı','15. yy','sword','Pollaxeli zırhlı piyade',
    'İngiliz men-at-arms sıkça yaya savaşırdı. Bu kart levha zırhlı, pollaxe kullanan bir donanım seçkisidir.',
    'https://www.english-heritage.org.uk/learn/story-of-england/medieval/war/',
    'Kapalı vizör, levha gövde ve bacak korumaları; daha kısa saplı pollaxe üzerinde çekiç, balta ve uç. Turnuva zırhı esas alınmadı.',
    {hp:168,damage:32,reach:24,cooldown:1.35,speed:20,armor:.29}),
  make('greek_rhodian_slinger','Rodoslu sapancı','Rodos','MÖ 401','ranged','Kurşun taneli sapancı',
    'Ksenophon Anabasis 3.3, Rodoslu askerlerin kurşun sapan tanelerini ve yaklaşık 200 kişilik sapancı grubunun oluşturulmasını anlatır. Ok atmaz.',xenophon,
    'Elde çevrilen iki ipli sapan, belde tane kesesi ve kısa tunik. Metin kesin kıyafet vermediği için baş bandı ve tunik temsili.',
    {hp:72,damage:15,reach:198,cooldown:1.7,speed:28,armor:0,projectile:'sling'}),
  make('greek_cretan_archer','Giritli okçu','Girit Şehir Devletleri','MÖ 4. yy','ranged','Hafif yaya okçu',
    'Ksenophon Anabasis 3.3–3.4, MÖ 401 seferindeki Giritli okçuları anlatır. Arrianos Anabasis 2.9, İssos’ta İskender’in sol kanadında Giritli okçuları kaydeder. Bütün dönemler için tek menzil veya üniforma çıkarılamaz.',xenophon,
    'Zırhsız kısa tunik, kumaş başlık, sadak ve yay. İskit okçu resimleri Girit üniforması olarak kullanılmadı.',
    {hp:78,damage:20,reach:177,cooldown:1.55,speed:27,armor:.02}),
  make('thebes_sacred_band','Thebai Kutsal Birliği','Thebai','MÖ 4. yy','spear','Seçkin hoplit',
    'Plutarkhos Pelopidas 18–19, kentçe desteklenen 300 seçkin savaşçıyı anlatır. Yazar olaylardan çok sonradır ve kesin üniforma tarif etmez.',
    'https://sourcebooks.web.fordham.edu/pwh/sacredband.asp',
    'Met 08.2.4 konik pilos miğferi incelendi; büyük yuvarlak aspis, mızrak ve keten gövde koruması dönem yorumu. Sparta arması veya sorgucu kullanılmadı.',
    {hp:152,damage:25,reach:29,cooldown:1.2,speed:20,armor:.23}),
  make('templar_sergeant','Tapınak çavuşu','Tapınak Tarikatı','12–13. yy','sword','Tarikatın silahlı çavuş kardeşi',
    'Tarikat kuralı şövalye kardeşlerin beyaz giysisini çavuşların siyah veya kahverengi giysisinden ayırır. Bu kart yaya donanım seçkisidir; tüm çavuşların yaya olduğu iddia edilmez.',
    'https://sourcebooks.web.fordham.edu/source/templars-primitiverule.asp',
    'Kahverengi üstlük, zincir başlık, kılıç ve küçük üçgen kalkan. Atlı beyaz Tapınak şövalyesinden rütbe ve donanım olarak ayrılır.',
    {hp:139,damage:25,reach:18,cooldown:1.05,speed:23,armor:.21}),
  make('crusader_crossbowman','Haçlı arbaletçisi','Haçlı Seferi Orduları','1202–1204','ranged','Arbaletli piyade',
    'Villehardouin anlatısını inceleyen araştırma, 1202 Zadar seferinde arbalet kullanımını kaydeder. Haçlı orduları tek bir halk veya tek üniformaya sahip ordu değildir.',latin,
    'Sade başlık, uzun koruyucu ceket ve ahşap kundaklı arbalet. 15. yüzyıl Alman pavisi bu erken dönem kartına taşınmadı.',
    {hp:87,damage:24,reach:174,cooldown:2.2,speed:23,armor:.08,projectile:'bolt'}),
  make('kipchak_lancer','Mızraklı Kıpçak süvarisi','Kıpçak / Kuman','12–13. yy','cavalry','Zırhlı mızraklı süvari',
    'Kuman silahları üzerine araştırmada mızrak buluntularının azlığı vurgulanır. Bu bir mızraklı donanım varyantıdır; yaygınlığı kesin veya adı bilinen ayrı elit alay olarak sunulmaz.',latin,
    'Mevcut Kıpçak maskeli miğfer yorumu, zincir gövde zırhı, yuvarlak kalkan ve uzun mızrak. Her Kıpçak mızraklısının maske taktığı veya atının zırhlı olduğu öne sürülmez.',
    {hp:190,damage:27,reach:31,cooldown:1.25,speed:43,armor:.20,chargeDamage:52}),
];
const addSource=(id,title,url)=>EUROPE_CRUSADER_UNITS.find(u=>u.id===id).sources.push({title,url});
addSource('german_pavise_crossbowman','Royal Armouries — German pavise','https://royalarmouries.org/collection/object/object-518');
addSource('german_pavise_crossbowman','Met 21940 — arbalet mekanizması','https://www.metmuseum.org/art/collection/search/21940');
addSource('english_dismounted_man_at_arms','Royal Armouries — pollaxe','https://royalarmouries.org/collection/object/object-24927');
addSource('thebes_sacred_band','Met 08.2.4 — pilos','https://www.metmuseum.org/art/collection/search/248012');
for (const [id,image,credit,source,note] of [
  ['german_pavise_crossbowman','german-crossbow-met-21940.jpg','The Metropolitan Museum of Art — Württemberg arbaleti, 1460','https://www.metmuseum.org/art/collection/search/21940','Fotoğraf yalnız arbalet mekanizmasını gösterir; bütün askerin veya pavisinin resmi değildir.'],
  ['thebes_sacred_band','greek-pilos-met-248012.jpg','The Metropolitan Museum of Art — bronz pilos, 08.2.4; Rogers Fund, 1908','https://www.metmuseum.org/art/collection/search/248012','Fotoğraf Yunan pilos tipini gösterir; bu eserin Thebai Kutsal Birliği tarafından kullanıldığı belgelenmiş değildir.'],
]) {
  const unit=EUROPE_CRUSADER_UNITS.find(u=>u.id===id);
  Object.assign(unit,{image:'/warrior-references/'+image,credit,source,license:'Kamu malı — The Met Open Access. Müzenin küçük önizlemesi; ek değişiklik yapılmadı.',visualNote:note+' '+unit.visualNote});
}
const kipchak=EUROPE_CRUSADER_UNITS.find(u=>u.id==='kipchak_lancer');
Object.assign(kipchak,{
  image:'/warrior-references/elite-kipchak-mask.jpg',
  credit:'Jim Kelly — Mysterious Mask, Saint Petersburg Museum (2009)',
  source:'https://commons.wikimedia.org/wiki/File:Mysterious_Mask,_Saint_Petersburg_Museum.jpg',
  license:'Jim Kelly, CC BY 2.0 — https://creativecommons.org/licenses/by/2.0/. Mevcut 330 piksel önizleme; yalnız boyutlandırılmıştır.',
  visualNote:'Lipovets kökenli maskeli miğfer yalnız baş donanımı referansıdır; tarihleme ve kültürel atıf tartışmalıdır. '+kipchak.visualNote,
});
export const EUROPE_CRUSADER_PROFILES={
  german_pavise_crossbowman:{head:'ecKettle',armor:'ecJack',weapon:'ecCrossbow',shield:'ecPavise',cloth:'#6c7769',shieldColor:'#8b4536'},
  german_halberdier:{head:'ecSallet',armor:'ecBrigandine',weapon:'ecHalberd',shield:null,cloth:'#946c42'},
  english_billman:{head:'ecKettle',armor:'ecJack',weapon:'ecBill',shield:null,cloth:'#b6a78c'},
  english_dismounted_man_at_arms:{head:'visor',armor:'plate',weapon:'ecPollaxe',shield:null,cloth:'#8c6259'},
  greek_rhodian_slinger:{head:'ecBand',armor:'ecChiton',weapon:'ecSling',shield:null,cloth:'#b7aa80',bareLegs:true,skin:'#b08b6b'},
  greek_cretan_archer:{head:'ecClothCap',armor:'ecChiton',weapon:'bow',shield:null,cloth:'#8d755a',bareLegs:true,quiver:true,skin:'#b08b6b'},
  thebes_sacred_band:{head:'ecPilos',armor:'linen',weapon:'spear',shield:'aspis',cloth:'#d0c4a3',shieldColor:'#ac915e',bareLegs:true},
  templar_sergeant:{head:'mailHood',armor:'surcoat',weapon:'sword',shield:'heater',cloth:'#70503b',shieldColor:'#70503b',emblem:'cross',badge:'#b13c31'},
  crusader_crossbowman:{head:'nasal',armor:'ecLongJack',weapon:'ecEarlyCrossbow',shield:null,cloth:'#b4a48a'},
  kipchak_lancer:{head:'mask',armor:'mail',weapon:'lance',shield:'round',cloth:'#647a83',shieldColor:'#7c6347',horse:'grey',trim:'#c0aa72'},
};
