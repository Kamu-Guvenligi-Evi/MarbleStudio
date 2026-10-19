const mendoza='https://digital.bodleian.ox.ac.uk/objects/2fea788e-2aa2-4f08-b6d9-648c00486220/surfaces/8ea8d550-9b2b-4e68-8885-8d0d122f2950/';
const codex='https://florentinecodex.getty.edu/en/book/9/folio/31r';
const sources=[{title:'Bodleian Libraries — Codex Mendoza, yaprak 64r',url:mendoza},{title:'Getty — Florentine Codex, kitap 9, yaprak 31r',url:codex}];
export const MEXICA_RANK_UNITS=[
  {
    id:'mexica_cuachicque',name:'Mexica Cuachicque savaşçısı',faction:'Meksika / Mexica (Aztek)',
    period:'15. yy–1521',kind:'sword',role:'Seçkin yakın dövüş piyadesi',color:'#c8a448',
    note:'Cuachicque, kaynaklarda saçları kırpılmış seçkin savaşçılar olarak anılır. Mendoza Kodeksi 64r alt sıradaki sarı savaş giysili, basamaklı kıvrım desenli kalkan ve dikdörtgen sırt alameti taşıyan figür esas alındı. Florentine Codex, Otomi ve Cuachicque savaşçılarını ayrı gruplar olarak sayar. Oyun değerleri tarihsel ölçüm değildir.',
    source:mendoza,sources,credit:'Bodleian Libraries, Codex Mendoza 64r ile karşılaştırılan özgün çizim',
    visualNote:'Sarı giysi, kısa saç çevresi, kırmızı-beyaz dikdörtgen sırt alameti, yeşil tüyler ve geometrik kalkan el yazmasından sadeleştirildi. Kodex figürü esir tutarken gösterilir; eldeki obsidyen ağızlı macuahuitl oyun için dönem donanımıyla tamamlandı. Yüz ve animasyon yorumdur.',
    combat:{hp:149,damage:32,reach:23,cooldown:1.25,speed:28,armor:.16},
  },
  {
    id:'mexica_otomi_rank',name:'Mexica Otomi rütbeli savaşçı',faction:'Meksika / Mexica (Aztek)',
    period:'15. yy–1521',kind:'sword',role:'Kıdemli kalkanlı piyade',color:'#5c8965',
    note:'Mendoza Kodeksi 64r alt soldaki yeşil savaş giysili kıdemli savaşçının temsili. Buradaki Otomi adı Mexica askerî rütbe bağlamındadır; bütün Otomi halkının aynı birliğe mensup olduğu anlamına gelmez. Saç bağı, daralan sırt alameti ve mavi-beyaz kalkan, sarı giysili Cuachicque figüründen farklıdır.',
    source:mendoza,sources,credit:'Bodleian Libraries, Codex Mendoza 64r ile karşılaştırılan özgün çizim',
    visualNote:'Yeşil giysi, uzun ve bağlı saç, daralan sırt süsü ve kalkanın mavi-beyaz motifi el yazmasından sadeleştirildi. Karmaşık kalkan motifi piksel ölçeğinde yaklaşık çizildi. Obsidyen ağızlı macuahuitl, yüz ve animasyon dönem donanımından oyun yorumudur.',
    combat:{hp:155,damage:27,reach:23,cooldown:1.3,speed:26,armor:.2},
  },
];
export const MEXICA_RANK_PROFILES={
  mexica_cuachicque:{head:'cuachicShorn',armor:'cuachicSuit',weapon:'macuahuitl',shield:'xicalcoliuhqui',cloth:'#c8a448',animalLegs:true},
  mexica_otomi_rank:{head:'otomiBoundHair',armor:'otomiSuit',weapon:'macuahuitl',shield:'otomiChimalli',cloth:'#5c8965',animalLegs:true},
};
