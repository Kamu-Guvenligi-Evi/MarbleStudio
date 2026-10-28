// Equipment roles, not claims that every soldier belonged to an elite regiment.
const make = (id, name, faction, period, kind, role, source, note, visualNote, combat) => ({
  id, name, faction, period, kind, role, source, note: `${period} · ${note}`, visualNote, combat,
  color: '#927959', credit: 'Kaynak donanımından özgün oyun çizimi; renkler ve belirtilmeyen kıyafet ayrıntıları temsili',
  sources: [{ title: `${name} — tarihî dayanak`, url: source }],
});
export const EASTERN_ROSTER_GAPS = [
  make('egypt_new_composite_archer', 'Yeni Krallık kompozit yaylı okçusu', 'Yeni Krallık Mısır', 'Yeni Krallık, MÖ 16–11. yy', 'ranged', 'Kompozit yaylı yaya okçu',
    'https://www.metmuseum.org/art/collection/search/555921',
    'Met koleksiyonundaki erken Yeni Krallık kompozit yay parçasından hareketle hazırlanmış donanım rolü. Bütün Mısır okçularının kompozit yay taşıdığı veya ayrı bir seçkin alay oluşturduğu iddia edilmez.',
    'Açılı kompozit yay, okluk, göğüs kayışı ve keten etek. Yayın tamamlanmış biçimi ve asker kıyafeti rekonstrüksiyondur; firavun başlığı kullanılmadı.',
    { hp: 95, damage: 25, reach: 183, cooldown: 1.8, speed: 26, armor: .03 }),
  make('egypt_khopesh_infantry', 'Yeni Krallık khopesh piyadesi', 'Yeni Krallık Mısır', 'Ramessid dönemi, MÖ 13–12. yy', 'sword', 'Khopesh kılıçlı kalkanlı piyade',
    'https://collections.louvre.fr/ark:/53355/cl010004555',
    'Louvre E 25689, II. Ramses adını taşıyan bronz khopesh örneğidir. Buradaki piyade bu silahın oyun rekonstrüksiyonudur; kraliyet nesnesi standart piyade teçhizatının kanıtı olarak sunulmaz.',
    'Dış kenarı kesici kıvrık bronz bıçak, yuvarlatılmış tepeli ahşap kalkan ve katlı keten etek. Kalkan ve kıyafet temsili; kraliyet arması yok.',
    { hp: 116, damage: 27, reach: 23, cooldown: 1.3, speed: 26, armor: .13 }),
  make('abbasid_mounted_archer', 'Abbâsî atlı okçusu', 'Abbâsî Halifeliği', '9–10. yy', 'cavalry', 'Gulâm geleneğinden atlı okçu',
    'https://www.iranicaonline.org/articles/army-ii/',
    'Abbâsî hizmetindeki Türk askerleri ve İslam ordularında gelişen hareketli atlı okçuluk geleneğini temsil eder. Bütün gulâmların aynı silahı taşıdığı varsayılmaz; yakın dövüş şok süvarisi değildir.',
    'Kısa bileşik yay, okluk, çapraz kapanan binici kaftanı, sivri başlık ve zırhsız at. Kıyafet ve renkler temsili; evrensel siyah üniforma veya geç Memlük zırhı varsayılmadı.',
    { hp: 127, damage: 17, reach: 169, cooldown: 1.65, speed: 44, armor: .09, chargeDamage: 0 }),
  make('daylamite_shield_infantry', 'Deylem kalkanlı piyadesi', 'Deylem toplulukları', '6. yy', 'sword', 'Kılıç ve kalkanlı dağ piyadesi',
    'https://www.iranicaonline.org/articles/deylamites/',
    'Prokopios aktarımı, yaklaşık 552 yılında Sâsânî müttefiki Deylemlileri kılıç, kalkan ve üç ciritle tanımlar. Bu kart kılıçlı yakın dövüş rolüdür; cirit atışı içermez. Bağımsız müttefikler düzenli Sâsânî alayı diye gösterilmez.',
    'Büyük yuvarlak kalkan, düz kılıç, kısa pelerin ve tunik. Kaynak kalkanın biçimini ve üniformayı kesinleştirmez; bu ayrıntılar temsili tamamlandı.',
    { hp: 129, damage: 24, reach: 22, cooldown: 1.25, speed: 25, armor: .2 }),
  make('han_shield_spearman', 'Han kalkanlı mızraklısı', 'Han Hanedanı', 'Batı Han, MÖ 2–1. yy', 'spear', 'Kalkanlı mızrak piyadesi',
    'https://www.clevelandart.org/art/1925.135',
    'Cleveland 1925.135 Han kabartmasında yuvarlak kalkan ve uzun mızrak taşıyan figür bulunur. Kaplanla mücadele sahnesi askerî alay veya standart üniforma kanıtı değildir; kart dönemin donanımından bir piyade rekonstrüksiyonudur.',
    'Yuvarlak kalkan, yaprak uçlu mızrak, kumaş başlık ve çapraz yakalı uzun ceket. Başlık ve giysinin oyun ölçeğindeki tamamlamaları temsili; Qin heykelinin kopyası değildir.',
    { hp: 113, damage: 24, reach: 35, cooldown: 1.4, speed: 24, armor: .12 }),
  make('song_long_spearman', 'Song uzun mızraklısı', 'Song Hanedanı', '11–12. yy', 'spear', 'İki elli mızraklı hat piyadesi',
    'https://central.bac-lac.gc.ca/.item?app=Library&id=MQ54986&oclc_number=1006987062&op=pdf',
    'Song ordularının mızraklı piyade rolü. Wujing Zongyao geleneğinde mızrak ve arbalet birlikte ele alınır; bu kart ateş mızrağı veya Beiwei muhafız alayı değildir.',
    'İki elle tutulan uzun saplı mızrak, katmanlı zırh, boyun korumalı miğfer ve zırhlı etek. Dönem donanımının temsili birleşimi; kesin alay üniforması iddiası yok.',
    { hp: 130, damage: 28, reach: 42, cooldown: 1.65, speed: 21, armor: .24 }),
];
EASTERN_ROSTER_GAPS.find(u => u.id === 'song_long_spearman').sources.push({
  title: 'Song dönemi mızrakları — ek genel kaynak', url: 'https://en.wikipedia.org/wiki/Chinese_polearm',
});
export const EASTERN_ROSTER_GAP_PROFILES = {
  egypt_new_composite_archer: { head: 'ergLinenBand', armor: 'ergArcherKilt', weapon: 'ergAngularBow', cloth: '#dacead', skin: '#ad7b55', bareLegs: true, bareFeet: true, quiver: true },
  egypt_khopesh_infantry: { head: 'ergShortHair', armor: 'ergLayeredKilt', weapon: 'ergKhopesh', shield: 'ergEgyptShield', cloth: '#e2d8b6', skin: '#ac7953', bareLegs: true, bareFeet: true },
  abbasid_mounted_archer: { head: 'ergRidingCap', armor: 'ergRidingCoat', weapon: 'bow', cloth: '#8a785b', horse: 'bay', quiver: true },
  daylamite_shield_infantry: { head: 'ergMountainHair', armor: 'ergMountainTunic', weapon: 'ergStraightSword', shield: 'ergMountainShield', cloth: '#a28a62', beard: true },
  han_shield_spearman: { head: 'ergHanCap', armor: 'ergHanCoat', weapon: 'ergHanSpear', shield: 'ergHanShield', cloth: '#80594c', legWraps: true },
  song_long_spearman: { head: 'ergSongHelmet', armor: 'ergSongLamellar', weapon: 'ergSongSpear', cloth: '#526c70', legWraps: true },
};
