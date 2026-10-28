import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { COMMANDER_ROSTER_COMPLETION_UNITS } from '../src/commander-roster-completion.js';


import catalogue from '../src/historical-catalogue.js';
import { HISTORICAL_TYPES as types, restoreHistoricalArmies } from '../src/historical-combat.js';
import { HISTORICAL_ART_PROFILES as profiles } from '../src/historical-art-profiles.js';
import { cultureForCivilization } from '../src/historical-culture-groups.js';
import { Battle } from '../src/crown-battle.js';
import { ARMY_PRESETS, presetMinimum, createCommanderArmy } from '../src/historical-army-presets.js';
import { armyCapacity, unitCapacity } from '../src/historical-army-capacity.js';
import { weaponFamily } from '../src/crown-battle-weapon-motion.js';
const units = COMMANDER_ROSTER_COMPLETION_UNITS.map(unit => catalogue.find(entry => entry.id === unit.id));

if (!process.argv.includes('--browser-only')) {
assert.equal(new Set(catalogue.map(u => u.id)).size, catalogue.length);
const battleAttestedAdditions = {
  mehmed_ii: ['mehmed_serbian_auxiliary_cavalry'],
  alp_arslan: ['seljuk_diyarbekir_volunteer', 'seljuk_uz_horse_archer'],
  timur: ['timur_aq_qoyunlu_cavalry', 'timur_kara_tatar_archer'],
  attila: ['attila_sciri_infantry'],
  genghis_khan: ['genghis_karluk_cavalry', 'genghis_uyghur_infantry'],
  ramesses_ii: ['egypt_nearin_infantry'],
  julius_caesar: ['caesar_hispanic_cavalry'],
  leonidas: ['greek_phocian_hoplite', 'greek_opuntian_locrian_infantry'],
  georg_frundsberg: ['bicocca_spanish_pikeman'],
  alexander_great: ['alexander_dahae_horse_archer', 'alexander_bactrian_cavalry', 'alexander_sogdian_cavalry'],
  hannibal_barca: ['hannibal_carthaginian_cavalry', 'hannibal_mauri_infantry'],
};
for (const [commander, additions] of Object.entries(battleAttestedAdditions)) {
  const minimum = presetMinimum(ARMY_PRESETS[commander]);
  const roster = createCommanderArmy(commander, minimum);
  assert.equal(armyCapacity(roster), minimum, `${commander}: additions fit minimum army`);
  for (const id of additions) {
    assert.ok(roster[id] > 0, `${commander}: battle-attested contingent retained`);
    assert.notEqual(types[id].projectile, 'bullet');
  }
}
assert.equal(createCommanderArmy('georg_frundsberg', 24).spanish_armoured_pikeman, undefined, 'later tercio card is not used for Bicocca');
assert.equal(types.alexander_dahae_horse_archer.projectile, 'arrow');
assert.equal(types.seljuk_uz_horse_archer.projectile, 'arrow');
assert.equal(types.timur_kara_tatar_archer.projectile, 'arrow');
assert.equal(types.timur_kara_tatar_archer.skirmish, true);
assert.ok(types.timur_kara_tatar_archer.speed > types.timurid_horse_archer.speed);
assert.ok(types.timur_kara_tatar_archer.armor < types.timurid_horse_archer.armor);
assert.equal(cultureForCivilization('Anadolu Kara Tatarları').id, 'kara-tatar');
assert.equal(types.seljuk_uz_horse_archer.skirmish, true);
assert.ok(types.seljuk_uz_horse_archer.speed > types.seljuk_ghulam_archer.speed);
assert.ok(types.seljuk_uz_horse_archer.armor < types.seljuk_ghulam_archer.armor);
assert.equal(cultureForCivilization('Uzlar').id, 'turkic');
assert.equal(presetMinimum(ARMY_PRESETS.alp_arslan), 24);
assert.equal(cultureForCivilization('Sırp Despotluğu').id, 'serbian');
assert.ok(types.mehmed_serbian_auxiliary_cavalry.armor > types.ottoman_cebelu.armor);
assert.ok(types.mehmed_serbian_auxiliary_cavalry.speed < types.ottoman_cebelu.speed);
assert.equal(types.alexander_dahae_horse_archer.ranged, true);
assert.equal(profiles.alexander_dahae_horse_archer.noStirrups, true);
for (const id of ['alexander_bactrian_cavalry', 'alexander_sogdian_cavalry', 'hannibal_carthaginian_cavalry', 'caesar_hispanic_cavalry']) {
  assert.equal(profiles[id].noStirrups, true, `${id}: ancient cavalry has no stirrups`);
  assert.ok(types[id].chargeDamage > 0, `${id}: close-combat cavalry charge`);
}
assert.ok(types.alexander_sogdian_cavalry.speed > types.alexander_bactrian_cavalry.speed);
assert.ok(types.alexander_sogdian_cavalry.armor < types.alexander_bactrian_cavalry.armor);
assert.equal(cultureForCivilization('Baktriya / Makedon hizmeti').id, 'ancient');
assert.equal(cultureForCivilization('Soğdlar / Makedon hizmeti').id, 'ancient');
assert.equal(cultureForCivilization('Mauri / Kartaca hizmeti').id, 'ancient');
assert.equal(cultureForCivilization('Hispania / Roma hizmeti').id, 'ancient');
assert.equal(presetMinimum(ARMY_PRESETS.ramesses_ii), 24);
assert.equal(presetMinimum(ARMY_PRESETS.julius_caesar), 24);
assert.equal(presetMinimum(ARMY_PRESETS.attila), 24);
assert.equal(presetMinimum(ARMY_PRESETS.genghis_khan), 24);
for (const id of ['genghis_karluk_cavalry', 'genghis_uyghur_infantry']) {
  assert.equal(cultureForCivilization(types[id].faction).id, 'turkic');
}
assert.equal(cultureForCivilization(types.attila_sciri_infantry.faction).id, 'ancient');
assert.equal(cultureForCivilization(types.seljuk_diyarbekir_volunteer.faction).id, 'middle-east');
assert.equal(cultureForCivilization(types.timur_aq_qoyunlu_cavalry.faction).id, 'turkic');
assert.equal(presetMinimum(ARMY_PRESETS.alp_arslan), 24);
assert.ok(types.timur_aq_qoyunlu_cavalry.chargeDamage > 0);
assert.equal(weaponFamily(profiles.flemish_pikeman.weapon), 'thrust');
assert.ok(types.flemish_pikeman.reach > types.flemish_goedendag.reach);
assert.ok(types.flemish_pikeman.damage < types.flemish_goedendag.damage);
assert.ok(types.flemish_pikeman.hp < types.flemish_goedendag.hp);
assert.ok(types.flemish_pikeman.speed < types.flemish_goedendag.speed);
assert.equal(types.burgundian_guard_archer.projectile, 'arrow');
assert.ok(types.burgundian_guard_archer.damage > types.french_franc_archer.damage);
assert.ok(types.burgundian_guard_archer.cooldown > types.french_franc_archer.cooldown);
assert.ok(types.burgundian_guard_archer.speed < types.french_franc_archer.speed);
assert.equal(cultureForCivilization(types.burgundian_guard_archer.faction).id, cultureForCivilization(types.flemish_goedendag.faction).id);
assert.equal(weaponFamily(profiles.hussite_sudlice_infantry.weapon), 'thrust');
assert.ok(types.hussite_sudlice_infantry.reach > types.hussite_flailman.reach);
assert.ok(types.hussite_sudlice_infantry.damage < types.hussite_flailman.damage);
assert.ok(types.hussite_sudlice_infantry.hp < types.hussite_flailman.hp);
assert.ok(types.hussite_sudlice_infantry.cooldown < types.hussite_flailman.cooldown);
assert.equal(weaponFamily(profiles.swiss_two_handed_swordsman.weapon), 'heavy');
assert.ok(types.swiss_two_handed_swordsman.damage > types.swiss_pikeman.damage);
assert.ok(types.swiss_two_handed_swordsman.reach < types.swiss_pikeman.reach);
assert.ok(types.swiss_two_handed_swordsman.cooldown > types.swiss_pikeman.cooldown);
for (const id of ['hussite_sudlice_infantry', 'swiss_two_handed_swordsman']) assert.notEqual(types[id].projectile, 'bullet');
const army = Object.fromEntries(units.map(u => [u.id, 2]));
const saved = [{ roman: 3, ...army }, { kipchak: 4, ...army }];
assert.deepEqual(restoreHistoricalArmies(JSON.parse(JSON.stringify(saved))).armies, saved);
assert.equal(types.aragon_almogavar_javelineer.projectile, 'dart');
assert.equal(types.aragon_almogavar_javelineer.skirmish, true);
assert.ok(types.aragon_almogavar_javelineer.hp < types.aragon_almogavar.hp);
assert.equal(types.hungarian_crossbowman.projectile, 'bolt');
assert.ok(types.hungarian_crossbowman.reach > types.aragon_almogavar_javelineer.reach);
assert.ok(types.hungarian_crossbowman.cooldown > types.aragon_almogavar_javelineer.cooldown);
assert.ok(types.hungarian_crossbowman.hp < types.hungarian_pavise_infantry.hp);
assert.equal(weaponFamily(profiles.scots_claymore_infantry.weapon), 'heavy');
assert.ok(types.scots_claymore_infantry.damage > types.scots_schiltron.damage);
assert.ok(types.scots_claymore_infantry.reach < types.scots_schiltron.reach);
assert.equal(types.irish_kern_javelineer.projectile, 'dart');
assert.equal(types.irish_kern_javelineer.skirmish, true);
assert.ok(types.irish_kern_javelineer.speed > types.irish_kern_spearman.speed);
assert.ok(types.irish_kern_javelineer.reach < types.irish_kern_archer.reach);
assert.ok(types.hungarian_pavise_infantry.hp > types.welsh_long_spearman.hp);
assert.ok(types.hungarian_pavise_infantry.speed < types.welsh_long_spearman.speed);
assert.ok(types.hungarian_pavise_infantry.reach < types.welsh_long_spearman.reach);
for (const id of ['scots_claymore_infantry', 'irish_kern_javelineer', 'welsh_long_spearman', 'hungarian_pavise_infantry']) {
  assert.notEqual(types[id].projectile, 'bullet');
}
const commanderGapAdditions = {
  francesco_sforza: 'milan_provisionato_infantry',
  julius_caesar: 'caesar_numidian_light_infantry',
  leonidas: 'greek_theban_thermopylae_hoplite',
  alexander_great: 'alexander_greek_allied_cavalry',
};
for (const [commander, id] of Object.entries(commanderGapAdditions)) {
  assert.ok(createCommanderArmy(commander, 24)[id] > 0, `${commander}: new troop in starting army`);
  assert.notEqual(types[id].projectile, 'bullet', `${id}: no new firearm`);
}
assert.equal(types.caesar_numidian_light_infantry.projectile, 'dart');
assert.equal(types.caesar_numidian_light_infantry.skirmish, true);
assert.ok(types.caesar_numidian_light_infantry.reach < types.roman_cretan_archer.reach);
assert.ok(types.milan_provisionato_infantry.hp > types.genoese_crossbowman.hp);
assert.ok(types.alexander_greek_allied_cavalry.hp > types.alexander_greek_mercenary_cavalry.hp);
assert.ok(types.alexander_greek_allied_cavalry.speed < types.alexander_greek_mercenary_cavalry.speed);
const ancientAdditions = {
  qi_jiguang: ['ming_rattan_javelineer'],
  alp_arslan: ['seljuk_daylamite_spearman', 'seljuk_daylamite_javelineer'],
  harold_godwinson: ['english_fyrd_javelineer'],
  harald_hardrada: ['norse_javelin_skirmisher', 'norse_armoured_spearman'],
  qin_shi_huang: ['qin_light_foot_archer'],
  takeda_shingen: ['sengoku_yari_samurai'],
  charles_vii: ['french_ordonnance_archer'],
  francesco_sforza: ['milan_field_crossbowman'],
  alexander_nevsky: ['novgorod_crossbowman', 'rus_sulitsa_javelineer'],
  saladin: ['ayyubid_crossbowman', 'ayyubid_javelineer', 'ayyubid_armoured_maceman'],
  darius_i: ['saka_foot_archer', 'saka_sagaris_axeman'],
  ramesses_ii: ['egypt_new_axeman'],
  genghis_khan: ['mongol_armoured_sabre_cavalry', 'mongol_axe_cavalry'],
  hannibal_barca: ['hannibal_light_spearman', 'carthage_citizen_spearman'],
  alexander_great: ['alexander_greek_allied_hoplite'],
};
for (const [commander, additions] of Object.entries(ancientAdditions)) {
  const minimum = presetMinimum(ARMY_PRESETS[commander]);
  const army = createCommanderArmy(commander, minimum);
  assert.equal(armyCapacity(army), minimum);
  for (const id of additions) {
    assert.ok(army[id] > 0, id + ': present in starting army');
    assert.notEqual(types[id].projectile, 'bullet');
  }
}
for (const [commander, retained] of Object.entries({
  alp_arslan: ['seljuk_hassa', 'seljuk_turkmen_archer', 'seljuk_ghulam_archer'],
  harold_godwinson: ['england_housecarl', 'english_housecarl_sword', 'english_fyrd_spearman', 'english_early_archer'],
  harald_hardrada: ['norse_hird_swordsman', 'norse_spearman', 'norse_dane_axeman', 'norse_longbowman'],
  qin_shi_huang: ['qin_ji_infantry', 'qin_long_spearman', 'qin_crossbowman', 'qin_swordsman', 'qin_bow_cavalry', 'qin_war_chariot'],
  takeda_shingen: ['japan_yari_ashigaru', 'japan_yumi_ashigaru', 'japan_teppo_ashigaru', 'samurai', 'japan_naginata_foot', 'sengoku_mounted_lancer'],
  charles_vii: ['french_ordonnance_gendarme', 'french_coutilier', 'french_franc_archer', 'french_franc_crossbowman', 'french_scots_guard', 'french_dismounted_man_at_arms'],
  francesco_sforza: ['milan_ducal_cavalry', 'italian_condotta_lancer', 'genoese_crossbowman', 'milan_provisionato_infantry'],
})) {
  const army = createCommanderArmy(commander, 24);
  assert.equal(armyCapacity(army), 24);
  for (const id of [...retained, ...ancientAdditions[commander]]) assert.ok(army[id] > 0, id + ': retained in commander army');
}
assert.equal(types.ming_rattan_javelineer.projectile, 'dart');
assert.equal(types.ming_rattan_javelineer.skirmish, true);
assert.ok(types.ming_rattan_javelineer.hp < types.ming_rattan_shield.hp);
assert.ok(types.ming_rattan_javelineer.armor < types.ming_rattan_shield.armor);
assert.ok(types.ming_rattan_javelineer.reach < types.ming_matchlock.reach);
const mingArmy = createCommanderArmy('qi_jiguang', 40);
assert.equal(armyCapacity(mingArmy), 40);
for (const id of ['ming_long_shield', 'ming_rattan_shield', 'ming_langxian', 'ming_long_spearman', 'ming_short_weapon_support', 'ming_matchlock', 'ming_rattan_javelineer']) assert.ok(mingArmy[id] > 0);
assert.equal(types.seljuk_daylamite_spearman.role, 'pike');
assert.equal(weaponFamily(profiles.seljuk_daylamite_spearman.weapon), 'thrust');
assert.equal(weaponFamily(profiles.seljuk_daylamite_javelineer.weapon), 'ranged');
assert.ok(types.seljuk_daylamite_spearman.hp > types.seljuk_daylamite_javelineer.hp);
assert.ok(types.seljuk_daylamite_spearman.speed < types.seljuk_daylamite_javelineer.speed);
assert.ok(types.seljuk_daylamite_javelineer.reach < types.seljuk_turkmen_archer.reach);
for (const id of ['seljuk_daylamite_javelineer', 'english_fyrd_javelineer']) {
  assert.equal(types[id].projectile, 'dart');
  assert.equal(types[id].skirmish, true);
}
assert.ok(types.english_fyrd_javelineer.hp < types.england_housecarl.hp);
assert.ok(types.english_fyrd_javelineer.reach < types.english_early_archer.reach);
assert.ok(types.english_fyrd_javelineer.damage > types.english_early_archer.damage);
assert.equal(types.french_ordonnance_archer.projectile, 'arrow');
assert.equal(types.norse_javelin_skirmisher.projectile, 'dart');
assert.equal(types.norse_javelin_skirmisher.skirmish, true);
assert.ok(types.norse_javelin_skirmisher.speed > types.norse_longbowman.speed);
assert.ok(types.norse_javelin_skirmisher.damage > types.norse_longbowman.damage);
assert.ok(types.norse_javelin_skirmisher.reach < types.norse_longbowman.reach);
assert.ok(types.norse_javelin_skirmisher.hp < types.norse_longbowman.hp);
assert.equal(types.norse_armoured_spearman.role, 'pike');
assert.ok(types.norse_armoured_spearman.hp > types.norse_spearman.hp);
assert.ok(types.norse_armoured_spearman.armor > types.norse_spearman.armor);
assert.ok(types.norse_armoured_spearman.speed < types.norse_spearman.speed);
assert.ok(types.norse_armoured_spearman.cooldown > types.norse_spearman.cooldown);
assert.equal(types.qin_light_foot_archer.projectile, 'arrow');
assert.ok(types.qin_light_foot_archer.speed > types.qin_crossbowman.speed);
assert.ok(types.qin_light_foot_archer.cooldown < types.qin_crossbowman.cooldown);
assert.ok(types.qin_light_foot_archer.damage < types.qin_crossbowman.damage);
assert.ok(types.qin_light_foot_archer.hp < types.qin_crossbowman.hp);
assert.ok(types.qin_light_foot_archer.reach < types.qin_crossbowman.reach);
assert.equal(types.sengoku_yari_samurai.role, 'pike');
assert.ok(types.sengoku_yari_samurai.hp > types.japan_yari_ashigaru.hp);
assert.ok(types.sengoku_yari_samurai.armor > types.japan_yari_ashigaru.armor);
assert.ok(types.sengoku_yari_samurai.damage > types.japan_yari_ashigaru.damage);
assert.ok(types.sengoku_yari_samurai.speed < types.japan_yari_ashigaru.speed);
assert.ok(types.sengoku_yari_samurai.reach < types.japan_yari_ashigaru.reach);
assert.ok(types.sengoku_yari_samurai.cooldown > types.japan_yari_ashigaru.cooldown);
assert.ok(types.french_ordonnance_archer.hp > types.french_franc_archer.hp);
assert.ok(types.french_ordonnance_archer.armor > types.french_franc_archer.armor);
assert.ok(types.french_ordonnance_archer.speed < types.french_franc_archer.speed);
assert.ok(types.french_ordonnance_archer.cooldown > types.french_franc_archer.cooldown);
assert.equal(types.milan_field_crossbowman.projectile, 'bolt');
assert.equal(types.milan_field_crossbowman.skirmish, true);
assert.ok(types.milan_field_crossbowman.speed > types.genoese_crossbowman.speed);
assert.ok(types.milan_field_crossbowman.cooldown < types.genoese_crossbowman.cooldown);
assert.ok(types.milan_field_crossbowman.hp < types.genoese_crossbowman.hp);
assert.ok(types.milan_field_crossbowman.damage < types.genoese_crossbowman.damage);
assert.ok(types.milan_field_crossbowman.reach < types.genoese_crossbowman.reach);
const nevskyArmy = createCommanderArmy('alexander_nevsky', 24);
assert.equal(armyCapacity(nevskyArmy), 24);
for (const id of ['rus_druzhina', 'rus_hryd_guard', 'rus_retinue_spearman', 'rus_foot_archer', ...ancientAdditions.alexander_nevsky]) {
  assert.ok(nevskyArmy[id] > 0, id + ': retained in Nevsky army');
}
assert.equal(types.novgorod_crossbowman.projectile, 'bolt');
assert.ok(types.novgorod_crossbowman.damage > types.rus_foot_archer.damage);
assert.ok(types.novgorod_crossbowman.cooldown > types.rus_foot_archer.cooldown);
assert.ok(types.novgorod_crossbowman.speed < types.rus_foot_archer.speed);
assert.ok(types.novgorod_crossbowman.reach < types.rus_foot_archer.reach);
assert.equal(types.rus_sulitsa_javelineer.projectile, 'dart');
assert.equal(types.rus_sulitsa_javelineer.skirmish, true);
assert.ok(types.rus_sulitsa_javelineer.speed > types.rus_foot_archer.speed);
assert.ok(types.rus_sulitsa_javelineer.reach < types.rus_foot_archer.reach);
assert.ok(types.rus_sulitsa_javelineer.hp < types.rus_foot_archer.hp);
const saladinArmy = createCommanderArmy('saladin', 24);
assert.equal(armyCapacity(saladinArmy), 24);
for (const id of ['ayyubid_lancer', 'ayyubid_horse_archer', 'ayyubid_foot_archer', 'ayyubid_foot_spearman', ...ancientAdditions.saladin]) {
  assert.ok(saladinArmy[id] > 0, id + ': retained in Saladin army');
}
const crossbow = types.ayyubid_crossbowman, javelineer = types.ayyubid_javelineer, maceman = types.ayyubid_armoured_maceman;
assert.equal(crossbow.role, 'archer');
assert.equal(crossbow.projectile, 'bolt');
assert.ok(crossbow.damage > types.ayyubid_foot_archer.damage);
assert.ok(crossbow.cooldown > types.ayyubid_foot_archer.cooldown);
assert.ok(crossbow.speed < types.ayyubid_foot_archer.speed);
assert.equal(javelineer.role, 'archer');
assert.equal(javelineer.projectile, 'dart');
assert.equal(javelineer.skirmish, true);
assert.ok(javelineer.reach < types.ayyubid_foot_archer.reach);
assert.ok(javelineer.hp < types.ayyubid_foot_archer.hp);
assert.ok(javelineer.speed > types.ayyubid_foot_archer.speed);
assert.equal(weaponFamily(profiles.ayyubid_armoured_maceman.weapon), 'heavy');
assert.ok(!maceman.ranged);
assert.ok(maceman.hp > types.ayyubid_foot_spearman.hp);
assert.ok(maceman.armor > types.ayyubid_foot_spearman.armor);
assert.ok(maceman.speed < types.ayyubid_foot_spearman.speed);
assert.ok(maceman.reach < types.ayyubid_foot_spearman.reach);
assert.ok(maceman.cooldown > types.ayyubid_foot_spearman.cooldown);
assert.equal(types.saka_foot_archer.role, 'archer');
assert.equal(types.saka_foot_archer.projectile, 'arrow');
assert.equal(types.saka_foot_archer.skirmish, true);
assert.ok(types.saka_foot_archer.speed > types.achaemenid_archer.speed);
assert.ok(types.saka_foot_archer.reach < types.achaemenid_archer.reach);
assert.ok(types.saka_foot_archer.hp < types.achaemenid_archer.hp);
assert.equal(weaponFamily(profiles.egypt_new_axeman.weapon), 'heavy');
assert.ok(!types.egypt_new_axeman.ranged);
assert.ok(types.egypt_new_axeman.damage > types.egypt_khopesh_infantry.damage);
assert.ok(types.egypt_new_axeman.cooldown > types.egypt_khopesh_infantry.cooldown);
assert.ok(types.egypt_new_axeman.armor < types.egypt_khopesh_infantry.armor);
assert.ok(types.egypt_new_axeman.hp < types.egypt_khopesh_infantry.hp);
const dariusArmy = createCommanderArmy('darius_i', 24);
for (const id of ['persian', 'achaemenid_archer', 'achaemenid_horse_archer', 'achaemenid_spear_cavalry', 'saka_foot_archer', 'saka_sagaris_axeman']) {
  assert.ok(dariusArmy[id] > 0, id + ': retained in Darius army');
}
assert.ok((dariusArmy.persian + dariusArmy.achaemenid_archer) / armyCapacity(dariusArmy) > .6);
assert.ok(types.hannibal_light_spearman.speed > types.carthage_libyan_infantry.speed);
assert.ok(types.hannibal_light_spearman.armor < types.carthage_libyan_infantry.armor);
assert.ok(types.carthage_citizen_spearman.hp > types.carthage_libyan_infantry.hp);
assert.ok(types.carthage_citizen_spearman.damage < types.carthage_libyan_infantry.damage);
assert.ok(types.alexander_greek_allied_hoplite.hp > types.alexander_greek_mercenary_infantry.hp);
assert.ok(types.alexander_greek_allied_hoplite.speed < types.alexander_greek_mercenary_infantry.speed);
assert.ok(types.alexander_greek_allied_hoplite.reach < types.alexander_sarissa.reach);
assert.equal(createCommanderArmy('hannibal_barca', 29).carthage_sacred_band, undefined);
assert.equal(createCommanderArmy('alexander_great', 24).greek_allied_hoplite, undefined);
const mongolSabre = types.mongol_armoured_sabre_cavalry, mongolAxe = types.mongol_axe_cavalry;
assert.equal(armyCapacity(createCommanderArmy('genghis_khan', 24)), 24);
for (const id of ['mongol', 'mongol_keshig', 'mongol_hook_lancer', 'mongol_armoured_sabre_cavalry', 'mongol_axe_cavalry']) {
  assert.ok(createCommanderArmy('genghis_khan', 24)[id] > 0, id + ': retained in Mongol army');
}
for (const id of ['mongol_armoured_sabre_cavalry', 'mongol_axe_cavalry']) {
  assert.equal(types[id].role, 'cavalry');
  assert.ok(!types[id].ranged, id + ': melee loadout');
}
assert.equal(weaponFamily(profiles.mongol_armoured_sabre_cavalry.weapon), 'slash');
assert.equal(weaponFamily(profiles.mongol_axe_cavalry.weapon), 'heavy');
assert.ok(mongolSabre.hp > types.mongol_hook_lancer.hp);
assert.ok(mongolSabre.armor > types.mongol_hook_lancer.armor);
assert.ok(mongolSabre.speed < types.mongol_hook_lancer.speed);
assert.ok(mongolSabre.reach < types.mongol_hook_lancer.reach);
assert.ok(mongolSabre.chargeDamage < types.mongol_hook_lancer.chargeDamage);
assert.ok(mongolAxe.speed > mongolSabre.speed);
assert.ok(mongolAxe.damage > mongolSabre.damage);
assert.ok(mongolAxe.cooldown > mongolSabre.cooldown);
assert.ok(mongolAxe.armor < mongolSabre.armor);
assert.ok(mongolAxe.hp < mongolSabre.hp);
const westernAdditions = ['german_mounted_crossbowman', 'german_landsknecht_katzbalger', 'english_hobelar', 'english_housecarl_sword', 'french_coutilier', 'french_franc_crossbowman'];
const southernAdditions = ['italian_roncone', 'italian_pavise_bearer', 'castilian_jinete', 'spanish_armoured_pikeman', 'portuguese_besteiro', 'portuguese_dismounted_man_at_arms'];
for (const id of southernAdditions) assert.notEqual(types[id].projectile, 'bullet', `${id}: no firearms`);
assert.equal(weaponFamily(profiles.italian_roncone.weapon), 'heavy');
assert.equal(types.portuguese_besteiro.projectile, 'bolt');
assert.ok(types.castilian_jinete.speed > types.santiago_knight.speed);
assert.ok(types.castilian_jinete.armor < types.santiago_knight.armor);
assert.ok(types.spanish_armoured_pikeman.reach > types.portuguese_dismounted_man_at_arms.reach);
assert.ok(types.italian_pavise_bearer.hp > types.italian_roncone.hp);
assert.ok(types.italian_pavise_bearer.damage < types.italian_roncone.damage);
for (const id of ['italian_roncone', 'italian_pavise_bearer']) assert.equal(createCommanderArmy('francesco_sforza', 24)[id], undefined, 'keep other periods outside Sforza army');
for (const id of westernAdditions) assert.notEqual(types[id].projectile, 'bullet', `${id}: no firearms`);
assert.equal(types.german_mounted_crossbowman.projectile, 'bolt');
assert.equal(types.german_mounted_crossbowman.skirmish, true);
assert.equal(types.german_mounted_crossbowman.chargeDamage, 0);
assert.equal(types.french_franc_crossbowman.projectile, 'bolt');
assert.ok(types.french_franc_crossbowman.cooldown > types.french_franc_archer.cooldown);
assert.ok(types.french_franc_crossbowman.damage > types.french_franc_archer.damage);
assert.ok(types.english_housecarl_sword.armor > types.england_housecarl.armor);
assert.ok(types.english_housecarl_sword.damage < types.england_housecarl.damage);
assert.ok(types.english_hobelar.speed > types.english_mail_knight.speed);
assert.ok(types.english_hobelar.hp < types.english_mail_knight.hp);
assert.ok(types.french_coutilier.speed > types.french_ordonnance_gendarme.speed);
assert.ok(types.french_coutilier.hp < types.french_ordonnance_gendarme.hp);
assert.equal(createCommanderArmy('harold_godwinson', 24).english_hobelar, undefined, '14th-century cavalry stays outside 1066 army');
assert.equal(createCommanderArmy('georg_frundsberg', 24).german_mounted_crossbowman, undefined, 'equipment illustration does not establish Frundsberg service');
for (const u of units) {
  assert.ok(profiles[u.id] && cultureForCivilization(u.faction));
  for (const team of [0, 1]) {
    const b = new Battle({ historicalArmies: team ? [{ roman: 1 }, { [u.id]: 1 }] : [{ [u.id]: 1 }, { roman: 1 }], seed: 19 });
    const a = b.units.find(v => v.team === team), enemy = b.units.find(v => v.team !== team);
    Object.assign(a, { x: 250, y: 400, cooldown: 0, chargeCooldown: 100 });
    const separation = (types[u.id].ranged || types[u.id].role === 'archer') ? 110 : 26;
    Object.assign(enemy, { x: 250 + (team ? -1 : 1) * separation, y: 400, cooldown: 100 });
    const projectiles = new Set();
    for (let i = 0; i < 150; i++) {
      b.step(1 / 30);
      b.projectiles.forEach(p => projectiles.add(p.kind === 'bullet' ? 'bullet' : p.style));
    }
    assert.ok(enemy.hp < enemy.maxHp, `${u.id}/${team}: actual damage`);
    if ((types[u.id].ranged || types[u.id].role === 'archer')) assert.ok(projectiles.has(u.combat.projectile || 'arrow'), `${u.id}: correct projectile`);
    assert.ok(b.units.every(v => [v.x, v.y, v.hp].every(Number.isFinite)));
  }
}
assert.equal(types.german_landsknecht_arquebusier.projectile, 'bullet');
assert.equal(types.japan_teppo_ashigaru.projectile, 'bullet');
assert.equal(types.egypt_new_spearman.role, 'pike');
assert.equal(types.qin_long_spearman.role, 'pike');
for (const id of ['ottoman_timariot', 'ottoman_cebelu']) assert.equal(types[id].role, 'cavalry');
for (const id of ['egypt_new_chariot', 'qin_war_chariot']) {
  assert.equal(unitCapacity(id), 3);
  assert.equal(armyCapacity({ [id]: 2, roman: 4 }), 10);
  const b = new Battle({ historicalArmies: [{ [id]: 1 }, { ottoman_timariot: 1 }] });
  const chariot = b.units.find(u => u.type === id), horse = b.units.find(u => u.type === 'ottoman_timariot');
  assert.ok(types[id].ranged && chariot.combatProfile.radius > horse.combatProfile.radius);
}
assert.equal(createCommanderArmy('jan_iii_sobieski', 24).polish_pikeman, undefined, 'early-century pikemen stay outside Sobieski’s late-century preset');
for (const id of ['polish_royal_partisan', 'polish_lipka_archer']) {
  assert.ok(createCommanderArmy('jan_iii_sobieski', 24)[id] > 0);
  assert.notEqual(types[id].projectile, 'bullet', 'new Polish reinforcements have no firearms');
}
assert.equal(types.polish_royal_partisan.role, 'pike');
assert.equal(types.polish_lipka_archer.skirmish, true);
assert.equal(profiles.polish_royal_partisan.weapon, 'partisan');
assert.equal(profiles.polish_lipka_archer.weapon, 'bow');
for (const id of ['polish_medieval_crossbowman', 'polish_pavise_bearer', 'polish_armoured_halberdier']) {
  assert.notEqual(types[id].projectile, 'bullet', 'medieval Polish troops have no firearms');
  assert.equal(createCommanderArmy('jan_iii_sobieski', 24)[id], undefined, '15th-century troops stay outside Sobieski’s preset');
}
assert.equal(types.polish_medieval_crossbowman.projectile, 'bolt');
for (const id of ['ottoman_akinci_archer', 'ottoman_akinci_mace', 'ottoman_serdengecti']) {
  assert.notEqual(types[id].projectile, 'bullet', 'new Ottoman troops have no firearms');
}
const mehmedArmy = createCommanderArmy('mehmed_ii', 24);
for (const id of ['ottoman_voynuk_lancer', 'ottoman_martolos', 'ottoman_janissary_armoured_sword']) {
  assert.notEqual(types[id].projectile, 'bullet', 'new Ottoman additions have no firearms');
}
for (const id of ['ottoman_martolos', 'ottoman_janissary_armoured_sword']) assert.ok(mehmedArmy[id] > 0, `${id}: present in Fatih army`);
assert.equal(mehmedArmy.ottoman_voynuk_lancer, undefined, '1545 equipment card stays outside Fatih preset');
assert.equal(types.ottoman_voynuk_lancer.role, 'cavalry');
assert.ok(types.ottoman_janissary_armoured_sword.armor > types.ottoman_serdengecti.armor);
assert.ok(types.ottoman_janissary_armoured_sword.speed < types.ottoman_serdengecti.speed);
for (const id of ['ottoman_sipahi_archer', 'ottoman_sipahi_axe', 'ottoman_janissary_spearman']) {
  assert.notEqual(types[id].projectile, 'bullet', 'new Ottoman equipment options have no firearms');
  assert.equal(mehmedArmy[id], undefined, 'later equipment options stay outside the Fatih preset');
}
assert.equal(types.ottoman_sipahi_archer.projectile, 'arrow');
assert.equal(types.ottoman_sipahi_archer.skirmish, true);
assert.ok(types.ottoman_sipahi_archer.armor > types.ottoman_akinci_archer.armor);
assert.ok(types.ottoman_sipahi_archer.speed < types.ottoman_akinci_archer.speed);
assert.equal(types.ottoman_janissary_spearman.role, 'pike');
assert.equal(profiles.ottoman_sipahi_axe.weapon, 'axe');
for (const id of ['ottoman_akinci_archer', 'ottoman_akinci_mace']) assert.ok(mehmedArmy[id] > 0);
assert.equal(mehmedArmy.ottoman_serdengecti, undefined, 'later Janissary volunteers stay outside the Fatih preset');
assert.equal(types.ottoman_akinci_archer.skirmish, true);
assert.equal(types.ottoman_akinci_archer.projectile, 'arrow');
assert.equal(profiles.ottoman_akinci_mace.weapon, 'bozdogan');
for (const u of units) assert.notEqual(cultureForCivilization(u.faction).id, 'other');
console.log(`PASS ${units.length} commander reinforcements: damage on both teams, projectiles, saved armies.`);
const battles = [];
for (const u of units) for (const team of [0, 1]) {
  const armies = [{ [u.id]: 12 }, { roman: 12 }];
  const b = new Battle({ historicalArmies: team ? armies.reverse() : armies, seed: 19 });
  for (let tick = 0; tick < 30 * 240 && b.winner === null; tick++) b.step(1 / 30);
  assert.notEqual(b.winner, null, `${u.id}/${team}: battle finishes`);
  assert.ok(b.units.every(v => [v.x, v.y, v.hp].every(Number.isFinite)));
  if ((types[u.id].ranged || types[u.id].role === 'archer')) assert.ok(b.stats[u.combat.projectile === 'bullet' ? 'shots' : 'arrows'] > 0, `${u.id}: projectiles in full battle`);
  battles.push({ id: u.id, team, winner: b.winner, seconds: +b.time.toFixed(2) });
}
await fs.mkdir('artifacts/commander-roster-completion', { recursive: true });
await fs.writeFile('artifacts/commander-roster-completion/full-battles.json', JSON.stringify(battles, null, 2));
console.log(`PASS ${battles.length} full battles; longest ${Math.max(...battles.map(b => b.seconds))} seconds.`);
const commanderBattles = [];
for (const [id, reinforcements] of Object.entries({ qi_jiguang: ancientAdditions.qi_jiguang, timur: ['timurid_guard_cavalry', 'timur'], attila: ['attila_ostrogoth_cavalry', 'attila_gepid_spearman'], alp_arslan: ancientAdditions.alp_arslan, harald_hardrada: ancientAdditions.harald_hardrada, alexander_nevsky: ancientAdditions.alexander_nevsky, saladin: ancientAdditions.saladin, darius_i: ['saka_foot_archer', 'saka_sagaris_axeman'], genghis_khan: ['mongol_armoured_sabre_cavalry', 'mongol_axe_cavalry'], francesco_sforza: ['milan_provisionato_infantry', 'milan_field_crossbowman'], julius_caesar: ['caesar_numidian_light_infantry'], leonidas: ['greek_theban_thermopylae_hoplite'], alexander_great: ['alexander_greek_allied_cavalry', 'alexander_greek_allied_hoplite'], hannibal_barca: ['hannibal_light_spearman', 'carthage_citizen_spearman'], mehmed_ii: ['ottoman_timariot', 'ottoman_cebelu'], georg_frundsberg: ['german_landsknecht_arquebusier', 'german_landsknecht_katzbalger'], harold_godwinson: ['english_housecarl_sword', ...ancientAdditions.harold_godwinson], ramesses_ii: ['egypt_new_spearman', 'egypt_new_chariot', 'egypt_new_axeman'], qin_shi_huang: ['qin_long_spearman', 'qin_war_chariot', 'qin_light_foot_archer'], takeda_shingen: ['japan_teppo_ashigaru', 'sengoku_yari_samurai'], jan_iii_sobieski: ['hussar', 'polish_pancerni', 'polish_light_cavalry', 'polish_musketeer', 'polish_dragoon'], nikephoros_ii_phokas: ['byzantine_prokoursator_archer'], charles_vii: ['french_scots_guard', 'french_coutilier', 'french_franc_crossbowman', 'french_ordonnance_archer'] })) for (const team of [0, 1]) {
  const armies = [{ roman: 48 }, { roman: 48 }], commanders = [null, null];
  armies[team] = createCommanderArmy(id, 48); commanders[team] = id;
  const b = new Battle({ historicalArmies: armies, commanders, seed: 19 });
  for (const reinforcement of [...reinforcements, ...(battleAttestedAdditions[id] || [])]) {
    assert.ok(armies[team][reinforcement] > 0, `${id}: ${reinforcement} present`);
    assert.equal(b.units.filter(u => u.team === team && u.type === reinforcement).length, armies[team][reinforcement]);
  }
  for (let tick = 0; tick < 30 * 240 && b.winner === null; tick++) b.step(1 / 30);
  assert.notEqual(b.winner, null, `${id}/${team}: commander army battle finishes`);
  assert.ok(b.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite)));
  commanderBattles.push({ id, team, winner: b.winner, seconds: +b.time.toFixed(2) });
}
await fs.writeFile('artifacts/commander-roster-completion/commander-battles.json', JSON.stringify(commanderBattles, null, 2));
console.log(`PASS ${commanderBattles.length} commander army battles, both teams; longest ${Math.max(...commanderBattles.map(b => b.seconds))} seconds.`);
}
if (process.argv.includes('--node-only')) process.exit(0);

const dir = 'artifacts/commander-roster-completion';
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 850, height: 310 } });
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(30000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.stack || e.message));
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.route('**/__commander-roster-completion-preview', route => route.fulfill({ contentType: 'text/html', body: '<body style="margin:0;background:#28352d;color:#eee;font:14px sans-serif"><main style="display:flex;flex-wrap:wrap"></main></body>' }));
  await page.goto('http://127.0.0.1:5173/__commander-roster-completion-preview');
  const art = await page.evaluate(async units => {
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const lib = new SpriteLibrary(), faults = [], silhouettes = new Set();
    let frames = 0;
    for (const u of units) {
      for (const team of [0, 1]) for (const action of ['idle', 'walk', 'attack', 'charge', 'charge-ready']) for (let f = 0; f < 8; f++) {
        const c = lib.get(u.id, team, f, action, 0), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let n = 0, edge = false;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 20) {
          n++; edge ||= !x || !y || x === c.width - 1 || y === c.height - 1;
        }
        if (!n || edge) faults.push(`${u.id}/${team}/${action}/${f}: empty or clipped`);
        if (!team && !f && action === 'idle') {
          const alpha = Uint8Array.from({ length: c.width * c.height }, (_, i) => d[i * 4 + 3] >= 128 ? 1 : 0);
          const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', alpha))).join(',');
          if (silhouettes.has(hash)) faults.push(`${u.id}: duplicate silhouette`);
          silhouettes.add(hash);
        }
        frames++;
      }
      const card = document.createElement('section'); card.style.cssText = 'width:270px;text-align:center';
      const title = document.createElement('p'); title.textContent = u.name; card.append(title);
      const c = document.createElement('canvas'); c.width = 260; c.height = 228;
      c.getContext('2d').drawImage(lib.get(u.id, 0, 0, 'idle', 0), 10, 0);
      card.append(c); document.querySelector('main').append(card); lib.cache.clear();
    }
    return { frames, faults, distinct: silhouettes.size };
  }, units);
  await page.screenshot({ path: `${dir}/units.jpg`, type: 'jpeg', quality: 72, fullPage: true });
  assert.deepEqual(art.faults, []);
  console.log(`PASS ${art.frames} animation frames and ${art.distinct} distinct profiles; browser checks starting.`);
  for (const width of [1366, 390]) {
    console.log(`Checking workshop at ${width}px.`);
    await page.setViewportSize({ width, height: 850 });
    await page.goto('http://127.0.0.1:5173/historical-armies.html');
    // A separate workshop save must not inherit the previous viewport's alliance plan.
    await page.evaluate(() => localStorage.removeItem('marble-battle-alliances-v1'));
    for (const u of units) {
      await page.locator(`[data-culture="culture:${cultureForCivilization(u.faction).id}"]`).click();
      await page.locator(`[data-country="${u.faction}"]`).click();
      if (u.kind === 'chariot') {
        await page.locator('[data-filter="chariot"]').click();
        assert.ok(await page.locator(`.unit-card[data-id="${u.id}"]`).isVisible());
        assert.equal(await page.locator('.unit-card:visible').count(), 1, 'chariot filter keeps the selected civilization');
        await page.locator('[data-filter="all"]').click();
      }
      for (const team of [0, 1]) {
        const input = page.locator(`input[data-id="${u.id}"][data-team="${team}"]`);
        await input.fill('2'); assert.equal(await input.inputValue(), '2');
        await input.fill('0'); assert.equal(await input.inputValue(), '0');
        await input.fill('2');
      }
    }
    await page.locator('#launch-battle').click();
    await page.waitForURL('**/crown-battle.html?historical=1');
    await page.reload();
    for (const u of units) for (const prefix of ['north', 'red']) assert.equal(await page.locator(`#${prefix}-${u.id}`).inputValue(), '2');
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(`${dir}/checks.json`, JSON.stringify({ ...art, units: units.map(u => u.id), pcAndPhoneBothTeams: true, errors }, null, 2));
  console.log(`PASS ${art.frames} animation frames; PC/phone, both teams add/remove, launch and reload.`);
} finally { await browser.close(); }


