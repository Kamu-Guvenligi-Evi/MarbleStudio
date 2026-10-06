// English labels for the recorded canvas; editor labels and custom names stay separate.
export const SECTION_LABELS = {
  shortcut: 'Risky shortcut', crossramps: 'Cross ramps', funnel: 'Bottleneck',
  fork: 'Split path', wheels: 'Twin rotors', slalom: 'Speed corridor',
  pulse: 'Pulse gates', drift: 'Moving island', pegs: 'Bumper garden',
  pendulum: 'Pendulum passage',
};
const COLOR_NAMES = ['Lime','Lavender','Coral','Ice','Gold','Sakura','Mint','Blue','Flame','Pearl','Copper','Pistachio','Orchid','Turquoise','Lemon','Pink','Ocean','Lilac','Mango','Jade'];
export function raceName(race,ball) {
  return race.ballNames && !race.ballNames[ball.id] ? COLOR_NAMES[ball.id] ?? ball.name : ball.name;
}

export const SECTION_LABELS_TR={shortcut:'Riskli kestirme',crossramps:'Çapraz rampalar',funnel:'Dar geçit',fork:'Yol ayrımı',wheels:'Dönen çarklar',slalom:'Hız koridoru',pulse:'Açılır kapılar',drift:'Hareketli ada',pegs:'Engel bahçesi',pendulum:'Sarkaç geçidi'};
