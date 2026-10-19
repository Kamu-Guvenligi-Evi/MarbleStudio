import { COMMANDER_REINFORCEMENT_UNITS } from './commander-reinforcement-units.js';
import { UNIT_STAT_BALANCE } from './historical-unit-stat-balance.js';
import { COMMANDER_ROSTER_COMPLETION_UNITS } from './commander-roster-completion.js';
import { WESTERN_FRONTIER_UNITS } from './western-frontier-units.js';
import { IMPERIAL_AUXILIARY_UNITS } from './imperial-auxiliary-units.js';
import { ACHAEMENID_CONTINGENT_UNITS } from './achaemenid-contingent-units.js';
import original from './historical-units.json' with { type: 'json' };
import { JANISSARY_YATAGAN_UNITS } from './janissary-yatagan.js';
import { LATE_MEDIEVAL_CAVALRY_UNITS } from './late-medieval-cavalry-units.js';
import { WORLD_WARRIOR_UNITS } from './world-warrior-units.js';
import { TURKIC_ELITE_UNITS } from './turkic-elite-units.js';
import { IBERIAN_UNITS } from './iberian-units.js';
import { EUROPEAN_ELITE_UNITS, EUROPEAN_HISTORICAL_REVIEWS } from './european-elite-units.js';
import { ITALIAN_ENGLISH_UNITS } from './italian-english-units.js';
import { TURKIC_ARAB_UNITS } from './turkic-arab-units.js';
import { ANDALUS_RUM_UNITS } from './andalus-rum-units.js';
import { MEDIEVAL_SPECIALIST_UNITS } from './medieval-specialist-units.js';
import { FRONTIER_WARRIOR_UNITS } from './frontier-warrior-units.js';
import { EUROPEAN_SPECIALIST_UNITS } from './european-specialist-units.js';
import { MEXICA_RANK_UNITS } from './mexica-rank-units.js';
import { PACIFIC_WARRIOR_UNITS } from './pacific-warrior-units.js';
import { TURKISH_JAPANESE_UNITS } from './turkish-japanese-units.js';
import { EUROPE_CRUSADER_UNITS } from './europe-crusader-units.js';
import { RUS_FRENCH_UNITS } from './rus-french-units.js';
import { ADDITIONAL_HISTORICAL_UNITS } from './additional-historical-units.js';
import { MAJOR_CIVILIZATION_UNITS } from './major-civilization-units.js';
import { HISTORICAL_TACTICS_UNITS } from './historical-tactics-units.js';
import { HISTORICAL_ARMY_SUPPORT_UNITS } from './historical-army-support-units.js';
import { COMMANDER_ARMY_UNITS } from './commander-army-units.js';
import { TIMURID_UNITS } from './historical-timurid-units.js';
import { COALITION_UNITS } from './historical-coalition-units.js';
import { WORLD_ROSTER_GAPS } from './world-roster-gaps.js';
import { EASTERN_ROSTER_GAPS } from './eastern-roster-gaps.js';
import { RELIEF_ROSTER_GAPS } from './relief-roster-gaps.js';
import { UNDERREPRESENTED_ROSTER } from './underrepresented-roster.js';
import { REGIONAL_ROSTER_GAPS } from './regional-roster-gaps.js';
import { CLASSICAL_SUPPORT_UNITS } from './classical-support-units.js';
import { MAJOR_ARMY_EXPANSION_UNITS } from './major-army-expansion-units.js';
import { COMMANDER_ALLIED_CONTINGENTS_UNITS } from './commander-allied-contingents-units.js';
import { ARMY_GAP_UNITS } from './army-gap-units.js';
import { ANCIENT_ROSTER_UNITS } from './ancient-roster-units.js';
import { MYTHOLOGICAL_UNITS } from './mythological-units.js';
import { MIDDLE_EARTH_UNITS } from './middle-earth-units.js';
import visuals from './historical-unit-visuals.json' with { type: 'json' };
import research from '../docs/historical-elite-research-2026-10-14.json' with { type: 'json' };

// Merge similar gameplay cards without losing soldiers in existing army plans.
export const HISTORICAL_UNIT_REPLACEMENTS = Object.freeze({
  ottoman_silahdar: 'ottoman_sipah',
  ottoman_ulufeci_right: 'ottoman_sipah', ottoman_ulufeci_left: 'ottoman_sipah',
  ottoman_gureba_right: 'ottoman_sipah', ottoman_gureba_left: 'ottoman_sipah',
});
// Research records remain archived. The first four lack a reviewed usable image;
// the Ottoman subdivisions below are represented by one cavalry card.
export const RETIRED_HISTORICAL_IDS = Object.freeze([
  'abbasid_ghulam', 'ghaznavid_daylami', 'sparta_hippeis',
  'seleucid_silver_shields',
  ...Object.keys(HISTORICAL_UNIT_REPLACEMENTS),
]);

// Reviewed gameplay representations, not claims about historical performance.
// Equipment-review and transition-period candidates remain in the research file.
const roles = {
  norse_longbowman: 'ranged',
  norse_dane_axeman: 'sword',
  norse_spearman: 'spear',
  norse_hird_swordsman: 'sword',
  mamluk_axebearer: 'sword',
  benin_warrior_chief: 'spear',
  maya_sajal: 'spear',
  khmer_ranked_cavalry: 'horse_sword',
  mughal_ahadi: 'cavalry',
  song_beiwei: 'horse_sword',
  goryeo_yongho_guard: 'spear',
  assyria_royal_guard: 'spear',
  han_yulin: 'horse_bow',
  inca_decorated_warrior: 'sword',
  tang_xuanjia: 'cavalry',
  kipchak_masked_swordsman: 'horse_sword',
  ottoman_sipah: 'cavalry', ottoman_silahdar: 'cavalry',
  ottoman_ulufeci_right: 'cavalry', ottoman_ulufeci_left: 'cavalry',
  ottoman_gureba_right: 'cavalry', ottoman_gureba_left: 'cavalry',
  ottoman_solak: 'ranged', abbasid_ghulam: 'horse_bow',
  ghaznavid_guard: 'horse_bow', ghaznavid_daylami: 'spear', seljuk_hassa: 'cavalry',
  mamluk_bahri: 'cavalry', mamluk_burji: 'horse_sword', mongol_keshig: 'horse_bow',
  ilkhan_keshikten: 'horse_bow', parthian_cataphract: 'cavalry', sasanian_aswaran: 'cavalry',
  macedon_companions: 'cavalry', macedon_hypaspists: 'spear', sparta_hippeis: 'spear',
  thebes_sacred_band: 'spear', seleucid_silver_shields: 'spear', rome_praetorian: 'sword',
  rome_equites: 'cavalry', england_housecarl: 'sword', templar_knight: 'cavalry',
  hospitaller_knight: 'cavalry', teutonic_knight: 'cavalry', japan_mounted_samurai: 'horse_bow', mexica_eagle: 'sword',
  rus_druzhina: 'cavalry', german_armoured_foot: 'sword',
  mexica_jaguar: 'sword', carthage_sacred_band: 'spear', egypt_sherden: 'sword', gaelic_gallowglass: 'sword',
};
const aliases = {
  'Osmanlı': 'Osmanlı Devleti', 'Moğollar': 'Moğol İmparatorluğu',
  'Roma': 'Roma İmparatorluğu', 'Bizans': 'Bizans İmparatorluğu',
  'Ahameniş Persleri': 'Ahameniş İmparatorluğu', 'Memlükler': 'Memlük Sultanlığı',
  "Ortaçağ Japonya'sı": 'Japonya',
};
const roleNames = { sword: 'Yakın dövüş piyadesi', spear: 'Mızraklı piyade', cavalry: 'Mızraklı süvari', ranged: 'Yaya okçu', horse_bow: 'Atlı okçu', horse_sword: 'Kılıçlı süvari' };
const baseIds = new Set([...original, ...EUROPE_CRUSADER_UNITS].map(unit => unit.id));
const additions = [...COMMANDER_ROSTER_COMPLETION_UNITS, ...JANISSARY_YATAGAN_UNITS, ...LATE_MEDIEVAL_CAVALRY_UNITS, ...research.units.filter(unit => unit.status === 'ana' && roles[unit.id] && !baseIds.has(unit.id)).map(unit => {
  const representation = roles[unit.id];
  const sources = unit.sourceIds.map(id => research.sources[id]).filter(Boolean);
  return {
    id: unit.id, name: unit.name, faction: unit.faction,
    kind: representation.startsWith('horse_') ? 'cavalry' : representation,
    role: roleNames[representation], note: `${unit.period} · ${unit.historicalNote}`,
    period: unit.period, mount: unit.mount, prototype: true,
    color: '#ab9270', source: sources[0]?.url, credit: sources[0]?.title || 'Araştırma kaydı', sources,
  };
})];
additions.push(...COMMANDER_ALLIED_CONTINGENTS_UNITS);
// Immortals and Varangians already exist as persian and varangian; no duplicate cards.
export default [...original, ...additions, ...WORLD_WARRIOR_UNITS, ...TURKIC_ELITE_UNITS, ...IBERIAN_UNITS, ...EUROPEAN_ELITE_UNITS, ...ITALIAN_ENGLISH_UNITS, ...TURKIC_ARAB_UNITS, ...ANDALUS_RUM_UNITS, ...MEDIEVAL_SPECIALIST_UNITS, ...FRONTIER_WARRIOR_UNITS, ...EUROPEAN_SPECIALIST_UNITS, ...MEXICA_RANK_UNITS, ...PACIFIC_WARRIOR_UNITS, ...TURKISH_JAPANESE_UNITS, ...EUROPE_CRUSADER_UNITS, ...RUS_FRENCH_UNITS, ...MAJOR_CIVILIZATION_UNITS, ...HISTORICAL_TACTICS_UNITS, ...HISTORICAL_ARMY_SUPPORT_UNITS, ...COMMANDER_ARMY_UNITS, ...TIMURID_UNITS, ...COALITION_UNITS, ...ANCIENT_ROSTER_UNITS, ...ARMY_GAP_UNITS, ...WORLD_ROSTER_GAPS, ...EASTERN_ROSTER_GAPS, ...RELIEF_ROSTER_GAPS, ...UNDERREPRESENTED_ROSTER, ...REGIONAL_ROSTER_GAPS, ...CLASSICAL_SUPPORT_UNITS, ...MAJOR_ARMY_EXPANSION_UNITS, ...WESTERN_FRONTIER_UNITS, ...IMPERIAL_AUXILIARY_UNITS, ...ACHAEMENID_CONTINGENT_UNITS, ...COMMANDER_REINFORCEMENT_UNITS, ...ADDITIONAL_HISTORICAL_UNITS, ...MYTHOLOGICAL_UNITS, ...MIDDLE_EARTH_UNITS].filter(unit => !RETIRED_HISTORICAL_IDS.includes(unit.id)).map(unit => {
  if (unit.id === 'ottoman_sipah') unit = {
    ...unit,
    name: 'Kapıkulu süvarileri',
    note: '15.–16. yy seçkisi · Sipah, Silahdar, sağ/sol Ulufeciler ve sağ/sol Gureba bölüklerinin ortak oyun temsili. Tarihte görevleri farklı altı bölüktür; benzer süvari kartları burada birleştirilmiştir. Tımarlı sipahilerle aynı teşkilat değildir.',
  };
  // Visual handoffs cannot change saved IDs, civilization groups or combat roles.
  const review = EUROPEAN_HISTORICAL_REVIEWS[unit.id];
  if (review) unit = { ...unit, ...review, sources: [...(unit.sources || []), ...review.sources] };
  const visual = visuals[unit.id];
  const art = {};
  if (visual?.image?.startsWith('/warrior-references/')) {
    for (const field of ['image', 'credit', 'source', 'visualNote', 'license']) {
      if (typeof visual[field] === 'string') art[field] = visual[field];
    }
    if (Array.isArray(visual.referenceImages)) art.referenceImages = visual.referenceImages.filter(ref => ref.image?.startsWith('/warrior-references/'));
  }
  // Apply the reviewed defaults in the catalogue as well as the battle engine,
  // so cards and simulation agree. Callers can still override unit.combat when
  // constructing custom types; roles, projectiles and saved IDs remain intact.
  const combat = UNIT_STAT_BALANCE[unit.id]
    ? { ...unit.combat, ...UNIT_STAT_BALANCE[unit.id] } : unit.combat;
  return { ...unit, ...art, ...(combat ? { combat } : {}), faction: aliases[unit.civilization || unit.faction] || unit.civilization || unit.faction };
});
