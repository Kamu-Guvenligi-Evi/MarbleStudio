// Institutions are documented; individual loadouts and balance are game interpretations.
const ref = (title, url) => ({ title, url });
export const ANDALUS_RUM_UNITS = [
  {
    id: 'rum_halka_guard', name: 'Halka-i hâs — Selçuklu muhafızı',
    faction: 'Anadolu Selçuklu Devleti', period: '12–13. yy', kind: 'sword',
    role: 'Zırhlı kılıçlı hassa muhafızı', color: '#647b79',
    note: '12–13. yy · Sultana bağlı hassa çevresinin yaya kılıçlı oyun temsili. Gulâmân-ı dergâh ve mefâride gibi ilişkili adlar ayrı kopya birliklere dönüştürülmez. Sivri miğfer, sıralı zırh, kısa çizme ve kılıç-kalkan biçimleri Konya savaşçı kabartmasına dayanır; eserdeki kişilerin hassa askeri olduğu kesin değildir.',
    source: 'https://islamansiklopedisi.org.tr/hassa-ordusu',
    sources: [
      ref('TDV — Hassa ordusu; Anadolu Selçuklu muhafız teşkilatı', 'https://islamansiklopedisi.org.tr/hassa-ordusu'),
      ref('Erkan Göksu (2011) — Türkiye Selçukluları dönemine ait iki askerî ıstılah; s. 144, gulâm adlandırmaları', 'https://dergipark.org.tr/en/download/article-file/636358'),
      ref('Türk ve İslâm Eserleri Müzesi / MWNF — Konya savaşçı kabartması, 12. yy, envanter 2540', 'https://islamicart.museumwnf.org/database_item.php?id=object;ISL;tr;Mus01;10;en'),
    ],
    credit: 'Konya kabartmasından donanım referanslarıyla özgün oyun çizimi',
    visualNote: 'Kabartma dönem savaşçılarını gösterir; belirli bir hassa üniformasını doğrulamaz. Zırhın malzemesi, renkleri ve muhafızla eşleştirilmesi yorumdur.',
    combat: { hp: 156, damage: 29, reach: 19, cooldown: 1.2, speed: 21, armor: .27 },
  },
  {
    id: 'cordoba_saqaliba', name: 'Sakālibe — Kurtuba saray muhafızı',
    faction: 'Kurtuba Halifeliği', period: '10. yy', kind: 'sword',
    role: 'Kılıçlı saray muhafızı', color: '#b18b61',
    note: '10. yy · III. Abdurrahman döneminde Sakālibe içinden oluşturulan saray muhafızlarının temsili. Sakālibe adı bütün üyeleri asker olan tek bir alayı veya etnik Arap birliğini anlatmaz. Kılıç, yuvarlak kalkan ve kemerli kısa tunik için 1004–1005 tarihli Leyre sandığındaki avcı figürü dönem karşılaştırmasıdır; muhafız portresi değildir.',
    source: 'https://islamansiklopedisi.org.tr/sakalibe',
    sources: [
      ref('TDV — Sakālibe; Kurtuba saray muhafızları ve III. Abdurrahman', 'https://islamansiklopedisi.org.tr/sakalibe'),
      ref('Museo de Navarra — Leyre sandığı, 1004–1005', 'https://museodenavarra.navarra.es/documents/20359270/20359292/MdN%2B-%2B6%2BObras%2Bmaestras%2BEN-FR.pdf'),
      ref('Leyre sandığı arka yüzü — kılıç, yuvarlak kalkan ve tunik tasviri', 'https://warfare.ueuo.com/6C-11C/Leyre-Casket.htm'),
    ],
    credit: 'Leyre sandığındaki dönem kıyafetlerinden özgün oyun çizimi',
    visualNote: 'Avcı tasviri muhafızın birebir üniforması değildir. Başlık, renkler ve koruma düzeyi oyun yorumudur.',
    combat: { hp: 124, damage: 25, reach: 18, cooldown: .92, speed: 27, armor: .1 },
  },
];
export const ANDALUS_RUM_PROFILES = {
  rum_halka_guard: { head: 'rumPointHelmet', armor: 'rumReliefArmor', weapon: 'rumSword', shield: 'rumReliefShield', cloth: '#647b79', trousers: '#675644' },
  cordoba_saqaliba: { head: 'cordobaCap', armor: 'cordobaTunic', weapon: 'cordobaSword', shield: 'cordobaRound', cloth: '#b18b61', trousers: '#d0bd96' },
};
