const classic=[[304,552],[304,440],[438,440],[438,127],[126,127],[126,362],[370,362],[370,202],[195,202]];
// Opening angles are tuned for a short physical journey to the inner pocket.
export const BREAKER_MAPS=[
  {id:'spiral',launchAngle:0.061,name:'Klasik Spiral',tag:'Sabır → zincirleme kırılma',path:classic,colors:['#111516','#7d848c','#ad4a10','#32d6b5','#ff594e']},
  {id:'mirror',launchAngle:-0.0688,name:'Ters Spiral',tag:'Tanıdık yol, ters yön',path:classic.map(([x,y])=>[540-x,y]),colors:['#111516','#7e8faa','#773cb1','#84b4fa','#ffc568']},
  {id:'zigzag',launchAngle:0.0487,name:'Yılan Yolu',tag:'Uzun yol, büyük patlama',path:[[100,552],[100,455],[440,455],[440,335],[100,335],[100,215],[440,215],[440,100],[280,100]],colors:['#111516','#8c839f','#663b9d','#bc8aee','#ffdc7b']},
  {id:'stairs',launchAngle:-0.0427,name:'Basamak',tag:'Her dönüşte bir adım daha',path:[[100,552],[100,435],[215,435],[215,320],[330,320],[330,205],[445,205],[445,95],[315,95]],colors:['#111516','#8c9692','#9c651e','#edc761','#ff666b']},
  {id:'hook',launchAngle:-0.062,name:'Kanca',tag:'Uzun tur, keskin dönüş',path:[[270,552],[270,445],[100,445],[100,110],[440,110],[440,345],[270,345],[270,220],[360,220]],colors:['#111516','#81959b','#176c91','#58d4e4','#ff9471']},
  {id:'coil',launchAngle:0.0331,name:'İç İçe',tag:'Merkeze yaklaş, alanı temizle',path:[[440,552],[440,110],[100,110],[100,445],[335,445],[335,215],[210,215],[210,335],[265,335]],colors:['#111516','#95918d','#a94548','#f28d9d','#fff087']},
];
export const getBreakerMap=id=>BREAKER_MAPS.find(map=>map.id===id)??BREAKER_MAPS[0];
