const ashigaru='https://www.mlit.go.jp/tagengo-db/en/H30-00668.html';
const armor='https://commons.wikimedia.org/wiki/File:Ashigaru_Armor.jpg';
const akinci='https://islamansiklopedisi.org.tr/akinci';
const azap='https://islamansiklopedisi.org.tr/azeb--asker';
const azapPrint='https://www.academiacolecciones.com/estampas/inventario.php?id=C-56-041b4';
export const TURKISH_JAPANESE_UNITS=[
  {
    id:'japan_yari_ashigaru',name:'Yari ashigaru',faction:'Japonya',period:'16–17. yy',kind:'spear',role:'Mızraklı piyade',color:'#777b50',
    note:'Ashigaru, samuraylarla birlikte görev yapan alt rütbeli piyadeleri ifade eder. Yari uzun saplı mızraktır. Bu kayıt bir silah rolünü temsil eder; ashigaruların tamamı seçkin muhafız değildir. Japonya turizm mirası kaydı, ashigaru eğitiminde mızrak ve yay kullanımını belgeler.',
    source:ashigaru,sources:[{title:'Kanazawa — Training and Education of Ashigaru',url:ashigaru},{title:'Saitama müzesi ashigaru zırhları — fotoğraf',url:armor}],
    credit:'Saitama müze zırhları incelenerek hazırlanan özgün çizim',
    visualNote:'Sade konik jingasa, siyah yatay levhalı gövde zırhı ve bağlı kusazuri etek parçaları müze fotoğrafından sadeleştirildi. Mızrak boyu, kumaş rengi ve hareket oyun yorumudur. Belirli bir klanın arması veya evrensel üniforma iddiası yoktur.',
    combat:{hp:108,damage:23,reach:35,cooldown:1.25,speed:23,armor:.13},
  },
  {
    id:'japan_yumi_ashigaru',name:'Yumi ashigaru',faction:'Japonya',period:'16–17. yy',kind:'ranged',role:'Yaya okçu',color:'#465e79',
    note:'Yaylı ashigaru piyadesi; ateşli silah taşıyan ashigaru çeşidi değildir. Kanazawa miras kaydında yay eğitimi de yer alır. Oyunda zırhlı fakat yakın dövüşte kırılgan bir yaya okçu rolündedir. Ashigaru bir elit alay adı değildir.',
    source:ashigaru,sources:[{title:'Kanazawa — Training and Education of Ashigaru',url:ashigaru},{title:'Saitama müzesi ashigaru zırhları — fotoğraf',url:armor}],
    credit:'Saitama müze zırhları incelenerek hazırlanan özgün çizim',
    visualNote:'Kızıl kahverengi sade gövde zırhı ve bağlı etek levhaları müze fotoğrafından; asimetrik yumi ve sadak rolün donanımından uyarlandı. Şapka, kumaş renkleri ve animasyon temsili bir birleşimdir; aynı kişiye ait eksiksiz takım değildir.',
    combat:{hp:88,damage:17,reach:180,cooldown:1.6,speed:23,armor:.09},
  },
  {
    id:'ottoman_akinci',name:'Akıncı',faction:'Osmanlı Devleti',period:'14–16. yy',kind:'cavalry',role:'Hafif kılıçlı süvari',color:'#b6904e',
    note:'Sınır bölgelerinde keşif ve akın görevleri üstlenen hafif atlılar. TDV kaydı kılıç, pala, mızrak ve kalkan gibi çeşitli silahları sayar. Oyunda kılıçlı bir donanım seçildi; bütün akıncıların aynı silahı veya üniformayı kullandığı öne sürülmez.',
    source:akinci,sources:[{title:'TDV İslâm Ansiklopedisi — Akıncı',url:akinci}],
    credit:'Şehnâme-i Âl-i Osman minyatürüne bakılarak hazırlanan özgün çizim',
    visualNote:'TDV sayfasındaki TSMK Hazine 1517, vr. 212a minyatürünün Osmanlı atlıları esas alındı: sarılı başlık, küçük açık renk sorguç, sarı kahverengi kaftan, yuvarlak kalkan ve zırhsız at. Renk ve oranlar sadeleştirildi; minyatür fotoğrafı dağıtılmıyor.',
    combat:{hp:145,damage:24,reach:22,cooldown:1.1,speed:47,chargeDamage:44,armor:.06},
  },
  {
    id:'ottoman_azap_archer',name:'Azap okçusu',faction:'Osmanlı Devleti',period:'16. yy tasviri / 1664 baskısı',kind:'ranged',role:'Hafif yaya okçu',color:'#856752',
    note:'Azap teşkilatı zaman içinde kara, kale ve deniz hizmetlerinde kullanıldı; erken azaplar hafif yaylı piyadeydi. Görünüm, Vecellio geleneğinde kadırga okçusu olarak adlandırılmış bir azap tasvirinden alındı. Oyunda karada savaşır; deniz dalının görüntüsü bütün azaplara genellenmez. Elit muhafız sınıfı değildir.',
    source:azap,sources:[{title:'TDV İslâm Ansiklopedisi — Azeb',url:azap},{title:'Real Academia — Azappi, C-56-041b4',url:azapPrint}],
    credit:'Vecellio / Krieger azap gravüründen hazırlanan özgün çizim',
    visualNote:'1664 tarihli siyah beyaz baskıdaki yassı sarılı başlık, dirseğe gelen dış kol, önden ilikli dolaman, bel kuşağı, yay, sadak ve eğri kılıç esas alındı. Renkler, kısaltılmış etek ve yay çekme hareketi oyun yorumudur; baskı renkli üniforma kanıtı değildir.',
    combat:{hp:78,damage:16,reach:168,cooldown:1.4,speed:27,armor:.03},
  },
];
export const TURKISH_JAPANESE_PROFILES={
  japan_yari_ashigaru:{head:'ashigaruJingasa',armor:'ashigaruBlack',weapon:'ashigaruYari',shield:null,cloth:'#777b50',skin:'#c4a079',legWraps:true},
  japan_yumi_ashigaru:{head:'ashigaruJingasa',armor:'ashigaruRed',weapon:'yumi',shield:null,cloth:'#465e79',skin:'#c4a079',quiver:true,legWraps:true},
  ottoman_akinci:{head:'akinciWrap',armor:'akinciKaftan',weapon:'sabre',shield:'round',shieldColor:'#9e7d45',cloth:'#b6904e',skin:'#be9976',horse:'bay',beard:true},
  ottoman_azap_archer:{head:'azapWrap',armor:'azapDolman',weapon:'bow',shield:null,cloth:'#856752',skin:'#be9976',quiver:true,beard:true},
};
