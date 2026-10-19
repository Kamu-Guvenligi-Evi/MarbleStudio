import './crown-battle-camera.css';
import { BattleDirector } from './crown-battle-director.js';

export function mountBattleCamera(canvas, renderer, getBattle, cancelSelection = () => {}) {
  const bar = document.createElement('div'); bar.className = 'battle-camera'; bar.setAttribute('aria-label', 'Meydan görünümü');
  bar.innerHTML = '<button type="button" id="zoom-out" aria-label="Uzaklaştır">−</button><button type="button" id="zoom-reset" title="Başlangıç görünümüne dön">%100</button><button type="button" id="zoom-in" aria-label="Yakınlaştır">+</button><button type="button" id="pan-view" aria-pressed="false" title="Aç ve sürükle. Orta fare tuşu veya Alt+sürükle de kullanılabilir.">Gezin</button><button type="button" id="fit-map" title="Haritanın tamamını göster">Harita</button><span class="camera-help">Ok tuşları: gezin · Tekerlek: yakınlaştır</span>';
  canvas.after(bar);
  const director = new BattleDirector(renderer, getBattle);
  const followButton = document.createElement('button');
  followButton.id = 'follow-battle'; followButton.type = 'button'; followButton.textContent = 'Takip';
  followButton.title = 'Çatışmayı yumuşakça takip et. Elle gezinmek takibi kapatır.';
  followButton.setAttribute('aria-pressed', 'false');
  bar.querySelector('.camera-help').before(followButton);
  const help = bar.querySelector('.camera-help'), defaultHelp = help.textContent;
  function follow(enabled) { director.setEnabled(enabled); update(); }
  followButton.onclick = () => {
    clear(); cancelSelection(); panButton.setAttribute('aria-pressed', 'false'); follow(!director.enabled);
  };
  let panning = null, touchGesture = false, pinch = null, followUIElapsed = 0;
  const touches = new Map(), keys = new Set();
  const panButton = bar.querySelector('#pan-view');
  function update() {
    bar.querySelector('#zoom-reset').textContent = `%${Math.round(renderer.view.zoom * 100)}`;
    bar.querySelector('#zoom-out').disabled = renderer.view.zoom <= renderer.minZoom;
    bar.querySelector('#zoom-in').disabled = renderer.view.zoom >= 3;
    canvas.classList.toggle('panning', panButton.getAttribute('aria-pressed') === 'true');
    followButton.setAttribute('aria-pressed', String(director.enabled));
    const note = director.enabled ? `Takip · ${director.phase} · Elle gezinerek çık` : defaultHelp;
    if (help.textContent !== note) help.textContent = note;
  }
  function zoom(factor) {
    follow(false);
    if (factor > 1 && renderer.view.zoom === 1) {
      const battle = getBattle(), units = battle.units.filter(u => battle.selected.has(u.id) && u.hp > 0);
      renderer.zoomAt(factor);
      if (units.length) { renderer.view.x = units.reduce((sum, u) => sum + u.x, 0) / units.length; renderer.view.y = units.reduce((sum, u) => sum + u.y, 0) / units.length; renderer.clampView(); }
    } else renderer.zoomAt(factor);
    update();
  }
  bar.querySelector('#zoom-in').onclick = () => zoom(1.4);
  bar.querySelector('#zoom-out').onclick = () => zoom(1 / 1.4);
  bar.querySelector('#zoom-reset').onclick = () => { follow(false); renderer.resetView(); panButton.setAttribute('aria-pressed', 'false'); update(); };
  bar.querySelector('#fit-map').onclick = () => { follow(false); renderer.fitMap(); update(); };
  panButton.onclick = () => { follow(false); panButton.setAttribute('aria-pressed', String(panButton.getAttribute('aria-pressed') !== 'true')); update(); };
  canvas.addEventListener('wheel', event => {
    // Browser Ctrl+wheel zoom remains available for accessibility.
    if (event.ctrlKey || event.metaKey) return;
    follow(false);
    event.preventDefault(); const rect = canvas.getBoundingClientRect();
    renderer.zoomAt(Math.exp(-Math.max(-120, Math.min(120, event.deltaY)) * .002), (event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height); update();
  }, { passive: false });
  // Capture before command/selection listeners so camera gestures cannot issue orders.
  canvas.addEventListener('pointerdown', event => {
    // Selection and orders need a stationary world under the pointer, too.
    if (director.enabled) follow(false);
    if (event.pointerType === 'touch') {
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.size >= 2) {
        event.preventDefault(); event.stopImmediatePropagation();
        touchGesture = true; panning = null; pinch = touchPoints(); cancelSelection();
        for (const id of touches.keys()) canvas.setPointerCapture(id);
        return;
      }
    }
    if (event.button !== 1 && !(event.button === 0 && (event.altKey || panButton.getAttribute('aria-pressed') === 'true'))) return;
    event.preventDefault(); event.stopImmediatePropagation();
    cancelSelection(); canvas.focus({ preventScroll: true });
    panning = { x: event.clientX, y: event.clientY, id: event.pointerId }; canvas.setPointerCapture(event.pointerId);
  }, true);
  canvas.addEventListener('pointermove', event => {
    if (touches.has(event.pointerId)) touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touchGesture && touches.has(event.pointerId)) {
      event.preventDefault(); event.stopImmediatePropagation();
      const next = touchPoints(), rect = canvas.getBoundingClientRect();
      if (pinch && next) {
        if (pinch.count === 2 && next.count === 2) renderer.zoomAt(next.distance / Math.max(1, pinch.distance), (pinch.x - rect.left) / rect.width, (pinch.y - rect.top) / rect.height);
        renderer.pan((next.x - pinch.x) / rect.width, (next.y - pinch.y) / rect.height);
      }
      pinch = next; update(); return;
    }
    if (!panning || event.pointerId !== panning.id) return;
    event.stopImmediatePropagation(); const rect = canvas.getBoundingClientRect();
    renderer.pan((event.clientX - panning.x) / rect.width, (event.clientY - panning.y) / rect.height);
    panning.x = event.clientX; panning.y = event.clientY;
  }, true);
  function touchPoints() {
    const points = [...touches.values()]; if (!points.length) return null;
    if (points.length === 1) return { ...points[0], count: 1 };
    const [a,b] = points; return { x: (a.x+b.x)/2, y: (a.y+b.y)/2, distance: Math.hypot(a.x-b.x,a.y-b.y), count: 2 };
  }
  const end = event => {
    if (touches.delete(event.pointerId) && touchGesture) {
      event.stopImmediatePropagation(); pinch = touchPoints();
      if (!touches.size) touchGesture = false;
    }
    if (panning && event.pointerId === panning.id) { event.stopImmediatePropagation(); panning = null; }
  };
  canvas.addEventListener('pointerup', end, true); canvas.addEventListener('pointercancel', end, true);
  canvas.addEventListener('lostpointercapture', end, true);
  const clear = () => { panning = null; touchGesture = false; pinch = null; touches.clear(); keys.clear(); };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { clear(); follow(false); panButton.setAttribute('aria-pressed', 'false'); update(); }
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code) || event.ctrlKey || event.altKey || event.metaKey || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName) || event.target.isContentEditable) return;
    event.preventDefault(); follow(false); keys.add(event.code);
  });
  document.addEventListener('keyup', event => keys.delete(event.code));
  document.addEventListener('focusin', event => { if (/INPUT|SELECT|TEXTAREA/.test(event.target.tagName) || event.target.isContentEditable) keys.clear(); });
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  update();
  return {
    update,
    tick(dt, running = false) {
      director.tick(dt, running);
      if (director.enabled && (followUIElapsed += dt) >= .2) { followUIElapsed = 0; update(); }
      if (!keys.size) return;
      const x = Number(keys.has('ArrowLeft')) - Number(keys.has('ArrowRight'));
      const y = Number(keys.has('ArrowUp')) - Number(keys.has('ArrowDown'));
      const speed = Math.min(.05, dt) * .65 / (Math.hypot(x,y) || 1);
      renderer.pan(x * speed, y * speed);
    },
  };
}
