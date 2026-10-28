// Documented warrior types; not all are permanent elite regiments.
export const MEDIEVAL_SPECIALIST_UNITS = [
  {
    id: 'norse_berserker', name: 'Berserker — Lewis tasviri',
    faction: 'İskandinavya', period: '12. yy tasviri', kind: 'sword',
    role: 'Uzun kalkanlı kılıç savaşçısı', color: '#987348',
    note: '12. yy sonu Lewis satranç taşındaki berserker tasvirinden uyarlama: kapitone uzun giysi, sivri miğfer, ağza kaldırılan uzun kalkan ve kılıç. Berserker adı tek tip üniformalı, sürekli bir muhafız alayı anlamına gelmez. Oyunda doğaüstü öfke yeteneği yoktur.',
    source: 'https://www.nms.ac.uk/collections/search/object?entry=21739',
    sources: [
      { title: 'National Museums Scotland — Lewis berserker taşı, H.NS 29', url: 'https://www.nms.ac.uk/collections/search/object?entry=21739' },
      { title: 'National Museums Scotland — eserin tam boy replikası ve görseli', url: 'https://shop.nms.ac.uk/products/lewis-chessmen-berserker-full-scale-replica-piece' },
    ],
    credit: 'Lewis satranç taşı H.NS 29 esas alınarak özgün oyun çizimi',
    visualNote: 'Geç 12. yy sanat tasviridir; bütün Viking çağının üniforması değildir. Renkler yorumdur.',
    combat: { hp: 142, damage: 32, reach: 19, cooldown: 1.15, speed: 24, armor: .15 },
  },
  {
    id: 'aragon_almogavar', name: 'Almogavar',
    faction: 'Aragon Tacı', period: '13–14. yy', kind: 'spear',
    role: 'Hafif mızraklı akın piyadesi', color: '#987557',
    note: '13–14. yy · Aragon Tacı ordularında ve Katalan Bölüğünde ün kazanan hafif piyadeler. Muntaner anlatımındaki kısa giysi, ağ başlık, deri bacaklık ve hafif ayakkabı esas alınır; kalkan taşımaz. Mızrak ve büyük bıçakla temsil edilir. Tarihî cirit kullanımı bu birliğe ayrı bir menzilli saldırı sağlamaz; saray muhafızı değildir.',
    source: 'https://www.mhcat.cat/exposicions/exposicions_realitzades/el_temps_dels_almogavers/l_aventura_d_orient/els_almogavers',
    sources: [
      { title: 'Museu d’Història de Catalunya — Els almogàvers; Muntaner kroniği, bölüm 64', url: 'https://www.mhcat.cat/exposicions/exposicions_realitzades/el_temps_dels_almogavers/l_aventura_d_orient/els_almogavers' },
      { title: 'Generalitat de Catalunya — Ramon Muntaner sergisi; mızrak, coltell ve ciritler', url: 'https://cultura.gencat.cat/web/.content/ilc/11-Exposicions/PDF_Expos/2016_Ramon-Muntaner.pdf' },
    ],
    credit: 'Müzenin aktardığı dönem kıyafet anlatımından özgün oyun çizimi',
    visualNote: 'Kıyafet yazılı dönem anlatımına dayanır. Renkler, yüz ve bıçağın kesin biçimi yorumdur; daha geç tablolar dönem fotoğrafı gibi kullanılmaz.',
    combat: { hp: 108, damage: 26, reach: 31, cooldown: 1.02, speed: 31, armor: .04 },
  },
  {
    id: 'japan_sohei', name: 'Sōhei — tapınak savaşçısı',
    faction: 'Japonya', period: '12–14. yy', kind: 'spear',
    role: 'Naginatalı tapınak piyadesi', color: '#353a39',
    note: '12–14. yy · Orta Çağ Japon tapınaklarının silahlı kuvvetlerinden oyun temsili. Bu toplulukların tamamı ruhban değildi ve savaşçı sınıfından bütünüyle ayrı bir askerî sınıf oluşturmazdı. Naginata, geniş kollu giysi ve beyaz baş örtüsü, daha geç Benkei ikonografisinden uyarlanır; doğrulanmış tek tip dönem üniforması değildir.',
    source: 'https://uhpress.hawaii.edu/9780824831233/',
    sources: [
      { title: 'Mikael S. Adolphson / University of Hawai‘i Press — The Teeth and Claws of the Buddha (2007)', url: 'https://uhpress.hawaii.edu/9780824831233/' },
      { title: 'University of Michigan Museum of Art — 18. yy Naginata Benkei, 1964/2.101', url: 'https://umma.umich.edu/objects/otsu-e-benkei-with-a-halberd-naginata-benkei-1964-2-101/' },
      { title: 'Tanabe Tourism Association — Benkei geleneksel tasviri ve efsane bağlamı', url: 'https://www.tanabe-kanko.jp/view/jinja/musashibobenkei/' },
    ],
    credit: 'Benkei ikonografisinden özgün çizim; belirli bir tarihî kişinin portresi değildir',
    visualNote: 'Beyaz örtü ve koyu cübbe sonraki görsel geleneğe dayanır. Dönem, tapınak kuvvetlerinin tarihidir; resmin yapılış tarihi değildir.',
    combat: { hp: 128, damage: 29, reach: 35, cooldown: 1.25, speed: 24, armor: .12 },
  },
];
export const MEDIEVAL_SPECIALIST_PROFILES = {
  norse_berserker: { head: 'lewisHelmet', armor: 'lewisAketon', weapon: 'lewisSword', shield: 'lewisKite', cloth: '#987348', trousers: '#635644' },
  aragon_almogavar: { head: 'almogavarNet', armor: 'almogavarCoat', weapon: 'almogavarSpear', shield: null, cloth: '#987557', trousers: '#75543c', legWraps: true },
  japan_sohei: { head: 'soheiHood', armor: 'soheiRobe', weapon: 'soheiNaginata', shield: null, cloth: '#353a39', trousers: '#49453d' },
};
