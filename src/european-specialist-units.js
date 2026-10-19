// Famous military specialists; these are not all standing elite guard regiments.
const welshMuseum = 'https://museum.wales/collections/online/object/228d8c8e-73b5-3d7b-aab0-c907584af17d/Model-of-Longbowman/';
const hussarShield = 'https://www.metmuseum.org/art/collection/search/24698';
const hussarStudy = 'https://doktori.bibl.u-szeged.hu/2436/8/kovacs.tibor.angol.tezis.pdf';
const flailMuseum = 'https://www.esbirky.cz/predmet/cep-7381395';
export const EUROPEAN_SPECIALIST_UNITS = [
  {
    id: 'welsh_longbowman', name: 'Galler uzun yaylı okçusu', faction: 'Galler / İngiliz hizmeti',
    period: '14. yy sonu–15. yy başı', kind: 'ranged', role: 'Uzun yaylı uzman piyade', color: '#54745a',
    note: 'İngiliz ordularında hizmet veren Galli okçuların temsili. Museum Wales koleksiyonundaki yaklaşık 1405 tarihini canlandıran modern modelin giysi tarifi kullanıldı: keten içlik, kısa kollu yün kapitone, yeşil-beyaz üst giysi, başlık ve miğfer. Bu renkler bütün Galli askerlerin ortak üniforması değildir; müze, Flint okçularının 1346 tarihli giysi kaydıyla benzerlik kurar.',
    source: welshMuseum, sources: [{ title: 'Amgueddfa Cymru — uzun yaylı okçu modeli, 2002.22H', url: welshMuseum }],
    credit: 'Museum Wales giysi tarifi ve kalkan ayrıntısıyla karşılaştırılan özgün çizim',
    visualNote: 'Müze modeli modern bir rekonstrüksiyondur. Yeşil-beyaz giysi ve kırmızı çoraplar yazılı tarife; kemerdeki küçük çelik kalkan fotoğrafa dayanır. Miğfer biçimi, renk tonları ve yüz yorumdur. Kalkan atış sırasında elde tutulmaz.',
    combat: { hp: 98, damage: 23, reach: 215, cooldown: 1.75, speed: 24, armor: .06 },
  },
  {
    id: 'hungarian_early_hussar', name: 'Erken Macar hussarı', faction: 'Macaristan Krallığı',
    period: 'Yaklaşık 1500–1550', kind: 'cavalry', role: 'Hafif mızraklı süvari', color: '#9b4a38',
    note: 'Macar ordularında kullanılan erken hussar süvarisi. Hafif mızrak, örgü zırh, konik miğfer ve boynu koruyan yükseltilmiş arka kenarlı kalkanla temsil edilir. Tibor Kovács’ın silah araştırması ve Met koleksiyonundaki 42.50.29 numaralı kalkan esas alındı. Lehlilerin kanatlı hussarıyla veya daha geç dönem üniformalarıyla aynı birlik değildir.',
    source: hussarShield, sources: [
      { title: 'Metropolitan Museum — Hungarian-Style Shield, 42.50.29', url: hussarShield },
      { title: 'Tibor Kovács — Hungarian hussar arms, doktora tezi İngilizce özeti, 2008', url: hussarStudy },
    ],
    credit: 'Met kalkan fotoğrafı ve Kovács silah incelemesinden özgün çizim',
    visualNote: 'Asimetrik kırmızı kalkan ve koyu çizgisi müze nesnesinden sadeleştirildi. Miğfer ve örgü zırh dönem donanım seçenekleridir; tek bir savaşçının eksiksiz portresi değildir. At, giysi rengi ve yüz yorumdur.',
    combat: { hp: 163, damage: 25, reach: 32, cooldown: 1.2, speed: 43, armor: .16, chargeDamage: 42 },
  },
  {
    id: 'hussite_flailman', name: 'Hussit savaş dövenli piyade', faction: 'Bohemya / Hussitler',
    period: '15. yy', kind: 'sword', role: 'İki elli savaş dövenli piyade', color: '#8d7956',
    note: 'Hussit savaşlarıyla tanınan piyadenin savaş harman dövenli temsili. Uzun ahşap sap, kısa eklem ve demir şeritlerle güçlendirilmiş ahşap vurucu baş kullanılır. Hussit müzesi savaş düzeni anlatımıyla ve Çek Ulusal Müzesi H2-20 kaydıyla karşılaştırıldı. Bu kayıt daimi seçkin muhafız birliği anlamına gelmez; savaş arabası ayrı bir oyun mekaniği olarak eklenmedi.',
    source: flailMuseum, sources: [
      { title: 'Národní muzeum / eSbírky — Cep bojový, H2-20', url: flailMuseum },
      { title: 'Hussite Museum Tábor — The Hussites sergisi', url: 'https://www.husitskemuzeum.cz/exhibition-the-hussites/' },
    ],
    credit: 'Çek Ulusal Müzesi savaş döveni fotoğrafından özgün silah çizimi',
    visualNote: 'H2-20 kaydında 15. yy tipi nesnenin 19. yy kopyası olabileceği belirtilir. Özgün Orta Çağ eseri olduğu kesin kabul edilmedi. Giysi ve sade başlık yorumdur; silahın ahşap gövdesi, demir kuşakları ve eklem bağlantısı fotoğrafla karşılaştırıldı.',
    combat: { hp: 127, damage: 34, reach: 27, cooldown: 1.55, speed: 22, armor: .09 },
  },
];
export const EUROPEAN_SPECIALIST_PROFILES = {
  welsh_longbowman: { head: 'welshCoifHelmet', armor: 'welshLiveryJack', weapon: 'longbow', shield: null, cloth: '#d3c9a8', trousers: '#874b42', quiver: false },
  hungarian_early_hussar: { head: 'earlyHussarHelmet', armor: 'hussarMailCoat', weapon: 'lance', shield: 'hungarianWingShield', cloth: '#9b4a38', trousers: '#645747', horse: 'bay' },
  hussite_flailman: { head: 'hussiteFeltCap', armor: 'hussitePaddedCoat', weapon: 'warFlail', shield: null, cloth: '#8d7956', trousers: '#756a54' },
};
