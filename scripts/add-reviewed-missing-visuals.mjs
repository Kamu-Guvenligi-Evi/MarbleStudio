import fs from 'node:fs';

const path = 'src/historical-unit-visuals.json';
const visuals = JSON.parse(fs.readFileSync(path, 'utf8'));
const commons = title => 'https://commons.wikimedia.org/wiki/' + title.replaceAll(' ', '_');
const entries = [
  ['ghaznavid_guard', 'ghaznavid-guard',
    'File:Guard of the sultan, wall painting from Lashkarī Bazar, Ghaznawid, 11th century (Archaeological Museum, Kabul, Afghanistan).jpg',
    'David Nicolle, Mamluk Studies Review XIX (2016), s. 280; 11. yüzyıl Leşker-i Bâzâr saray muhafızı duvar resmi üzerinden çizim',
    'Gazneli saray muhafızını gösteren duvar resminin modern çizimi. Tören giysisini gösterir; oyundaki atlı okçu temsilinin bütün teçhizatını belgeleyen bir resim değildir.',
    'CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/. David Nicolle; yalnız 330 piksele boyutlandırılmıştır.'],
  ['seljuk_hassa', 'seljuk-hassa',
    'File:Standing guard figure, Seljuk period, Iran, late 12th-13th century.jpg',
    'The Metropolitan Museum of Art, Standing Figure with Feathered Headdress, 12.–erken 13. yüzyıl, eser 454621',
    'Selçuklu saray çevresine ait dönem referansı. Müze figürü kişisel muhafız, vezir veya emir olarak yorumlar; Hassa mensubu olduğu kesin değildir. Eserde modern restorasyonlar vardır; süvari teçhizatı belgesi değildir. https://www.metmuseum.org/art/collection/search/454621',
    'CC0 / kamu malı, The Met Open Access — https://creativecommons.org/publicdomain/zero/1.0/. Yalnız 330 piksele boyutlandırılmıştır.'],
  ['mamluk_burji', 'mamluk-burji',
    'File:Leaf from a Mamluk furusiyya manuscript, Egypt or Syria, ca. 1500, The David Collection, Copenhagen (1) (35600910133).jpg',
    'Richard Mortel, fotoğraf 2017; David Collection, yaklaşık 1500 tarihli Memlük fürûsiyye yazması yaprağı',
    'Burcî dönemine tarihlenen silah talimi resmi; yaya talim yapan kişiyi gösterir. Belirli bir Burcî süvari alayının portresi veya savaş üniforması değildir.',
    'CC BY 2.0 — https://creativecommons.org/licenses/by/2.0/. Fotoğraf: Richard Mortel; yalnız 330 piksele boyutlandırılmıştır.'],
  ['sasanian_aswaran', 'sasanian-aswaran',
    'File:Armed-horseman.JPG',
    'Zereshk, 2005; 78maze kırpması, 2007; Tâk-ı Bostan Sasani zırhlı süvari kabartması',
    'Genellikle II. Hüsrev ile ilişkilendirilen kraliyet süvarisi kabartması. Sasani ağır süvari zırhı için dönem referansıdır; bütün Asvârân birliklerinin tek tip kıyafeti olduğu anlamına gelmez.',
    'Fotoğraf sahibi tarafından kamu malına bırakılmıştır (PD-user: Zereshk). Commons kırpmasının 330 piksel önizlemesi.'],
  ['macedon_companions', 'macedon-companions',
    'File:Alexander and Bucephalus - Battle of Issus mosaic - Museo Archeologico Nazionale - Naples BW.jpg',
    'Berthold Werner; Napoli Ulusal Arkeoloji Müzesi, Pompeii İskender mozaiği ayrıntısı, yaklaşık MÖ 100',
    'At üzerindeki İskenderi gösteren, yaşamından sonraki bir mozaik. Hetairoi komutanı ve Makedon süvarisi için bağlamsal referanstır; sıradan bir Hetairoi askerinin portresi değildir.',
    'Fotoğraf: CC BY-SA 3.0 — https://creativecommons.org/licenses/by-sa/3.0/. Berthold Werner; yalnız 330 piksele boyutlandırılmıştır; bu görsel aynı lisansla sunulur.'],
  ['parthian_cataphract', 'parthian-cataphract',
    'File:ParthianCataphract.JPG',
    'World Imaging; British Museum, aslanla savaşan zırhlı süvari kabartması, nesne W_-91908',
    'Eser Seleukos veya Part dönemine (MÖ 3.–2. yüzyıl) atfedilir; kesin Part kimliği iddiası yoktur. Zırhlı süvari için dönem referansıdır. https://www.britishmuseum.org/collection/object/W_-91908',
    'Fotoğraf sahibi tarafından kamu malına bırakılmıştır (PD-self, World Imaging). Yalnız 330 piksele boyutlandırılmıştır.'],
  ['rome_equites', 'rome-equites',
    'File:Funerary altar of Marius Alexander of the equites singulares (AE 1982, 76) 02 det.jpg',
    'Mark Landon, 2008; Museo Nazionale Romano, Equites Singulares mensubu Marius Alexander mezar sunağı, AE 1982, 76',
    'Geç 2.–erken 3. yüzyıla tarihlenen mezar sunağında iki at arasında bir asker. Birlik mensubuyla doğrudan bağlantılı mezar tasviridir; çatışma duruşu veya eksiksiz muharebe teçhizatı belgesi değildir.',
    'CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/. Fotoğraf: Mark Landon; yalnız 330 piksele boyutlandırılmıştır.'],
];
for (const [id, filename, title, credit, visualNote, license] of entries) {
  const image = `/warrior-references/elite-${filename}.jpg`;
  if (!fs.existsSync('public' + image)) throw Error(`Missing image: ${image}`);
  visuals[id] = { image, credit, source: commons(title), visualNote, license };
}
fs.writeFileSync(path, JSON.stringify(visuals, null, 2) + '\n');
console.log(JSON.stringify({ added: entries.map(entry => entry[0]) }));
