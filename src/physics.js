import Matter from 'matter-js';
import { buildCourse, updateCourse, COURSE_META, MODULES } from './courses.js';
import { normalizeSequence } from './section-settings.js';
import { normalizeBallImages, ballImageColor } from './ball-images.js';
import { normalizeNames } from './presentation.js';
const { Engine, Bodies, Body, Composite, Events } = Matter;
export const WIDTH = 540;
export const BALL_RADIUS = 18;
export const COLORS = ['#d8fa77','#b6a0ff','#ff997d','#71d8f2','#f4c65b','#f080b4','#66dbb5','#86aaff','#f26d70','#cbdadf','#e3a96e','#b9e57d','#d48cf2','#5fd2d0','#ffe79b','#ffb4c8','#88b5bd','#dcbdff','#ffbe73','#95e8c8'];
export const NAMES = ['Lime','Lavanta','Mercan','Buz','Altın','Sakura','Nane','Mavi','Alev','İnci','Bakır','Fıstık','Orkide','Turkuaz','Limon','Pembe','Okyanus','Leylak','Mango','Yeşim'];
export function random(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class Race {
  constructor({ seed = 2048, count = 12, preset = 'cascade', sections = 6, sequence = null, previewIndex = null, ballImages = [], ballNames = [], onHit = () => {} } = {}) {
    this.ballImages=normalizeBallImages(ballImages);
    this.ballNames=normalizeNames(ballNames);
    this.seed = Math.max(1, Math.min(999999, Math.floor(Number(seed) || 2048)));
    this.preset = COURSE_META[preset] ? preset : 'cascade';
    this.sectionCount = [4, 6, 8].includes(Number(sections)) ? Number(sections) : 6;
    if(sequence !== null) sequence = normalizeSequence(sequence);
    this.isCustom = sequence !== null;
    if (this.isCustom) this.sectionCount = sequence.length;
    if(previewIndex !== null && (!Number.isInteger(previewIndex) || previewIndex < 0 || previewIndex >= this.sectionCount)) throw new Error('Geçersiz bölüm seçimi.');
    this.courseName = this.isCustom ? 'Kendi parkurum' : COURSE_META[this.preset].name;
    this.rng = random(this.seed);
    this.fxRng = random(this.seed ^ 0x5f3759df);
    this.time = 0; this.state = 'ready'; this.finished = []; this.particles = []; this.rescues = 0;
    this.engine = Engine.create({ enableSleeping: false, positionIterations: 10, velocityIterations: 8 });
    this.engine.gravity.y = .95;
    this.course = buildCourse(this.engine.world, this.rng, this.preset, this.sectionCount, sequence, previewIndex);
    this.sequence = this.course.sequence;
    this.sectionCount = this.course.sections.length;
    this.obstacles = this.course.obstacles; this.sections = this.course.sections; this.finishY = this.course.finishY;
    updateCourse(this.course, 0);
    const ballCount = Math.max(6, Math.min(20, Math.floor(Number(count) || 12)));
    const slots = Array.from({length:ballCount},(_,i)=>i);
    const startRng = random(this.seed ^ 0x37ab91);
    for(let i=slots.length-1;i>0;i--) {
      const j=Math.floor(startRng()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]];
    }
    this.balls = Array.from({ length: ballCount }, (_, id) => {
      const slot=slots[id];
      const body = Bodies.circle(88 + (slot % 8) * 52 + (this.rng() - .5) * 8, 260 - Math.floor(slot / 8) * 44, BALL_RADIUS, {
        restitution: .5, friction: 0, frictionStatic: 0, frictionAir: .0001, density: .003, slop: .03,
      });
      body.plugin.ball = id; Composite.add(this.engine.world, body);
      return { id, name: this.ballNames[id]??NAMES[id], get color(){return ballImageColor(this.imageSrc,COLORS[id]);}, imageSrc:this.ballImages[id], body, trail: [], finishedAt: null, lastY: body.position.y, stuckFor: 0 };
    });
    Events.on(this.engine, 'collisionStart', event => {
      for (const pair of event.pairs) {
        const body = pair.bodyA.plugin.ball !== undefined ? pair.bodyA : pair.bodyB.plugin.ball !== undefined ? pair.bodyB : null;
        if (!body || body.speed < 1.9) continue;
        onHit(body.speed, body.position.x);
        const contact=pair.collision.supports.find(Boolean)??body.position;
        const sparkCount=Math.min(8,Math.ceil(body.speed),140-this.particles.length);
        for (let n = 0; n < sparkCount; n++) {
          this.particles.push({ x: contact.x, y: contact.y, vx: (this.fxRng() - .5) * 5, vy: (this.fxRng() - .5) * 5, life: 1, color: this.balls[body.plugin.ball].color });
        }
      }
    });
  }
  start() {
    if (this.state !== 'ready') return;
    Composite.remove(this.engine.world, this.course.startGate);
    this.obstacles.splice(this.obstacles.indexOf(this.course.startGate), 1);
    this.state = 'running';
  }
  step(dt = 1000 / 120) {
    if (this.state !== 'running') return;
    this.time += dt / 1000; updateCourse(this.course, this.time);
    const previousY = this.balls.map(b => b.body.position.y);
    for (const b of this.balls) {
      const body = b.body;
      // Keep a tunnelling guard, without braking normal ramp and free-fall speeds.
      if (body.speed > 18) Body.setVelocity(body, { x: body.velocity.x * 18 / body.speed, y: body.velocity.y * 18 / body.speed });
      if (b.finishedAt === null) {
        const waitingAtGate = this.course.gates.some(g => !g.open && Math.abs(body.position.y - g.body.position.y) < 45 && Math.abs(body.position.x - g.body.position.x) < 130);
        if (!waitingAtGate && Math.abs(body.position.y - b.lastY) < .13 && body.speed < .45) b.stuckFor += dt / 1000;
        else b.stuckFor = 0;
        if (b.stuckFor > 2.5) {
          const massScale = (BALL_RADIUS / 12) ** 2;
          Body.applyForce(body, body.position, { x: (body.position.x < 270 ? 1 : -1) * .0015 * massScale, y: -.002 * massScale });
          b.stuckFor = 0; this.rescues++;
        }
        b.lastY = body.position.y;
      }
    }
    Engine.update(this.engine, dt);
    // Interpolated crossings prevent ball IDs deciding near-simultaneous finishes.
    const arrivals = [];
    for (const [i, b] of this.balls.entries()) {
      if (b.finishedAt === null && b.body.position.y >= this.finishY) {
        const delta = b.body.position.y - previousY[i];
        const fraction = delta > 0 ? Math.max(0, Math.min(1, (this.finishY - previousY[i]) / delta)) : 1;
        b.finishedAt = this.time - dt / 1000 + fraction * dt / 1000; arrivals.push(b);
      }
      b.trail.push({ ...b.body.position }); if (b.trail.length > 24) b.trail.shift();
    }
    arrivals.sort((a, b) => a.finishedAt - b.finishedAt); this.finished.push(...arrivals);
    for (const p of this.particles) { p.x += p.vx; p.y += p.vy; p.life -= dt / 450; }
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.finished.length === this.balls.length) this.state = 'finished';
  }
  sectionAt(y) { return this.sections.find(s => y >= s.y && y < s.endY) ?? null; }
  ranking() {
    return [...this.balls].sort((a, b) => {
      if (a.finishedAt !== null && b.finishedAt !== null) return a.finishedAt - b.finishedAt;
      if (a.finishedAt !== null) return -1;
      if (b.finishedAt !== null) return 1;
      return b.body.position.y - a.body.position.y;
    });
  }
  dispose() { Events.off(this.engine); Composite.clear(this.engine.world, false); Engine.clear(this.engine); }
}
