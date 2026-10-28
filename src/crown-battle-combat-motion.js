import { roleOf, UNIT_TYPES } from './crown-battle.js';
import { livingMotion } from './crown-battle-reference-motion.js';

const clamp = x => Math.max(0, Math.min(1, x));
const joints = [-9, -4, 0];
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

export function fallDuration(unit) {
  const role = roleOf(unit);
  return (role === 'elephant' ? 1.05 : role === 'cavalry' ? .85 : .68) + (unit.id % 5) * .025;
}

// Reused output objects keep this independent of soldier count and frame rate.
// Both the Canvas and GPU paths use this same pose, including the bent knees.
export function combatPose(unit, time, offset, out) {
  out.a = out.d = out.alpha = 1; out.b = out.c = out.x = out.y = out.fold = 0;
  out.direction = unit.deathDirection || unit.hitDirection || -unit.face;
  if (unit.hp > 0) {
    out.x = offset;
    if (unit.flash > 0 || unit.stagger > 0) {
      const t = unit.flash > 0 ? 1 - unit.flash / .13 : 1 - unit.stagger / .28;
      const reaction = Math.sin(Math.PI * clamp(t)) * (unit.stagger > 0 ? 1 : .65);
      out.c = -.15 * reaction * (unit.hitDirection || unit.staggerX || -unit.face);
      out.d = 1 - .055 * reaction;
    } else if (unit.moving || unit.attack > 0) {
      const role = roleOf(unit);
      livingMotion(unit, time, role, unit.combatProfile?.ranged ?? (UNIT_TYPES[unit.type]?.ranged || role === 'archer'), out);
    }
    return out;
  }
  const age = Math.max(0, time - (unit.deadAt ?? time)), t = age / fallDuration(unit);
  const role = roleOf(unit), mounted = role === 'cavalry' || role === 'elephant';
  const buckle = smooth((t - .1) / .38), fall = smooth((t - .24) / .55);
  const settle = Math.sin(clamp((t - .79) / .21) * Math.PI) * (1 - clamp((t - .79) / .21));
  const dir = out.direction;
  // Early loss of support, then gravity, then one small ground contact settle.
  // Horses already have a horizontal silhouette: they sink onto their side.
  const angle = dir * (mounted ? .24 * fall : 1.42 * fall + .08 * Math.sin(clamp(t / .24) * Math.PI));
  const sy = mounted ? 1 - .62 * fall : 1 - .18 * fall;
  out.a = Math.cos(angle); out.b = Math.sin(angle) * sy;
  out.c = -Math.sin(angle); out.d = Math.cos(angle) * sy;
  out.x = dir * (mounted ? 4 : 2.5) * fall;
  out.y = (mounted ? 3 : 1.5) * fall - settle * 1.2;
  out.fold = mounted ? 0 : buckle * .82;
  out.alpha = 1 - .16 * fall - .12 * smooth((age - 12) / 18);
  return out;
}

// Each row: texture y, horizontal bend, posed y. Four strips only for a
// falling/collapsed foot soldier; ordinary units remain one GPU quad.
export function combatRows(pose, top, bottom, rows) {
  const count = pose.fold ? 5 : 2;
  for (let i = 0; i < count; i++) {
    const y = i === 0 ? top : i === count - 1 ? bottom : Math.max(top, Math.min(bottom, joints[i - 1]));
    const bend = y < -9 ? 0 : y < -4 ? (y + 9) / 5 : y < 0 ? -y / 4 : 0;
    rows[i * 3] = y;
    rows[i * 3 + 1] = -pose.direction * bend * 4 * pose.fold;
    rows[i * 3 + 2] = y + Math.min(1, Math.max(0, -y / 9)) * 5 * pose.fold;
  }
  return count;
}

export function drawPosedSprite(ctx, entry, pose, rows) {
  const left = entry.offsetX, top = entry.offsetY, width = entry.width / entry.resolution;
  const count = combatRows(pose, top, top + entry.height / entry.resolution, rows);
  ctx.save(); ctx.globalAlpha *= pose.alpha;
  ctx.transform(pose.a, pose.b, pose.c, pose.d, pose.x, pose.y);
  for (let i = 0; i < count - 1; i++) {
    const j = i * 3, h = rows[j + 3] - rows[j];
    if (h <= 0) continue;
    ctx.save();
    ctx.transform(1, 0, (rows[j + 4] - rows[j + 1]) / h, (rows[j + 5] - rows[j + 2]) / h, rows[j + 1], rows[j + 2]);
    ctx.drawImage(entry.canvas, entry.x, entry.y + (rows[j] - top) * entry.resolution, entry.width, h * entry.resolution, left, 0, width, h);
    ctx.restore();
  }
  ctx.restore();
}
