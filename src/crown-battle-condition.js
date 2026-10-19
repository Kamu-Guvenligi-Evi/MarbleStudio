// Condition is independent of successful hits and player orders. One army
// census twice a second; no new per-soldier neighbour searches in the hot loop.
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
export const strainOf = u => clamp((u.fatigue - 30) / 70, 0, 1);
export function conditionSpeed(u) {
  return 1 - strainOf(u) * (u.combatProfile.role === 'cavalry' ? .74 : .42);
}
export function conditionCadence(u) {
  return 1 + strainOf(u) * .85 + (u.morale < 45 ? .2 : 0);
}
export function exertAttack(battle, u, projectile) {
  const movingShot = projectile && u.combatProfile.role === 'cavalry' && (u.moving || u.speed > 3);
  u.fatigue = clamp(u.fatigue + (movingShot ? 4 : projectile ? .9 : 1.3));
  u.lastExertion = battle.time;
}
export function damageMorale(battle, u, damage) {
  if (damage <= 0) return;
  u.morale = clamp(u.morale - damage / u.maxHp * 85);
  u.lastDamage = battle.time;
}
export function surveyCondition(battle, alive) {
  if (battle.time < (battle.conditionSurveyAt || 0)) return;
  battle.conditionSurveyAt = battle.time + .5;
  const groups = battle.conditionArmies ||= new Map();
  for (const a of groups.values()) { a.count = 0; a.x = 0; a.y = 0; }
  for (const u of alive) {
    if (u.commanderId) continue;
    let a = groups.get(u.armyId);
    if (!a) groups.set(u.armyId, a = { initial: 0, count: 0, x: 0, y: 0, loss: 0 });
    a.count++; a.x += u.x; a.y += u.y;
  }
  for (const [id, a] of groups) {
    a.initial = Math.max(a.initial, a.count);
    a.loss = a.initial ? 1 - a.count / a.initial : 0;
    if (a.count) { a.x /= a.count; a.y /= a.count; }
    a.commander = battle.armyCommanders.get(id);
  }
}
export function updateCondition(battle, u, dt, progress) {
  const horse = u.combatProfile.role === 'cavalry';
  const travelling = u.moving && progress > dt * 2;
  const effort = travelling ? clamp(progress / dt / u.combatProfile.config.speed, 0, 2.5) : 0;
  const recentCombat = battle.time - Math.max(u.lastExertion, u.lastDamage) < 4;
  // Walking is sustainable for longer than repeated mounted shooting. Standing
  // while firing is not rest; toggling orders cannot refill stamina.
  u.fatigue = clamp(u.fatigue + dt * (travelling ? effort * (horse ? 1.05 : .45) : recentCombat ? 0 : -3));
  if (horse && u.combatProfile.ranged) {
    if (u.fatigue >= 80) u.resting = true;
    else if (u.fatigue <= 40) u.resting = false;
  }
  const army = battle.conditionArmies?.get(u.armyId);
  const loss = army?.loss || 0;
  u.morale = clamp(u.morale - Math.max(0, loss - u.seenArmyLoss) * 45);
  u.seenArmyLoss = loss;
  const leader = army?.commander;
  if (leader && leader.hp <= 0 && !u.seenCommanderLoss) {
    u.morale = clamp(u.morale - 22); u.seenCommanderLoss = true;
  }
  const supported = leader?.hp > 0 && Math.hypot(u.x - leader.x, u.y - leader.y) < 180;
  const ceiling = clamp(100 - loss * 40 - strainOf(u) * 15 - (1 - u.hp / u.maxHp) * 25 - (u.seenCommanderLoss ? 15 : 0), 25, 100);
  if (u.morale > ceiling) u.morale = Math.max(ceiling, u.morale - dt * .7);
  else if (!recentCombat) u.morale = Math.min(ceiling, u.morale + dt * (supported ? 2.3 : 1.3));
  if (!u.commanderId && u.morale < 20 && !u.rally && battle.time >= u.rallyCooldown) {
    const threat = u.nearbyThreat?.hp > 0 ? u.nearbyThreat : u.target;
    let dx = threat?.hp > 0 ? u.x - threat.x : -u.face, dy = threat?.hp > 0 ? u.y - threat.y : 0;
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    // Fixed, short rally destination: morale must not create another endless kite.
    u.rally = { x: clamp(u.x + dx * 65, battle.bounds.left + 38, battle.bounds.right - 38),
      y: clamp(u.y + dy * 65, battle.bounds.top + 113, battle.bounds.bottom - 88), until: battle.time + 8 };
    u.pendingAttack = null; u.attack = 0; u.charge = null;
    u.screening = null; u.screenYield = null; u.navPath = null; u.npcRoute = null;
    battle.stats.rallies = (battle.stats.rallies || 0) + 1;
  }
}
export function steerRally(battle, u, dt) {
  if (!u.rally) return false;
  if (battle.time >= u.rally.until) {
    u.rally = null; u.rallyCooldown = battle.time + 20;
    u.morale = Math.max(40, u.morale); u.retarget = 0;
    return false;
  }
  // Keep the player's destination, but don't follow its cached path while rallying.
  const order = u.order; u.order = null;
  battle.walk(u, u.rally, u.combatProfile.config.speed * .8, dt);
  u.order = order;
  return true;
}

export function conditionSummary(battle) {
  const groups = Array.from({ length: 2 }, () => ({ count: 0, fatigue: 0, morale: 0, rally: 0, resting: 0, seeking: 0 }));
  const selected = battle.selected.size > 0;
  for (const u of battle.units) {
    if (u.hp <= 0 || u.removed || (selected && !battle.selected.has(u.id))) continue;
    const g = groups[u.team]; g.count++; g.fatigue += u.fatigue; g.morale += u.morale;
    if (u.rally) g.rally++;
    else if (u.order?.rest || (u.resting && !u.moving)) g.resting++;
    else if (u.resting) g.seeking++;
  }
  return groups.flatMap((g, team) => !g.count ? [] : [`${selected ? 'Seçili' : team ? 'Kızıl' : 'Mavi'} · Yorgunluk %${Math.round(g.fatigue / g.count)} · Moral %${Math.round(g.morale / g.count)}${g.rally ? ` · ${g.rally} geri çekiliyor` : ''}${g.resting ? ` · ${g.resting} dinleniyor` : ''}${g.seeking ? ` · ${g.seeking} dinlenme arıyor` : ''}`]).join(' / ');
}
