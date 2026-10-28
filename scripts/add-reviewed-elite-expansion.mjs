import fs from 'node:fs';

const researchPath = 'docs/historical-elite-research-2026-10-14.json';
const visualsPath = 'src/historical-unit-visuals.json';
const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
const visuals = JSON.parse(fs.readFileSync(visualsPath, 'utf8'));
const sources = {
  jaguar_bm: ['British Museum — Aztec eagle warrior; Eagle and Jaguar orders', 'https://www.britishmuseum.org/collection/object/E_Am1856-0422-93'],
  carthage_diodorus: ['Diodorus Siculus, Bibliotheca historica 16.80.4 — Kartaca Kutsal Birliği', 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Diodorus_Siculus/16D%2A.html'],
  sherden_getty: ['Jorrit M. Kelder — From Thutmose III to Homer to Blackadder, Getty', 'https://www.getty.edu/publications/egypt-classical-world/01/'],
  gallowglass_mcinerney: ['Luke McInerney — Gallóglaigh Thuadhmhumhain / The Gallowglass of Thomond', 'https://www.clarelibrary.ie/eolas/coclare/history/gallowglass_of_thomond.pdf'],
};
for (const [id, [title, url]] of Object.entries(sources)) {
  research.sources[id] = { title, url, kind: 'müze / tarihsel metin / akademik araştırma', access: '2026-10-14' };
}
const units = [
  {
    id: 'mexica_jaguar', faction: 'Mexica / Aztek', name: 'Jaguar savaşçıları', period: '15.–erken 16. yy',
    kind: 'seçkin savaşçı sınıfı', mount: 'foot', status: 'ana',
    historicalNote: 'Mexica ordusunda Kartal savaşçılarıyla birlikte anılan prestijli savaşçı sınıfı. Modern anlamda tek bir alay olarak düşünülmemelidir.',
    equipmentDraft: 'Macuahuitl ve kalkan; jaguarı temsil eden savaşçı kıyafeti. Kıyafetin gerçek jaguar postundan yapıldığı varsayılmaz.',
    sourceIds: ['jaguar_bm'], visualSourceIds: ['jaguar_codex'],
  },
  {
    id: 'carthage_sacred_band', faction: 'Kartaca', name: 'Kutsal Birlik — Kartaca', period: 'MÖ 4. yy',
    kind: 'seçkin yurttaş piyadesi', mount: 'foot', status: 'ana',
    historicalNote: 'Diodoros, Krimisos savaşında seçkin Kartacalı yurttaşlardan oluşan Kutsal Birliği anlatır. Thebai Kutsal Birliği ile aynı teşkilat değildir; Hannibal dönemine kesintisiz devam ettiği varsayılmaz.',
    equipmentDraft: 'Mızrak ve büyük kalkanlı ağır piyade temsili; oyun teçhizatı tarihsel metnin verdiğinden daha ayrıntılıdır.',
    sourceIds: ['carthage_diodorus'], visualSourceIds: ['carthage_dodge'],
  },
  {
    id: 'egypt_sherden', faction: 'Yeni Krallık Mısır', name: 'Şerden muhafızları', period: 'MÖ 13. yy — II. Ramses',
    kind: 'hükümdar muhafızı', mount: 'foot', status: 'ana',
    historicalNote: 'Mısır hizmetine alınan Şerden savaşçılarından II. Ramsesin muhafızları olarak Kadeşte bulunanlar. Bütün Şerden toplulukları Mısırlı veya muhafız sayılmaz; kökenleri tartışmalıdır.',
    equipmentDraft: 'Uzun kılıç, yuvarlak kalkan, boynuzlu miğfer; kabartmalara dayalı yakın dövüş piyadesi.',
    sourceIds: ['sherden_getty'], visualSourceIds: ['sherden_breasted'],
  },
  {
    id: 'gaelic_gallowglass', faction: 'İrlanda Gal lordlukları', name: 'Gallowglass ağır piyadesi', period: '13.–15. yy seçkisi',
    kind: 'profesyonel ağır piyade', mount: 'foot', status: 'ana',
    historicalNote: 'İskoçya ve Adalardan gelen, İrlanda lordlarının hizmetinde yerleşen profesyonel savaşçı aileleri. Tek bir devletin veya tek bir alayın adı değildir.',
    equipmentDraft: 'Uzun saplı savaş baltası, kılıç, miğfer ve zırh; oyunda yakın dövüş sınıfı.',
    sourceIds: ['gallowglass_mcinerney'], visualSourceIds: ['gallowglass_durer'],
  },
];
// Use the existing Mexica civilization spelling so Eagle/Jaguar stay together.
units[0].faction = research.units.find(unit => unit.id === 'mexica_eagle')?.faction || units[0].faction;
for (const unit of units) {
  const index = research.units.findIndex(existing => existing.id === unit.id);
  if (index < 0) research.units.push(unit); else research.units[index] = unit;
}
const entries = [
  ['mexica_jaguar', 'jaguar_codex', 'elite-mexica-jaguar.jpg', 'File:Jaguar warrior.jpg',
    'Anonim, Codex Magliabechiano, 16. yüzyıl, yaprak 30r; Wikimedia Commons',
    'Erken sömürge dönemi kodeksindeki Jaguar savaşçısı; ritüel dövüş bağlamındadır. Gündelik üniformanın veya bütün savaş teçhizatının şeması değildir.'],
  ['carthage_sacred_band', 'carthage_dodge', 'elite-carthage-sacred-band.png', 'File:Sacred band footman.PNG',
    'Theodore Ayrault Dodge, Hannibal (1891), Sacred Band footman; Wikimedia Commons',
    '1891 tarihli modern tarih çizimi; antik dönem eseri değildir. Kitabın Hannibal başlığı, bu birliğin Hannibal döneminde var olduğunu kanıtlamaz. Kartaca kaydı MÖ 4. yüzyılla sınırlıdır.'],
  ['egypt_sherden', 'sherden_breasted', 'elite-egypt-sherden.jpg', 'File:Relief Sherden Breasted 2.jpg',
    'Abu Simbel kabartması; Ippolito Rosellini çizimi, James Henry Breasted yayını (1908), fig. 2; Wikimedia Commons',
    'II. Ramsesin Şerden muhafızlarını betimleyen Abu Simbel kabartmasının tarihsel çizimi. Fotoğraf değil; özgün kabartmanın yayın üzerinden aktarımıdır.'],
  ['gaelic_gallowglass', 'gallowglass_durer', 'elite-gaelic-gallowglass.jpg', 'File:Galloglass-circa-1521.jpg',
    'Albrecht Dürer, Irish Soldiers and Peasants (1521); Wikimedia Commons kopyası',
    'Gallowglass ve diğer İrlandalı figürlerin birlikte yorumlandığı grup çizimi. 1521 tarihli kıyafet referansıdır; 13. yüzyıl teçhizatına doğrudan uygulanmaz ve bütün figürler ağır piyade değildir.'],
];
for (const [id, sourceId, filename, title, credit, visualNote] of entries) {
  const source = 'https://commons.wikimedia.org/wiki/' + title.replaceAll(' ', '_');
  visuals[id] = {
    image: '/warrior-references/' + filename, credit, source, visualNote,
    license: 'Kamu malı (Public domain) — https://creativecommons.org/publicdomain/mark/1.0/. ' + (filename.endsWith('.png') ? 'Commons dosyası değiştirilmeden kullanılmıştır.' : 'Commons kopyasının 330 piksel önizlemesi.'),
  };
  research.sources[sourceId] = { title: credit, url: source, kind: 'görsel — kamu malı', access: '2026-10-14' };
}
// The archival subdivision records remain available for historical research.
visuals.ottoman_sipah.visualNote = 'Genel sipahi kıyafet referansı; figür yaya resmedilmiştir. Altı Bölüğün tamamına özgü tek tip üniforma olarak yorumlanmamalıdır. 1657–1658 tarihli kıyafet daha erken dönemlere aynen uygulanmaz.';
fs.writeFileSync(researchPath, JSON.stringify(research, null, 2) + '\n');
fs.writeFileSync(visualsPath, JSON.stringify(visuals, null, 2) + '\n');
console.log('Updated 4 elite units, source records, image credits and Ottoman reference note.');
