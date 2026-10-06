# Marble Studio

İçerik Atölyesi, OAuth ile bağlanan YouTube kanallarına üretim sonrası otomatik yükleme ve kanal başına günlük reçete destekler. Kurulum ve Google API sınırlamaları: [FACTORY.md](FACTORY.md#youtubea-otomatik-yükleme).

## Hızlı kullanım

Studio artık sade bir başlangıç ekranıyla açılır. **Bana bırak → Videomu oluştur** tek bir videoyu otomatik hazırlar. İstersen Parkur, Arena, Spiral veya İstatistik seçebilirsin. Yarış düzeni, kadro, müzik, süre ve çıktı ayarları otomatik belirlenir. Yarışlar doğal hızda, 25–180 saniyelik dikey 1080p MP4; istatistikler kaynaklı kütüphaneden bir konuyla yaklaşık 30 saniyelik yatay MP4 olarak hazırlanır. İstatistik çıktısı sessizdir.

**Videolarım** üretim durumunu, izlemeyi ve indirmeyi açar. **Kendim düzenleyeyim** ayrıntılı editöre geçer; **Ana ekran** sade görünüme döner. Editöre doğrudan erişim: `http://127.0.0.1:5173?edit=1`. Otomatik üretim mevcut taslakları değiştirmez.

Masaüstü kısayolu Studio ve video hizmetini birlikte başlatır. Video hizmeti güncellendiyse bir kez yeniden başlatılmalıdır. **Çalışmalarım** isimli kayıtları korur; editördeki **Yedekler** menüsünden yedek alıp yükleyebilirsin. Üretilmiş videolar için ayrıca `output/` klasörünü yedekle.

## Otomatik yarış bölümleri

Otomatik **Parkur** üretimi dört gerçek yarış kuralından birini geçmişe göre seçer. Ana ekranda ek ayar gerekmez:

- **Sprint:** 12 yarışmacı; ilk finiş kazanır.
- **Eleme kupası:** üç farklı parkurda 12 → 8 → 4 yarışmacı; finalde ilk finiş kazanır.
- **Takım mücadelesi:** A/B/C takımlarında dörder yarışmacı; ilk altı finiş sırasıyla 6–1 puan getirir. En yüksek takım toplamı kazanır.
- **Üç etaplı şampiyona:** aynı 12 yarışmacı üç farklı parkurda yarışır. Her etapta ilk altı 6–1 puan alır; toplam puan kazanır. Eşitlikte son etaptan geriye doğru finiş sıraları karşılaştırılır.

Tek etaplar 4–5, çok etaplı yarışların her etabı 2–3 engel bölümü kullanır. Tur bilgisi, eleme kuralı, puan tablosu ve sonuç videoda görünür. Katılımcı adı, rengi ve numarası turlar boyunca korunur. Takım yarışında renk takımını gösterir. Etap finişinde yarışmacıların tamamı beklenmez; elemede gereken kontenjan veya puanlı yarışta ilk altı finiş tamamlanınca etap kapanır.

Planlayıcı son 300 parkur üretiminde daha az kullanılan formatı tercih eder. Format geçmişi tekrar hafızasında saklanır; iş arşivi temizlense de yeni kayıtların format geçmişi korunur. Tekrar kimliği bütün etapları ve kuralları kapsar. Eski hizmet sürümü yeni otomatik iş kabul etmez: video hizmetini yeniden başlatmak gerekir.

Bu dört format yalnızca otomatik parkura eklenmiştir; Arena, Spiral ve İstatistik havuzlarını genişletmez. Yeni anlatım veya rövanş üretimi bu sürümde yoktur. Görsel kalite kontrolleri izleyici ilgisi ya da YouTube para kazanma garantisi değildir.

Kontroller: `node tests/episode-formats.mjs`, Studio açıkken `node tests/episode-browser.mjs`; dört gerçek MP4 için `node tests/episode-export.mjs`. Son komut çıktıları ayrı bir `artifacts/episode-exports-*` klasörüne yazar.

## Studio → MP4 / seri üretim

Üstteki **Video oluştur** düğmesi açık çalışmayı aynı pencereden üretim kuyruğuna gönderir. Kadro, yüklenmiş görseller, isimler, müzik tercihi ve lider müziği eşleştirmeleri korunur. İstatistik ekranında uygulanan tablo, başlık, kaynak ve sunum seçenekleri kullanılır. Studio 5173, video hizmeti 5180 adresinde çalışır; masaüstü kısayolu ikisini birlikte başlatır.

- **Aynı çalışmayı dışa aktar:** mevcut düzen numarası ve hız 1× korunur. Parkurda bütün topların bitişi, ayarlı geri sayım ve sonuç süresi kaydedilir. İstatistik tablosu kendi süresinde oynatılır ve iki saniye son sonuç gösterilir. Tamamlama sınırı simülasyonda 10 dakikadır.
- **Yeni düzenler:** kadro ve parkur/tema korunur, başlangıç düzeni değişir. Bitiş ve süre kontrollerinden geçen adaylar seçilir. İstatistikler için bu seçenek kapalıdır.
- MP4 için dikey / yatay / kare, 720p / 1080p, 30 / 60 FPS, ses ve üç sunum seçeneği bulunur. Görüntü seçilen çerçeveye kesilmeden sığdırılır; farklı yönlerde boş alan kalabilir. Giriş ve kapanış metni düzenlenebilir. Eski **Videoya kaydet** düğmeleri doğrudan tarayıcıdan WebM kaydını sürdürür.
- **Yedek indir** bütün Studio ayarlarını, tabloları ve görselleri JSON dosyasına kaydeder. **Yedek yükle** önce mevcut ayarların kopyasını indirir, sonra yedeği uygular. Hatalı dosya mevcut çalışmayı değiştirmez. Yedek video dosyalarını ve Atölye iş geçmişini içermez; bunlar `output/` klasöründedir.

**Kontroller:** `npm.cmd test` veri/fizik kontrollerini ve derlemeyi; `npm.cmd run check` bunlara güncel tarayıcı testlerini ekler. `npm.cmd run check:export` ayrıca dört formatı gerçek MP4 olarak üretir ve çözer; birkaç dakika sürebilir. Test Atölyesi ayrı bir portta ve `artifacts/` altında çalışır, gerçek üretim kuyruğuna iş eklemez. Eski editör senaryoları tarihsel dosyalardır; güncel ana test listesine dahil değildir.


Spiral için düşüş, kırılma, çoğalma ve bitiş efektleri canlı oynatmada ve otomatik videolarda bulunur. İçerik Atölyesi'nin v2 üreticisi altı parkur profili, üç tempo akışı, 4–8 bölüm ve dört spiral davranışı kullanır. Ayrıntılar ve test komutları: [FACTORY.md](FACTORY.md).

**Toplu video üretimi:** `Start-Factory.cmd` ile hizmeti başlat, [İçerik Atölyesi](http://127.0.0.1:5180) panelinden seri oluştur. Değişken parkurlar, otomatik bitiş kontrolü, MP4 ve paylaşım metinleri üretir. Kurulum ve günlük üretim açıklamaları: [FACTORY.md](FACTORY.md).

Spiral çoğalma ekranındaki **Spiral teması** menüsünde Buz Kıran, Lav Çekirdeği, Kutup Işıkları, Altın Kasa, Şeker Sarmalı ve Kozmik Kristal bulunur. Temalar spiral malzemesini, arka planı, top paletini ve kırılma parçalarını değiştirir. Seçim otomatik saklanır ve video kaydında kullanılır; kayıt sırasında tema değiştirilemez. Tema kontrolleri: `node tests/spiral-themes.mjs`.

Kodla çizilen ve Matter.js fiziğiyle çalışan yerel 2D top yarışı uygulaması. Görsel/video AI servisi veya API anahtarı kullanmaz.

## İstatistik yarışı

Üstteki **İstatistik yarışı** sekmesi yıllara göre değişen yatay çubuk sıralamasını açar. Çubuklar soldan sağa uzar; değerler değiştikçe yarışmacılar sıralamada akıcı biçimde yer değiştirir. Bu alan parkur ve küre arenasından bağımsızdır; sekme değiştirmek oynayan yarışı duraklatır.

**Hazır veri kütüphanesi:** 11 kaynaklı veri setinden bir karta tıklayın; başlık, birim, kaynak ve tablo birlikte yüklenir. Yeni yarış hikâyeleri listenin başındadır. Kategori filtresiyle futbol, motor sporları, uzay, otomotiv, seyahat, nüfus, ekonomi veya teknoloji seçilebilir. Dosyalar yereldir; oynatma için internet gerekmez. Kaynak ve kapsam bölümünde bağlantılar, alınma tarihi, kullanım koşulları ve seçim yöntemi bulunur.

| Konu | Kapsam |
| --- | --- |
| Süper Lig: kupa yarışı | 1959–2026; 6 kulüp; sezon sonuçlarından birikimli kupalar |
| Formula 1: galibiyet rekoru | 1950–2025; 30 pilot; 1.149 yarışın sonuçlarından birikimli galibiyetler |
| Uzay yarışı: yörüngeye çıkanlar | 1957–2025; 18 ülke; UNOOSA kaydındaki birikimli uzay nesneleri |
| Elektrikli otomobil yarışı | 2015–2025; 15 ülke; yıllık bataryalı + fişli hibrit otomobil satışları |
| Turizm: pandemi kırılması | 1995–2020; 15 ülke; pandemi öncesi yükseliş ve ilk yıldaki düşüş |
| Avrupa Kupası / Şampiyonlar Ligi | 1956–2026; 24 şampiyon kulübün birikimli kupaları |
| Nüfus | 1960–2025; her sette seçili 30 ülke/ekonomi |
| GSYİH, kişi başına GSYİH, ihracat | 1990–2025; cari ABD doları; her sette seçili 30 ülke/ekonomi |
| İnternet kullanımı | 2000–2024; her sette seçili 30 ülke/ekonomi |

Dünya Bankası kadroları, dönem boyunca verisi eksiksiz olan ülke/ekonomilerin son yıl değerlerine göre seçilir; uygun verisi varsa Türkiye dahil edilir. Bu sabit kadrolar tüm dünyanın eksiksiz sıralaması değildir; eksik gözlemler sıfırla veya tahminle doldurulmaz. Futbol sayıları yıllık basamaklarla ilerler, kesirli kupa gösterilmez.

Yeni seriler `scripts/statistics_stories.py` ile ham kayıtlardan üretilir. Süper Lig için TFF sezon şampiyonları; F1 için sayfalanmış Jolpica/Ergast yarış sonuçları; uzay, otomotiv ve turizm için UNOOSA, IEA ve UN Tourism verilerinin Our World in Data sürümleri kullanılır. Ham CSV/JSON/HTML yanıtları ve indirme adresleri `scripts/statistics-cache/` içinde tutulur. `python scripts/import-statistics.py` önbellekten bütün 11 seriyi yeniden üretir.

Süper Lig sayımı 1959’dan başlar; Beşiktaş’ın yıldız hesabına eklenen 1957–1958 kupaları dahil değildir. F1 sprintleri sayılmaz, ortak yarış galibiyetleri her kazanan pilota yazılır; bütün tarihsel liderler kadroda korunur. Uzay serisi roket veya faal uydu sayısı değil, kayıttaki nesnelerin toplamıdır; kayıtsız yıllarda yeni nesne kaydı yok kabul edilir ve veri tabanının eksik kapsamı açıklamada belirtilir. EV ve turizm serilerinde eksik yıllar doldurulmaz. Turizm 2020 kırılmasını anlatan tarihsel bir penceredir, güncel sıralama değildir. Yeni seriler varsayılan olarak yıllık basamaklarla ilerler.

`npm run test:stories` yeni tablolardaki bütün değerleri kaynak kayıtlarıyla karşılaştırır; tarihsel liderlerin korunmasını, pandemi düşüşünü, kart seçimlerini, kaynak açıklamalarını, mobil görünümü ve video kaydını kontrol eder.

`public/statistics/manifest.json` kaynakları ve kapsam notlarını, yanındaki CSV dosyaları tabloları içerir. `python scripts/import-statistics.py` önbellekteki yanıtlarla aynı veri setlerini yeniden üretir. `--refresh` Dünya Bankası yanıtlarını yeniden indirir; UEFA sezon listesi kaynaklarıyla `scripts/statistics-football.json` içinde tutulur ve yeni sezonlar ayrıca doğrulanarak eklenir. Ham API yanıtları `scripts/statistics-cache/` içindedir. `npm run test:statistics-library` bütün sayıları kaynak yanıtlarıyla, sezon toplamlarını, kaldırılan seçimlerden geçişi, kaynak gösterimini ve tarayıcı akışını kontrol eder.

- İlk açılışta 2000–2025 arasında on hayali yarışmacının **örnek verisi** gösterilir; gerçek istatistik olmadığı görüntüde ve videoda belirtilir.
- **CSV yükle** ile kendi tablonu getir veya alttaki metni düzenleyip **Veriyi uygula** düğmesine bas. İlk satır `Yıl,Alfa,Beta`, sonraki satırlar `2000,10,20` gibi olmalıdır. 1–301 yıl ve 2–30 yarışmacı gerekir. Tek yıl satırı sabit karşılaştırmadır. Her satırda bütün değerler bulunmalı; eksik değerler sıfır sayılmaz. Negatif değerler desteklenmez. Akıcı geçiş ara yılları doğrusal hesaplar; yıllık geçiş değerleri bir sonraki veri yılına kadar korur. Kendi tablonu uygulamak hazır verinin kaynak etiketini kaldırır.
- Virgüllü CSV içinde ondalıklar noktayla yazılır. Excel'den gelen noktalı virgüllü CSV içinde ondalık virgül de kabul edilir. Binlik ayıracı kullanma. Hatalı dosya mevcut yarış verisini değiştirmez.
- Başlık, birim, kaynak, ilk 5/10/15 gösterimi ve 15/30/60/120 saniyelik süre seçilebilir. Başlat/duraklat, başa al, yıl çizgisinde gezinme ve tam ekran bulunur. Uygulanan veri ve sunum ayarları bu tarayıcıda otomatik saklanır; **CSV indir** uygulanan tabloyu dışa aktarır. CSV dosyası sunum ayarlarını içermez.
- **Videoya kaydet**, yarışı baştan **sessiz 1920×1080 yatay WebM** olarak kaydeder; son sıralamayı iki saniye gösterip indirir. Erken bitirme ve son videoyu yeniden indirme desteklenir. Kayıt boyunca sekmeyi görünür tut. Kayıt sırasında veri düzenleme ve diğer yarış sekmelerine geçiş kilitlenir.

`src/statistics-data.js` veri doğrulaması ve yıl hesaplamasını, `src/statistics.js` ekranı, animasyonu ve kaydı, `src/statistics.css` görünümü içerir. `npm run test:statistics` veri doğrulaması, sıralama, oynatma, CSV aktarımı, taslak kalıcılığı, mobil görünüm ve otomatik 1920×1080 video kaydını doğrular. Tarayıcı testi için yerel sunucu açık olmalıdır.

## Açılış

**Ortak geliştirme ve kullanım:** GitHub Desktop'ta bu depoyu **Clone** ile bilgisayarına indir, ardından **Repository → Show in Explorer** ile klasörü açıp `Baslat.cmd` dosyasına çift tıkla. İlk açılışta Node.js, uygulama bağımlılıkları ve video tarayıcısı otomatik hazırlanır; elle kurulum, npm komutu veya yönetici izni gerekmez. İlk hazırlık için internet gerekir. Sonraki açılışlarda aynı araçlar tekrar kullanılır.

Güncelleme almak için GitHub Desktop'ta **Fetch origin → Pull origin**, ardından `Baslat.cmd`. Bağımlılıklar değiştiyse otomatik yenilenir; uygulamanın yönettiği sunucular yeni kodla açılır. Devam eden video üretimi varsa video hizmeti yeniden başlatılmaz; iş bitince `Baslat.cmd` yeniden açılır. Kod değişiklikleri editörde anında uygulanır. Kendi değişikliklerini GitHub Desktop'ta **Commit → Push origin** ile paylaş. Herkesin yazabilmesi için organizasyondaki ekibe bu depoda **Write** yetkisi verilmeli. Araçlar, videolar ve kişisel ayarlar Git'e gönderilmez.

Geliştirme araçlarını elle yönetmek isteyenler için `npm install` ve `npm run dev` de kullanılabilir.

**Ortak çalışma videoları:** Mevcut 32 farklı kayıt `work-videos/` klasöründe paylaşılır. GitHub Desktop'ta Clone/Pull yapınca videolar Git LFS üzerinden gelir. Uygulamanın **Videolarım** listesinde diğer hazır videolarla birlikte görünür; izlenebilir, indirilebilir ve klasörde açılabilir. Üretim ayarları bulunan kayıtların `metadata.json` dosyaları da paylaşılır. Yeni üretilen kişisel videolar `output/` altında kalır; ortak arşiv her kullanıcının üretim geçmişinden ayrıdır.

**Başka Windows PC’de kurulum olmadan:** Taşınabilir ZIP paketini bir klasöre çıkartıp `MarbleStudio/Baslat.cmd` dosyasına çift tıkla. Node.js, uygulama bağımlılıkları, FFmpeg ve video üretim tarayıcısı paketin içindedir; Node.js, npm veya Chrome kurmak gerekmez. Windows 10/11, 64 bit içindir. GitHub'daki **Code → Download ZIP** kaynak kodudur; taşınabilir paket **Releases** bölümünden indirilir.

## Dört ayrı yarış alanı

Üst menüden **Parkur yarışı**, **Küre arenası**, **İstatistik yarışı** veya **Spiral çoğalma** açılır. Uygulama doğrudan Parkur yarışı ekranında başlar. Parkur oluşturma, bölüm düzenleme ve Parkurlarım arayüzü kaldırılmıştır.

- **Parkur yarışı:** Hazır parkur seç, yarışmacı sayısını ayarla, **Kadroyu seç** ile görsel kütüphanesinden yarışmacı ekle ve **Başlat** düğmesine bas. Önceki taslakta bulunan özel parkur ilk açılışta korunur; hazır parkur seçmek bunu o yarışın taslağında değiştirir.
- **Küre arenası:** Kendi kadrosunu ve yarış ayarlarını kullanır. Toplar üç bağla başlar; duvara çarptıkça bağ kurar, rakiplerinin bağlarını keser. Her duvar çarpışmasında topun hızına başlangıç hızının %0,25'i eklenir; hız küçük ve eşit adımlarla artar. Bağı kalmayan elenir, son bağlı top kazanır. Kamera ve parkur seçimi bu alanda gösterilmez.
- **İstatistik yarışı:** Kendi veri kütüphanesi, tablo düzenlemesi, zaman çizgisi ve yatay video kaydı bulunur. Top yarışlarının ayarları bu ekranda gösterilmez.
- **Spiral çoğalma:** Sağ üstten gelen top buza temas edince küçük bir bölgeyi kırıp kaybolur. Buz iki boyutlu bir alandır; çentikler ve kenarlarda kalan çıkıntılar sonraki toplarla kırılır, ana kütleden kopan parçalar düşer. Grup tükenince bir kare sonra dışarıdan yeni top gelir. ×2 noktasında oluşan grup 0,06 saniyelik aralıklarla kanala girer; sonraki grup için çarpan bir artar. Toplar alt tarafta hızlanır, üst tarafta yavaşlar. Her topun rengi sabittir; spiral daha kalın, sabit gri-mavi kenarlıklara sahiptir. Merkez açılınca simülasyon biter. Üst sınır 64 toptur. Başlangıç sayısı, kadro, ses, hız ve sunum ayarları ayrı saklanır; tek müzik ve 1080 × 1920 video kaydı desteklenir. Başlık kaldırılmıştır; video görüntüsünde ek logo, alt sayaç veya ilerleme çubuğu yoktur. Referans: https://www.instagram.com/reel/DcRTleaon6_/ — animasyon Canvas ile yeniden çizilir; kaynak video oynatılmaz.

`src/spiral-ice.js` temas alanını ve kırılan parçaları tutar. `scripts/analyze-spiral-reference.py`, yerelde bulunan referans videosundan top konumlarını ve buz alanını ölçer; uygulamada kullanılmaz. Varsayılan akış, referansın ilk darbe, çoğalma ve grup girişleri incelenerek ayarlanmıştır.

Spiral mantığı `src/spiral.js`, çizimi `src/spiral-renderer.js` içindedir. `marble-studio-spiral-v1` taslağı diğer alanlardan bağımsızdır. `npm run test:spiral` çoğalma, tamamlanma, aynı düzenin tekrar oynatılması, taslak doğrulaması, sekme geçişleri, duraklatma, mobil görünüm ve manuel/otomatik video indirmeyi denetler. Tarayıcı testi için yerel sunucu açık olmalıdır.

Parkur ve arena; kadro, sayı, ses, izler, düzen numarası, oynatma hızı, sunum süreleri ve müzik tercihlerini ayrı saklar. Yarış türü değiştirildiğinde seçilen tür kendi ayarlarıyla başa alınır. İstatistik ekranına geçmek oynayan top yarışını duraklatır. Müzik paneli gerektiğinde açılır; lider müziği parkura, tek parça müzik seçimi her iki top yarışına uygundur.

**Yarış ayarları** etkin top yarışının araç çubuğundadır. **İzleme seçenekleri** hız ve kamera kontrollerini içerir. **Videoya kaydet** mevcut yarışı baştan kaydeder; tamamlandığında indirir. Kayıt sırasında yarış türünü ve kadroyu değiştirmek kilitlenir. Erken bitirmek için **Kaydı bitir ve indir** kullanılır.

Yeni taslaklar `marble-studio-track-v1` ve `marble-studio-arena-v1` anahtarlarında saklanır. Eski taslak ilk geçişte ilgili alana aktarılır; eski isimli kayıtlar tarayıcıdan silinmez. İstatistik taslağı kendi anahtarını kullanır.

## Alan Savaşı

**Kendim düzenleyeyim → Arena → Arena oyunu → Alan Savaşı** ile açılır. Üçgen, kare, altıgen, yıldız veya daire seç; mevcut ülke, takım, burç veya özel görsel kadron yarışsın. Toplar kendi bölgelerinden çıkıp iz çizer; geri döndüklerinde çevreledikleri alanı ele geçirir. Rakibin açık izine dokunmak hamlesini iptal eder. Rakiplerin bölgeleri de el değiştirebilir. 30, 45 veya 60 saniye sonunda en çok alanı olan kazanır; eşit alan varsa beraberlik gösterilir.

Şekil, süre ve kadro taslaklarda, kaydedilmiş çalışmalarda ve yedeklerde korunur. **Video oluştur** aynı mücadeleyi MP4 olarak üretir; otomatik Arena üretimi de şekilleri kullanabilir. Görsel referans: [üçgen alan mücadelesi](https://www.youtube.com/shorts/1vDss0KwZgk). Referans video uygulamaya eklenmez; alan kapatma ve çizim uygulamanın kendi simülasyonudur.

Kontroller: `node tests/territory.mjs`, yerel sunucu açıkken `node tests/territory-browser.mjs`; gerçek MP4 için `node tests/territory-export.mjs`. Deneme çıktıları `artifacts/` altındadır.

## Geliştirme ve kontrol

- `src/app.js`: dört yarış alanı, ayrı taslaklar, oynatma ve video kaydı.
- `src/studio-layout.css`: yarış alanlarının masaüstü ve mobil düzeni.
- `src/music.js`: parkur ve arena için ayrı müzik tercihleri.
- `src/physics.js`, `src/courses.js`: parkur fiziği ve hazır parkurlar.
- `src/arena.js`, `src/arena-renderer.js`: küre arenası fiziği ve çizimi.
- `src/statistics.js`, `src/statistics-scale.js`: istatistik yarışı ve değişken eksen ölçeği.
- `src/ball-editor.js`, `src/image-catalog.js`: kadro ve görsel seçimi.

Yerel sunucu açıkken `npm run test:workspaces` üç alanın ayrımını, eski editörün kaldırılmasını, kadro/ayar/müzik kalıcılığını, video kaydı kilitlerini ve mobil taşmaları doğrular. `npm run test:recording` eşzamanlı kayıt başlangıcı, kaynakların bırakılması ve hata sonrası tekrar denemeyi kontrol eder. `node tests/statistics-scale.mjs` eksen büyümesi ve küçülmesini doğrular. `npm run build` üretim çıktısını `dist/` içine hazırlar.

Eski editör akışına bağlı tarayıcı testleri önceki arayüzü hedefler; yeni alanlar için `test:workspaces` kullanılır. Eski editör modülleri uygulamanın giriş noktasına bağlanmaz.


## Geçmişe göre otomatik üretim

Otomatik ana ekran yalnızca içerik türünü üretim hizmetine gönderir. Hizmet, son 300 tamamlanmış işin kalıcı kayıtlarına göre türü, genel amaçlı müziği, kadro kategorisini ve istatistik konusunu seçer. İstatistikte aynı veri otomatik olarak yeniden üretilmez; yeni veya güncellenmiş veri gerekir. Ülke, takım ve burç kadroları yerel görsel kütüphanesinden hazırlanır; spiral renkli topları kullanır. Mevcut kullanıcı taslakları bu seçimlerden etkilenmez.

Her otomatik yarış için en fazla 16 farklı aday denenir, beş uygun aday hedeflenir. Parkur yapısı, arena hareket seviyesi veya spiral tema/davranışı adaylar arasında değişir. Tamamlanma ve süre denetimlerine ek olarak çıktı zamanında ilk olayın 3 saniyeyi, olaysız aralığın 8 saniyeyi aşması; görünür yarışmacı oranının %35 altında veya durağan örnek oranının %65 üzerinde olması elenme nedenidir. Bu eşikler editoryal yardımcı kurallardır, izlenme tahmini değildir. İstatistik çıktıları ayrı veri doğrulaması kullanır.

`metadata.json`, seçim puanını, aday incelemesini, çıktı kalite ölçülerini, müzik atıflarını ve otomatik seçim bilgilerini tutar. Normal kullanıcı dışa aktarımında seçilmiş kadro ve düzen değiştirilmez. Yeni hizmet `automatic-diversity` yeteneğini bildirir; eski hizmette otomatik ana ekran yeniden başlatma açıklaması gösterir.

Kontroller: `node tests/automatic-diversity.mjs` aktarım, tekrar önleme ve aday çeşitliliğini test eder. `node tests/automatic-review.mjs` ayrı bir test hizmetinde altı gerçek MP4 üretir; başlangıç/orta/son karelerini ve ses ölçülerini `artifacts/automatic-review-*/review.json` yanında saklar. İnceleme için üretim çözünürlüğü 720p kullanılır; ana ekranın varsayılanı 1080p'dir.


## Uzun süreli tekrar koruması

Otomatik üretimde içerik imzası tüm geçmişle karşılaştırılır. Aynı içerik tekrar edilmez. Çok benzer bir düzen için hem 90 gün geçmesi hem araya en az 300 tamamlanmış video girmesi gerekir. Müzik, başlık, dil ve başlangıç numarası gibi değişiklikler yakın tekrar kontrolünü aşmaz. İstatistikte sütun/satır sırası, ayraç veya başlık değişimi yeni içerik sayılmaz; verilerin değişmesi gerekir.

İmzalar `output/repetition-ledger.json` ve aynı dosyanın `.bak` yedeğinde tutulur. Açılışta mevcut tamamlanmış işlerin geçmişi bu hafızaya aktarılır. Video klasörleri veya ana iş geçmişi arşivlense bile bu iki dosyayı koru; üretim yedeğine dahil et. Hafıza ve yedeği birlikte bozuksa hizmet boş hafızayla devam etmez.

Spiral kütüphanesindeki 24 tema/davranışın tamamı koruma altındaysa **Bana bırak** diğer türlere geçer. Özellikle spiral seçilmişse veya istatistik verileri tükenmişse iş **Tekrar önlendi** açıklamasıyla durur; boş yere otomatik yeniden denenmez. Editörden özellikle istenen aynı çalışmanın dışa aktarımı bu otomatik engelin dışındadır.

`node tests/repetition-guard.mjs` süre/adet sınırlarını, yeniden başlatmayı, arşivlemeyi ve hasarlı kayıt durumlarını; `node tests/repetition-service.mjs` gerçek hizmet üzerinden tekrar engelini denetler. Güncel otomatik ekran eski hizmetin koruma olmadan üretim yapmasına izin vermez; üretim hizmetini yeniden başlatmak gerekir.
