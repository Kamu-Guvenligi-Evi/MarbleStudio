// Eight baked poses share the simulation's contact at phase .5 (120 ms).
// Preparation, contact, follow-through and recovery are deliberately asymmetric.
const times = [0, .25, .5, .625, .875];
const curves = {
  thrust: { angle: [0, 1.48, 1.48, 1.48, 0], x: [0, -5, 2, 1, 0], y: [0, 0, 0, 0, 0] },
  slash: { angle: [0, -.85, 1.45, 1.9, 0], x: [0, -2, 2, 2, 0], y: [0, -2, -1, 1, 0] },
  heavy: { angle: [0, -1.15, 1.45, 2.05, 0], x: [0, -3, 2, 3, 0], y: [0, -5, -1, 2, 0] },
};
export function weaponFamily(weapon = '') {
  if (/spear|pike|lance|kontos|xyston|sarissa|menavlion|yari|^ihe$/i.test(weapon)) return 'thrust';
  if (/mace|bozdogan|hammer|club|axe|phkak|poleaxe|halberd|flail|taiaha|naginata|roncone|claymore|^crSwissGreatsword$|^ecBill$|^mcJi$/i.test(weapon)) return 'heavy';
  if (/bow|musket|crossbow|sling|staff|javelin/i.test(weapon)) return 'ranged';
  return 'slash';
}
function sample(values, phase) {
  if (phase >= .875) return values[4];
  let i = 0;
  while (phase > times[i + 1]) i++;
  const t = Math.max(0, (phase - times[i]) / (times[i + 1] - times[i]));
  return values[i] + (values[i + 1] - values[i]) * t * t * (3 - 2 * t);
}
// Called when baking a shared sprite, never for each soldier in the render loop.
export function weaponMotion(weapon, action, phase, restAngle = .25) {
  const family = weaponFamily(weapon), curve = curves[family];
  if (action !== 'attack' || !curve) return { angle: restAngle, x: 0, y: 0 };
  const angle = sample(curve.angle, phase);
  const restWeight = phase <= .25 ? 1 - phase / .25 : phase >= .625 ? (phase - .625) / .25 : 0;
  return { angle: angle + restAngle * Math.min(1, restWeight), x: sample(curve.x, phase), y: sample(curve.y, phase) };
}
