// Equipment roles filling gaps in the playable armies, not invented elite regiments.
const make = (id, name, faction, period, kind, role, source, note, visualNote, combat) => ({
  id, name, faction, period, kind, role, source, note: `${period} · ${note}`, visualNote,
  combat, color: '#9a805a', credit: 'Tarihî donanımdan hareketle özgün oyun çizimi',
  sources: [{ title: `${name} — donanım kaynağı`, url: source }],
});
export const ANCIENT_ROSTER_UNITS = [
  make('assyrian_slinger', 'Asur sapancısı', 'Yeni Asur', 'Yeni Asur dönemi', 'ranged', 'Kuşatma ve açık alan sapancısı',
    'https://www.britishmuseum.org/collection/object/W_1851-0902-27',
    'British Museum kabartması dağlık bir alandaki kuşatmada Asur okçuları ve sapancılarını gösterir. Kart sapancı silah rolünü temsil eder; ayrı bir muhafız alayı değildir.',
    'Sapan ve taş kesesi, sivri miğfer, kısa etekli tunik ve sakal. Kabartmalardaki Asur donanımından hareketle çizildi; renkler ve hareketler temsili.',
    { hp: 88, damage: 23, reach: 168, cooldown: 1.95, speed: 26, armor: .06, projectile: 'sling' }),
  make('egypt_middle_spearman', 'Mısır deri kalkanlı mızraklı', 'Orta Krallık Mısır', 'MÖ yaklaşık 1981–1802', 'spear', 'Kalkanlı hat piyadesi',
    'https://www.metmuseum.org/art/collection/search/546270',
    'Met 17.9.3 kalkan modeli ve beraberindeki mızraklar dönemin askerî donanımını temsil eder. Ahşap kalkan sığır derisini taklit eden boyalı yüzeye sahiptir.',
    'Yüksek kemerli, benekli deri görünümlü kalkan ve kırmızı kenar müze nesnesinden; kısa keten etek, saç, duruş ve renklerin geri kalanı rekonstrüksiyon.',
    { hp: 111, damage: 23, reach: 29, cooldown: 1.35, speed: 23, armor: .12 }),
  make('egypt_middle_axeman', 'Mısır hilal baltalı piyadesi', 'Orta Krallık Mısır', 'MÖ yaklaşık 1981–1802', 'sword', 'Yakın dövüş baltacısı',
    'https://www.metmuseum.org/art/collection/search/544279',
    'Met 15.2.5a, b bronz savaş baltasının uzun hilal ağzı esas alındı. Müzedeki ahşap sap ve bağlar restore edilmiştir. Kart donanım rolüdür; adlandırılmış seçkin bir teşkilat değildir.',
    'Sapa iki bağla tutunan, içi boşluklu uzun hilal balta; açık gövde, kısa keten etek ve taşıma kayışı temsili. Kuzey Avrupa baltası kullanılmadı.',
    { hp: 99, damage: 29, reach: 21, cooldown: 1.4, speed: 26, armor: .03 }),
  make('achaemenid_spear_cavalry', 'Ahameniş mızraklı süvarisi', 'Ahameniş İmparatorluğu', 'MÖ 5. yy', 'cavalry', 'Yakın dövüş süvarisi',
    'https://lexundria.com/hdt/7.84/mcly',
    'Herodotos 7.84 Pers süvarilerinin piyadeye benzer donanımını ve bazılarının metal başlığını aktarır; 7.61 piyadenin kısa mızrağını ve pullu korumasını tanımlar. Kart bu donanımın yakın dövüş rolünü seçer.',
    'Bronz başlık, pullu gövde koruması, kollu tunik, pantolon ve kısa süvari mızrağı. Başlığın kesin şekli ve renkler temsili; üzengi ve Orta Çağ at zırhı yok.',
    { hp: 165, damage: 25, reach: 27, cooldown: 1.35, speed: 39, armor: .17, chargeDamage: 44 }),
  make('han_crossbowman', 'Han arbaletçisi', 'Han Hanedanı', 'MS 1–3. yy', 'ranged', 'Tetikli arbalet piyadesi',
    'https://asia-archive.si.edu/object/S2012.9.2116/',
    'Smithsonian S2012.9.2116, Doğu Han dönemine ait bronz arbalet tetik mekanizmasıdır. Bu kart tek atışlı arbalet donanımını temsil eder; tekrarlayan arbalet veya adı bilinen bir seçkin alay değildir.',
    'Ahşap kundak, yatay yay, tunik, baş bağı ve bacak sargıları. Kaynak tetik mekanizmasını doğrular; tam silah, asker kıyafeti ve renkler temsili tamamlamadır.',
    { hp: 94, damage: 29, reach: 186, cooldown: 2.45, speed: 23, armor: .07, projectile: 'bolt' }),
  make('han_jian_infantry', 'Han jian kılıçlı piyadesi', 'Han Hanedanı', 'Han dönemi, MÖ 206–MS 220', 'sword', 'Düz kılıçlı yakın dövüş piyadesi',
    'https://www.britishmuseum.org/collection/object/A_1940-1214-280',
    'British Museum 1940,1214.280 kılıcı Han dönemine tarihlenir. Kart dönem kılıcına dayalı bir donanım seçeneğidir; nesne tek başına bir birlik adı veya standart asker üniforması kanıtlamaz.',
    'Düz kılıç, kısa kabza siperi, bağlı saç ve levhacıklı gövde zırhı. Kılıç dışındaki giysi ve koruma ayrıntıları oyun rekonstrüksiyonu; Japon katana donanımı kullanılmadı.',
    { hp: 119, damage: 27, reach: 23, cooldown: 1.2, speed: 25, armor: .17 }),
];
ANCIENT_ROSTER_UNITS.find(u => u.id === 'achaemenid_spear_cavalry').sources.push({ title: 'Herodotos 7.61 — Pers donanımı', url: 'https://lexundria.com/hdt/7.61/mcly' });
ANCIENT_ROSTER_UNITS.find(u => u.id === 'achaemenid_spear_cavalry').sources.push({ title: 'Herodotos 6.102 — Darius dönemindeki seferde süvari', url: 'https://lexundria.com/hdt/6.102/mcly' });
ANCIENT_ROSTER_UNITS.find(u => u.id === 'achaemenid_spear_cavalry').note += ' Herodotos 6.102, Darius dönemindeki Marathon seferinde süvarinin varlığını doğrular. Darius hazır ordusundaki yakın dövüş rolü dönemsel bir yorumdur; kartın ayrıntılı donanım tarifi Kserkses seferi metninden gelir.';
for (const [id, object] of [['egypt_middle_spearman', 546270], ['egypt_middle_axeman', 544279]]) {
  Object.assign(ANCIENT_ROSTER_UNITS.find(u => u.id === id), {
    image: `/warrior-references/ancient-${object}.jpg`,
    credit: 'The Metropolitan Museum of Art — Open Access; oyun savaşçısı özgün çizim',
    license: 'Kaynak fotoğrafı kamu malı / The Met Open Access.',
  });
}
export const ANCIENT_ROSTER_PROFILES = {
  assyrian_slinger: { head: 'mcAssyrianCone', armor: 'mcAssyrianKilt', weapon: 'ecSling', cloth: '#ac8659', beard: true, bareLegs: true },
  egypt_middle_spearman: { head: 'mcEgyptHair', armor: 'agEgyptKilt', weapon: 'agBronzeSpear', shield: 'agHide', cloth: '#e5dac0', skin: '#a97652', bareLegs: true, bareFeet: true },
  egypt_middle_axeman: { head: 'mcEgyptHair', armor: 'agEgyptKilt', weapon: 'agCrescentAxe', cloth: '#d8c89e', skin: '#a97652', bareLegs: true, bareFeet: true, sash: true },
  achaemenid_spear_cavalry: { head: 'agPersianHelm', armor: 'agPersianScale', weapon: 'shortSpear', cloth: '#9d6350', trim: '#c3a575', horse: 'dun', noStirrups: true, beard: true },
  han_crossbowman: { head: 'agHanCap', armor: 'agHanTunic', weapon: 'ecCrossbow', cloth: '#6d7868', legWraps: true },
  han_jian_infantry: { head: 'agHanKnot', armor: 'agHanPlates', weapon: 'agJian', cloth: '#8e6250', legWraps: true },
};
