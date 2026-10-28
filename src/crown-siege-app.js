import { SiegeBattle, ATTACKERS, DEFENDERS } from './crown-siege.js';
import { BattleRenderer } from './crown-battle-renderer.js';
import { drawSiege } from './crown-siege-art.js';

const $ = id => document.getElementById(id);
const canvas = $('battle'), viewport = $('viewport');
class SiegeRenderer extends BattleRenderer {
  drawBattlefield(ctx, battle) { drawSiege(ctx, battle); }
  desktopHUD() {} // Siege status is accessible HTML outside the map.
  resetView() { this.view = { x: 80, y: 480, zoom: .38 }; this.invalidate(); }
}
export const runtime = { battle: new SiegeBattle(), running: false, speed: 1, moveMode: false };
runtime.renderer = new SiegeRenderer(canvas, runtime.battle);
const renderer = runtime.renderer;
renderer.resetView();
renderer.enableLayers();
function resize() {
  renderer.resize(viewport.clientWidth, viewport.clientHeight, true, Math.min(devicePixelRatio, 1.5));
  // Keep the original soldier artwork and proportions at fortress scale.
  renderer.renderIfNeeded({ running: runtime.running });
}
new ResizeObserver(resize).observe(viewport);
function notice(text) { $('notice').textContent = text; }
let logKey = '';
function syncTactics(b) {
  const r = b.ram, d = b.defense, finished = b.winner !== null;
  $('attack-tactics').hidden = b.activeTeam !== ATTACKERS;
  $('defense-tactics').hidden = b.activeTeam !== DEFENDERS;
  for (const button of document.querySelectorAll('[data-plan]')) {
    button.setAttribute('aria-pressed', String(button.dataset.plan === b.plan)); button.disabled = finished;
  }
  $('shields').disabled = finished;
  $('shields').setAttribute('aria-pressed', String(b.shields));
  $('shields').textContent = `Kalkanlı ilerleyiş · ${b.shields ? 'Açık' : 'Kapalı'}`;
  $('plan-hint').textContent = {
    balanced: '12 koçbaşı mürettebatı, her kanatta 8 merdiven askeri. Kalan piyadeler kapıya yürür.',
    gate: '12 koçbaşı mürettebatı, her kanatta 4 merdiven askeri. Piyade ağırlığı kapıda.',
    walls: '6 koçbaşı mürettebatı, her kanatta 14 merdiven askeri. İki sur koluna ağırlık verilir.',
  }[b.plan];
  $('ram-state').textContent = r.hp <= 0 ? 'Koçbaşı yandı' : b.gate.hp <= 0 ? 'Kapı aşıldı' : r.crew < 4 ? 'Mürettebat bekliyor' : r.x > 158 ? 'Kapıya ilerliyor' : 'Kapıyı dövüyor';
  $('ram-detail').textContent = `${r.crew} mürettebat · ${r.hits} darbe · %${Math.ceil(r.hp / r.maxHp * 100)} dayanıklılık`;
  $('ram-hp').value = r.hp;
  for (const [i, name] of ['north', 'south'].entries()) {
    const l = b.ladders[i];
    $(name + '-state').textContent = l.hp <= 0 ? `Yeniden kurulum · ${Math.ceil(l.down)} sn` : l.climber ? 'Asker sura tırmanıyor' : l.build >= l.required ? 'Merdiven hazır' : l.build ? 'Merdiven kuruluyor' : 'Sura yaklaşma';
    $(name + '-detail').textContent = `${l.crossed} asker sura çıktı · %${Math.ceil(l.hp / l.maxHp * 100)} dayanıklılık`;
    $(name + '-build').value = l.build; $(name + '-build').max = l.required;
  }
  $('supplies').textContent = `${Math.floor(d.supplies)} / 100`; $('supply-bar').value = d.supplies;
  for (const button of document.querySelectorAll('[data-tactic]')) {
    const kind = button.dataset.tactic, cooldown = Math.ceil(d[kind + 'Cooldown']);
    button.disabled = !b.tacticAvailable(kind);
    button.querySelector('small').textContent = cooldown ? `${cooldown} sn bekle` : `${{ oil:35, repair:40, volley:25 }[kind]} ikmal`;
  }
  const key = JSON.stringify(b.events);
  if (key !== logKey) {
    logKey = key; $('dispatch').textContent = b.events[0]?.message || 'Ordular emir bekliyor.';
    $('battle-log').replaceChildren(...b.events.map(event => {
      const li = document.createElement('li');
      li.textContent = `${Math.floor(event.time / 60)}:${String(Math.floor(event.time % 60)).padStart(2, '0')} — ${event.message}`; return li;
    }));
  }
}
function sync() {
  const b = runtime.battle, c = b.capture, counts = b.counts();
  syncTactics(b);
  $('play').textContent = runtime.running ? 'Duraklat' : b.time ? 'Devam et' : 'Kuşatmayı başlat';
  $('play').disabled = b.winner !== null;
  $('gate').value = b.gate.hp; $('gate-label').textContent = b.gate.hp ? `${Math.ceil(b.gate.hp)} / ${b.gate.maxHp}` : 'Kapı yıkıldı';
  $('capture').value = c.progress; $('capture-label').textContent = `${Math.floor(c.progress)} / 30 sn`;
  $('attackers').textContent = counts[ATTACKERS]; $('defenders').textContent = counts[DEFENDERS];
  const remaining = Math.max(0, Math.ceil(b.timeLimit - b.time));
  $('clock').textContent = `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
  $('phase').textContent = b.winner !== null ? 'Kuşatma sona erdi' : !b.time ? 'Konuşlanma' : !runtime.running ? 'Duraklatıldı' : b.phase === 'approach' ? 'I · Kaleye yaklaşma' : b.phase === 'gate' ? 'II · Kapı saldırısı' : 'III · Avlu mücadelesi';
  const objective = b.winner !== null ? b.resultReason : b.phase !== 'courtyard' ? (b.activeTeam === DEFENDERS ? 'Doğu kapısını koru. İki merdiven kolunu durdur; avluya geçit verme.' : 'Koçbaşıyla kapıyı yık veya merdivenlerle suru aş. Avlu sancağını tut.') : c.contested ? 'Avlu çekişmeli. Ele geçirme sayacı durdu.' : c.attackers ? 'Saldıranlar sancağı ele geçiriyor!' : 'Surlar aşıldı. Avlu sancağı için mücadele başlıyor.';
  if ($('objective').textContent !== objective) $('objective').textContent = objective;
  $('selection').textContent = b.selected.size ? `${b.selected.size} asker seçili` : 'Birlik seçilmedi';
  $('move').setAttribute('aria-pressed', String(runtime.moveMode));
  $('result').hidden = b.winner === null;
  if (b.winner !== null) { $('result-title').textContent = b.winner === DEFENDERS ? 'Kale dayandı.' : 'Kale ele geçirildi.'; $('result-reason').textContent = b.resultReason; }
  for (const id of ['move','hold','auto']) $(id).disabled = b.winner !== null;
}
function reset() {
  runtime.running = false; runtime.moveMode = false;
  runtime.battle = new SiegeBattle({ activeTeam: Number($('side').value) });
  $('defense-target').value = runtime.battle.defense.target;
  renderer.reset(runtime.battle); renderer.resetView();
  notice('Ordular yeniden kuruldu. Kuşatma hazır.'); sync();
}
$('restart').onclick = reset; $('again').onclick = reset;
$('play').onclick = () => { if (runtime.battle.winner === null) { runtime.running = !runtime.running; sync(); } };
$('speed').onchange = () => { runtime.speed = Number($('speed').value); };
$('side').onchange = () => {
  runtime.battle.activeTeam = Number($('side').value); runtime.battle.selected.clear(); runtime.moveMode = false;
  renderer.invalidate(); sync(); notice(runtime.battle.activeTeam === DEFENDERS ? 'Soldaki mavi savunmayı yönetiyorsun. Sur okçuları doğu cephesini korur.' : 'Sağdaki kızıl orduyu yönetiyorsun. Piyadeler batıya, kale kapısına ilerler.');
};
for (const button of document.querySelectorAll('[data-plan]')) button.onclick = () => {
  if (runtime.battle.setPlan(button.dataset.plan)) { sync(); notice('Hücum görevleri değişti. El emri verilen birlikler emirlerini sürdürür.'); }
};
$('shields').onclick = () => {
  const b = runtime.battle; if (b.activeTeam !== ATTACKERS || b.winner !== null) return;
  b.shields = !b.shields; sync(); notice(b.shields ? 'Kalkanlar yukarıda. Ok hasarı azalır; piyade daha yavaş ilerler.' : 'Hızlı yürüyüş. Piyadeler oklara daha açık.');
};
$('defense-target').onchange = () => { runtime.battle.defense.target = $('defense-target').value; };
for (const button of document.querySelectorAll('[data-tactic]')) button.onclick = () => {
  if (runtime.battle.useTactic(button.dataset.tactic)) { renderer.invalidate(); sync(); notice(runtime.battle.events[0].message); }
};
for (const button of document.querySelectorAll('[data-front]')) button.onclick = () => {
  const b = runtime.battle, front = button.dataset.front;
  renderer.view = { x: front === 'ram' ? b.ram.x - 90 : 60, y: front === 'north' ? 240 : front === 'south' ? 780 : 480, zoom: .85 };
  renderer.clampView(); renderer.invalidate();
};
for (const button of document.querySelectorAll('[data-select]')) button.onclick = () => {
  const b = runtime.battle, kind = button.dataset.select;
  b.selected = new Set(b.units.filter(u => u.team === b.activeTeam && u.hp > 0 && !u.wall && (kind === 'all' || (kind === 'archer' ? u.type === 'archer' : u.type !== 'archer'))).map(u => u.id));
  runtime.moveMode = false; renderer.invalidate(); sync();
  if (!b.selected.size) notice('Bu tarafta hareket ettirilebilecek saha okçusu yok. Sur okçuları sabit mevzide.');
};
$('move').onclick = () => {
  if (!runtime.battle.selected.size) { notice('Önce komuta ettiğin taraftan bir birlik seç.'); return; }
  runtime.moveMode = !runtime.moveMode; sync(); notice(runtime.moveMode ? 'Haritada intikal noktasını tıkla veya dokun.' : 'İntikal seçimi iptal edildi.');
};
$('hold').onclick = () => { runtime.battle.stopSelected(); runtime.moveMode = false; renderer.invalidate(); sync(); notice('Seçili birlikler mevzilerini koruyor.'); };
$('auto').onclick = () => { runtime.battle.engageSelected(); runtime.moveMode = false; renderer.invalidate(); sync(); notice('Seçili birlikler kuşatma görevlerine döndü.'); };
$('zoom-in').onclick = () => renderer.zoomAt(1.25);
$('zoom-out').onclick = () => renderer.zoomAt(.8);
$('focus').onclick = () => renderer.resetView();
$('fit').onclick = () => renderer.fitMap();
function normalized(e) { const r = canvas.getBoundingClientRect(); return { x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height }; }
function world(e) { const p = normalized(e); return renderer.screenToWorld(p.x,p.y); }
function order(e) {
  const p = world(e), count = runtime.battle.commandMove(p.x,p.y);
  runtime.moveMode = false; renderer.invalidate(); sync();
  notice(count ? `${count} askere intikal emri verildi. Kapı ve surlar geçişi engeller.` : 'Emir vermek için önce saha birliği seç.');
}
canvas.addEventListener('contextmenu', e => { e.preventDefault(); order(e); });
canvas.addEventListener('wheel', e => { e.preventDefault(); const p=normalized(e);renderer.zoomAt(Math.exp(-e.deltaY*.001),p.x,p.y); },{passive:false});
let drag = null;
canvas.addEventListener('pointerdown', e => {
  if(e.button!==0)return;
  canvas.setPointerCapture(e.pointerId);
  drag = { x:e.clientX,y:e.clientY,view:{...renderer.view},moved:false,id:e.pointerId };
});
canvas.addEventListener('pointermove', e => {
  if(!drag || e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.hypot(dx,dy)>6)drag.moved=true;
  if(drag.moved){renderer.view.x=drag.view.x-dx/viewport.clientWidth*600/renderer.view.zoom;renderer.view.y=drag.view.y-dy/viewport.clientHeight*960/renderer.view.zoom;renderer.clampView();renderer.invalidate();}
});
canvas.addEventListener('pointerup', e => {
  if(!drag || e.pointerId!==drag.id)return;
  const moved=drag.moved;drag=null;
  if(moved)return;
  if(runtime.moveMode){order(e);return;}
  const p=world(e),b=runtime.battle;
  const unit=b.units.filter(u=>u.hp>0&&u.team===b.activeTeam).sort((a,z)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(z.x-p.x,z.y-p.y))[0];
  if(!e.shiftKey)b.selected.clear();
  if(unit&&Math.hypot(unit.x-p.x,unit.y-p.y)<20/renderer.view.zoom){
    if(unit.wall)notice('Surdaki birlikler mevzilerinde otomatik savaşır; merdiven birlikleri geçişi açınca avluya iner.');
    else b.selected.has(unit.id)?b.selected.delete(unit.id):b.selected.add(unit.id);
  }
  renderer.invalidate();sync();
});
canvas.addEventListener('pointercancel',()=>{drag=null;});
window.addEventListener('keydown',e=>{
  if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName))return;
  if(e.code==='Space'){e.preventDefault();$('play').click();}
  if(e.code==='Escape'){runtime.moveMode=false;runtime.battle.selected.clear();renderer.invalidate();sync();}
});
let previous = performance.now(), accumulated = 0, uiElapsed = 0;
function frame(now) {
  const elapsed=Math.min(.1,(now-previous)/1000);previous=now;
  if(runtime.running){
    accumulated+=elapsed*runtime.speed;
    while(accumulated>=1/30){runtime.battle.step(1/30);accumulated-=1/30;}
    if(runtime.battle.winner!==null){runtime.running=false;sync();}
  }else accumulated=0;
  uiElapsed+=elapsed;if(uiElapsed>.2){sync();uiElapsed=0;}
  renderer.renderIfNeeded({running:runtime.running});requestAnimationFrame(frame);
}
sync();requestAnimationFrame(frame);
