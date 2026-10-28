// Reviewed replacements for legacy units that still used the generic role preset.
// Equipment/period basis: docs/historical-elite-research-2026-10-14.json.
// Numbers are game balance, not measured historical performance. Related equipment
// gets distinct gameplay tradeoffs, not a claim of historical national superiority.
export const HISTORICAL_EQUIPMENT_BALANCE = {
  // Mounted lance representations: reach/charge, protection at a movement cost.
  ottoman_sipah: { hp: 185, speed: 39, damage: 26, reach: 30, cooldown: 1.25, armor: .14, chargeDamage: 52 },
  seljuk_hassa: { hp: 190, speed: 40, damage: 26, reach: 31, cooldown: 1.2, armor: .16, chargeDamage: 52 },
  // Bahri carries a lance; the Burji representation carries a sabre and shield.
  mamluk_bahri: { hp: 190, speed: 41, damage: 26, reach: 31, cooldown: 1.25, armor: .16, chargeDamage: 60 },
  mamluk_burji: { hp: 205, speed: 37, damage: 29, reach: 22, cooldown: 1.15, armor: .2, chargeDamage: 36 },
  macedon_companions: { hp: 175, speed: 41, damage: 26, reach: 32, cooldown: 1.3, armor: .12, chargeDamage: 58 },
  rome_equites: { hp: 180, speed: 38, damage: 25, reach: 30, cooldown: 1.25, armor: .17, chargeDamage: 48 },
  rus_druzhina: { hp: 195, speed: 36, damage: 27, reach: 31, cooldown: 1.3, armor: .2, chargeDamage: 50 },
  tang_xuanjia: { hp: 215, speed: 34, damage: 28, reach: 31, cooldown: 1.35, armor: .26, chargeDamage: 54 },
  mughal_ahadi: { hp: 170, speed: 42, damage: 25, reach: 31, cooldown: 1.3, armor: .1, chargeDamage: 52 },
  // Existing close-combat artwork, not lance cavalry inferred from the name.
  kipchak_masked_swordsman: { hp: 205, speed: 36, damage: 29, reach: 21, cooldown: 1.1, armor: .24, chargeDamage: 36 },
  song_beiwei: { hp: 205, speed: 35, damage: 30, reach: 23, cooldown: 1.3, armor: .24, chargeDamage: 38 },
  khmer_ranked_cavalry: { hp: 165, speed: 41, damage: 29, reach: 23, cooldown: 1.35, armor: .08, chargeDamage: 34 },
  // Bows: mobility/range trade against durability. Yoroi is heavier; unarmoured
  // Han representation does not inherit the generic cavalry's health/protection.
  ghaznavid_guard: { hp: 140, speed: 42, damage: 18, reach: 170, cooldown: 1.7, armor: .1, ranged: true, skirmish: true, chargeDamage: 0 },
  // Related guards retain bows: rapid mobile harassment / slower, stronger shots.
  mongol_keshig: { hp: 135, speed: 47, damage: 16, reach: 175, cooldown: 1.45, armor: .14, ranged: true, skirmish: true, chargeDamage: 0 },
  ilkhan_keshikten: { hp: 155, speed: 41, damage: 20, reach: 180, cooldown: 1.8, armor: .14, ranged: true, skirmish: true, chargeDamage: 0 },
  japan_mounted_samurai: { hp: 155, speed: 38, damage: 20, reach: 180, cooldown: 1.8, armor: .2, ranged: true, skirmish: true, chargeDamage: 0 },
  han_yulin: { hp: 125, speed: 43, damage: 17, reach: 170, cooldown: 1.65, armor: .04, ranged: true, skirmish: true, chargeDamage: 0 },
  ottoman_solak: { hp: 85, speed: 25, damage: 20, reach: 185, cooldown: 1.65, armor: .03 },
  // Shield/spear representations. Do not invent a sarissa for the hypaspists,
  // or metal body armour from the colour/material of a museum sculpture.
  macedon_hypaspists: { hp: 135, speed: 24, damage: 24, reach: 30, cooldown: 1.15, armor: .18 },
  carthage_sacred_band: { hp: 145, speed: 20, damage: 25, reach: 30, cooldown: 1.2, armor: .22 },
  assyria_royal_guard: { hp: 115, speed: 24, damage: 23, reach: 31, cooldown: 1.15, armor: .1 },
  goryeo_yongho_guard: { hp: 130, speed: 23, damage: 24, reach: 29, cooldown: 1.2, armor: .16 },
  maya_sajal: { hp: 110, speed: 27, damage: 25, reach: 32, cooldown: 1.15, armor: .06 },
  benin_warrior_chief: { hp: 120, speed: 25, damage: 24, reach: 32, cooldown: 1.2, armor: .1 },
  // Macuahuitl, sword, mace and axe: impact/tempo instead of a shared sword DPS.
  // Both remain shielded macuahuitl infantry: mobility/tempo versus staying power.
  mexica_eagle: { hp: 125, speed: 28, damage: 27, reach: 20, cooldown: 1.15, armor: .12 },
  mexica_jaguar: { hp: 130, speed: 27, damage: 28, reach: 20, cooldown: 1.2, armor: .12 },
  egypt_sherden: { hp: 130, speed: 24, damage: 25, reach: 20, cooldown: 1.1, armor: .14 },
  inca_decorated_warrior: { hp: 120, speed: 26, damage: 31, reach: 18, cooldown: 1.3, armor: .06 },
  mamluk_axebearer: { hp: 120, speed: 25, damage: 34, reach: 22, cooldown: 1.45, armor: .08 },
};
