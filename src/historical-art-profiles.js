import { WESTERN_FRONTIER_PROFILES } from './western-frontier-units.js';
import { COMMANDER_ROSTER_COMPLETION_PROFILES } from './commander-roster-completion.js';
import { IMPERIAL_AUXILIARY_PROFILES } from './imperial-auxiliary-units.js';
import { ACHAEMENID_CONTINGENT_PROFILES } from './achaemenid-contingent-units.js';
import { COMMANDER_REINFORCEMENT_PROFILES } from './commander-reinforcement-units.js';
// Equipment-led art direction. Colours and emblems are gameplay choices, not
// claims of universal uniforms. Reference limitations remain in the catalogue.
import { WORLD_WARRIOR_PROFILES } from './world-warrior-units.js';
import { LATE_MEDIEVAL_CAVALRY_PROFILES } from './late-medieval-cavalry-units.js';
import { JANISSARY_YATAGAN_PROFILES } from './janissary-yatagan.js';
import { TURKIC_ELITE_PROFILES } from './turkic-elite-units.js';
import { IBERIAN_PROFILES } from './iberian-units.js';
import { EUROPEAN_ELITE_PROFILES } from './european-elite-units.js';
import { ITALIAN_ENGLISH_PROFILES } from './italian-english-units.js';
import { TURKIC_ARAB_PROFILES } from './turkic-arab-units.js';
import { ANDALUS_RUM_PROFILES } from './andalus-rum-units.js';
import { MEDIEVAL_SPECIALIST_PROFILES } from './medieval-specialist-units.js';
import { FRONTIER_WARRIOR_PROFILES } from './frontier-warrior-units.js';
import { EUROPEAN_SPECIALIST_PROFILES } from './european-specialist-units.js';
import { MEXICA_RANK_PROFILES } from './mexica-rank-units.js';
import { PACIFIC_WARRIOR_PROFILES } from './pacific-warrior-units.js';
import { TURKISH_JAPANESE_PROFILES } from './turkish-japanese-units.js';
import { EUROPE_CRUSADER_PROFILES } from './europe-crusader-units.js';
import { RUS_FRENCH_PROFILES } from './rus-french-units.js';
import { ADDITIONAL_HISTORICAL_PROFILES } from './additional-historical-units.js';
import { MAJOR_CIVILIZATION_PROFILES } from './major-civilization-units.js';
import { HISTORICAL_TACTICS_PROFILES } from './historical-tactics-units.js';
import { HISTORICAL_ARMY_SUPPORT_PROFILES } from './historical-army-support-units.js';
import { COMMANDER_ARMY_PROFILES } from './commander-army-units.js';
import { TIMURID_PROFILES } from './historical-timurid-units.js';
import { COALITION_PROFILES } from './historical-coalition-units.js';
import { WORLD_ROSTER_GAP_PROFILES } from './world-roster-gaps.js';
import { EASTERN_ROSTER_GAP_PROFILES } from './eastern-roster-gaps.js';
import { RELIEF_ROSTER_GAP_PROFILES } from './relief-roster-gaps.js';
import { UNDERREPRESENTED_PROFILES } from './underrepresented-roster.js';
import { REGIONAL_GAP_PROFILES } from './regional-roster-gaps.js';
import { CLASSICAL_SUPPORT_PROFILES } from './classical-support-units.js';
import { MAJOR_ARMY_EXPANSION_PROFILES } from './major-army-expansion-units.js';
import { COMMANDER_ALLIED_CONTINGENTS_PROFILES } from './commander-allied-contingents-units.js';
import { ARMY_GAP_PROFILES } from './army-gap-units.js';
import { ANCIENT_ROSTER_PROFILES } from './ancient-roster-units.js';
const p = (head, armor, weapon, shield, cloth, extra = {}) => ({ head, armor, weapon, shield, cloth, ...extra });
export const HISTORICAL_ART_PROFILES = Object.freeze({
  ...COMMANDER_ROSTER_COMPLETION_PROFILES,
  ...JANISSARY_YATAGAN_PROFILES,
  ...LATE_MEDIEVAL_CAVALRY_PROFILES,
  ...ADDITIONAL_HISTORICAL_PROFILES,
  ...MAJOR_CIVILIZATION_PROFILES,
  ...HISTORICAL_TACTICS_PROFILES,
  ...HISTORICAL_ARMY_SUPPORT_PROFILES,
  ...COMMANDER_ARMY_PROFILES,
  ...TIMURID_PROFILES,
  ...COALITION_PROFILES,
  ...ANCIENT_ROSTER_PROFILES,
  ...ARMY_GAP_PROFILES,
  ...WORLD_ROSTER_GAP_PROFILES,
  ...EASTERN_ROSTER_GAP_PROFILES,
  ...RELIEF_ROSTER_GAP_PROFILES,
  ...UNDERREPRESENTED_PROFILES,
  ...REGIONAL_GAP_PROFILES,
  ...CLASSICAL_SUPPORT_PROFILES,
  ...MAJOR_ARMY_EXPANSION_PROFILES,
  ...COMMANDER_ALLIED_CONTINGENTS_PROFILES,
  ...WESTERN_FRONTIER_PROFILES,
  ...IMPERIAL_AUXILIARY_PROFILES,
  ...ACHAEMENID_CONTINGENT_PROFILES,
  ...COMMANDER_REINFORCEMENT_PROFILES,
  ...RUS_FRENCH_PROFILES,
  ...EUROPE_CRUSADER_PROFILES,
  ...TURKISH_JAPANESE_PROFILES,
  ...MEXICA_RANK_PROFILES,
  ...PACIFIC_WARRIOR_PROFILES,
  ...WORLD_WARRIOR_PROFILES,
  ...TURKIC_ELITE_PROFILES,
  ...IBERIAN_PROFILES,
  ...EUROPEAN_ELITE_PROFILES,
  ...ITALIAN_ENGLISH_PROFILES,
  ...TURKIC_ARAB_PROFILES,
  ...ANDALUS_RUM_PROFILES, ...MEDIEVAL_SPECIALIST_PROFILES, ...FRONTIER_WARRIOR_PROFILES, ...EUROPEAN_SPECIALIST_PROFILES,
  norse_hird_swordsman: p('spectacle', 'mail', 'norseSword', 'round', '#405e77', { shieldColor: '#c7ad72', cape: '#465e75', beard: true, legWraps: true, trim: '#b79b61' }),
  norse_spearman: p('norseHair', 'norseTunic', 'spear', 'round', '#a17245', { shieldColor: '#627552', beard: true, legWraps: true, trim: '#cfb581' }),
  norse_dane_axeman: p('nasal', 'mail', 'norseDaneaxe', null, '#805444', { beard: true, legWraps: true, trim: '#a9aa93' }),
  norse_longbowman: p('norseCap', 'norseTunic', 'longbow', null, '#586e60', { quiver: true, legWraps: true, trim: '#b5a57b' }),
  assyria_royal_guard: p('assyrian', 'fringed', 'spear', null, '#d8c7a0', { bareLegs: true, beard: true, trim: '#875d37' }),
  goryeo_yongho_guard: p('topknot', 'goryeoVest', 'shortSpear', null, '#42647c', { trousers: '#e0decd', pennant: '#eee9d8', trim: '#a7aaa0' }),
  song_beiwei: p('songHelm', 'songLamellar', 'sabre', null, '#9b4d38', { horse: 'grey', trim: '#d4b575' }),
  mughal_ahadi: p('mughalWrap', 'jama', 'lance', 'round', '#d8c9a4', { horse: 'black', shieldColor: '#463f31', trim: '#98683e' }),
  khmer_ranked_cavalry: p('khmerAnimal', 'khmerPadded', 'phkak', null, '#a17c45', { horse: 'bay', trim: '#dfc18a' }),
  maya_sajal: p('mayaOrnament', 'mayaVest', 'spear', 'mayaRect', '#a56346', { bareLegs: true, skin: '#a87954', shieldColor: '#c8ac7d', trim: '#d9c8a6' }),
  benin_warrior_chief: p('beninCap', 'beninBells', 'spear', 'beninRect', '#776247', { bareLegs: true, skin: '#78513a', shieldColor: '#755f43', trim: '#bc9c5d' }),
  mamluk_axebearer: p('turbanTall', 'robe', 'mamlukAxe', null, '#be985c', { longCoat: true, trim: '#e3cdaa' }),
  han_yulin: p('hanCap', 'hanRobe', 'bow', null, '#78533e', { horse: 'dun', quiver: true, noStirrups: true, trim: '#b8a17a' }),
  inca_decorated_warrior: p('incaBand', 'incaUnku', 'starMace', null, '#d9d1b8', { bareLegs: true, trim: '#b84435' }),
  tang_xuanjia: p('tangRidge', 'tangGuard', 'lance', null, '#303733', { horse: 'bay', tangTack: true, trim: '#929584' }),
  samurai: p('kabuto', 'yoroi', 'katana', null, '#9d372d', { crest: 'crescent', trim: '#d9b35e' }),
  janissary: p('bork', 'robe', 'musket', null, '#346d62', { trim: '#dfbf76', longCoat: true }),
  kipchak: p('mask', 'mail', 'bow', null, '#bb9556', { quiver: true, horse: 'dun', cape: '#60513c' }),
  kipchak_masked_swordsman: p('mask', 'mail', 'sabre', 'round', '#335d72', { horse: 'black', shieldColor: '#9c7548', longCoat: true, trim: '#d5b675' }),
  hussar: p('lobster', 'plate', 'lance', 'hussar', '#a43936', { wings: true, horse: 'bay', pelt: true, pennant: '#eee0b5' }),
  spartan: p('corinthian', 'bronze', 'spear', 'aspis', '#a5352e', { cape: '#a5352e', emblem: 'lambda', bareLegs: true }),
  mongol: p('fur', 'lamellar', 'bow', null, '#826044', { quiver: true, horse: 'dun', longCoat: true }),
  mamluk: p('turbanCone', 'mail', 'lance', 'round', '#32836f', { horse: 'grey', shieldColor: '#a57e45', trim: '#d9bd76' }),
  viking: p('spectacle', 'mail', 'axe', 'round', '#72734e', { shieldColor: '#8d4634', emblem: 'quarters', beard: true }),
  roman: p('imperial', 'segment', 'gladius', 'scutum', '#ad342c', { shieldColor: '#a62f26', emblem: 'bolt', bareLegs: true }),
  persian: p('tiara', 'scale', 'spear', 'wicker', '#9272a5', { longCoat: true, patterned: true, beard: true }),
  knight: p('visor', 'plate', 'lance', 'heater', '#496a94', { bard: 'cloth', horse: 'grey', crest: 'plume', emblem: 'stripe' }),
  varangian: p('nasal', 'mail', 'daneaxe', 'roundBack', '#764e82', { cape: '#813a42', beard: true, longCoat: true }),
  landsknecht: p('beret', 'slashed', 'pike', null, '#d6a437', { secondary: '#a43b32', plume: true }),
  ottoman_sipah: p('turban', 'robe', 'lance', 'round', '#9c433a', { longCoat: true, horse: 'bay', shieldColor: '#b49b52', trim: '#dfbb65' }),
  ottoman_solak: p('solak', 'robe', 'bow', null, '#c9a044', { longCoat: true, cape: '#315b70', trim: '#edddaa', quiver: true }),
  ghaznavid_guard: p('cap', 'robe', 'bow', null, '#b8473e', { patterned: true, quiver: true, horse: 'grey', longCoat: true, trim: '#e8c570' }),
  seljuk_hassa: p('furCone', 'lamellar', 'lance', 'kite', '#417b7e', { horse: 'bay', shieldColor: '#d4ba79', longCoat: true, braid: true }),
  mamluk_bahri: p('cone', 'lamellar', 'lance', 'round', '#ded0a1', { horse: 'black', shieldColor: '#a48b4c', crest: 'tail', trim: '#8c3830' }),
  mamluk_burji: p('turbanTall', 'mail', 'sabre', 'round', '#ab3331', { horse: 'grey', bard: 'cloth', shieldColor: '#6f4933', longCoat: true }),
  mongol_keshig: p('mongol', 'lamellar', 'bow', null, '#3c545c', { horse: 'black', bard: 'leather', quiver: true, crest: 'tail' }),
  ilkhan_keshikten: p('cone', 'scale', 'bow', null, '#526d8b', { horse: 'bay', quiver: true, cape: '#7a3f4e', trim: '#e0bf79' }),
  parthian_cataphract: p('cone', 'scale', 'kontos', null, '#a18c63', { horse: 'bay', bard: 'scale', coveredFace: true }),
  sasanian_aswaran: p('sasanian', 'mail', 'kontos', null, '#d1cbb1', { horse: 'grey', bard: 'mail', ribbons: true, coveredFace: true }),
  macedon_companions: p('boeotian', 'linen', 'xyston', null, '#dad3b3', { horse: 'bay', cape: '#784c84', bareLegs: true }),
  macedon_hypaspists: p('phrygian', 'linen', 'spear', 'aspis', '#e0d5ac', { shieldColor: '#9d874a', emblem: 'sun', bareLegs: true }),
  rome_praetorian: p('imperialCrest', 'muscle', 'gladius', 'oval', '#704360', { shieldColor: '#ad8b49', emblem: 'scorpion', bareLegs: true }),
  rome_equites: p('romanCavalry', 'scale', 'lance', 'oval', '#b6563d', { horse: 'grey', shieldColor: '#e1c481', emblem: 'wings', cape: '#a13c32' }),
  england_housecarl: p('nasal', 'mail', 'daneaxe', 'roundBack', '#61746b', { shieldColor: '#bc9c57', beard: true }),
  templar_knight: p('greathelm', 'surcoat', 'lance', 'heater', '#e8dfc5', { horse: 'bay', bard: 'cloth', emblem: 'cross', badge: '#b23b32', trim: '#9d7752' }),
  hospitaller_knight: p('mailHood', 'surcoat', 'lance', 'kite', '#303c39', { horse: 'grey', emblem: 'cross', badge: '#f1e7c9', cape: '#253330' }),
  teutonic_knight: p('greathelm', 'surcoat', 'lance', 'heater', '#e8e8db', { teutonic: true, horse: 'black', emblem: 'cross', badge: '#202a2e', cape: '#e8e8db', shieldColor: '#e8e8db', trim: '#aab7b6' }),
  japan_mounted_samurai: p('kabuto', 'yoroi', 'yumi', null, '#4c5541', { horse: 'bay', quiver: true, crest: 'horns', trim: '#d6a95a' }),
  mexica_eagle: p('eagle', 'feathers', 'macuahuitl', 'chimalli', '#ad7c42', { shieldColor: '#b94d32', bareLegs: true, featherCape: true }),
  mexica_jaguar: p('jaguar', 'jaguar', 'macuahuitl', 'chimalli', '#cf9e4d', { shieldColor: '#387a80', emblem: 'rings', animalLegs: true }),
  rus_druzhina: p('rus', 'mail', 'lance', 'kite', '#8e5036', { horse: 'dun', cape: '#8b3737', shieldColor: '#b47b40', emblem: 'stripe', beard: true }),
  german_armoured_foot: p('sallet', 'plate', 'greatsword', null, '#758681', { fluted: true }),
  carthage_sacred_band: p('attic', 'muscle', 'spear', 'aspis', '#d5caa3', { shieldColor: '#be9b52', cape: '#794f78', emblem: 'rings', bareLegs: true }),
  egypt_sherden: p('horned', 'banded', 'longsword', 'round', '#e2d5ac', { shieldColor: '#a68656', emblem: 'studs', bareLegs: true }),
  gaelic_gallowglass: p('bascinet', 'mail', 'longaxe', null, '#827759', { longCoat: true, beard: true, cape: '#706b4c' }),
});
