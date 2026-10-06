import Matter from 'matter-js';
import { normalizeSection } from './section-settings.js';

const { Bodies, Body, Composite } = Matter;
export const SECTION_HEIGHT = 650;
export const COURSE_START = 430;
export const COURSE_META = {
  cascade: { name: 'Neon Cascade', accent: '#d6fa85', modules: ['funnel', 'fork', 'wheels', 'slalom', 'pulse', 'drift', 'pegs', 'pendulum'] },
  pinball: { name: 'Pinball Garden', accent: '#c9acff', modules: ['pegs', 'wheels', 'fork', 'pendulum', 'drift', 'pulse', 'funnel', 'slalom'] },
  velocity: { name: 'Velocity', accent: '#ffb587', modules: ['slalom', 'fork', 'drift', 'funnel', 'pendulum', 'wheels', 'pulse', 'pegs'] },
  clockwork: { name: 'Clockwork', accent: '#72dedb', modules: ['pulse', 'pendulum', 'wheels', 'drift', 'fork', 'pegs', 'funnel', 'slalom'] },
};

export const MODULES = {
  shortcut: { name: 'Riskli kestirme', subtitle: 'Ortayı yakala, uzun yolu geride bırak.', icon: '⑂', color: '#f4c65b', tag: 'Pozisyon değiştirir' },
  crossramps: { name: 'Çapraz hız rampaları', subtitle: 'Kısa rampalar, hızlı çapraz geçişler.', icon: '≋', color: '#71d8f2', tag: 'Hızlı' },
  funnel: { name: 'Darboğaz', subtitle: 'Dar geçit, kalabalık çıkış.', icon: '⋁', color: '#d6fa85' },
  fork: { name: 'Yol ayrımı', subtitle: 'İki rota. Tek bir finiş.', icon: '⑂', color: '#77d9ef' },
  wheels: { name: 'İkiz rotor', subtitle: 'Zıt yönler, yeni sıralamalar.', icon: '✳', color: '#c7a8f5' },
  slalom: { name: 'Hız koridoru', subtitle: 'Rampaları kullan, çizgini koru.', icon: '≋', color: '#ffb587' },
  pulse: { name: 'Nabız kapıları', subtitle: 'Doğru tarafta, doğru zamanda.', icon: 'Ⅱ', color: '#f29fbd' },
  drift: { name: 'Hareketli ada', subtitle: 'Hiçbir geçiş aynı kalmaz.', icon: '↔', color: '#7dd6ba' },
  pegs: { name: 'Çarpışma bahçesi', subtitle: 'Her temas yeni bir ihtimal.', icon: '⠿', color: '#a0c4f4' },
  pendulum: { name: 'Sarkaç geçidi', subtitle: 'Salınımı yakala, aradan sıyrıl.', icon: '⌁', color: '#f3cc78' },
};

// Modules have a 650-unit envelope and leave passages for 36-unit marbles.
export function buildCourse(world, rng, preset, sectionCount, customSequence = null, previewIndex = null) {
  const obstacles = [], movers = [], gates = [], sections = [];
  let currentSection = null;
  const included = () => !currentSection || previewIndex === null || currentSection.sourceIndex === previewIndex;
  const add = (body, kind = 'rail') => {
    body.plugin = { ...body.plugin, kind, section: currentSection?.index ?? -1 };
    if (included()) { obstacles.push(body); Composite.add(world, body); } return body;
  };
  const rail = (x, y, width, angle = 0, kind = 'rail', height = 14) => add(Bodies.rectangle(x, y, width, height, {
    isStatic: true, angle, chamfer: { radius: Math.min(6, height / 2) }, friction: 0, frictionStatic: 0, restitution: .35,
  }), kind);
  const line = (x1, y1, x2, y2, kind = 'rail') => rail((x1 + x2) / 2, (y1 + y2) / 2, Math.hypot(x2 - x1, y2 - y1), Math.atan2(y2 - y1, x2 - x1), kind);
  const circle = (x, y, radius, kind = 'bumper') => add(Bodies.circle(x, y, radius, { isStatic: true, restitution: .72, friction: 0, frictionStatic: 0 }), kind);
  const spin = (x, y, width, speed, angle = 0) => {
    const body = rail(x, y, width, angle, 'rotor', 16);
    if(included()) movers.push({ type: 'spin', body, speed: speed * (currentSection.settings.speed ?? 1), phase: angle, x, y, radius: width / 2 });
  };
  const swing = (x, y, width, phase, speed, amplitude) => {
    const body = rail(x, y, width, Math.sin(phase) * amplitude, 'swing', 17);
    if(included()) movers.push({ type: 'swing', body, phase, speed: speed * (currentSection.settings.speed ?? 1), amplitude: amplitude * (currentSection.settings.amplitude ?? 1), x, y, radius: width / 2 });
  };
  const translate = (x, y, radius, travel, speed, phase) => {
    const body = circle(x + Math.sin(phase) * travel, y, radius, 'drifter');
    if(included()) movers.push({ type: 'slide', body, x, y, travel: travel * (currentSection.settings.travel ?? 1), speed: speed * (currentSection.settings.speed ?? 1), phase, radius });
  };
  const pulse = (x, y, width, phase) => {
    const body = rail(x, y, width, 0, 'pulse', 12);
    const {openFor,closedFor} = currentSection.settings;
    const gate = { body, phase, period: openFor + closedFor, openFor, open: false, untilChange: 0 };
    body.plugin.gate = gate; if(included()) gates.push(gate);
  };

  const finishY = COURSE_START + (previewIndex === null ? sectionCount : 1) * SECTION_HEIGHT + (previewIndex === null ? 220 : 100);
  const bottom = finishY + 230;
  rail(13, bottom / 2, bottom + 100, Math.PI / 2, 'wall', 26);
  rail(527, bottom / 2, bottom + 100, Math.PI / 2, 'wall', 26);
  rail(270, bottom, 540, 0, 'wall', 30);
  const startGate = rail(270, 300, 488, 0, 'gate', 12);
  const base = COURSE_META[preset].modules;
  const pool = base.slice(1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const sequence = (customSequence ?? [base[0], ...pool].slice(0, sectionCount)).map(normalizeSection);
  for (const [index, config] of sequence.entries()) {
    const {type,settings} = config;
    const y = COURSE_START + (previewIndex === null ? index : 0) * SECTION_HEIGHT;
    const phase = rng() * Math.PI * 2;
    let direction = rng() < .5 ? -1 : 1;
    if(settings.direction === 'clockwise' || settings.side === 'right') direction = 1;
    if(settings.direction === 'counterclockwise' || settings.side === 'left') direction = -1;
    const variation = (rng() - .5) * 24;
    currentSection = { index: previewIndex === null ? index : 0, sourceIndex:index, type, settings, y, endY: y + SECTION_HEIGHT, ...MODULES[type] };
    if(included()) sections.push(currentSection);
    switch (type) {
      case 'shortcut': {
        const center = 270 + settings.offset, half = settings.gap / 2;
        // The middle stays open; missed entries flow down the two longer banks.
        line(center - half, y + 100, 100, y + 270);
        line(center + half, y + 100, 440, y + 270);
        line(26, y + 365, 182, y + 530);
        line(514, y + 365, 358, y + 530);
        break;
      }
      case 'crossramps': {
        const x = value => direction === 1 ? value : 540 - value;
        // Short, staggered banks leave a clear central lane and no holding pockets.
        for (const [left, top] of [[true,85],[false,185],[true,335],[false,435]]) {
          line(x(left ? 26 : 514), y + top, x(left ? 220 : 320), y + top + 125 * settings.slope);
        }
        break;
      }
      case 'funnel': {
        const center = 270 + variation;
        const halfGap = settings.gap / 2;
        line(26, y + 110, center - halfGap, y + 250); line(514, y + 110, center + halfGap, y + 250);
        line(center - halfGap, y + 250, center - halfGap, y + 310); line(center + halfGap, y + 250, center + halfGap, y + 310);
        spin(center, y + 465, 250, direction * .68, phase); break;
      }
      case 'fork': {
        const diamond = Bodies.polygon(270, y + 170, 4, 61, { isStatic: true, restitution: .38, friction: 0, frictionStatic: 0 });
        Body.rotate(diamond, Math.PI / 4); add(diamond, 'splitter');
        line(270, y + 225, 270, y + 440, 'divider');
        line(27, y + 300, 170, y + 370); line(513, y + 235, 370, y + 305);
        circle(368, y + 425, 20); spin(135, y + 490, 120, direction * 1.05, phase); break;
      }
      case 'wheels': {
        spin(158, y + 190, 204, direction * .86, phase);
        spin(382, y + 310, 204, -direction * .92, -phase);
        spin(220 + variation, y + 495, 260, direction * .57, phase + 1); break;
      }
      case 'slalom': {
        const x = value => direction === 1 ? value : 540 - value;
        line(x(26), y + 100, x(365), y + 100 + 105 * settings.slope); line(x(514), y + 285, x(175), y + 285 + 115 * settings.slope);
        line(x(26), y + 455, x(290), y + 455 + 90 * settings.slope); break;
      }
      case 'pulse': {
        line(26, y + 85, 182, y + 175); line(514, y + 85, 358, y + 175);
        line(270, y + 110, 270, y + 405, 'divider');
        const period = settings.openFor + settings.closedFor;
        pulse(146, y + 315, 238, phase / (2 * Math.PI) * period);
        pulse(394, y + 315, 238, phase / (2 * Math.PI) * period + period / 2);
        circle(160, y + 475, 24); circle(380, y + 475, 24); break;
      }
      case 'drift': {
        translate(270, y + 150, 43, 137, .9, phase);
        translate(270, y + 360, 53, 125, -.75, phase + Math.PI);
        line(26, y + 420, 163, y + 490); line(514, y + 420, 377, y + 490); break;
      }
      case 'pegs': {
        for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
          circle(90 + col * 82 + (row % 2) * 24, y + 130 + row * 94, (12 + rng() * 5) * settings.size, 'peg');
        }
        swing(270, y + 535, 190, phase, 1.1, .5); break;
      }
      case 'pendulum': {
        // Preserve a ball-width exit beside each paddle even at low amplitudes.
        swing(167, y + 180, 200, phase, 1.15, .7);
        swing(373, y + 355, 200, phase + Math.PI, 1, .7);
        circle(185, y + 510, 21); circle(355, y + 510, 21); break;
      }
    }
  }
  currentSection = null;
  const exit = finishY - 190;
  if(previewIndex === null) { line(26, exit, 202, exit + 80); line(514, exit, 338, exit + 80); }
  return { obstacles, movers, gates, sections, startGate, finishY, bottom, sequence };
}

export function updateCourse(course, time) {
  for (const m of course.movers) {
    if (m.type === 'spin') Body.setAngle(m.body, m.phase + time * m.speed, true);
    else if (m.type === 'swing') Body.setAngle(m.body, Math.sin(m.phase + time * m.speed) * m.amplitude, true);
    else Body.setPosition(m.body, { x: m.x + Math.sin(m.phase + time * m.speed) * m.travel, y: m.y }, true);
  }
  for (const gate of course.gates) {
    const phase = (time + gate.phase) % gate.period;
    gate.open = phase < gate.openFor;
    gate.untilChange = gate.open ? gate.openFor - phase : gate.period - phase;
    gate.body.collisionFilter.mask = gate.open ? 0 : 0xffffffff;
  }
}
