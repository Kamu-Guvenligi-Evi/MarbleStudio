// Live simulation pacing. Large armies run at 20 updates per playback second
// (10 for 6000+ soldiers at 4x; the renderer interpolates between updates):
// accelerated playback advances a larger simulation interval instead of
// multiplying the number of full-army updates on the browser thread.
export function advanceBattleFrame(battle, accumulator, elapsed, speed, now = () => performance.now()) {
  const crowded = battle.units.length >= 2500;
  const updates = battle.units.length >= 6000 && speed >= 4 ? 10 : 20;
  const dt = crowded ? Math.min(.4, Math.max(1, speed) / updates) : 1 / 30;
  // Leave time for drawing, input and the browser compositor, even when 4x
  // playback keeps the simulation backlog permanently full.
  const deadline = now() + 9;
  accumulator = Math.min(Math.max(.25, dt), accumulator + Math.min(.1, Math.max(0, elapsed)) * speed);
  while (battle.winner === null) {
    const remaining = deadline - now();
    if (remaining <= 0 || (!battle.pendingStep && accumulator + 1e-9 < dt)) break;
    if (!battle.pendingStep) accumulator = Math.max(0, accumulator - dt);
    if (crowded || speed > 1 || battle.pendingStep) {
      if (!battle.advanceFrame(dt, remaining)) break;
    } else battle.step(dt);
    // A fast tick may leave enough budget for the next one (including 2x/4x).
    // Keep a bounded backlog across frames instead of discarding it every RAF.
  }
  battle.feedback?.update();
  return accumulator;
}
