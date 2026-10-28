import { armyCapacity, unitCapacity } from '../src/historical-army-capacity.js';
import assert from 'node:assert/strict';
import { ARMY_PRESETS, createCommanderArmy, presetMinimum } from '../src/historical-army-presets.js';
import { Battle } from '../src/crown-battle.js';
import { HISTORICAL_TYPES } from '../src/historical-combat.js';
import { CIVILIZATION_DOCTRINES } from '../src/historical-civilization-tactics.js';
import commanders from '../src/historical-commanders.json' with { type: 'json' };

assert.deepEqual(Object.keys(ARMY_PRESETS).sort(), commanders.map(c => c.id).sort());
// Previously omitted allies must actually spawn in both teams, including after
// largest-remainder scaling; merely listing them in the catalogue is not enough.
for (const [commander, allies] of Object.entries({
  timur: ['timur_aq_qoyunlu_cavalry', 'timur_kara_tatar_archer'],
  mehmed_ii: ['ottoman_timariot', 'ottoman_cebelu', 'ottoman_martolos', 'ottoman_janissary_armoured_sword', 'mehmed_serbian_auxiliary_cavalry'],
  georg_frundsberg: ['german_landsknecht_arquebusier', 'german_landsknecht_katzbalger'],
  harold_godwinson: ['english_housecarl_sword', 'english_fyrd_spearman', 'english_early_archer'],
  charles_vii: ['french_coutilier', 'french_franc_crossbowman', 'french_franc_archer', 'french_scots_guard', 'french_dismounted_man_at_arms'],
  attila: ['attila_ostrogoth_cavalry', 'attila_gepid_spearman'],
  hannibal_barca: ['carthage_gallic_swordsman', 'hannibal_iberian_cavalry', 'hannibal_gallic_cavalry', 'carthage_war_elephant', 'numidian_light_cavalry'],
  leonidas: ['greek_thespian_hoplite', 'greek_allied_hoplite'],
  alexander_great: ['agrianian_javelineer', 'thessalian_cavalry', 'macedon_prodromos', 'paeonian_cavalry', 'thracian_peltast', 'greek_cretan_archer', 'alexander_greek_mercenary_infantry', 'alexander_greek_mercenary_cavalry', 'alexander_odrysian_cavalry'],
  julius_caesar: ['caesar_balearic_slinger', 'caesar_germanic_cavalry', 'caesar_germanic_light_infantry'],
  qin_shi_huang: ['qin_bow_cavalry', 'qin_long_spearman'],
  darius_i: ['achaemenid_spear_cavalry'],
  nikephoros_ii_phokas: ['byzantine_akontistes', 'byzantine_sphendobolistes', 'byzantine_prokoursator_lancer'],
  saladin: ['ayyubid_foot_spearman'],
  ramesses_ii: ['egypt_sherden', 'egypt_khopesh_infantry', 'egypt_new_composite_archer', 'egypt_new_spearman'],
  alexander_nevsky: ['rus_druzhina', 'rus_hryd_guard', 'rus_retinue_spearman', 'rus_foot_archer'],
  takeda_shingen: ['japan_naginata_foot', 'japan_teppo_ashigaru'],
})) for (const n of [presetMinimum(ARMY_PRESETS[commander]), 97, 241]) for (const team of [0, 1]) {
  const army = createCommanderArmy(commander, n), armies = [{ roman: 24 }, { roman: 24 }];
  armies[team] = army;
  const battle = new Battle({ historicalArmies: armies, seed: 42 });
  for (const type of allies) {
    assert.ok(army[type] > 0, `${commander}: ${type} included in generated army`);
    assert.equal(battle.units.filter(u => u.team === team && u.type === type).length, army[type], `${commander}/${team}: ${type} spawns`);
  }
}
// These catalogue entries belong to different periods/commanders and must not
// be injected into an available preset merely to make every new type automatic.
assert.equal(ARMY_PRESETS.julius_caesar.units.roman_triarius, undefined);
assert.equal(ARMY_PRESETS.julius_caesar.units.roman_veles, undefined);
assert.equal(ARMY_PRESETS.darius_i.units.achaemenid_indian_archer, undefined);
for (const type of ['egypt_old_kingdom_archer', 'egypt_middle_spearman', 'egypt_middle_axeman', 'egypt_achaemenid_marine']) {
  assert.equal(ARMY_PRESETS.ramesses_ii.units[type], undefined, 'Ramses retains New Kingdom scope');
}
assert.equal(ARMY_PRESETS.alexander_nevsky.units.rus_axe_warrior, undefined, '11–12th-century axe card stays outside the 13th-century army');
// Tang and Akbar-period troops remain manually selectable; the current Chinese
// and Timurid commanders predate/postdate them and must not inherit these cards.
for (const preset of Object.values(ARMY_PRESETS)) {
  assert.equal(preset.units.tang_crossbowman, undefined);
  assert.equal(preset.units.mughal_shamsherbaz, undefined);
}
for (const [id, preset] of Object.entries(ARMY_PRESETS)) {
  const minimum = presetMinimum(preset);
  assert.equal(minimum, id === 'qi_jiguang' ? 40 : id === 'timur' ? 28 : id === 'hannibal_barca' ? 29 : 24, 'complete army capacity includes elephant slots');
  assert.ok(Object.keys(preset.units).length >= 2, `${id}: supporting units present`);
  assert.ok(new Set(Object.keys(preset.units).map(type => {
    const cfg = HISTORICAL_TYPES[type];
    return `${cfg.role}/${Boolean(cfg.ranged)}/${cfg.projectile || ''}/${cfg.armor || 0}/${cfg.reach}`;
  })).size >= 2, `${id}: distinct equipment roles, not renamed clones`);
  // Sweep rounding boundaries, including small armies where a missing soldier
  // can otherwise silently disable the commander's doctrine.
  const profile = CIVILIZATION_DOCTRINES.find(p => p.id === preset.doctrineId);
  for (let n = minimum; n <= 1000; n++) {
    const army = createCommanderArmy(id, n);
    assert.equal(armyCapacity(army), n);
    if (id === 'timur') assert.ok(army.timur >= 1, 'Timur retains war elephants at every size');
    if (!preset.doctrineId) continue;
    const roles = profile ? profile.roles : { seljuk_hassa: 'horse', seljuk_turkmen_archer: 'bow', seljuk_ghulam_archer: 'bow' };
    const eligible = Object.entries(army).filter(([type]) => roles[type]).reduce((s, [, count]) => s + count, 0);
    assert.ok(eligible / n >= .6, `${id}/${n}: doctrine core preserved`);
    for (const [role, need] of Object.entries(profile?.required || { horse: 4 })) {
      assert.ok(Object.entries(army).filter(([type]) => roles[type] === role).reduce((s, [, count]) => s + count, 0) >= need);
    }
  }
  for (const count of [minimum, minimum * 2, 97, 241]) {
    const army = createCommanderArmy(id, count);
    assert.equal(armyCapacity(army), count);
    for (const [type, n] of Object.entries(army)) {
      assert.ok(HISTORICAL_TYPES[type]);
      assert.ok(Number.isSafeInteger(n) && n >= preset.units[type]);
      assert.ok(Math.abs(n - count * preset.units[type] / minimum) < (Object.keys(preset.units).some(t => unitCapacity(t) > 1) && unitCapacity(type) === 1 ? 10 : 1));
    }
    for (const team of [0, 1]) {
      const armies = [{ roman: 24 }, { roman: 24 }], commanders = [null, null];
      armies[team] = army; commanders[team] = id;
      const battle = new Battle({ seed: 42, historicalArmies: armies, commanders, expandedMap: true });
      battle.step(1 / 30);
      const state = !preset.doctrineId ? battle.tactics.formations.armies.get(`army-${team}`)
        : preset.doctrineId === 'TR_SELJUK' ? battle.tactics.teams[team] : battle.tactics.civilizations.teams[team];
      assert.ok(state, `${id}/${count}/${team}: generated army starts its commander formation or doctrine`);
      assert.equal(battle.commanders[team].commanderId, id);
    }
  }
  for (const invalid of [minimum - 1, 0, -1, 25.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => createCommanderArmy(id, invalid));
  }
}
assert.throws(() => createCommanderArmy('unknown', 24));
console.log(`PASS: ${commanders.length} mixed armies; doctrine minimum–1000 rounding/role sweep; four sizes on both teams activate commander formations/doctrines; exact capacity totals and invalid size checks.`);
