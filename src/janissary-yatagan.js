export const JANISSARY_YATAGAN_UNITS = [{
  id: 'janissary_yatagan', name: 'Yatağanlı Yeniçeri',
  faction: 'Osmanlı Devleti', period: '18. yy–1826', kind: 'sword',
  role: 'Yatağanlı yakın dövüş piyadesi', color: '#9c4643',
  note: '18. yy–1826 · Yeniçerinin yatağanla yakın dövüşünü temsil eden donanım seçeneği; ayrı bir tarihî orta veya yalnız kılıç taşıyan bir teşkilat değildir. Yatağan, ateşli silahlarla birlikte de taşınabilen bir yan silahtı. Oyunda bu seçenek yalnız yakın dövüşür.',
  image: '/warrior-references/yatagan-met-24329-full.jpg',
  source: 'https://www.metmuseum.org/art/collection/search/24329',
  credit: 'The Metropolitan Museum of Art — Foça yapımı yatağan, 1822 (36.25.1617a, b)',
  license: 'Kamu malı / The Met Open Access.',
  visualNote: 'Çift kavisli kısa namlu, çapraz balçaksız kulaklı kabza; beyaz börk, koyu kaftan ve kırmızı kuşak. Müze örneği muhtemelen sunum için yapılmış süslü bir silahtır; oyunda genel biçimi sadeleştirilmiştir. Kıyafet renkleri özgün oyun yorumudur, bütün Yeniçerilere ortak üniforma iddiası değildir.',
  sources: [{title: 'The Met — Yatağanın biçimi ve Yeniçerilerde kullanımı', url: 'https://www.metmuseum.org/art/collection/search/24329'}],
  combat: {hp: 125, damage: 25, reach: 16, cooldown: .95, speed: 26, armor: .07, ranged: false},
}];

export const JANISSARY_YATAGAN_PROFILES = {
  janissary_yatagan: {head: 'bork', armor: 'robe', weapon: 'yatagan', cloth: '#263f53', trim: '#c5a365', trousers: '#91433e', janissaryYatagan: true},
};

export function drawYataganJanissaryArmor(g,p){
  if(!p.janissaryYatagan)return false;
  const poly=(color,points)=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();g.strokeStyle='#29312e';g.lineWidth=.55;g.stroke();};
  const line=(color,width,points)=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.stroke();};
  poly(p.cloth,[[-4,-22],[3,-22],[5,-18],[3,-12],[6,-5],[1,-4],[0,-9],[-2,-4],[-6,-5],[-4,-12],[-5,-18]]);
  poly('#b35447',[[-2,-22],[1,-22],[3,-14],[-2,-13]]);
  line(p.trim,.65,[[-3,-21],[-2,-15],[0,-13],[3,-20]]);
  for(let y=-20;y<-14;y+=1.7)line('#d5b67e',.6,[[0,y],[1,y]]);
  poly('#9e4942',[[-4,-13],[3,-14],[4,-11],[-4,-10]]);
  for(let y=-12.5;y<-10;y++)line('#c88664',.45,[[-3,y],[3,y-.6]]);
  // Empty scabbard carried at the waist; the drawn blade is in the hand.
  line('#302e2c',2.1,[[-4,-12],[-7,-4],[-9,0]]);
  line('#ae9764',.8,[[-4.7,-10],[-3.3,-9.5]]);
  line('#ae9764',1,[[-8.7,-.7],[-9,0]]);
  line(p.trim,.55,[[-5,-5],[-2,-4],[0,-9],[1,-4],[5,-5]]);
  return true;
}
