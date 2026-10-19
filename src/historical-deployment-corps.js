import catalogue from './historical-catalogue.js';
import { formationLayout } from './crown-battle-formations.js';
import { selectCorpsFormation } from './historical-formation-policy.js';

const chariots = new Set(catalogue.filter(u => u.kind === 'chariot').map(u => u.id));
const pikes = new Set(['alexander_sarissa', 'macedon_sarissa_phalangite', 'landsknecht', 'swiss_pikeman', 'polish_pikeman', 'scots_schiltron']);
const lightHorse = new Set(['macedon_prodromos', 'paeonian_cavalry', 'alexander_greek_mercenary_cavalry',
  'alexander_odrysian_cavalry', 'byzantine_prokoursator_lancer', 'polish_light_cavalry',
  'ottoman_akinci', 'ottoman_akinci_mace']);

// Equipment and attested battlefield roles, not a universal ethnic formation.
// See docs/new-unit-formations-2026-10-16.txt for sources and interpretation limits.
export function deploymentCorps(u) {
  const p = u.combatProfile;
  if (chariots.has(u.type)) return 'chariot';
  if (p.role === 'elephant') return 'elephant';
  if (p.role === 'cavalry') return p.ranged ? 'mounted' : lightHorse.has(u.type) ? 'light-horse' : 'horse';
  if (p.ranged) return p.config.projectile === 'dart' ? 'skirmisher' : 'missile';
  if (u.type === 'caesar_germanic_light_infantry') return 'escort';
  return pikes.has(u.type) ? 'pike' : 'infantry';
}

export const corpsExtent = list => list.length ? ({
  front: Math.max(...list.map(p => p.f + p.radius)), rear: Math.min(...list.map(p => p.f - p.radius)),
  left: Math.min(...list.map(p => p.a - p.radius)), right: Math.max(...list.map(p => p.a + p.radius)),
}) : { front: 0, rear: 0, left: -12, right: 12 };

export function corpsBuilder(members, sections, ordered) {
  return (soldiers, role, duty, kind, front, side = 0, edge = 0) => {
    if (!soldiers.length) return;
    const plan = formationLayout(soldiers, 0, 0, { kind },
      { left: -1e6, right: 1e6, top: -1e6, bottom: 1e6 }, u => u.combatProfile.radius);
    const radius = Math.max(...soldiers.map(u => u.combatProfile.radius));
    const local = plan.slots.map(p => ({ f: p.x, a: p.y, radius }));
    const box = corpsExtent(local);
    const shift = edge < 0 ? side - box.right : edge > 0 ? side - box.left : side;
    for (const p of local) { p.f += front - box.front; p.a += shift; }
    local.sort((a, b) => a.a - b.a || b.f - a.f);
    const sorted = ordered(soldiers);
    local.forEach((p, i) => members.push({ unit: sorted[i], role, duty, ...p }));
    sections.push({ role, duty, kind, count: soldiers.length, ...corpsExtent(local) });
  };
}

// Add supporting corps outside an existing doctrine's occupied frontage.
// They share its command/advance but never inherit a cavalry charge or a cell role.
export function attachDeploymentSupports(state, units) {
  // Core-only armies need the same body extents as armies with auxiliaries.
  for (const m of state.members) m.radius = m.unit.combatProfile.radius;
  const assigned = new Set(state.members.map(m => m.unit.id));
  const extra = units.filter(u => !assigned.has(u.id));
  if (!extra.length) return;
  const ordered = list => list.slice().sort((a, b) =>
    (a.x - b.x) * state.side.x + (a.y - b.y) * state.side.y || a.id - b.id);
  const add = corpsBuilder(state.members, [], ordered);
  const core = corpsExtent(state.members);
  let centerFront = state.profile?.kind==='wings'
    ? corpsExtent(state.members.filter(m=>m.role==='bow')).front : core.front;
  for (const corps of ['pike', 'infantry', 'missile', 'skirmisher', 'elephant', 'horse', 'escort', 'light-horse', 'mounted', 'chariot']) {
    const soldiers = ordered(extra.filter(u => deploymentCorps(u) === corps));
    // The Ottoman bow centre needs its foot screen in front of it. Putting
    // these soldiers beyond both cavalry wings leaves the centre undefended.
    if(state.profile?.kind==='wings'&&['pike','infantry'].includes(corps)&&soldiers.length) {
      const start=state.members.length;
      add(soldiers,'auxiliary',`${corps}-center`,selectCorpsFormation(corps,state.strategy),0,0);
      const screen=state.members.slice(start),box=corpsExtent(screen);
      for(const m of screen)m.f+=centerFront+22-box.rear;
      centerFront=corpsExtent(screen).front;
      continue;
    }
    const split = Math.ceil(soldiers.length / 2), box = corpsExtent(state.members);
    const front = corps === 'missile' ? core.rear - 25
      : ['skirmisher', 'light-horse', 'mounted'].includes(corps) ? core.front + 25 : core.front;
    const gap = corps === 'chariot' || corps === 'elephant' ? 32 : 18;
    add(soldiers.slice(0, split), 'auxiliary', `${corps}-left`, selectCorpsFormation(corps,state.strategy,{side:-1}), front, box.left - gap, -1);
    add(soldiers.slice(split), 'auxiliary', `${corps}-right`, selectCorpsFormation(corps,state.strategy,{side:1}), front, box.right + gap, 1);
  }
  if (state.profile?.kind === 'wings') {
    const scouts = state.members.filter(m => m.duty === 'akinci-screen');
    const shift = Math.max(0, centerFront + 22 - corpsExtent(scouts).rear);
    for (const m of scouts) m.f += shift;
  }
  for (const m of state.members) if (m.role === 'auxiliary') {
    m.auxiliary = true; m.visualRole = m.a < 0 ? 'left' : 'right';
  }
}
