// Allied contingents, not invented elite regiments. Equipment and army ratios
// are explicitly reconstructions where narrative sources do not specify them.
const getica = 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Jordanes/Getica/C*.html';
const polybius = 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/3*.html';
const herodotus = 'https://lexundria.com/hdt/7.202/mcly';
const make = (id, name, faction, period, kind, role, source, note, combat) => ({
  id, name, faction, period, kind, role, source, note, combat, color: '#82755c',
  sources: [{ title: `${name} — tarihî katılım kaynağı`, url: source }],
  credit: 'Kaynaklardan hareketle özgün oyun çizimi',
  visualNote: 'Giysi, renk, silah alt rolü ve sayısal güç oyun rekonstrüksiyonudur; standart üniforma, kesin mevcut veya ayrı seçkin alay iddiası değildir.',
});
export const COALITION_UNITS = [
  make('attila_ostrogoth_cavalry', 'Attila müttefiki Ostrogot süvarisi', 'Ostrogotlar', '5. yy; 451', 'cavalry', 'Mızraklı müttefik süvari', getica,
    'Jordanes Getica 199–200, Valamir ve Ostrogotları Attila yanında anar. Süvari donanımı temsili rol seçimi; bütün Got kuvvetlerinin atlı olduğu ileri sürülmez. Üzengi çizilmez.',
    { hp: 165, speed: 38, damage: 25, reach: 31, cooldown: 1.35, armor: .16, chargeDamage: 33 }),
  make('attila_gepid_spearman', 'Attila müttefiki Gepid mızraklısı', 'Gepidler', '5. yy; 451', 'spear', 'Kalkanlı müttefik piyade', getica,
    'Jordanes Getica 199–200, Ardaric komutasındaki Gepid desteğini kaydeder. Kaynak sabit silah dağılımı vermez; kalkanlı mızraklı bu kontenjanın oyun temsilidir.',
    { hp: 123, speed: 25, damage: 23, reach: 33, cooldown: 1.3, armor: .08 }),
  make('carthage_gallic_swordsman', 'Hannibal müttefiki Galya kılıçlısı', 'Galya / Kartaca hizmeti', 'MÖ 3. yy sonu', 'sword', 'Uzun kılıçlı müttefik piyade', polybius,
    'Polybios 3.114–115, Hannibal merkezindeki Kelt ve İber piyadelerini, Keltlerin uzun kesici kılıçlarını ayırt eder. Bu kart Galya kontenjanıdır; Roma hizmetindeki Galya süvarisinden ayrıdır.',
    { hp: 115, speed: 28, damage: 27, reach: 24, cooldown: 1.35, armor: .04 }),
  make('greek_thespian_hoplite', 'Thespiai hopliti', 'Thespiai', 'MÖ 480', 'spear', 'Aspis kalkanlı müttefik hoplit', herodotus,
    'Herodotos 7.202, Thermopylai ordusunda 700 Thespiailiyi; 7.222 onların Leonidas ile kalışını anlatır. Korinth tipi miğfer ve bronz gövde zırhı dönem yorumu; kesin kent üniforması değildir.',
    { hp: 143, speed: 22, damage: 25, reach: 34, cooldown: 1.4, armor: .22 }),
  make('greek_allied_hoplite', 'Thermopylai müttefik kent hopliti', 'Yunan şehir devletleri', 'MÖ 480', 'spear', 'Müttefik hoplit hattı', herodotus,
    'Herodotos 7.202: Tegea, Mantineia, Arkadia Orkhomenosu ve diğer Arkadialılar, Korinthos, Phlius ve Mykenai kontenjanları. Thebai, Thespiai, Phokis ve Opus Lokris kendi kartlarında temsil edilir. Benzer hoplit rolleri tek kartta toplanır; bütün birliklerin son gün kaldığı veya aynı donanımı taşıdığı iddia edilmez.',
    { hp: 128, speed: 24, damage: 23, reach: 34, cooldown: 1.35, armor: .15 }),
];
COALITION_UNITS.find(u => u.id === 'greek_thespian_hoplite').sources.push({ title: 'Herodotos 7.222 — Thespiaililerin kalışı', url: 'https://lexundria.com/hdt/7.222/mcly' });
COALITION_UNITS.find(u => u.id === 'greek_allied_hoplite').sources.push({ title: 'Herodotos 7.202 — Peloponnesos müttefikleri', url: 'https://lexundria.com/hdt/7.202/mcly' });
export const COALITION_PROFILES = {
  attila_ostrogoth_cavalry: { head: 'bare', armor: 'mail', weapon: 'spear', shield: 'oval', cloth: '#687453', shieldColor: '#9c7449', horse: 'bay', noStirrups: true, cape: '#756049', beard: true },
  attila_gepid_spearman: { head: 'bare', armor: 'ahTunic', weapon: 'spear', shield: 'round', cloth: '#8c7355', shieldColor: '#646e82', legWraps: true, beard: true },
  carthage_gallic_swordsman: { head: 'bare', armor: 'ahTunic', weapon: 'longsword', shield: 'oval', cloth: '#797456', shieldColor: '#876044', braid: true, beard: true },
  greek_thespian_hoplite: { head: 'corinthian', armor: 'bronze', weapon: 'spear', shield: 'aspis', cloth: '#655e7e', shieldColor: '#a08755', bareLegs: true },
  greek_allied_hoplite: { head: 'attic', armor: 'linen', weapon: 'spear', shield: 'aspis', cloth: '#64817a', shieldColor: '#837046', bareLegs: true },
};
