export const IBERIAN_UNITS = [{
  id: 'santiago_knight', name: 'Santiago şövalyesi', faction: 'León / Kastilya',
  period: '13. yy temsili', kind: 'cavalry', role: 'Mızraklı tarikat süvarisi', color: '#b33e36',
  note: '1170’te León Kralı II. Fernando döneminde Cáceres’te kurulan askerî tarikat. 13. yy temsili: zincir zırh, örtü giysisi, kalkan ve mızrak; geç dönem plaka zırh kullanılmaz.',
  source: 'https://pares.cultura.gob.es/ParesBusquedas20/catalogo/autoridad/21516/imprimir',
  sources: [
    { title: 'Orta Çağ Avrupa donanımı — Metropolitan Museum', url: 'https://www.metmuseum.org/essays/arms-and-armor-in-medieval-europe' },
    { title: 'Santiago kılıç-haçı — İspanya Kültür Bakanlığı', url: 'https://tesauros.cultura.gob.es/tesauros/bienesculturales/1190064.html' },
  ],
  credit: 'İspanya Kültür Bakanlığı / PARES; dönem donanımı: Metropolitan Museum',
  visualNote: 'Dönem şövalye donanımıyla özgün çizim. Kırmızı kılıç-haç tarikatı belirtir; giysi kesimi ve at koşumu yorumdur.',
  combat: { hp: 195, damage: 28, reach: 31, cooldown: 1.4, speed: 34, armor: .24, chargeDamage: 55 },
}];
export const IBERIAN_PROFILES = {
  santiago_knight: { head: 'nasal', armor: 'santiagoSurcoat', weapon: 'lance', shield: 'heater', cloth: '#e3dcc7', horse: 'bay', shieldColor: '#e3dcc7', emblem: 'santiago', badge: '#b33632' },
};
