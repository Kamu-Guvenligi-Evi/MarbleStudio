import commanders from './historical-commanders.json' with { type: 'json' };
import { CIVILIZATION_DOCTRINES } from './historical-civilization-tactics.js';
import { ARMY_HISTORY } from './historical-army-history.js';
import { armyCapacity, unitCapacity } from './historical-army-capacity.js';

// Period-compatible mixed forces. These are gameplay ratios, not historic muster
// counts. The doctrine core stays above 60%; supporting troops keep their own AI.
const COMPOSITIONS = {
  TR_OTTOMAN: { ottoman_solak: 1, ottoman_janissary_bow: 5, ottoman_sipah: 5, ottoman_timariot: 2, ottoman_cebelu: 2, ottoman_azap_frontline: 2, ottoman_akinci: 1, ottoman_akinci_archer: 1, ottoman_akinci_mace: 1, ottoman_martolos: 1, ottoman_janissary_armoured_sword: 1, mehmed_serbian_auxiliary_cavalry: 2 },
  DE_PIKE: { landsknecht: 12, german_halberdier: 2, german_doppelsoldner: 2, german_landsknecht_katzbalger: 2, german_pavise_crossbowman: 2, german_landsknecht_arquebusier: 2, bicocca_spanish_pikeman: 2 },
  EN_SHIELDWALL: { england_housecarl: 12, english_housecarl_sword: 4, english_fyrd_spearman: 4, english_early_archer: 2, english_fyrd_javelineer: 2 },
  FR_OPPORTUNITY: { french_ordonnance_gendarme: 4, french_coutilier: 4, french_franc_archer: 2, french_franc_crossbowman: 2, french_scots_guard: 2, french_dismounted_man_at_arms: 2, french_ordonnance_archer: 8 },
  IT_CONDOTTA: { milan_ducal_cavalry: 10, italian_condotta_lancer: 6, genoese_crossbowman: 3, milan_provisionato_infantry: 3, milan_field_crossbowman: 2 },
  GR_HOPLITE: { spartan: 12, greek_thespian_hoplite: 3, greek_allied_hoplite: 2, greek_theban_thermopylae_hoplite: 2, spartan_helot_light: 3, greek_phocian_hoplite: 1, greek_opuntian_locrian_infantry: 1 },
  PE_ACHAEMENID: { persian: 8, achaemenid_archer: 8, achaemenid_horse_archer: 2, achaemenid_spear_cavalry: 2, saka_foot_archer: 2, saka_sagaris_axeman: 2 },
  JP_INFANTRY: { japan_yari_ashigaru: 7, japan_yumi_ashigaru: 6, japan_teppo_ashigaru: 2, samurai: 2, japan_naginata_foot: 2, sengoku_mounted_lancer: 3, sengoku_yari_samurai: 2 },
  CN_QIN: { qin_ji_infantry: 4, qin_long_spearman: 4, qin_crossbowman: 7, qin_swordsman: 2, qin_bow_cavalry: 2, qin_war_chariot: 1, qin_light_foot_archer: 2 },
  CN_MING: { ming_long_shield: 3, ming_rattan_shield: 3, ming_langxian: 6, ming_long_spearman: 14, ming_short_weapon_support: 6, ming_matchlock: 6, ming_rattan_javelineer: 2 },
};
export const ARMY_PRESETS = Object.fromEntries(commanders.flatMap(commander => {
  const profile = CIVILIZATION_DOCTRINES.find(profile => commander.doctrineIds.includes(profile.id));
  if (!profile) return [];
  const units = COMPOSITIONS[profile.id];
  if (!units) throw new Error(`Hazır ordu bileşimi eksik: ${profile.id}`);
  return [[commander.id, { name: profile.name, doctrineId: profile.id, units }]];
}));
ARMY_PRESETS.timur = { name: 'Timur — Ankara seferi dönemi', doctrineId: null,
  units: { timurid_horse_archer: 8, timurid_armored_lancer: 7, timurid_guard_cavalry: 4, timur_aq_qoyunlu_cavalry: 2, timur_kara_tatar_archer: 2, timur: 1 } };
ARMY_PRESETS.alp_arslan = { name: 'Selçuklu sahte ricatı', doctrineId: 'TR_SELJUK', units: { seljuk_hassa: 8, seljuk_turkmen_archer: 6, seljuk_ghulam_archer: 2, seljuk_daylamite_spearman: 2, seljuk_daylamite_javelineer: 2, seljuk_diyarbekir_volunteer: 2, seljuk_uz_horse_archer: 2 } };
Object.assign(ARMY_PRESETS, {
  jan_iii_sobieski: { name: 'Sobieski — Leh karma saha ordusu', doctrineId: null, units: { hussar: 6, polish_pancerni: 4, polish_light_cavalry: 2, polish_musketeer: 6, polish_dragoon: 2, polish_royal_partisan: 2, polish_lipka_archer: 2 } },
  ramesses_ii: { name: 'Yeni Krallık Mısır piyade ve savaş arabaları', doctrineId: null, units: { egypt_sherden: 4, egypt_khopesh_infantry: 2, egypt_new_axeman: 2, egypt_new_spearman: 3, egypt_nearin_infantry: 1, egypt_new_composite_archer: 6, egypt_new_chariot: 2 } },
  alexander_nevsky: { name: 'Rus maiyet süvarisi ve karma piyade ordusu', doctrineId: null, units: { rus_druzhina: 6, rus_hryd_guard: 4, rus_retinue_spearman: 6, rus_foot_archer: 4, novgorod_crossbowman: 2, rus_sulitsa_javelineer: 2 } },
  harald_hardrada: { name: 'Norveç hird ve Viking piyade ordusu', doctrineId: null, units: { norse_hird_swordsman: 6, norse_spearman: 6, norse_dane_axeman: 4, norse_longbowman: 4, norse_javelin_skirmisher: 2, norse_armoured_spearman: 2 } },
  attila: { name: 'Hun ordusu ve Got–Gepid–Skir müttefikleri', doctrineId: null, units: { hun_horse_archer: 8, hun_sword_cavalry: 6, attila_ostrogoth_cavalry: 4, attila_gepid_spearman: 4, attila_sciri_infantry: 2 } },
  genghis_khan: { name: 'Moğol ordusu ve Karluk–Uygur müttefikleri', doctrineId: null, units: { mongol: 8, mongol_keshig: 4, mongol_hook_lancer: 4, mongol_armoured_sabre_cavalry: 2, mongol_axe_cavalry: 2, genghis_karluk_cavalry: 2, genghis_uyghur_infantry: 2 } },
  alexander_great: { name: 'Makedon falanksı ve müttefik kanatlar', doctrineId: null, units: { alexander_sarissa: 4, alexander_greek_allied_hoplite: 1, macedon_hypaspists: 2, macedon_companions: 2, thessalian_cavalry: 1, agrianian_javelineer: 2, macedon_foot_archer: 1, macedon_prodromos: 1, paeonian_cavalry: 1, thracian_peltast: 1, greek_cretan_archer: 1, alexander_greek_mercenary_infantry: 1, alexander_greek_mercenary_cavalry: 1, alexander_odrysian_cavalry: 1, alexander_greek_allied_cavalry: 1, alexander_dahae_horse_archer: 1, alexander_bactrian_cavalry: 1, alexander_sogdian_cavalry: 1 } },
  julius_caesar: { name: 'Cumhuriyet lejyonu ve yardımcı birlikler', doctrineId: null, units: { roman_republic_legionary: 10, roman_gallic_cavalry: 3, caesar_hispanic_cavalry: 1, roman_cretan_archer: 2, caesar_balearic_slinger: 2, caesar_germanic_cavalry: 2, caesar_germanic_light_infantry: 2, caesar_numidian_light_infantry: 2 } },
  saladin: { name: 'Eyyûbî karma piyade ve süvari ordusu', doctrineId: null, units: { ayyubid_lancer: 6, ayyubid_horse_archer: 6, ayyubid_foot_archer: 4, ayyubid_foot_spearman: 2, ayyubid_crossbowman: 2, ayyubid_javelineer: 2, ayyubid_armoured_maceman: 2 } },
  hannibal_barca: { name: 'Kartaca karma sefer ordusu', doctrineId: null, units: { carthage_libyan_infantry: 3, hannibal_light_spearman: 2, carthage_citizen_spearman: 2, carthage_iberian_sword: 2, carthage_gallic_swordsman: 2, numidian_light_cavalry: 3, carthage_balearic_slinger: 2, hannibal_iberian_cavalry: 2, hannibal_gallic_cavalry: 2, hannibal_ligurian_infantry: 2, hannibal_carthaginian_cavalry: 1, hannibal_mauri_infantry: 1, carthage_war_elephant: 1 } },
  nikephoros_ii_phokas: { name: 'Bizans karma piyade ve katafrakt ordusu', doctrineId: null, units: { byzantine_skoutatos: 6, byzantine_menavlatos: 4, byzantine_foot_archer: 2, byzantine_kataphraktos: 4, byzantine_akontistes: 2, byzantine_sphendobolistes: 2, byzantine_prokoursator_lancer: 2, byzantine_prokoursator_archer: 2 } },
});

for (const [id, preset] of Object.entries(ARMY_PRESETS)) {
  if (!ARMY_HISTORY[id]) throw new Error(`Ordu tarihî kapsamı eksik: ${id}`);
  preset.history = ARMY_HISTORY[id];
}

export function presetMinimum(preset) {
  return armyCapacity(preset.units);
}

// Weighted largest-remainder allocation respects capacity, including odd totals.
// Every preset has ordinary one-slot troops to fill the final small remainder.
// The minimum is a complete starting army, safely above each doctrine's threshold.
export function createCommanderArmy(commanderId, total) {
  const preset = ARMY_PRESETS[commanderId];
  if (!preset) throw new Error('Bu komutan için henüz taktiğe uygun hazır ordu yok.');
  const minimum = presetMinimum(preset);
  if (!Number.isSafeInteger(total) || total < minimum) throw new Error(`En az ${minimum} kapasite olacak şekilde tam sayı gir.`);
  const rows = Object.entries(preset.units).map(([type, weight]) => {
    const exact = (total / minimum) * weight;
    return { type, count: Math.floor(exact), remainder: exact % 1, cost: unitCapacity(type) };
  });
  let remainder = total - rows.reduce((sum, row) => sum + row.count * row.cost, 0);
  while (remainder > 0) {
    const next = rows.filter(row => row.cost <= remainder).sort((a, b) => b.remainder - a.remainder)[0];
    if (!next) break;
    next.count++; next.remainder--; remainder -= next.cost;
  }
  return Object.fromEntries(rows.map(row => [row.type, row.count]));
}
