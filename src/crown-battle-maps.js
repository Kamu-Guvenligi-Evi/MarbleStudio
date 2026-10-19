import { makeGround } from './crown-battle-ground.js';

// Structures are on hold. Retired map IDs resolve to the open classic field.
export const BATTLE_MAPS = Object.freeze([
  { id: 'classic', name: 'Eski Meydan', description: 'Mevcut yeşil vadi; senaryoya göre kuru arazi.', color: '#6d7650' },
  { id: 'steppe', name: 'Bozkır', description: 'Kuru otlarla kaplı açık bozkır.', color: '#999063' },
  { id: 'desert', name: 'Kum Çölü', description: 'Kum dalgalarıyla açık çöl arazisi.', color: '#bd9868' },
  { id: 'snow', name: 'Karlı Ova', description: 'Kar örtüsüyle geniş, açık ova.', color: '#b9cbc9' },
  { id: 'autumn', name: 'Güz Çayırı', description: 'Sonbahar renklerinde açık çayır.', color: '#85805b' },
  { id: 'stone', name: 'Taş Meydanı', description: 'Taş döşeli açık savaş meydanı.', color: '#929085' },
]);
export const battleMap = id => BATTLE_MAPS.find(map => map.id === id) || BATTLE_MAPS.find(map => map.id === 'classic');

export function makeBattleMap(seed, id, width = 900, height = 1440) {
  return makeGround(seed, battleMap(id).id, width, height);
}
