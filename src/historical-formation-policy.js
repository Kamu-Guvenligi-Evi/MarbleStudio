// Shared by commanders: equipment and the opposing front choose the shape.
// A doctrine may prefer a shape, but no formation belongs to a civilization.
export function selectCorpsFormation(corps, strategy, { side = 0, underFire = false, reserve = false, fallback } = {}) {
  if (reserve || corps === 'pike') return 'block';
  if (['mounted', 'light-horse', 'skirmisher', 'chariot', 'escort'].includes(corps)) return 'loose';
  const enemy = strategy?.enemy, count = Math.max(1, enemy?.count || 0);
  const cavalry = (enemy?.cavalry || 0) / count >= .35 || strategy?.kind === 'brace';
  const protectedFront = ((enemy?.pikes || 0) + (enemy?.elephants || 0)) / count >= .3;
  const fire = underFire || strategy?.kind === 'close';
  if (corps === 'missile') return cavalry ? 'line' : 'loose';
  if (corps === 'horse') {
    if (cavalry) return 'block';
    if (protectedFront || strategy?.kind === 'flank')
      return side && side === strategy?.flank ? (side < 0 ? 'echelonLeft' : 'echelonRight') : 'block';
    return fallback || 'wedge';
  }
  if (corps === 'infantry') {
    if (cavalry) return 'block';
    if (fire) return 'loose';
    return fallback || 'line';
  }
  return fallback || 'line';
}
