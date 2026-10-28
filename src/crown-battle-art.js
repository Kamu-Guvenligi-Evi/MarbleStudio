// Locally drawn, cached artwork. All animation frames share the simulation's positions.
import { weaponMotion } from './crown-battle-weapon-motion.js';
import { random } from './crown-battle.js';
import { HISTORICAL_TYPES } from './historical-combat.js';
import { historicalSprite } from './historical-battle-art.js';
import { MIDDLE_EARTH_BY_ID } from './middle-earth-units.js';
import { middleEarthSprite } from './middle-earth-art.js';
import { paintedArtVersion } from './middle-earth-painted-art.js';
import { COMMANDER_TYPES } from './historical-commander-types.js';
import { commanderSprite } from './historical-commander-art.js';
const TAU = Math.PI * 2;
function surface(w, h, scale = 2) { const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale; const g = c.getContext('2d', { willReadFrequently: w === 80 && h === 76 }); g.scale(scale, scale); return [c, g]; }
function ellipse(g, color, x, y, rx, ry, angle = 0) { g.fillStyle = color; g.beginPath(); g.ellipse(x, y, rx, ry, angle, 0, TAU); g.fill(); }
function path(g, color, points, stroke, width = .5) { g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = color; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); } }
function line(g, color, width, points) { g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }
function gradient(g, x, y, x2, y2, stops) { const v = g.createLinearGradient(x, y, x2, y2); stops.forEach(([p, c]) => v.addColorStop(p, c)); return v; }

export function makeSprite(type, team, frame, action, variant = 0, rangedHorse = false, firearm = false, weapon = null) {
  const [canvas, g] = surface(80, 76, 3); g.translate(30, 61);
  const cloth = team ? '#9e4036' : '#326a86', shade = team ? '#512c29' : '#233e53', trim = '#d2b875';
  const metal = gradient(g, -5, -21, 6, -14, [[0, '#e0e4d8'], [.3, '#a6b6b5'], [.55, '#6b8086'], [.7, '#c0cdca'], [1, '#344953']]);
  const gait = ['walk','charge','charge-ready'].includes(action) ? Math.sin(frame / 8 * TAU) : 0, swing = action === 'attack' ? Math.sin(frame / 8 * Math.PI) : 0;
  const horse = type === 'cavalry';
  const melee = type !== 'archer' && !rangedHorse && !firearm;
  const pose = weaponMotion(type === 'pike' || horse ? 'spear' : weapon || 'sword', action, frame / 8, type === 'pike' ? .55 : horse ? 1.25 : .25);
  const hx = 7 + pose.x, hy = -12 + pose.y;
  if (horse) {
    const coat = ['#79533b', '#4d4339', '#aaa294'][variant], coatLight = ['#af8260', '#79695a', '#ddd2b8'][variant];
    // Far legs, jointed forelegs, lifted hooves, and flowing tail.
    line(g, '#362f29', 2.5, [[-9, -9], [-10 - gait * 3, -4], [-8 - gait * 4, 1]]);
    line(g, '#362f29', 2.3, [[8, -10], [9 + gait * 4, -5], [12 + gait * 3, 1]]);
    g.strokeStyle = '#242b27'; g.lineWidth = 2.3; g.beginPath(); g.moveTo(-13, -16); g.bezierCurveTo(-21, -18, -15, -6, -23, -8 + gait * 2); g.stroke();
    const body = gradient(g, 0, -22, 1, -6, [[0, coatLight], [.5, coat], [1, '#302c26']]);
    ellipse(g, body, -2, -14, 13, 6.4, -.08); ellipse(g, body, -10, -14, 5, 6);
    path(g, body, [[6,-12],[8,-24],[12,-29],[16,-27],[14,-21],[12,-10]], '#342e26');
    ellipse(g, coatLight, 15, -25, 4.9, 2.8, .5); ellipse(g, '#3c332b', 18, -24, 2, 1.7);
    path(g, coat, [[10,-27],[10,-32],[12,-29],[15,-31],[14,-26]], '#332e28');
    line(g, '#272b29', 2, [[9,-28],[7,-23],[7,-18]]);
    line(g, coatLight, 2.5, [[-9,-10],[-6 + gait * 3,-5],[-9 + gait * 4,1]]);
    line(g, coatLight, 2.5, [[8,-10],[6 - gait * 3,-4],[8 - gait * 5,1]]);
    line(g, '#272b27', 2.5, [[-10 + gait*4,1],[-7 + gait*4,1]]);
    line(g, '#272b27', 2.5, [[7-gait*5,1],[10-gait*5,1]]);
    path(g, shade, [[-8,-19],[5,-20],[8,-10],[4,-7],[-6,-9]], '#252e2e');
    path(g, cloth, [[-7,-19],[4,-19],[5,-9],[-6,-10]], trim, .6);
    line(g, trim, .7, [[-5,-11],[3,-10],[3,-16]]);
    line(g, '#e0ceb0', .6, [[14,-28],[13,-23],[18,-23]]);
    ellipse(g, '#121e1d', 15,-26, .65,.65);
    line(g, '#302d25', .7, [[16,-23],[8,-18],[1,-22]]);
    g.translate(-1, -14 + Math.abs(gait) * .5);
  }
  g.translate(0, action === 'walk' ? -Math.abs(gait) * .8 : 0);
  // Boots and articulated greaves.
  const step = gait * (horse ? .7 : 2.2);
  line(g, '#23312e', 2.6, [[-2,-7],[-3-step,-3],[-3-step,0]]);
  line(g, '#23312e', 2.6, [[2,-7],[2+step,-3],[3+step,0]]);
  line(g, '#a4b1aa', 1.3, [[-3-step,-5],[-3-step,-1.6]]);
  line(g, '#748b8f', 1.3, [[2+step,-5],[3+step,-1.6]]);
  ellipse(g, '#232e2a', -2-step,.3,2,1); ellipse(g, '#232e2a', 4+step,.3,2,1);
  // Surcoat, mail skirt, belt and breastplate.
  path(g, shade, [[-4,-16],[4,-16],[5,-6],[2,-4],[-1,-6],[-4,-5]], '#23322e', .7);
  path(g, cloth, [[-3,-13],[3,-13],[4,-6],[0,-7],[-3,-5]], '#344744', .4);
  for (let y = -10; y < -5; y += 1.1) for (let x = -3; x < 4; x += 1.2) ellipse(g, '#b0b9a96b', x + (y % 2)*.2, y, .3, .25);
  path(g, type === 'archer' ? '#685d40' : metal, [[-3,-18],[2,-18],[4,-15],[3,-11],[-3,-11],[-4,-15]], '#263a3f', .65);
  line(g, '#d5dcd0', .5, [[-2.7,-16],[-2,-12],[0,-12]]);
  line(g, '#443a29', 1.2, [[-3,-10],[4,-10]]); ellipse(g, trim, 1,-10,.8,.6);
  ellipse(g, metal, -4,-16,2,2.1); ellipse(g, metal, 4,-16,1.8,2);
  line(g, '#51646a', 2, [[-4,-14],[-5,-10],[-2,-9]]);
  line(g, metal, 1.8, [[4,-14],[5+(melee?pose.x*.5:swing*2),-11+(melee?pose.y*.5:0)],melee?[hx,hy]:[8+swing*3,-12]]);
  ellipse(g, '#c7ab83', melee?hx:7+swing*3,melee?hy:-12,1,1);
  // Rounded helmet, neck mail, visor, nasal guard and polished ridge.
  ellipse(g, '#283b40', 0,-19.5,3.8,4.2);
  ellipse(g, '#c1a07b', 1.3,-20,2.5,2.4);
  ellipse(g, type === 'archer' ? '#5c6747' : metal, -.3,-22,3.8,3.3);
  if (type !== 'archer') {
    line(g, '#cbd8d0', .65, [[-2.4,-23.5],[-.8,-24.6],[.8,-24.3]]);
    line(g, '#364e54', .8, [[-3,-20.8],[3.1,-20.8]]);
    line(g, '#dae0cc', .8, [[1.6,-22],[2,-18.8]]);
    line(g, '#485b5e', .9, [[-2.8,-20],[-2.6,-17.7]]);
  } else {
    path(g, '#7e885d', [[-4,-21],[-3,-24],[0,-26],[3,-23],[3,-21]], '#3e4e39');
    line(g, '#3e3023', 2.7, [[-5,-15],[-7,-8]]);
    for (let i = 0; i < 3; i++) { line(g, '#b2a17c', .5, [[-5-i*.65,-14],[-5-i*.65,-21]]); line(g, '#ddd5b9', .7, [[-5-i*.65,-20],[-6-i*.65,-22]]); }
  }
  if (firearm) {
    line(g, '#664630', 2, [[1,-10],[16,-16]]); line(g, metal, 1, [[6,-12],[21,-18]]);
    if(action==='attack'&&frame%8>=4&&frame%8<6) path(g,'#f4d280',[[21,-18],[26,-21],[24,-18],[27,-16],[22,-16]]);
  } else if (type === 'archer' || rangedHorse) {
    const bowTop = weapon === 'yumi' ? -33 : -22;
    const released=action==='attack'&&frame%8>=4,draw=released?0:swing;
    const nock=5-draw*5;
    line(g,metal,1.8,[[4,-14],[8,-13],[12,-13]]);
    line(g,metal,1.6,[[-4,-14],[0,-11],[nock,-13]]);
    g.strokeStyle = '#cbb182'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(9,bowTop); g.bezierCurveTo(14,bowTop+3,12,-16,12,-13);g.bezierCurveTo(12,-10,14,-7,9,-4); g.stroke();
    line(g, '#e8dfc0', .45, [[9,bowTop],[released?9:nock,-13],[9,-4]]);
    if(!released){line(g, '#b6a487', .65, [[nock,-13],[18,-13]]); path(g, '#ccd4ce', [[18,-13],[15.5,-14],[15.5,-12]]);}
    ellipse(g,'#c7ab83',12,-13,1,1);ellipse(g,'#c7ab83',nock,-13,1,1);
  } else {
    if (type === 'pike' || horse) {
      g.save();g.translate(hx,hy);g.rotate(pose.angle);
      line(g, '#342e24', 1.6, [[0,12],[0,-30]]);line(g, '#b0a179', .65, [[0,12],[0,-30]]);
      path(g, '#d5e2de', [[0,-35],[-1.4,-30],[0,-28],[1.4,-30]], '#607b80', .4);
      g.restore();
    } else {
      g.save(); g.translate(hx,hy); g.rotate(pose.angle);
      if (weapon === 'axe') {
        line(g, '#876342', 1.5, [[0,5],[0,-17]]);
        path(g, metal, [[0,-16],[6,-18],[7,-12],[4,-10],[0,-12]], '#344951', .5);
        line(g, '#e3e3d2', .7, [[6,-17],[6.5,-12],[4,-10.5]]);
      } else if (weapon === 'obsidian') {
        path(g, '#956d40', [[-1.4,1],[-2,-14],[0,-16],[2,-14],[1.4,1]], '#4a3628', .5);
        for (const side of [-1,1]) for(let y=-13;y<-3;y+=2.5) path(g, '#283631', [[side*1.7,y],[side*3,y-.2],[side*3,y+1.5],[side*1.7,y+1.5]]);
        line(g, '#c7a06b', .6, [[0,-13],[0,-2]]);
      } else {
        path(g, metal, [[-1,0],[-1,-12],[0,-15],[1,-12],[1,0]], '#344951', .45);
        line(g, '#ebede1', .55, [[0,-13],[0,-1]]); line(g, trim,1, [[-3,0],[3,0]]); line(g,'#493c29',1.5,[[0,1],[0,3]]);
      }
      g.restore();
    }
    // Curved heraldic kite shield with metal rim, boss, paint and highlights.
    const shield = gradient(g,-5,-12,5,-6,[[0,cloth],[.45,cloth],[1,shade]]);
    path(g, shield, [[-5,-14],[0,-16],[5,-13],[4,-6],[0,-2],[-4,-6]], '#d0bd88', .65);
    line(g, '#e3d5ae', .9, [[0,-13],[0,-5]]); line(g, '#e3d5ae', .9, [[-3,-11],[3,-11]]);
    ellipse(g, '#e6d39a', 0,-10.7,.9,.9); line(g, '#ffffff35', .6, [[-3.5,-13],[-3,-8]]);
  }
  return canvas;
}

export class SpriteLibrary {
  variantOf(type, variant) {
    // Historical horses only distinguish the presence of a forehead marking.
    if (!type.startsWith('myth_') && !type.startsWith('me_') && HISTORICAL_TYPES[type]?.role === 'cavalry') return variant % 2;
    return type.startsWith('me_') || type.startsWith('myth_') || (type !== 'cavalry' && HISTORICAL_TYPES[type]?.role !== 'cavalry' && !COMMANDER_TYPES[type]) ? 0 : variant;
  }
  constructor() { this.cache = new Map(); this.fallbacks = new Map(); this.poses = new WeakMap(); this.generated = 0; }
  isExactPose(source, frame, action) { const pose = this.poses.get(source); return pose?.frame === frame && pose?.action === action; }
  beginFrame() { this.remainingMs = 4; this.generated = 0; this.deferred = false; }
  endFrame() { this.remainingMs = null; }
  get(type, team, frame, action, variant) {
    variant = this.variantOf(type, variant);
    const key = `${type}/${team}/${frame}/${action}/${variant}/${paintedArtVersion(type)}`;
    if (!this.cache.has(key)) {
      const fallback = this.fallbacks.get(`${type}/${team}/${action}/${variant}`) || this.fallbacks.get(`${type}/${team}/${variant}`);
      // Keep a known pose visible while new poses are prepared over several
      // frames. A mixed army must not generate hundreds of canvases in one RAF.
      if (fallback && this.remainingMs != null && (this.generated >= 1 || this.remainingMs <= 0)) {
        this.deferred = true; return fallback;
      }
      const started = performance.now();
      const source = MIDDLE_EARTH_BY_ID[type] ? middleEarthSprite(type,team,frame,action) : COMMANDER_TYPES[type] ? commanderSprite(type,team,frame,action,variant) : HISTORICAL_TYPES[type] ? historicalSprite(type,team,frame,action,variant,makeSprite) : makeSprite(type,team,frame,action,variant);
      // Bake edge separation and directional light once per frame, never per soldier.
      const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
      // Sprite bounds are inspected once on the CPU, then uploaded to the atlas.
      // Keep these tiny source surfaces off the GPU to avoid a readback stall.
      const g = canvas.getContext('2d', { willReadFrequently: true });
      g.shadowColor = '#12231ed9'; g.shadowBlur = 2; g.shadowOffsetX = 1; g.shadowOffsetY = 2;
      g.drawImage(source, 0, 0); g.shadowBlur = 0; g.shadowOffsetX = g.shadowOffsetY = 0;
      g.globalCompositeOperation = 'source-atop';
      const light = g.createLinearGradient(0, 0, canvas.width, canvas.height);
      light.addColorStop(0, '#fff3ce16'); light.addColorStop(.58, '#ffffff00'); light.addColorStop(1, '#101e2625');
      g.fillStyle = light; g.fillRect(0, 0, canvas.width, canvas.height);
      this.cache.set(key, canvas);
      this.poses.set(canvas, { frame, action });
      this.fallbacks.set(`${type}/${team}/${action}/${variant}`, canvas);
      this.fallbacks.set(`${type}/${team}/${variant}`, canvas);
      this.generated++;
      if (this.remainingMs != null) this.remainingMs -= performance.now() - started;
    }
    return this.cache.get(key);
  }
}

function pine(g,x,y,s,rng,dry) {
  g.save(); g.translate(x,y); g.scale(s,s);
  ellipse(g,'#17261c32',16,4,27,8,.25);
  line(g,'#3b3828',4,[[1,2],[0,-35]]); line(g,'#948264',1,[[0,0],[-1,-29]]);
  const greens = dry ? ['#414b32','#5c6440','#77805a','#8f9567'] : ['#253c30','#344c36','#506849','#6e8255'];
  for (let layer=0;layer<7;layer++) {
    const yy=-9-layer*6.5, spread=24-layer*2.9;
    for (let j=0;j<9;j++) {
      const angle=j/9*TAU, bx=Math.cos(angle)*spread*.65, by=yy+Math.sin(angle)*spread*.25;
      path(g,greens[j%3],[[bx,by-9-rng()*5],[bx-spread*.5,by+3],[bx-spread*.2,by+2],[bx-spread*.33,by+5],[bx+spread*.5,by+4],[bx+spread*.28,by]],'#21382938',.4);
      for(let k=0;k<4;k++) line(g,greens[2+(j%2)],.45,[[bx-2,by-5+k*1.5],[bx-5-k,by-2+k*1.5]]);
    }
  }
  g.restore();
}

export function makeTerrain(seed,preset) {
  const [canvas,g] = surface(600,960), rng=random(Number(seed)+71), dry=preset==='flank';
  g.fillStyle=dry?'#9d895f':'#6d7650';g.fillRect(0,0,600,960);
  // Soft overlapping ground tones, worn paths and individually lit grass blades.
  for(let i=0;i<650;i++) {
    const x=rng()*600,y=rng()*960,r=15+rng()*65;
    const v=g.createRadialGradient(x,y,0,x,y,r);v.addColorStop(0,i%3===0?'#c2b87c28':i%3===1?'#263d282b':'#8e9f6425');v.addColorStop(1,'#66774a00');g.fillStyle=v;g.fillRect(x-r,y-r,r*2,r*2);
  }
  for(let i=0;i<30;i++) {
    g.strokeStyle=dry?'#c0a97b08':'#baa87c06';g.lineWidth=30+i*2.5;g.beginPath();g.moveTo(365,-10);g.bezierCurveTo(280,290,200,630,360,970);g.stroke();
  }
  for(let i=0;i<46000;i++) {
    const x=rng()*600,y=rng()*960;
    g.globalAlpha=.1+rng()*.25;g.fillStyle=i%3===0?'#d2cc93':i%3===1?'#293e29':'#8f9a61';g.fillRect(x,y,.4+rng()*1.4,.35+rng()*.65);
  }
  g.globalAlpha=1;
  for(let i=0;i<3200;i++) {
    const x=rng()*600,y=rng()*960,h=1+rng()*2.3;
    line(g,dry?'#6d6e474b':'#34492f60',.45,[[x-1,y],[x-.6,y-h],[x+1,y]]);
    line(g,'#d0cb8a44',.4,[[x+.8,y],[x+1.8,y-h]]);
  }
  // Scattered stones and flowers, heavier scrub at the edges.
  for(let i=0;i<250;i++) {
    const x=rng()*600,y=rng()*960,s=.5+rng()*2.3;
    ellipse(g,'#26352335',x+1,y+1,s*1.4,s*.55);
    path(g,'#737760',[[x-s,y],[x-s*.8,y-s],[x+s*.3,y-s*1.3],[x+s,y-.3]],'#4d59454d');
    line(g,'#b6b69a',.5,[[x-s*.8,y-s],[x+s*.3,y-s*1.3]]);
  }
  for(let i=0;i<550;i++) {
    const x=rng()*600,y=rng()*960;
    if(x>55 && x<545 && y>130 && y<870) continue;
    ellipse(g,'#384d3280',x,y,1+rng()*4,1+rng()*2);
    ellipse(g,i%3?'#89945c':'#d8c894',x-1,y-1,.65,.6);
  }
  // Broken dry-stone boundary, kept outside playable formations.
  for(let i=0;i<31;i++) {
    const x=19+(i%3)*6,y=270+Math.floor(i/3)*8;
    ellipse(g,'#182a2040',x+5,y+3,8,3);
    path(g,'#787d6a',[[x-4,y],[x-5,y-5],[x+1,y-8],[x+5,y-5],[x+5,y]],'#424e42');
    path(g,'#a0a28a',[[x-5,y-5],[x+1,y-8],[x+5,y-5],[x,y-3]]);
  }
  const trees=[];
  for(let i=0;i<83;i++) {let x=rng()*660-30,y=i<38?50+rng()*95:920+rng()*90;if(i%8===0){x=i%16?0:598;y=160+rng()*710;}trees.push({x,y,s:.62+rng()*.6});}
  trees.sort((a,b)=>a.y-b.y).forEach(t=>pine(g,t.x,t.y,t.s,rng,dry));
  const light=g.createLinearGradient(0,0,600,960);light.addColorStop(0,'#ffebb010');light.addColorStop(.6,'#283f2600');light.addColorStop(1,'#182e2520');g.fillStyle=light;g.fillRect(0,0,600,960);
  const vignette=g.createRadialGradient(300,480,250,300,480,610);vignette.addColorStop(0,'#13281d00');vignette.addColorStop(1,'#13281d75');g.fillStyle=vignette;g.fillRect(0,0,600,960);
  return canvas;
}
