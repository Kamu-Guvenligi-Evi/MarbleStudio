// Equipment roles, not uniform regiments. Numbers and army ratios are game tuning.
const make = (id, name, faction, period, kind, role, source, note, visualNote, combat) => ({
  id, name, faction, period, kind, role, source, combat, color: '#927752',
  sources: [{ title: `${name} — tarihî dayanak`, url: source }],
  note: `${period} · ${note}`, visualNote,
  credit: 'Kaynaklara dayanan özgün oyun çizimi; kesim, renk ve sayısal özellikler temsili',
});
export const MAJOR_ARMY_EXPANSION_UNITS = [
  make('japan_naginata_foot', 'Naginatalı yaya', 'Japonya', '16. yy', 'sword', 'Uzun kesici silahlı yakın destek',
    'https://artsandculture.google.com/story/rwXBhVHFrCNTLQ',
    'Tachibana Müzesi koleksiyonundaki 16. yüzyıl naginata donanımından hareketle laik yaya rolü. Sōhei keşişi veya belirli bir Takeda alayı değildir. Yariye göre daha kısa erişimli, ağır kesişi daha yavaş bir destek birliğidir.',
    'Kavisli naginata, jingasa ve hafif gövde zırhı; silahın varlığı kaynaklı, bu kıyafet birleşimi ve renkler temsili. Müzedeki aile arması kopyalanmaz.',
    { hp: 116, speed: 25, damage: 30, reach: 28, cooldown: 1.4, armor: .12 }),
  make('mughal_shamsherbaz', 'Babür kılıç-kalkan piyadesi', 'Babür İmparatorluğu', '16. yy sonu', 'sword', 'Çevik kılıç ve küçük kalkan',
    'https://persian.packhum.org/text/000702051/5',
    'Ayn-ı Ekberînin Shamsherbáz anlatısındaki küçük chirwah kalkanı kullanan grubu temsil eder. Metindeki bütün kılıç ustaları tek donanımda birleştirilmez; iki elli Banáit ve kalkansız Bankúlí değildir. Bir saha alayının kesin adı veya mevcudu olarak sunulmaz.',
    'Küçük yuvarlak kalkan, hafif jama ve sarık. Kılıcın kavisli biçimi ve kıyafetin ayrıntıları dönemsel yorumdur; ağır metal zırh çizilmez.',
    { hp: 108, speed: 28, damage: 24, reach: 19, cooldown: 1.05, armor: .05 }),
  make('tang_crossbowman', 'Tang arbaletçisi', 'Tang Hanedanı', '7.–9. yy', 'ranged', 'Arbaletli yaya desteği',
    'https://m.gushiwen.cn/guwen/bookv_31ecf2aa5458.aspx',
    'Du Younun Tongdian 148. cildinde arbaletçiler, yaylılar ve süvari ayrı bileşenlerdir. Kart bu yaya arbalet rolünü temsil eder; daha geç Song veya Qin askeri değildir. Yavaş atış döngüsü ve yakın dövüş zayıflığı karşılığında güçlü tek atış sağlar.',
    'Yatay kundaklı arbalet, Tang biçimli miğfer ve sınırlı lamel zırh. Kesin bir alayın üniforması veya belirli çekiş gücünde arbalet iddiası yoktur.',
    { hp: 101, speed: 22, damage: 29, reach: 185, cooldown: 2.3, armor: .12, projectile: 'bolt' }),
  make('ayyubid_foot_spearman', 'Eyyûbî mızraklı yaya', 'Eyyûbîler', '12.–13. yy', 'spear', 'Kalkanlı yaya saf desteği',
    'https://warfare.6te.net/Nicolle-Islam-Continued_Importance_of_Trained_Infantry.htm',
    'Nicolle, el-Tarsûsîye dayanarak Eyyûbî piyadesinin uzun kalkanların arkasında saflandığını ve mızrak kullandığını aktarır. Bu kart süvariye eşlik eden yaya desteğidir; bütün Eyyûbî piyadesi veya belirli bir garnizon değildir.',
    'Mızrak, uzun kalkan ve kapitone giysi; kalkanın kesin kesimi, giysi ve renkleri temsili. Geç Memlük ya da Avrupa plaka zırhı kullanılmaz.',
    { hp: 118, speed: 24, damage: 22, reach: 32, cooldown: 1.25, armor: .09 }),
];

export const MAJOR_ARMY_EXPANSION_PROFILES = {
  japan_naginata_foot: { head: 'ashigaruJingasa', armor: 'ashigaruBlack', weapon: 'maNaginata', cloth: '#7c6b4c', skin: '#c4a079', legWraps: true },
  mughal_shamsherbaz: { head: 'mughalWrap', armor: 'jama', weapon: 'maTalwar', shield: 'maChirwah', cloth: '#baa378', skin: '#a77e59', trim: '#75513b' },
  tang_crossbowman: { head: 'tangRidge', armor: 'lamellar', weapon: 'crossbow', cloth: '#73795d', skin: '#c4a079', trim: '#aa9570' },
  ayyubid_foot_spearman: { head: 'cap', armor: 'maQuilted', weapon: 'spear', shield: 'maTallShield', cloth: '#a39169', skin: '#b68d62', beard: true },
};
