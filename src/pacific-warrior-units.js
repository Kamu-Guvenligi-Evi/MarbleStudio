const taiaha='https://collections.tepapa.govt.nz/topic/3128';
const helmet='https://artsandculture.google.com/asset/hawaiian-feather-helmet/RQFHggEharPuvA?hl=en';
const cloak='https://blog.tepapa.govt.nz/2020/07/10/kalaniopuus-gift-to-cook-a-sacred-cloak-and-its-history-of-display/';
export const PACIFIC_WARRIOR_UNITS=[
  {
    id:'maori_taiaha',name:'Māori taiaha ustası',faction:'Aotearoa / Māori toplulukları',
    period:'18. yy geleneksel donanımı',kind:'sword',role:'İki elli yakın dövüş uzmanı',color:'#a99370',
    note:'Taiaha, iki elle kullanılan ahşap bir yakın dövüş silahı ve itibar göstergesidir. Oyuk yüzlü baş ve sivri dil bir uçta, ana vurucu yassı bölüm diğer uçtadır. Kayıt, usta bir savaşçıyı temsil eder; bütün Māori topluluklarına ait tek bir devlet veya belgelenmiş daimî elit muhafız teşkilatı değildir. Ateşli silahların yaygınlaşmasından önceki donanım seçildi.',
    source:taiaha,sources:[{title:'Te Papa — Fighting figure: taiahanın kullanımı',url:taiaha},{title:'Te Papa — Taiaha, ME013970',url:'https://collections.tepapa.govt.nz/object/54050'},{title:'Te Papa — Parkinson sonrası savaşçı gravürü, 1784',url:'https://collections.tepapa.govt.nz/object/1495571'}],
    credit:'Te Papa silah fotoğrafları ve dönem gravürüyle karşılaştırılan özgün çizim',
    visualNote:'Oyma başlı ahşap taiaha müze nesnesinden; saç düğümü, kulak süsü ve lifli omuz giysisi Parkinson sonrası gravürden sadeleştirildi. Gravür Avrupalı sanatçı yorumudur; giysinin alt kısmı ve animasyon oyun yorumudur. Kişiye özgü tā moko deseni kopyalanmadı. Çizim belirli bir kişinin portresi değildir.',
    combat:{hp:132,damage:29,reach:28,cooldown:1.15,speed:29,armor:.06},
  },
  {
    id:'hawaiian_alii',name:'Hawaiili aliʻi mızraklı savaşçı',faction:'Hawaiʻi şeflikleri',
    period:'18. yy geleneksel donanımı',kind:'spear',role:'Yüksek statülü mızraklı savaşçı',color:'#c45934',
    note:'Aliʻi bir statü adıdır; bu kayıt isimli bir alayı değil, savaşan bir şefi temsil eder. British Museum, tüy başlık ve pelerinlerin erkek şeflerce savaşta ve törende kullanıldığını belirtir. Ahşap ihe mızrağı Bishop Museum silah anlatımına dayanır. Tüfek ve topun yaygınlaşmasından önceki donanım seçildi; oyun istatistikleri tarihsel ölçüm değildir.',
    source:helmet,sources:[{title:'British Museum — Hawaiian feather helmet, Oc,HAW.108',url:helmet},{title:'Te Papa — 18. yy ʻahu ʻula, FE000327',url:cloak},{title:'Bishop Museum — Mea Kaua: Hawaiʻi silahları',url:'https://www.hawaiialive.org/resource/mea-kaua'}],
    credit:'British Museum ve Te Papa nesne fotoğraflarıyla karşılaştırılan özgün çizim',
    visualNote:'Tüy kaplı örgü mahiole, tüy pelerin ve ahşap mızrak ayrı kaynaklardan birleştirildi; nesnelerin aynı kişiye ait olduğu iddia edilmez. Pelerin deseni küçük ölçekte sadeleştirildi. Yüz, malo bel örtüsü, silah oranları ve hareket oyun yorumudur. Metal miğfer, metal mızrak ucu veya ortak asker üniforması değildir.',
    combat:{hp:145,damage:26,reach:35,cooldown:1.25,speed:26,armor:.08},
  },
];
export const PACIFIC_WARRIOR_PROFILES={
  maori_taiaha:{head:'maoriTopknot',armor:'maoriFiberWrap',weapon:'taiaha',shield:null,cloth:'#a99370',skin:'#b48a65',bareLegs:true,bareFeet:true},
  hawaiian_alii:{head:'mahiole',armor:'ahuUla',weapon:'ihe',shield:null,cloth:'#c45934',skin:'#b48a65',bareLegs:true,bareFeet:true},
};
