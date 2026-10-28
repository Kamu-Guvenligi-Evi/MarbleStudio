import fs from 'node:fs';
const p='package.json',pkg=JSON.parse(fs.readFileSync(p,'utf8'));pkg.scripts['test:merge']='node tests/merge-evolution.mjs && node tests/merge-evolution-browser.mjs && node tests/merge-theme-editor.mjs';fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n');
fs.appendFileSync('src/merge-evolution.css','\n.settings-grid>.muted{grid-column:1/-1;margin:0}\n');
fs.writeFileSync('docs/merge-current-state.txt',`28 Ekim 2026 — güncel durum (eski library-merge notundaki sayılar ve fizik ayarları güncel değildir).
27 zincir, 24 menü kartı; Pokémon tek kartta dört zincir. Diğer temalar altı basamak.
Kullanıcı bitiş tercihi: Son forma ulaşana kadar sürekli akış; son formdan sonra 3 saniye gösterim.
Süreye bağlı erken bitiş ve 180 nesnede giriş kesilmesi kaldırıldı. normalizeMerge.duration eski dosyaları okuyabilmek için duruyor ancak oyunu bitirmiyor; UI'dan kaldırıldı.
probeMerge 30 dakika hesaplama sonunda son form yoksa açık hata verir; yarım oyunu tamamlandı diye dışa aktarmaz. Canlı oyun bu sınırdan etkilenmez.
Tema düzenleyici: 2–6 basamak, mevcut görsel seçimi, ad, sıralama, kaldırma/ekleme, sıfırlama. themeEdits tema başına ayarlar içinde saklanır; snapshot ve video aynı zinciri kullanır. Yeni dosyalar merge-theme-editor.js ve tests/merge-theme-editor.mjs.
Kontroller: 27/27 varsayılan zincir final; deterministik fizik, değer korunumu, eski süre sonrası akış, 180 nesne sonrası giriş, mobil, kalıcılık, özel zincirin video çıktısı, orijinale dönüş başarılı. Vite build başarılı; paket boyutu uyarısı mevcut.
Referans 115549.mp4 her 4 saniyede örneklenerek artifacts/reference-flow.jpg dosyasında incelendi. Bölümler boyunca düzenli üst giriş görülüyor; bu örnekleme tam kare-kare hız ölçümü değildir.
Önceki görsel işi henüz bitmedi: Uzayda cosmos, sun-life, massive-star, missions, moons bazı eski SVG yer tutucuları içeriyor. Yanlış KindPNG adayları kullanılmamalı. Önceki özet ve manifest kaynaklarına bak. Gezegenlerin mevcut PNG'leri temiz. Spor, futbol, otomobil, müzik güncellemeleri mevcut. Meyvelerde fide/ahududu düzeltildi. Yeni görsel üretilmemeli; internet kaynakları tercih ediliyor.
Kullanıcıdan ayrıca onay almadan alt ajan açma; internet kullanımını düşük tut. scripts/*apply*, six-stage-curation, replace-merge-art gibi eski mutasyon betiklerini tekrar çalıştırma.
`);
