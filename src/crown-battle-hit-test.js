import { WORLD } from './crown-battle.js';
import { visualScaleOf } from './crown-battle-visual-scale.js';
import { combatOffset } from './crown-battle-feedback.js';
import { combatPose } from './crown-battle-combat-motion.js';
import { soldierAction, soldierFrame } from './crown-battle-tactical-visuals.js';

// Match the visible, scaled sprite first; retain the forgiving foot target for touch.
export function unitAtPoint(battle, renderer, point, team = null, footRadius = 14) {
  const rect = renderer.canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / renderer.canvas.width, rect.height / renderer.canvas.height);
  const pixelsX = renderer.canvas.width * scale / WORLD.width * renderer.view.zoom;
  const pixelsY = renderer.canvas.height * scale / WORLD.height * renderer.view.zoom;
  let visible = null, nearest = null, distance = footRadius;
  const pose = {};
  for (const unit of battle.units) {
    if ((team !== null && unit.team !== team) || unit.hp <= 0 || unit.removed) continue;
    const dx = point.x - unit.x, dy = point.y - unit.y;
    const d = Math.hypot(dx * pixelsX, dy * pixelsY);
    if (d < distance) { distance = d; nearest = unit; }
    const size=visualScaleOf(unit);
    combatPose(unit, renderer.combatTime ?? battle.time, combatOffset(unit), pose);
    const px = dx / (renderer.spriteScaleX * size) - pose.x;
    const py = dy / (renderer.spriteScaleY * size) - pose.y;
    const determinant = pose.a * pose.d - pose.b * pose.c;
    const x = (pose.d * px - pose.c * py) / determinant * unit.face + 30;
    const y = (pose.a * py - pose.b * px) / determinant + 61;
    if (x < 0 || x >= 80 || y < 0 || y >= 76) continue;
    const action = soldierAction(unit);
    const frame = soldierFrame(unit, action, battle.time);
    const sprite = renderer.sprites.get(unit.type, unit.team, frame, action, unit.id % 3);
    const alpha = sprite.getContext('2d').getImageData(Math.floor(x * sprite.width / 80), Math.floor(y * sprite.height / 76), 1, 1).data[3];
    // Soldiers are painted in y order, so an overlapping foreground soldier wins.
    if (alpha >= 64 && (!visible || unit.y >= visible.y)) visible = unit;
  }
  return visible || nearest;
}
