// Equipment selections, not uniformed regiments; combat values are game balance.
const ref = (title, url) => ({ title, url });
export const LATE_MEDIEVAL_CAVALRY_UNITS = [
  {
    id: 'italian_condotta_lancer', name: 'Condotta — İtalyan ağır süvarisi',
    faction: 'Floransa Cumhuriyeti', period: '15. yy ikinci yarısı', kind: 'cavalry',
    role: 'Sözleşmeli ağır mızraklı süvari', color: '#963f4b',
    note: '15. yy ikinci yarısı · İtalyan şehir devletlerinin sözleşmeyle tuttuğu askerî şirketlerin ağır süvari temsili. Condottiere şirketin komutanıdır; bütün askerlerin rütbesi veya tek bir seçkin alayın adı değildir. Floransa hizmetindeki seçenek burada gösterilir; Milano dükünün famiglia ducale maiyetiyle aynı teşkilat değildir.',
    image: '/warrior-references/italian-armet-met-24810.jpg',
    source: 'https://www.metmuseum.org/art/collection/search/24810',
    credit: 'The Metropolitan Museum of Art — İtalyan armet, yaklaşık 1490 (49.163.4)',
    license: 'Kamu malı / The Met Open Access; müze küçük görseli.',
    visualNote: 'Yuvarlak plaka zırh, kapalı armet ve süvari mızrağı. Bordo, altın işlemeli at örtüsü özgün oyun yorumudur; belirli şirketin belgelenmiş üniforması değildir. Referans miğfer, Floransalı bir askere kesin olarak atfedilmez.',
    sources: [ref('National Gallery — San Romano ve Floransa hizmetindeki condottiere', 'https://www.nationalgallery.org.uk/paintings/catalogues/gordon-2003/the-battle-of-san-romano'), ref('The Met — 15. yüzyıl İtalyan armet', 'https://www.metmuseum.org/art/collection/search/24810')],
    combat: { hp: 202, damage: 31, reach: 35, cooldown: 1.5, speed: 32, armor: .33, chargeDamage: 50 },
  },
  {
    id: 'imperial_gothic_knight', name: 'İmparatorluk şövalyesi — Gotik ağır süvari',
    faction: 'Kutsal Roma İmparatorluğu', period: '15. yy sonu', kind: 'cavalry',
    role: 'Gotik zırhlı mızraklı şövalye', color: '#b79a4b',
    note: '15. yy sonu · İmparatorluk topraklarından varlıklı, ağır donanımlı bir şövalyenin oyun temsili. Reichsritter imparatora doğrudan bağlı soyluların statüsüdür; tek tip merkezî muhafız alayı değildir. Örgütlü Reichsritterschaft esas olarak 16. yüzyılda şekillenir. Kart daha erken Gotik donanımı kullanır; Maximilian zırhıyla aynı sayılmaz.',
    image: '/warrior-references/gothic-armor-met-35903.jpg',
    source: 'https://www.metmuseum.org/art/collection/search/35903',
    credit: 'The Metropolitan Museum of Art — Gotik zırh (29.150.8a–q)',
    license: 'Kamu malı / The Met Open Access; müze küçük görseli.',
    visualNote: 'Sallet ve boğaz koruması, sivri ve yivli Gotik plakalar; atın baş ve gövdesinde parçalı zırh. Altın-siyah at örtüsü oyun yorumudur, bütün şövalyelere ortak imparatorluk üniforması değildir. Müze referansı farklı tarihî parçaların birleştirilmesiyle oluşturulmuş, yaklaşık yarısı modern restorasyondur.',
    sources: [ref('Historisches Lexikon Bayerns — Reichsritterschaft', 'https://www.historisches-lexikon-bayerns.de/Lexikon/Artikel_45405'), ref('The Met — Gotik zırh ve restorasyon bilgisi', 'https://www.metmuseum.org/art/collection/search/35903')],
    combat: { hp: 215, damage: 32, reach: 35, cooldown: 1.55, speed: 30, armor: .36, chargeDamage: 52 },
  },
];
export const LATE_MEDIEVAL_CAVALRY_PROFILES = {
  italian_condotta_lancer: { head: 'milanArmet', armor: 'plate', milanese: true, weapon: 'lance', cloth: '#963f4b', trim: '#c9ad68', horse: 'bay', bard: 'cloth', condotta: true },
  imperial_gothic_knight: { head: 'imperialSallet', armor: 'plate', weapon: 'lance', cloth: '#b79a4b', trim: '#ddc780', horse: 'grey', bard: 'cloth', gothicKnight: true },
};
