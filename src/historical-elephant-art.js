// Original game artwork in the shared 80 × 76 sprite coordinate system.
// The illustration suggests a medieval war elephant; it is not a uniform reconstruction.
export function drawWarElephant(g, { color }, team, frame, action) {
  const phase = frame / 8 * Math.PI * 2;
  const walking = action === 'walk';
  const stride = walking ? Math.sin(phase) : 0;
  const thrust = action === 'attack' ? Math.sin(frame / 7 * Math.PI) : 0;
  const gold = '#d5b56c', darkGold = '#836033', ink = '#303a38';
  const teamCloth = team ? '#b34436' : '#367e9c';
  const gradient = (x, y, x2, y2, stops) => {
    const fill = g.createLinearGradient(x, y, x2, y2);
    stops.forEach(([at, shade]) => fill.addColorStop(at, shade));
    return fill;
  };
  const shape = (d, fill, stroke = ink, width = .6) => {
    const p = new Path2D(d);
    if (fill) { g.fillStyle = fill; g.fill(p); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(p); }
  };
  const line = (d, stroke, width = .6) => shape(d, null, stroke, width);
  const oval = (x, y, rx, ry, fill, stroke = null) => {
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fillStyle = fill; g.fill();
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = .5; g.stroke(); }
  };
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  const skin = gradient(-14, -39, 10, -8, [[0, '#a2aaa0'], [.45, '#808d84'], [1, '#535f5a']]);
  const legSkin = gradient(-4, -20, 4, 0, [[0, '#86938a'], [1, '#59665f']]);
  // Far legs sit behind the belly. Feet remain planted while the opposite pair rises.
  function leg(x, swing, far) {
    const dx = swing * 2.8, lift = Math.max(0, swing) * 1.8;
    g.save(); g.translate(x, 0);
    shape(`M-4 -21 Q-5 -14 ${-3 + dx * .4} -9 L${-4 + dx} ${-2 - lift} Q${-4 + dx} ${1 - lift} ${1 + dx} ${1 - lift} L${5 + dx} ${.5 - lift} Q${6 + dx} ${-1 - lift} ${3 + dx} ${-3 - lift} L${3 + dx * .4} -12 L5 -22 Z`, far ? '#505d57' : legSkin);
    line(`M${-3 + dx * .4} -9 Q${dx * .4} -7 ${3 + dx * .4} -9`, far ? '#414d48' : '#58665d');
    if (!far) for (let n = 0; n < 3; n++) oval(-2 + dx + n * 2, -lift - .5, .8, .65, '#b8b5a0');
    g.restore();
  }
  leg(-12, -stride, true); leg(14, stride, true);
  line(`M-22 -29 Q-29 -22 -25 ${-10 + stride}`, '#606c61', 1.4);
  shape(`M-25 ${-13 + stride} Q-29 ${-9 + stride} -25 ${-7 + stride} L-24 ${-12 + stride} Z`, '#3d4540');
  shape('M-24 -25 C-25 -37 -16 -40 -2 -39 C10 -40 22 -36 23 -26 C24 -16 15 -12 2 -12 L-13 -13 C-21 -14 -24 -19 -24 -25 Z', skin, ink, .8);
  leg(-16, stride, false); leg(9, -stride, false);
  // Padded caparison, edged in brass with a large motif readable at game scale.
  shape('M-22 -35 Q-9 -41 12 -35 L13 -16 L6 -13 L-1 -16 L-8 -13 L-16 -16 L-21 -15 Z', gradient(0, -37, 0, -13, [[0, color], [1, '#24494e']]), darkGold, 1.1);
  line('M-20 -33 L-18 -18 L-15 -19 L-8 -16 L-1 -19 L6 -16 L10 -18 L10 -33', gold, .7);
  shape('M-15 -34 L5 -34 L5 -23 L-5 -18 L-15 -23 Z', '#405954', gold, .6);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
    const x = -13 + col * 3.6, y = -32 + row * 3;
    shape(`M${x} ${y} h2.5 v1.8 l-1.25 .8 l-1.25 -.8 Z`, row % 2 ? '#88918a' : '#a7aaa0', '#52615b', .25);
  }
  shape('M-5 -27 L-2 -23 L-5 -19 L-8 -23 Z', gold, '#eee0aa', .4);
  for (const x of [-18, -8, 6]) { line(`M${x} -16 v3`, gold, .8); oval(x, -12.5, .9, 1.2, darkGold); }
  // Head, small Asian-elephant ear, curved ivory tusks and a tapered mobile trunk.
  g.save(); g.translate(thrust * 2, walking ? -Math.abs(stride) * .4 : -thrust);
  shape('M19 -28 Q27 -28 32 -22 Q35 -19 39 -22 Q36 -17 32 -18 L23 -23 Z', '#c5bea0', '#7d806e', .5);
  shape('M15 -37 C18 -42 28 -42 31 -35 L31 -27 Q33 -21 34 -16 Q35 -9 39 -10 Q42 -11 41 -15 Q46 -10 42 -6 Q36 -2 31 -10 L26 -21 Q19 -19 16 -25 Z', skin, ink, .8);
  for (let i = 0; i < 4; i++) line(`M${30 + i * .8} ${-19 + i * 2.4} l3 -.7`, '#52625a', .45);
  shape('M17 -36 Q7 -39 9 -30 Q9 -20 16 -22 Q23 -25 21 -34 Z', gradient(10, -34, 22, -24, [[0, '#a9ada0'], [1, '#65746a']]), '#4e5d54', .7);
  line('M16 -34 Q11 -34 12 -29 Q13 -24 16 -25', '#7b887b', .6);
  shape('M23 -26 C29 -26 31 -19 40 -22 C37 -15 29 -18 24 -21 Z', '#eee3bc', '#8c8a6b', .6);
  line('M27 -23 Q33 -19 37 -21', '#fff3d2', .65);
  shape('M18 -38 Q25 -43 30 -36 L30 -31 L25 -32 L23 -37 Z', '#526c6a', gold, .7);
  line('M24 -39 L27 -34 L29 -34', '#c4c8b4', .7);
  oval(28.3, -31, 1.25, .8, '#27352e'); oval(28.7, -31.3, .35, .3, '#f0ddb1');
  line('M21 -24 Q22 -18 28 -18', darkGold, 1.1);
  oval(26, -19.3, 1, 1.2, gold);
  g.restore();
  // Sway belongs to the mounted crew, rather than to the planted feet.
  g.save(); g.translate(0, walking ? -Math.abs(stride) * .65 : -thrust * .35);
  shape('M-17 -40 L7 -40 L9 -35 L-18 -35 Z', '#6c4830', '#352e24', .8);
  line('M-17 -36 H8', gold, 1);
  line('M-19 -37 L-19 -58', '#8e7245', 1);
  shape(`M-18 -57 Q-12 ${-59 + stride} -7 -55 L-9 -49 Q-13 ${-52 + stride} -18 -50 Z`, teamCloth, gold, .5);
  for (const [x, y] of [[-15, -55], [-16, -53], [-14, -53]]) oval(x, y, .55, .55, '#f4d99b');
  oval(-19, -58.5, .9, 1.1, gold);
  function soldier(x, y, archer) {
    g.save(); g.translate(x, y);
    shape('M-2 -6 L2 -6 L3 0 L-3 0 Z', '#6e817a', '#2f3e39', .6);
    line('M-2 -4 H2 M-2 -2 H2', '#bcc1ae', .5);
    oval(0, -8, 1.8, 2.1, '#bd9970');
    shape('M-2 -8 Q-2 -11 0 -12 Q2 -10 2 -8 Z', '#aeb8b1', '#34463e', .5);
    line('M0 -11 V-9', '#ece3bc', .5);
    line('M.3 -7.5 H1.3', '#473c2e', .5);
    if (archer === true) {
      line('M1 -5 L5 -6 L7 -7', '#ad9877', 1.2);
      line('M-1 -5 L2 -3 L5 -6', '#708078', 1.4);
      const reach = thrust * 2;
      line(`M7 ${-12 + reach} Q12 -6 7 ${reach} M7 ${-12 + reach} L5 -6 L7 ${reach}`, '#deb978', .65);
      line('M4 -6 H14', '#c1b187', .55);
    } else if (archer === false) {
      line('M1 -5 L4 -3 L5 -7', '#ac9473', 1.1);
      line('M5 1 L7 -17', '#987846', .8);
      shape('M7 -20 L5.5 -16 L8 -16 Z', '#c2c9c1', '#475950', .4);
    } else {
      line('M1 -5 L3 -2 L6 -1', '#ad9877', 1.1);
      line('M5 -1 L7 -5 Q8 -6 8 -4', '#b19a67', .6);
    }
    g.restore();
  }
  soldier(-10, -39, false); soldier(1, -39, true);
  // Front parapet gives the riders a seated, supported silhouette.
  shape('M-17 -42 H-13 V-40 H-9 V-42 H-5 V-40 H0 V-42 H4 V-40 H8 L7 -35 H-16 Z', '#855939', gold, .6);
  for (const x of [-12, -5, 2]) { oval(x, -37.6, 1.4, 1.8, teamCloth, darkGold); oval(x, -37.6, .4, .5, gold); }
  // Mahout sits directly behind the head with visible reins.
  soldier(16, -34, 'driver');
  line('M18 -36 Q21 -35 25 -29', '#514936', .5);
  line('M15 -34 L17 -30 L16 -27', '#624e3b', 1.5);
  g.restore(); g.restore();
}
