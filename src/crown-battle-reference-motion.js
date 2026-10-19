// Motion study: local battle recording, 2026-10-17 (6–8 s).
// Small weight shifts keep dense ranks readable. Reuse the eight baked limb
// frames, with continuous body motion on the simulation clock (never wall time).
const TAU = Math.PI * 2;
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

export function strideClock(unit, time) {
  return time * (unit.charge ? 20 : 11) + (unit.phase || 0);
}

// Mutates a reusable, identity-initialized combat pose. No allocations or art
// generation per soldier; Canvas and instanced GPU rendering share this path.
export function livingMotion(unit, time, role, ranged, out) {
  const face = unit.face || 1;
  const horse = role === 'cavalry', elephant = role === 'elephant';
  if (unit.moving) {
    const cycle = strideClock(unit, time) * TAU / 8;
    const step = Math.sin(cycle), lift = step * step;
    if (horse) {
      // Collected canter: gather, rise, then settle onto the leading hoof.
      const drive = unit.charge ? 1 : .65;
      out.y = -lift * 1.15 * drive;
      out.b = Math.sin(cycle + .55) * .025 * drive * face;
      out.c = -(.035 + step * .018) * drive * face;
      out.d = 1 - Math.cos(cycle * 2) * .012 * drive;
    } else if (elephant) {
      out.c = -.012 * step * face;
      out.d = 1 - lift * .008;
    } else {
      // Feet remain planted while the shoulders transfer weight between steps.
      out.c = -(.025 + step * .018) * face;
      out.d = 1 - lift * .018;
    }
  }
  if (unit.attack > 0) {
    const phase = clamp(1 - unit.attack / .24);
    const prepare = Math.sin(Math.PI * clamp(phase / .5));
    const strike = phase < .5 ? smooth((phase - .25) / .25) : 1 - smooth((phase - .5) / .375);
    // Release recoil for bows; shoulder-led commitment for melee. Translation
    // is already supplied by combatOffset, so do not double the attack reach.
    const lean = ranged ? -.045 * Math.sin(Math.PI * clamp((phase - .5) / .375))
      : strike * (horse ? .065 : elephant ? .035 : .13) - prepare * .035;
    out.c -= lean * face;
    out.d -= strike * (ranged ? .008 : .025);
  }
  return out;
}
