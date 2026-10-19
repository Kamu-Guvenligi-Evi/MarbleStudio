// Equipment-based troop representations; these were not five uniform elite regiments.
const make = (id, name, faction, period, kind, role, source, note, visualNote, combat) => ({
  id, name, faction, period, kind, role, source, note: `${period} · ${note}`, visualNote, combat,
  color: '#8a775d', credit: 'Müze kayıtları ve dönem metinlerinden özgün çizim; renk ve giysi tamamlamaları temsili',
  sources: [{ title: `${name} — tarihî dayanak`, url: source }],
});
export const WESTERN_FRONTIER_UNITS = [
  make('flemish_goedendag', 'Flandre goedendag milisi', 'Flandre şehir milisleri', '14. yy başı', 'spear', 'İki elli saplama silahlı milis piyadesi',
    'https://collectie.nmm.nl/nl/collectie/detail/255241/',
    'Nationaal Militair Museum, Oxford sandığındaki Kortrijk tasvirinde Flaman milislerin goedendag taşıdığını belirtir. Seçkin tarikat askeri değildir. Oyunda silahın saplama kullanımı temsil edilir.',
    'Kalın ahşap sopa, demir darbe halkası ve eksen doğrultusunda sivri uç; teber veya tırpan değildir. Kapitone ceket ve kenarlı miğfer dönem yorumu; sağlam özgün bir tam sap korunmadığı için sap uzunluğu temsili.',
    { hp: 132, damage: 32, reach: 30, cooldown: 1.55, speed: 22, armor: .15 }),
  make('frankish_axeman', 'Frank baltacı', 'Merovenj Frank Krallıkları', '6. yy', 'sword', 'Kalkanlı yakın dövüş baltacısı',
    'https://www.britishmuseum.org/collection/object/H_1856-0701-1416',
    'British Museum 1856,0701.1416: Merovenj mezarından ahşap sap kalıntılı demir francisca. Bu donanımı kullanan savaşçı temsilidir, özel alay adı değildir. Tarihte atılabilen balta bu kartta yakın dövüşte kullanılır; balta fırlatma mekaniği yoktur.',
    'Öne uzanan üst köşeli kıvrık francisca başı, kısa sap, merkez kabaralı ahşap kalkan, uzun tunik. Saç, giysi ve kalkan tamamlamaları temsili; Viking boynuzlu miğferi kullanılmaz.',
    { hp: 123, damage: 31, reach: 19, cooldown: 1.25, speed: 26, armor: .09 }),
  make('frankish_angon', 'Frank angon ciritçisi', 'Merovenj Frank Krallıkları', '6–7. yy', 'ranged', 'Kancalı cirit taşıyan yaya savaşçı',
    'https://galeriemuseale.inrap.fr/index.php/Expositions/Show/Details/id/47?lang=en_US',
    'INRAP, angonu Frank savaşçısının kısa ahşap saplı uzun ciridi olarak tanımlar. British Museum, kancalı angonu Frank silahları arasında sayar. Ayrı standart alay varsayılmaz; oyunda donanıma göre seçilebilir asker rolüdür.',
    'Uzun ince demir boyunlu, geriye bakan iki kancalı cirit; omuz örtüsü, kumaş başlık ve küçük kabaralı kalkan. Kalkanı kilitleme gibi özel bir fizik etkisi uygulanmaz.',
    { hp: 108, damage: 31, reach: 126, cooldown: 2.2, speed: 27, armor: .06, projectile: 'dart' }),
  make('sarmatian_noble_lancer', 'Sarmat soylu mızraklısı', 'Roksolan / Sarmat toplulukları', 'MS 1. yy', 'cavalry', 'Kalkansız ağır zırhlı mızrak süvarisi',
    'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Tacitus/Histories/1B%2A.html#79',
    'Tacitus, Historiae 1.79: Roksolan süvarilerinin uzun mızraklarını, soylularının demir veya sert deri levhalı zırhlarını ve kalkan kullanmadıklarını anlatır. Antik yazarın abartılı zırh dayanıklılığı ifadesi oyun kuralına dönüştürülmedi.',
    'Uzun kontos, üst üste pul sıralı uzun zırh, zırhsız at ve kalkan bulunmaması. Miğfer ve kıyafet ayrıntıları yorumdur; bu kaynak atın da zırhlı olduğunu söylemez.',
    { hp: 202, damage: 28, reach: 37, cooldown: 1.45, speed: 37, armor: .27, chargeDamage: 61 }),
  make('spanish_rodelero', 'İspanyol rodela kılıçlısı', 'İspanyol İtalya Seferi Orduları', '16. yy başı', 'sword', 'Yuvarlak kalkanlı yakın dövüş piyadesi',
    'https://constitution.org/2-Authors/mac/artofwar2.htm',
    'Machiavelli, Savaş Sanatı II, İspanyol piyadelerinin Alman mızraklılarının yakınına girerek kılıçla savaşmasını anlatır; Prens XXVI kalkanın rolünü belirtir. Her mızrak düzenini otomatik yenen bir karşı birim değildir.',
    'Yuvarlak metal rodela, düz kılıç, sade göğüslük ve açık yüzlü erken cabasset yorumu. Geniş süslü fatih miğferi ve ateşli silah yok; zırh dağılımı ile renkler temsili.',
    { hp: 141, damage: 24, reach: 19, cooldown: .95, speed: 25, armor: .23 }),
];
WESTERN_FRONTIER_UNITS.find(u => u.id === 'frankish_angon').sources.push({ title: 'British Museum, Room 41 — Frank angonu', url: 'https://www.britishmuseum.org/sites/default/files/2021-05/large_print_guide_room_41.pdf' });
WESTERN_FRONTIER_UNITS.find(u => u.id === 'spanish_rodelero').sources.push({ title: 'Machiavelli, Prens XXVI — kalkan ve kılıçla mızrakların içine giriş', url: 'https://thephilosopher.net/machiavelli/tvorchestvo/the-prince/pagen/21/' });
export const WESTERN_FRONTIER_PROFILES = {
  flemish_goedendag: { head: 'wfKettle', armor: 'wfQuilt', weapon: 'wfGoedendag', cloth: '#ae996b', skin: '#bf997a' },
  frankish_axeman: { head: 'wfFrankHair', armor: 'wfFrankTunic', shield: 'wfBoardShield', weapon: 'wfFrancisca', cloth: '#727d63', skin: '#c49a77' },
  frankish_angon: { head: 'wfClothCap', armor: 'wfShoulderCloak', shield: 'wfSmallShield', weapon: 'wfAngon', cloth: '#a07962', skin: '#be9470' },
  sarmatian_noble_lancer: { head: 'wfSegmentHelmet', armor: 'wfScaleCoat', weapon: 'wfKontos', cloth: '#847065', skin: '#bc9473', horse: 'bay' },
  spanish_rodelero: { head: 'wfCabasset', armor: 'wfHalfPlate', shield: 'wfRodela', weapon: 'wfSword', cloth: '#875c50', skin: '#bd9879' },
};
