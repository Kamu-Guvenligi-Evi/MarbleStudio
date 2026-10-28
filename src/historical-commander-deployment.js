import { deploymentCorps, corpsExtent as extent, corpsBuilder } from './historical-deployment-corps.js';
import { selectCorpsFormation } from './historical-formation-policy.js';

// Opening slots are computed once, in army-local coordinates. Fit the entire
// deployment together so map edges cannot fold separate ranks into each other.
export function commanderDeployment(units, origin, direction, bounds, underFire, strategy) {
  const angle = direction * Math.PI / 180;
  const forward = { x: Math.round(Math.cos(angle)), y: Math.round(Math.sin(angle)) };
  const lateral = { x: forward.y ? 1 : 0, y: forward.x ? 1 : 0 };
  const across = p => p.x * lateral.x + p.y * lateral.y;
  const project = p => p.x * forward.x + p.y * forward.y;
  const ordered = list => list.slice().sort((a, b) => across(a) - across(b) || project(b) - project(a) || a.id - b.id);
  const infantry = [], missiles = [], cavalry = [], elephants = [], skirmishers = [], chariots = [], escorts = [];
  for (const u of units) {
    const corps = deploymentCorps(u);
    (corps === 'chariot' ? chariots : corps === 'escort' ? escorts : corps === 'skirmisher' ? skirmishers
      : ['horse', 'light-horse', 'mounted'].includes(corps) ? cavalry
        : corps === 'elephant' ? elephants : corps === 'missile' ? missiles : infantry).push(u);
  }
  const sections = [], members = [];
  const add = corpsBuilder(members, sections, ordered);
  const pikes = infantry.filter(u => deploymentCorps(u) === 'pike');
  // Draw reserves from the rear, leaving the nearest ranks on the fighting line.
  // Sarissa/pike corps stay together; ordinary spearmen are not pikemen.
  const foot = infantry.filter(u => deploymentCorps(u) !== 'pike').sort((a, b) => project(b) - project(a) || a.id - b.id);
  const reserveCount = foot.length >= 48 ? Math.floor(foot.length * .2) : 0;
  const reserve = reserveCount ? foot.splice(-reserveCount) : [];
  const shape=(corps,options={})=>selectCorpsFormation(corps,strategy,{underFire,...options});
  const lineKind = shape('infantry');
  if (pikes.length) {
    add(pikes, 'front', 'pike-center', 'block', 0);
    const flank = ordered(foot), split = Math.ceil(flank.length / 2);
    const box = extent(members);
    add(flank.slice(0, split), 'front', 'infantry-left', lineKind, 0, box.left - 16, -1);
    add(flank.slice(split), 'front', 'infantry-right', lineKind, 0, box.right + 16, 1);
  } else if (strategy?.kind === 'brace' && foot.some(u => u.combatProfile.role === 'pike')) {
    add(foot.filter(u => u.combatProfile.role === 'pike'), 'front', 'spear-front', 'line', 0);
    add(foot.filter(u => u.combatProfile.role !== 'pike'), 'front', 'infantry-support', 'line', extent(members).rear - 24);
  } else add(foot, 'front', 'line', lineKind, 0);
  // Short-range throwers screen the flanks with open withdrawal lanes; they
  // cannot reach the enemy from the rear batteries used by bows and slings.
  const screenBox = extent(members), screen = ordered(skirmishers), screenSplit = Math.ceil(screen.length / 2);
  add(screen.slice(0, screenSplit), 'bow', 'skirmisher-left', 'loose', 35, screenBox.left - 18, -1);
  add(screen.slice(screenSplit), 'bow', 'skirmisher-right', 'loose', 35, screenBox.right + 18, 1);
  // Missile batteries leave the central advance lane open, including flat fire.
  const frontBox = members.length ? extent(members) : { left: -12, right: 12, rear: 0 };
  const bow = ordered(missiles), bowSplit = Math.ceil(bow.length / 2);
  add(bow.slice(0, bowSplit), 'bow', 'missile-left', shape('missile'), frontBox.rear - 30, frontBox.left - 18, -1);
  add(bow.slice(bowSplit), 'bow', 'missile-right', shape('missile'), frontBox.rear - 30, frontBox.right + 18, 1);
  const rear = members.length ? extent(members).rear : 0;
  add(reserve, 'front', 'reserve', 'block', rear - 32);
  // Large bodies have their own lane rather than inflating every infantry file.
  if (elephants.length) {
    const box = members.length ? extent(members) : { right: 0 };
    add(elephants, 'elephant', 'shock', 'line', -12, box.right + 30, 1);
  }
  const core = members.length ? extent(members) : { left: -15, right: 15 };
  const horse = ordered(cavalry.filter(u => deploymentCorps(u) === 'horse')), horseSplit = Math.ceil(horse.length / 2);
  for (const [soldiers, side, edge, duty] of [
    [horse.slice(0, horseSplit), core.left - 35, -1, 'cavalry-left'],
    [horse.slice(horseSplit), core.right + 35, 1, 'cavalry-right'],
  ]) {
    const flanking = strategy?.kind === 'flank' && strategy.flank === edge;
    const lane = flanking ? edge * Math.max(Math.abs(side), strategy.enemy.width + 55) : side;
    add(soldiers, 'horse', duty, shape('horse',{side:edge}), strategy?.kind === 'brace' ? -80 : -20, lane, edge);
    if (flanking) for (const m of members) if (m.duty === duty) m.flanking = true;
  }
  const escortBox = extent(members), escort = ordered(escorts), escortSplit = Math.ceil(escort.length / 2);
  add(escort.slice(0, escortSplit), 'front', 'cavalry-support-left', 'loose', -20, escortBox.left - 16, -1);
  add(escort.slice(escortSplit), 'front', 'cavalry-support-right', 'loose', -20, escortBox.right + 16, 1);
  const lightBox = extent(members), light = ordered(cavalry.filter(u => deploymentCorps(u) === 'light-horse'));
  const lightSplit = Math.ceil(light.length / 2);
  add(light.slice(0, lightSplit), 'horse', 'light-cavalry-left', 'loose', 30, lightBox.left - 22, -1);
  add(light.slice(lightSplit), 'horse', 'light-cavalry-right', 'loose', 30, lightBox.right + 22, 1);
  // Mounted skirmishers screen outside the shock cavalry; mixing them into
  // the same wedge makes riders with different ranges obstruct one another.
  const wings = members.length ? extent(members) : core;
  const mounted = ordered(cavalry.filter(u => u.combatProfile.ranged)), mountedSplit = Math.ceil(mounted.length / 2);
  add(mounted.slice(0, mountedSplit), 'horse', 'mounted-left', 'loose', 20, wings.left - 22, -1);
  add(mounted.slice(mountedSplit), 'horse', 'mounted-right', 'loose', 20, wings.right + 22, 1);
  const chariotBox = extent(members), carts = ordered(chariots), cartSplit = Math.ceil(carts.length / 2);
  add(carts.slice(0, cartSplit), 'horse', 'chariot-left', 'loose', 0, chariotBox.left - 32, -1);
  add(carts.slice(cartSplit), 'horse', 'chariot-right', 'loose', 0, chariotBox.right + 32, 1);

  for (const m of members) m.goal = { id: m.unit.id, radius: m.radius,
    x: origin.x + forward.x * m.f + lateral.x * m.a,
    y: origin.y + forward.y * m.f + lateral.y * m.a };
  const minX = Math.min(...members.map(m => m.goal.x - m.radius)), maxX = Math.max(...members.map(m => m.goal.x + m.radius));
  const minY = Math.min(...members.map(m => m.goal.y - m.radius)), maxY = Math.max(...members.map(m => m.goal.y + m.radius));
  const area = { left: bounds.left + 45, right: bounds.right - 45, top: bounds.top + 115, bottom: bounds.bottom - 95 };
  if (maxX - minX > area.right - area.left || maxY - minY > area.bottom - area.top) return null;
  const shiftX = Math.max(area.left - minX, Math.min(0, area.right - maxX));
  const shiftY = Math.max(area.top - minY, Math.min(0, area.bottom - maxY));
  for (const m of members) { m.goal.x += shiftX; m.goal.y += shiftY; }
  // Translating a formation into the field must not move a flanking wing back
  // into the enemy frontage. The caller can choose a fitted frontal plan.
  if (strategy?.kind === 'flank' && members.some(m => m.flanking
    && ((m.goal.x - origin.x) * lateral.x + (m.goal.y - origin.y) * lateral.y)
      * strategy.flank - m.radius < strategy.enemy.width + 25)) return null;
  const groups = [];
  for (const section of sections) {
    const group = groups.find(g => g.role === section.role);
    if (group) group.count += section.count;
    else groups.push({ role: section.role, kind: section.kind, count: section.count });
  }
  return { members, sections, groups, forward };
}
