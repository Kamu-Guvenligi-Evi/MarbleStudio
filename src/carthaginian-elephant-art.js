// Original reconstruction, not a claimed Punic uniform. Towerless equipment is
// a conservative artistic choice; ancient sources do not settle every detail.
export function drawCarthaginianElephant(g, team, frame, action) {
  const moving = action === 'walk' || action === 'charge';
  const stride = moving ? Math.sin(frame / 8 * Math.PI * 2) : 0;
  const push = action === 'attack' ? Math.sin(frame / 7 * Math.PI) : 0;
  const ink = '#363830', ivory = '#e9ddbd', cloth = team ? '#9b433b' : '#376c83';
  const shape = (d, fill, stroke = ink, width = .65) => {
    const p = new Path2D(d);
    if (fill) { g.fillStyle = fill; g.fill(p); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(p); }
  };
  const line = (d, color, width = .6) => shape(d, null, color, width);
  const oval = (x, y, rx, ry, color) => {
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = color; g.fill();
  };
  const shade = (x, y, x2, y2, a, b) => {
    const c = g.createLinearGradient(x, y, x2, y2); c.addColorStop(0, a); c.addColorStop(1, b); return c;
  };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const skin = shade(-18, -39, 20, -12, '#a59f88', '#686d60');
  function leg(x, swing, far) {
    const dx = swing * 2.6, lift = Math.max(0, swing) * 1.8;
    shape(`M${x-4} -21 Q${x-5} -12 ${x-3+dx} ${-3-lift} Q${x-4+dx} ${1-lift} ${x+dx} ${1-lift} L${x+5+dx} ${1-lift} Q${x+6+dx} ${-1-lift} ${x+3+dx} ${-4-lift} L${x+4} -21 Z`, far ? '#535a50' : skin);
    if (!far) {
      line(`M${x-3+dx*.5} -9 Q${x+dx*.5} -7 ${x+3+dx*.5} -9`, '#565f53');
      for (let n=0;n<3;n++) oval(x-1+dx+n*1.7, -lift-.1, .7, .6, '#c6bea1');
    }
  }
  leg(-11, -stride, true); leg(14, stride, true);
  line(`M-21 -31 Q-27 -23 -25 ${-12+stride}`, '#6d705e', 1.3);
  shape(`M-25 ${-14+stride} Q-28 ${-10+stride} -24 ${-8+stride} L-23 ${-13+stride} Z`, '#41483e');
  shape('M-23 -25 C-26 -35 -15 -40 -3 -39 Q9 -40 20 -35 Q25 -30 23 -23 Q22 -13 12 -12 L-10 -12 Q-23 -13 -23 -25 Z', skin);
  line('M-19 -30 Q-21 -24 -17 -20 M-11 -17 Q-2 -14 6 -16 M4 -35 Q12 -34 16 -30', '#858672', .55);
  leg(-16, stride, false); leg(10, -stride, false);
  // Small saddle blanket and girth, leaving the hide exposed. No steel armour.
  shape('M-14 -37 Q-3 -40 9 -36 L8 -26 Q0 -23 -12 -27 Z', cloth, '#463f32');
  line('M-12 -35 Q-3 -37 7 -34 L6 -28 Q-2 -26 -10 -29', '#cab48a', .8);
  line('M-8 -37 Q-10 -25 -5 -13', '#77603e', 1.7);
  line('M-8 -37 Q-10 -25 -5 -13', '#b39763', .55);
  g.save(); g.translate(push * 1.4, -Math.abs(stride)*.3-push*.6);
  // African-type broad ear and sloping forehead; exact ancient taxon is uncertain.
  shape('M20 -25 Q29 -23 36 -24 Q34 -18 25 -20 Z', '#c4b99d');
  shape('M15 -35 Q20 -41 26 -37 L30 -31 Q30 -24 33 -19 L34 -10 Q35 -5 39 -8 Q41 -10 40 -13 Q45 -8 41 -4 Q35 0 31 -6 Q28 -12 28 -19 L23 -24 Q16 -23 15 -35 Z', skin);
  shape('M18 -36 Q9 -42 5 -35 Q3 -28 10 -18 Q13 -15 17 -20 Q22 -26 20 -32 Z', shade(7,-37,20,-20,'#b3ab91','#717966'));
  line('M16 -34 Q8 -36 8 -29 L13 -22 M17 -32 Q12 -31 13 -25', '#888d75', .75);
  shape('M24 -24 Q29 -21 38 -23 Q35 -17 25 -19 Z', ivory, '#8f8c72');
  line('M27 -21 Q31 -19 35 -21', '#fff2d2', .6);
  oval(27,-31,1.05,.75,'#242e26'); oval(27.3,-31.2,.28,.25,'#e8ddbc');
  for(let i=0;i<5;i++) line(`M${29+i*.35} ${-21+i*2.2} l3 -.5`, '#596352', .45);
  line('M20 -37 Q25 -36 29 -30', '#725d40', .9);
  g.restore();
  // Seated mahout: linen tunic, head wrap, bent bare leg and short driving goad.
  g.save(); g.translate(0,-Math.abs(stride)*.5);
  shape('M8 -44 L13 -44 L15 -37 L10 -36 L7 -39 Z', '#d4c7a4');
  line('M11 -37 L16 -33 L15 -28', '#a77f59', 1.9);
  line('M15 -28 L17 -27', '#74573f', 1.4);
  oval(11,-47,2,2.6,'#aa825c');
  shape('M9 -47 Q8 -51 11 -51 Q14 -50 13 -47 L12 -48 Z', '#dcd1b1');
  line('M9 -49 L13 -49', '#a99b77', .5);
  oval(12,-46.8,.35,.3,'#3d3427');
  line('M13 -42 L17 -40 L20 -43', '#a77f59', 1.4);
  line('M19 -39 L22 -47 Q23 -48 24 -46', '#775d3a', .8);
  line('M17 -40 Q22 -38 25 -34', '#675339', .45);
  g.restore(); g.restore();
}
