import { corpsBuilder, corpsExtent } from './historical-deployment-corps.js';
import { selectCorpsFormation } from './historical-formation-policy.js';

// 1445 ordonnance equipment groups, not a claim that every French battle used
// one diagram. Reuse the player's formations; intervals are game distances.
export function frenchDeployment(state, groups) {
  const sections = [], members = state.members;
  const ordered = list => list.slice().sort((a, b) =>
    (a.x - b.x) * state.side.x + (a.y - b.y) * state.side.y || a.id - b.id);
  const add = corpsBuilder(members, sections, ordered);
  const enemy = state.strategy?.enemy;
  const defensive = enemy && enemy.cavalry >= enemy.count * .35;
  const lead = enemy && enemy.leftThreat < enemy.rightThreat ? -1 : 1;
  const shape=(corps,options)=>selectCorpsFormation(corps,state.strategy,options);
  add(groups.get('foot') || [], 'auxiliary', 'foot-centre', shape('infantry'), 0);
  const foot = corpsExtent(members);
  const bows = ordered(groups.get('bow') || []), bowSplit = Math.ceil(bows.length / 2);
  // Missile sections can shoot beside the foot, without occupying a cavalry
  // approach lane or requiring infantry to walk through a rear bow block.
  add(bows.slice(0, bowSplit), 'auxiliary', 'bows-left', shape('missile'), -12, foot.left - 22, -1);
  add(bows.slice(bowSplit), 'auxiliary', 'bows-right', shape('missile'), -12, foot.right + 22, 1);
  const centre = corpsExtent(members);
  const horses = groups.get('horse') || [];
  const gendarmes = ordered(horses.filter(u => u.type !== 'french_coutilier'));
  const coutiliers = ordered(horses.filter(u => u.type === 'french_coutilier'));
  for (const side of [-1, 1]) {
    const name = side < 0 ? 'left' : 'right';
    const split = list => side < 0 ? list.slice(0, Math.ceil(list.length / 2)) : list.slice(Math.ceil(list.length / 2));
    const kind = shape('horse',{side,fallback:side===lead?(side<0?'echelonLeft':'echelonRight'):'block'});
    const edge = side < 0 ? centre.left - 40 : centre.right + 40;
    const start = members.length;
    add(split(gendarmes), 'front', `gendarmes-${name}`, kind, defensive ? -30 : side === lead ? 28 : -20, edge, side);
    const body = corpsExtent(members.slice(start));
    add(split(coutiliers), 'front', `coutiliers-${name}`, 'block', body.rear - 22, edge, side);
    const wing = members.slice(start), box = corpsExtent(wing);
    for (const m of wing) { m.wingSide = side; m.wingCenter = (box.left + box.right) / 2; }
  }
  for (const m of members) {
    m.auxiliary = m.role === 'auxiliary';
    m.visualRole = m.a < 0 ? 'left' : m.a > 0 ? 'right' : 'bait';
  }
  state.formationGeometry = { kind: 'french-ordonnance', lead, defensive: !!defensive, sections };
}
