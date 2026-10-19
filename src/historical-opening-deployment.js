import { combatant } from './historical-opponent-analysis.js';
import { activeCommander } from './historical-commander-tactics.js';
import { commanderDeployment } from './historical-commander-deployment.js';

// Run the existing directors as a planning pass, without advancing the battle.
// Cache their exact slots: spawning and the first combat order share one plan.
export function prepareCommanderOpenings(b, expandedMap) {
  if (!b.tactics) return;
  const preview = Object.assign(Object.create(b), {
    time: .001, log() {}, tactics: new b.tactics.constructor(),
    bounds: { left: -1e7, right: 1e7, top: -1e7, bottom: 1e7 },
  });
  const teams = [0, 1].map(team => b.units.filter(u => combatant(u) && u.team === team));
  const armies = b.armyConfigs.map(a => ({ id: a.id, team: a.team, units: teams[a.team].filter(u => u.armyId === a.id) }));
  const director = preview.tactics;
  director.coordination.initialize(preview, b.units);
  // Assess the opposing local front before allocating the final widths. Do not
  // mistake the entire opposing alliance for one commander's flank target.
  const opposition = new Map(armies.map(a => [a.id, director.coordination.enemies(a.id, teams[1 - a.team])]));
  director.coordination.enemies = id => opposition.get(id) || [];
  for (const a of armies) director.coordination.sectors.set(a.id, {
    team: a.team, axis: 'y', forward: { x: a.team ? -1 : 1, y: 0 }, min: -1e7, max: 1e7,
  });
  director.strategy.update(preview, b.units);
  director.initialize(preview, teams);
  director.civilizations.initialize(preview, teams, new Set(director.armies.keys()));
  b.openingDeployments = new Map();
  const layouts = [[], []];
  for (const a of armies) {
    const leader = activeCommander(b, a.team, a.id), strategy = director.strategy.plans.get(a.id);
    let kind, state, slots;
    if (leader && strategy && a.units.length && opposition.get(a.id).length) {
      state = director.armies.get(a.id);
      if (state) {
        kind = 'seljuk';
        slots = state.members.map(m => ({ unit: m.unit, ...director.point(state,
          (m.role === 'bait' ? 85 : 15) + m.depth,
          m.role === 'bait' ? m.offset : (m.role === 'left' ? -1 : 1) * state.spread + m.offset) }));
      } else if ((state = director.civilizations.armies.get(a.id))) {
        kind = 'civilization';
        slots = state.members.map(m => ({ unit: m.unit, ...director.civilizations.point(state, m.f, m.a) }));
      } else {
        const plan = director.formations.deployment(preview, a.id, a.units, opposition.get(a.id), strategy);
        if (plan) {
          kind = 'formation';
          state = { ...plan, armyId: a.id, team: a.team, commander: leader, phase: 'assemble',
            started: 0, advance: 0, requestedKey: strategy.key, created: 0, replans: 0,
            assembleLimit: 5, marchSpeed: Math.min(...a.units.map(u => u.combatProfile.config.speed)) * .8 };
          slots = state.members.map(m => ({ unit: m.unit, ...m.goal }));
        }
      }
    }
    if (slots) {
      // Troops outside the feigned-retreat detachment retain separate support
      // files; never place their old block on top of the newly deployed wings.
      const assigned = new Set(slots.map(p => p.unit.id));
      const extras = a.units.filter(u => !assigned.has(u.id));
      if (extras.length) {
        const side = Math.max(...slots.map(p => p.y + p.unit.combatProfile.radius)) + 45;
        const plan = commanderDeployment(extras, { x: 0, y: 0 }, a.team ? 180 : 0, preview.bounds, false);
        const low = Math.min(...plan.members.map(m => m.goal.y - m.radius));
        slots.push(...plan.members.map(m => ({ unit: m.unit, x: m.goal.x, y: side + m.goal.y - low })));
      }
    } else slots = a.units.map(unit => ({ unit, x: unit.x, y: unit.y }));
    const sign = a.team ? -1 : 1;
    const front = slots.length ? Math.max(...slots.map(p => sign * p.x + p.unit.combatProfile.radius)) : 0;
    const rear = slots.length ? Math.min(...slots.map(p => sign * p.x - p.unit.combatProfile.radius)) : 0;
    let low = slots.length ? Math.min(...slots.map(p => p.y - p.unit.combatProfile.radius)) : -30;
    let high = slots.length ? Math.max(...slots.map(p => p.y + p.unit.combatProfile.radius)) : 30;
    if (kind === 'seljuk') {
      // Leave the same maneuver envelope required by the live director, even
      // when a small detachment's initial bodies occupy narrower wings.
      low = Math.min(low, state.origin.y - state.spread - 60);
      high = Math.max(high, state.origin.y + state.spread + 60);
    }
    layouts[a.team].push({ ...a, leader, strategy, kind, state, slots, front, rear, low, high,
      width: front - rear, height: Math.max(60, high - low) });
  }
  const depth = Math.max(0, ...layouts.flat().map(a => a.width));
  const frontGap = expandedMap ? Math.min(960, 560 + depth * .6) : 160;
  b.deploymentSpacing = { frontGap, depth };
  for (const team of [0, 1]) {
    let top = 480 - Math.max(0, layouts[team].reduce((n, a) => n + a.height + 100, 0) - 100) / 2;
    for (const a of layouts[team]) {
      const sign = team ? -1 : 1, cy = top + a.height / 2;
      const dx = 300 - sign * (frontGap / 2 + .01 + a.front), dy = cy - (a.low + a.high) / 2;
      for (const p of a.slots) Object.assign(p.unit, { x: p.x + dx, y: p.y + dy,
        lastX: p.x + dx, lastY: p.y + dy, face: sign });
      if (a.leader) Object.assign(a.leader, { x: sign * a.rear + dx - sign * 45, y: cy });
      if (a.state) {
        if (a.state.origin) { a.state.origin.x += dx; a.state.origin.y += dy; }
        for (const m of a.state.members) if (m.goal) { m.goal.x += dx; m.goal.y += dy; }
        a.state.started = 0;
        if (a.state.since !== undefined) a.state.since = 0;
        for (const h of a.state.history || []) h.time = 0;
        b.openingDeployments.set(a.id, { kind: a.kind, state: a.state, strategy: { ...a.strategy, since: 0 },
          positions: a.units.map(unit => ({ unit, x: unit.x, y: unit.y })) });
      }
      b.initialArmyAreas.set(a.id, { top: top - 40, bottom: top + a.height + 40 });
      top += a.height + 100;
    }
  }
}

export function activateCommanderOpenings(b) {
  if (!b.openingDeployments || b.openingsActivated || b.time <= 0) return;
  b.openingsActivated = true;
  if (b.navigation) return;
  for (const [id, opening] of b.openingDeployments) {
    const { state, strategy, positions, kind } = opening;
    if (activeCommander(b, state.team, id) !== state.commander
      || b.units.filter(u => combatant(u) && u.armyId === id).length !== positions.length || positions.some(({ unit, x, y }) =>
      !combatant(unit) || unit.order || unit.tacticalOverride || Math.hypot(unit.x - x, unit.y - y) > .01)) continue;
    const director = kind === 'seljuk' ? b.tactics : kind === 'civilization' ? b.tactics.civilizations : b.tactics.formations;
    director.armies.set(id, state);
    if (director.teams) director.teams[state.team] ||= state;
    if (director.attempted) director.attempted.add(id);
    b.tactics.strategy.plans.set(id, strategy);
  }
}
