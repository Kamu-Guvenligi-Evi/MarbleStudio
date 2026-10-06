import { MODULES, COURSE_META } from './courses.js';
import { Race } from './physics.js';
import { normalizeSection } from './section-settings.js';

// A small vector drawing of the actual collision geometry, no external images.
function thumbnail(type, sourceRace = null, index = 0) {
  const race = sourceRace ?? new Race({ sequence: [type], count: 6 });
  const y = race.sections[index].y;
  const color = MODULES[type].color;
  const shapes = race.obstacles.filter(b => b.plugin.section === index).map(b => {
    const fill = ['rail','divider'].includes(b.plugin.kind) ? '#506b8b' : color;
    if (b.circleRadius) return `<circle cx="${b.position.x}" cy="${b.position.y}" r="${b.circleRadius}" fill="${fill}" stroke="${color}" stroke-width="3"/><circle cx="${b.position.x}" cy="${b.position.y}" r="${b.circleRadius*.5}" fill="#18243d"/>`;
    return `<polygon points="${b.vertices.map(v => `${v.x},${v.y}`).join(' ')}" fill="${fill}" stroke="${color}" stroke-width="3"/>`;
  }).join('');
  if(!sourceRace)race.dispose();
  return `<svg viewBox="0 ${y+40} 540 600" aria-hidden="true" focusable="false"><path d="M24 ${y+40}V${y+640}M516 ${y+40}V${y+640}" stroke="#59dfff" stroke-width="5"/>${shapes}<circle cx="232" cy="${y+65}" r="18" fill="#d6ed91"/><circle cx="227" cy="${y+59}" r="5" fill="#fff"/><circle cx="290" cy="${y+57}" r="18" fill="#f4aa95"/><circle cx="285" cy="${y+51}" r="5" fill="#fff"/></svg>`;
}

export function createEditor({ getRace, onChange, onInspect, onOpenLibrary, onCloseLibrary, notify }) {
  const $ = s => document.querySelector(s);
  const previews = Object.fromEntries(Object.keys(MODULES).map(type => [type, thumbnail(type)]));
  const history = [];
  const templateCache = new Map();
  function templateFor(preset) {
    const seed = getRace().seed, key = `${preset}:${seed}`;
    if (!templateCache.has(key)) {
      const template = new Race({ preset, seed, sections: 4 });
      const types = template.sections.map(s => s.type); template.dispose();
      if (templateCache.size > 12) templateCache.clear();
      templateCache.set(key, types);
    }
    return [...templateCache.get(key)];
  }
  const courseDescriptions = {
    cascade: 'Dar geçitler ve dönen engeller.', pinball: 'Bol çarpışmalı, sürprizli bir yarış.',
    velocity: 'Akıcı rampalar ve hızlı geçişler.', clockwork: 'Açılan kapılar, hareketli parçalar.',
  };
  $('#library-pieces').innerHTML = Object.entries(MODULES).map(([type, m]) => `
    <button class="library-card" data-piece="${type}" aria-label="${m.name} ekle">
      <span class="card-image">${previews[type]}</span><span class="card-copy"><b>${m.name}</b><small>${m.subtitle}</small>${m.tag ? `<span class="piece-tag">${m.tag}</span>` : ''}<span class="card-add">Parkura ekle <span aria-hidden="true">＋</span></span></span>
    </button>`).join('');
  $('#library-courses').innerHTML = Object.entries(COURSE_META).map(([key, meta]) => `
    <button class="library-card" data-course="${key}" aria-label="${meta.name} parkurunu ekle">
      <span class="card-image">${meta.modules.slice(0,4).map(t => previews[t]).join('')}</span><span class="card-copy"><b>${meta.name}</b><small>${courseDescriptions[key]}</small><span class="card-add">4 bölüm ekle <span aria-hidden="true">＋</span></span></span>
    </button>`).join('');

  function current() { return structuredClone(getRace().sequence); }
  function edit(sequence, message) {
    if (sequence.length > 24) { notify('Parkur dolu. Yeni bir parça eklemek için bir bölüm sil.'); return false; }
    history.push(current()); if (history.length > 40) history.shift();
    onChange(sequence);
    if (message) notify(message);
    return true;
  }
  function add(types) {
    if (edit([...current(), ...types], types.length === 1 ? `${MODULES[types[0]].name} eklendi.` : '4 bölüm parkurunun sonuna eklendi.')) {
      onCloseLibrary();
      requestAnimationFrame(() => $('#open-library').scrollIntoView({block:'nearest'}));
    }
  }
  $('#open-library').onclick = onOpenLibrary;
  $('#library-pieces').onclick = e => {
    const button = e.target.closest('[data-piece]');
    if (button) add([button.dataset.piece]);
  };
  $('#library-courses').onclick = e => {
    const button = e.target.closest('[data-course]'); if (!button) return;
    add(templateFor(button.dataset.course));
  };
  $('#clear-course').onclick = () => edit([], 'Parkur temizlendi. Geri al ile geri getirebilirsin.');
  $('#undo-edit').onclick = () => {
    if (!history.length) return;
    onChange(history.pop()); notify('Son değişiklik geri alındı.');
  };
  $('#editor-list').onclick = e => {
    const inspect = e.target.closest('[data-inspect]');
    if(inspect){onInspect(Number(inspect.dataset.inspect));return;}
    const button = e.target.closest('button[data-action]'); if (!button) return;
    const index = Number(button.dataset.index), sequence = current(), action = button.dataset.action;
    let focusIndex = index;
    if (action === 'remove') sequence.splice(index, 1);
    else {
      const next = index + (action === 'up' ? -1 : 1);
      if (next < 0 || next >= sequence.length) return;
      [sequence[index],sequence[next]] = [sequence[next],sequence[index]]; focusIndex = next;
    }
    edit(sequence, action === 'remove' ? 'Bölüm silindi. Geri al ile geri getirebilirsin.' : 'Bölüm sırası değiştirildi.');
    const target = document.querySelector(`[data-action="${action}"][data-index="${Math.min(focusIndex, sequence.length - 1)}"]`);
    if (target && !target.disabled) target.focus({preventScroll:true});
    else $('#open-library').focus({preventScroll:true});
  };

  function selectTab(name, focus = false) {
    for (const key of ['pieces','courses']) {
      const selected = name === key;
      $(`#tab-${key}`).setAttribute('aria-selected', String(selected));
      $(`#tab-${key}`).tabIndex = selected ? 0 : -1;
      $(`#library-${key}`).hidden = !selected;
    }
    if (focus) $(`#tab-${name}`).focus();
  }
  for (const key of ['pieces','courses']) {
    $(`#tab-${key}`).onclick = () => selectTab(key);
    $(`#tab-${key}`).onkeydown = e => {
      if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) {
        e.preventDefault(); selectTab(e.key === 'Home' ? 'pieces' : e.key === 'End' ? 'courses' : key === 'pieces' ? 'courses' : 'pieces', true);
      }
    };
  }
  return {
    applySettings(index,config) {
      const sequence=current();sequence[index]=normalizeSection(config);edit(sequence,'Bölüm ayarları uygulandı.');
    },
    clearHistory(){history.length=0;},
    render() {
      const race = getRace();
      $('#editor-count').textContent = `${race.sectionCount} bölüm`;
      $('#editor-list').innerHTML = race.sections.length ? race.sections.map((s,index) => `
        <li class="course-row"><span class="piece-order">${String(index+1).padStart(2,'0')}</span><button class="piece-preview" data-inspect="${index}" aria-label="${index+1}. bölümü incele">${thumbnail(s.type,race,index)}</button>
          <button class="piece-copy inspect-piece" data-inspect="${index}"><b>${s.name}</b><small>${s.subtitle}</small><span>İncele ve dene ↗</span></button>
          <div class="piece-actions"><button data-action="up" data-index="${index}" aria-label="${index+1}. bölümü yukarı taşı" title="Yukarı taşı" ${index === 0 ? 'disabled' : ''}>↑</button><button data-action="down" data-index="${index}" aria-label="${index+1}. bölümü aşağı taşı" title="Aşağı taşı" ${index === race.sectionCount-1 ? 'disabled' : ''}>↓</button><button data-action="remove" data-index="${index}" aria-label="${index+1}. bölümü sil">Sil</button></div>
        </li>`).join('') : '<li class="empty-course"><b>İlk parçanı seçerek başla.</b>Aşağıdaki “Bölüm ekle” düğmesinden hazır bir parça seç.</li>';
      $('#undo-edit').disabled = !history.length;
      $('#clear-course').disabled = race.sectionCount === 0;
      $('#open-library').disabled = race.sectionCount >= 24;
      $('#start').disabled = race.sectionCount === 0;
      $('#record').disabled = race.sectionCount === 0;
      $('#course-summary').textContent = race.sectionCount ? `${race.sectionCount} bölüm · ${race.balls.length} top` : 'Parkurun henüz boş.';
      $('#build-help').textContent = race.sectionCount ? 'Hazırsan topları piste çıkaralım.' : 'Yarışmak için en az bir bölüm ekle.';
      for (const b of document.querySelectorAll('[data-course]')) {
        b.disabled = race.sectionCount > 20;
        b.querySelector('.card-image').innerHTML = templateFor(b.dataset.course).map(type => previews[type]).join('');
      }
    },
  };
}
