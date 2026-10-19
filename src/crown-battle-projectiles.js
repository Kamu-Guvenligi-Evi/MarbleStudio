// Ground-plane motion and elevation are separate so arrows keep their shape
// and flight direction in both the portrait and stretched desktop battlefield.
const SPEED = 280;
const GRAVITY = 180;
let arrowSprite;

function getArrowSprite(ctx) {
  if (arrowSprite) return arrowSprite;
  // A single tiny raster replaces several paths per projectile in dense volleys.
  const canvas = ctx.canvas.ownerDocument?.createElement('canvas') || new OffscreenCanvas(80, 24);
  canvas.width = 80; canvas.height = 24;
  const g = canvas.getContext('2d'); g.scale(4, 4); g.translate(17, 3);
  g.lineCap = 'butt'; g.lineWidth = 1.4; g.strokeStyle = '#423522';
  g.beginPath(); g.moveTo(-15, 0); g.lineTo(-2.5, 0); g.stroke();
  g.lineWidth = .65; g.strokeStyle = '#c6a879'; g.stroke();
  g.fillStyle = '#c9c4af';
  g.beginPath(); g.moveTo(-11, 0); g.lineTo(-14.5, -1);
  g.lineTo(-16, -.9); g.lineTo(-15, 0); g.lineTo(-16, .9);
  g.lineTo(-14.5, 1); g.closePath(); g.fill();
  g.fillStyle = '#66757a';
  g.beginPath(); g.moveTo(1, 0); g.lineTo(-3.5, -1);
  g.lineTo(-2.5, 0); g.lineTo(-3.5, 1); g.closePath(); g.fill();
  g.strokeStyle = '#c4d1cf'; g.lineWidth = .5;
  g.beginPath(); g.moveTo(-3, -.6); g.lineTo(1, 0); g.stroke();
  arrowSprite = canvas;
  return canvas;
}

export function createArrow(source, target, damage, releaseHeight = 13, targetHeight = 13, hitRadius = 8, style = 'arrow') {
  // The shared engine dispatches ranged shots here; a sling has no arrow shaft.
  if (source.combatProfile?.config?.projectile === 'sling' || source.type === 'greek_rhodian_slinger') style = 'sling';
  if (source.combatProfile?.config?.projectile === 'dart') style = 'dart';
  // Bolts retain the same ballistic collision model; only launch speed and shaft differ.
  const launchSpeed = style === 'bolt' ? 345 : style === 'dart' ? 210 : SPEED;
  const dx = target.x - source.x, dy = target.y - source.y;
  const speed = target.moving ? target.speed || 0 : 0;
  const tx = (target.headingX || 0) * speed, ty = (target.headingY || 0) * speed;
  // Solve an intercept once, at release. A subsequent turn cannot steer an arrow.
  const a = launchSpeed * launchSpeed - tx * tx - ty * ty;
  const dot = dx * tx + dy * ty, distance2 = dx * dx + dy * dy;
  const duration = Math.max(.09, a > 0
    ? (dot + Math.sqrt(dot * dot + a * distance2)) / a
    : Math.sqrt(distance2) / launchSpeed);
  const endX = target.x + tx * duration, endY = target.y + ty * duration;
  const vz = (targetHeight - releaseHeight) / duration + GRAVITY * duration / 2;
  const p = { kind: 'arrow', style, target, sourceId: source.id, team: source.team, damage, age: 0, duration,
    fromX: source.x, fromY: source.y, releaseHeight, endX, endY, hitRadius,
    vx: (endX - source.x) / duration, vy: (endY - source.y) / duration, vz,
    launchOffsetX: (source.face || 1) * 10,
    lifetime: (vz + Math.sqrt(vz * vz + 2 * GRAVITY * releaseHeight)) / GRAVITY };
  advanceArrow(p, 0);
  return p;
}

export function advanceArrow(p, dt) {
  p.age += dt;
  const t = Math.min(p.age, p.lifetime);
  p.x = p.fromX + p.vx * t;
  p.groundY = p.fromY + p.vy * t;
  const gravity = p.gravity ?? GRAVITY;
  p.height = Math.max(0, p.releaseHeight + p.vz * t - gravity * t * t / 2);
  p.verticalSpeed = p.vz - gravity * t;
  p.y = p.groundY - p.height;
  p.angle = Math.atan2(p.vy - p.verticalSpeed, p.vx);
}

export function createBullet(source, target, damage) {
  const dx = target.x - source.x, dy = target.y - source.y;
  const d = Math.max(.001, Math.hypot(dx, dy));
  // Short direct fire: fixed muzzle direction, no target-following or lob.
  const p = { kind: 'bullet', ballistic: true, target, sourceId: source.id,
    team: source.team, damage, age: 0, duration: d / 650, lifetime: (d + 100) / 650,
    fromX: source.x, fromY: source.y, endX: target.x, endY: target.y,
    vx: dx / d * 650, vy: dy / d * 650, vz: 0, gravity: 0, releaseHeight: 8 };
  advanceArrow(p, 0); return p;
}

export function loftArrow(p, target) {
  if (p.style === 'bolt' || p.style === 'sling' || p.style === 'dart') return false;
  const dx = target.x - p.fromX, dy = target.y - p.fromY;
  const speed = target.moving ? target.speed || 0 : 0;
  const tx = (target.headingX || 0) * speed, ty = (target.headingY || 0) * speed;
  const targetHeight = p.releaseHeight + p.vz * p.duration - GRAVITY * p.duration ** 2 / 2;
  const dh = targetHeight - p.releaseHeight;
  const energy = p.vx ** 2 + p.vy ** 2 + p.vz ** 2;
  const required = t => (dx / t + tx) ** 2 + (dy / t + ty) ** 2 + (dh / t + GRAVITY * t / 2) ** 2;
  // Find the high-angle solution with the SAME launch speed. Raising the arc
  // costs flight time; it does not grant extra energy or steer after release.
  let low = Math.max(p.duration * 1.05, Math.sqrt(energy) / GRAVITY);
  let high = 2 * Math.sqrt(energy) / GRAVITY + 1 + Math.abs(dh) / Math.sqrt(energy);
  if (required(low) > energy || required(high) < energy) return false;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (required(mid) < energy) low = mid; else high = mid;
  }
  p.duration = (low + high) / 2;
  p.endX = target.x + tx * p.duration; p.endY = target.y + ty * p.duration;
  p.vx = (p.endX - p.fromX) / p.duration; p.vy = (p.endY - p.fromY) / p.duration;
  p.vz = dh / p.duration + GRAVITY * p.duration / 2;
  p.lifetime = (p.vz + Math.sqrt(p.vz * p.vz + 2 * GRAVITY * p.releaseHeight)) / GRAVITY;
  p.lofted = true; advanceArrow(p, 0); return true;
}

export function projectilePose(p, sx = 1, sy = 1) {
  if (p.kind === 'bullet') {
    const angle = p.angle ?? Math.atan2(p.target.y - p.y, p.target.x - p.x);
    return { x: p.x, y: p.y, angle: Math.atan2(Math.sin(angle) / sy, Math.cos(angle) / sx) };
  }
  const bowOffset = p.launchOffsetX * (1 - Math.min(p.age, p.lifetime) / p.duration);
  return { x: p.x + bowOffset * sx, y: p.groundY - p.height * sy,
    angle: Math.atan2(p.vy / sy - p.verticalSpeed,
      p.vx / sx - p.launchOffsetX / p.duration) };
}

export function drawProjectile(ctx, p, sx = 1, sy = 1, pose = projectilePose(p, sx, sy)) {
  ctx.save(); ctx.translate(pose.x, pose.y); ctx.scale(sx, sy); ctx.rotate(pose.angle);
  if (p.kind !== 'arrow-ground' && p.age > .015) {
    // A short fading wake attached to the actual projectile, with no stored
    // particles and no second arrow generated at bow release.
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = p.kind === 'bullet' ? 1.3 : .8;
    ctx.strokeStyle = p.kind === 'bullet' ? '#ffd99d' : '#e3dfc7';
    const tail = p.kind === 'bullet' ? 5 : p.style === 'bolt' ? 10 : p.style === 'sling' ? 2 : p.style === 'dart' ? 25 : 17;
    const length = Math.min(18, p.age * 90);
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha *= .55;
      ctx.beginPath(); ctx.moveTo(-tail - length * i / 3, 0); ctx.lineTo(-tail - length * (i + 1) / 3, 0); ctx.stroke();
    }
    ctx.restore();
  }
  if (p.kind === 'bullet') {
    ctx.strokeStyle = '#ffd594'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, 0); ctx.stroke();
  } else {
    if (p.kind === 'arrow-ground') ctx.globalAlpha *= .65 * Math.min(1, p.ttl);
    // Reuse the cached raster; a short, stout bolt has a distinct silhouette.
    if (p.style === 'sling') {
      ctx.fillStyle = '#89918a'; ctx.beginPath(); ctx.ellipse(0, 0, 2, 1.2, 0, 0, Math.PI * 2); ctx.fill();
    } else if (p.style === 'bolt') ctx.drawImage(getArrowSprite(ctx), -10.2, -3.3, 12, 6.6);
    else if (p.style === 'dart') ctx.drawImage(getArrowSprite(ctx), -25.5, -3.3, 30, 6.6);
    else ctx.drawImage(getArrowSprite(ctx), -17, -3, 20, 6);
  }
  ctx.restore();
}
