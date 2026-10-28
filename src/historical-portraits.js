import catalogue from './historical-catalogue.js';

// Keep the drawn portrait until its local reference image has loaded.
export function attachHistoricalPortraits(root = document) {
  const byId = new Map(catalogue.map(unit => [unit.id, unit]));
  for (const canvas of root.querySelectorAll('canvas[data-portrait]')) {
    const unit = byId.get(canvas.dataset.portrait);
    if (!unit?.image) continue;
    const image = document.createElement('img');
    image.className = 'unit-portrait reference-portrait';
    image.dataset.referencePortrait = unit.id;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.title = [unit.name, unit.visualNote, unit.credit, unit.license].filter(Boolean).join(' · ');
    image.decoding = 'async';
    image.onload = () => { if (canvas.isConnected) canvas.replaceWith(image); };
    image.src = unit.image;
  }
}
