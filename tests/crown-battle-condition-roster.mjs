import assert from 'node:assert/strict';
import { Battle, UNIT_TYPES } from '../src/crown-battle.js';

const types = ['gokturk_lance_cavalry', 'tibetan_shield_swordsman', 'benin_bow_warrior',
  'moche_atlatl_warrior', 'kerma_dagger_warrior', 'saka_sagaris_axeman',
  'thracian_rhomphaia_warrior', 'maori_patu_warrior', 'hawaiian_slinger',
  'irish_kern_archer', 'dacian_shield_spearman', 'roman_triarius', 'roman_veles',
  'agrianian_javelineer', 'thessalian_cavalry', 'achaemenid_indian_archer',
  'flemish_goedendag', 'frankish_axeman', 'frankish_angon',
  'sarmatian_noble_lancer', 'spanish_rodelero', 'egypt_achaemenid_marine',
  'lycian_cornel_archer', 'bactrian_short_spearman',
  'late_roman_plumbatarius', 'late_roman_slinger', 'paphlagonian_short_spearman',
  'colchian_hide_spearman', 'libyan_fire_javelineer', 'aithiopian_palm_archer',
  'caesar_balearic_slinger', 'macedon_prodromos', 'qin_bow_cavalry',
  'achaemenid_spear_cavalry'];
const results = [];
for (const type of types) for (const team of [0, 1]) {
  assert.ok(UNIT_TYPES[type], `${type} must remain registered`);
  const armies = [{ roman: 16 }, { roman: 16 }];
  armies[team] = { [type]: 16 };
  const b = new Battle({ seed: 713, historicalArmies: armies, expandedMap: true });
  let peakFatigue = 0, minMorale = 100;
  for (let tick = 0; tick < 600 * 30 && b.winner === null; tick++) {
    b.step(1 / 30);
    if (tick % 30) continue;
    for (const u of b.units) {
      assert.ok(Number.isFinite(u.x) && Number.isFinite(u.y), `${type}: finite position`);
      assert.ok(u.fatigue >= 0 && u.fatigue <= 100, `${type}: bounded fatigue`);
      assert.ok(u.morale >= 0 && u.morale <= 100, `${type}: bounded morale`);
      if (u.team === team) {
        peakFatigue = Math.max(peakFatigue, u.fatigue);
        minMorale = Math.min(minMorale, u.morale);
      }
    }
  }
  assert.equal(b.outcomeReason, 'elimination', `${type}/${team}: no endless retreat`);
  assert.ok(peakFatigue > 0 && minMorale < 100, `${type}: fatigue and morale participate`);
  results.push({ type, team, seconds: +b.time.toFixed(1), winner: b.winner,
    peakFatigue: +peakFatigue.toFixed(1), minMorale: +minMorale.toFixed(1) });
}
console.log(`PASS ${results.length} full battles across ${types.length} roster types`, JSON.stringify(results));
