/* Son Çağrı v2 — kayıt yuvaları, kayıt noktaları ve açılış ekranı.
   app.js'ten önce yüklenir; app.js kayıt anahtarını Kayit.key() ile alır. */
(function () {
  'use strict';
  const META = 'son-cagri-slots', LEGACY = 'son-cagri-save-v1', MAX_SLOTS = 4, MAX_CP = 3;
  const slotKey = id => 'son-cagri-slot-' + id, cpKey = id => 'son-cagri-cp-' + id;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch { } }
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { } },
    del(k) { try { sessionStorage.removeItem(k); } catch { } }
  };
  const DIFF_NAMES = { easy: 'Kolay', normal: 'Normal', hard: 'Zor' };

  function readMeta() { try { const m = JSON.parse(ls.get(META)); if (m && Array.isArray(m.list)) return m; } catch { } return null; }
  function writeMeta(m) { ls.set(META, JSON.stringify(m)); }
  let meta = readMeta();
  // Eski tek kayıtlık sürümden geçiş
  if (!meta) {
    meta = { active: null, list: [] };
    const old = ls.get(LEGACY);
    if (old) {
      let info = {};
      try { const s = JSON.parse(old); info = summary(s); } catch { }
      const id = 's' + Date.now().toString(36);
      if (ls.set(slotKey(id), old)) { meta.list.push(Object.assign({ id, name: info.guild || 'Birliğim', created: Date.now() }, info)); meta.active = id; ls.del(LEGACY); }
    }
    writeMeta(meta);
  }
  if (meta.active && !meta.list.some(x => x.id === meta.active)) meta.active = meta.list[0]?.id || null;
  if (!meta.active) {   // hiç kayıt yoksa: yeni oyun için boş bir yuva aç (açılış ekranında seçilecek)
    const id = 's' + Date.now().toString(36);
    meta.list.push({ id, name: 'Yeni birlik', created: Date.now(), fresh: true, auto: true, difficulty: 'normal' });
    meta.active = id; writeMeta(meta);
  }

  function summary(s) {
    return { guild: s.guild?.name, base: s.guild?.base, day: s.day, floor: s.floor, heroes: s.heroes?.length || 0, difficulty: s.difficulty || 'normal',
      power: 0, updated: Date.now(), color: s.guild?.color || '#d5b376', fresh: false };
  }
  const active = () => meta.list.find(x => x.id === meta.active);

  /* ---------- app.js'e açık arayüz ---------- */
  const api = {
    key() { return slotKey(meta.active); },
    pending() { try { const p = JSON.parse(ss.get('son-cagri-pending')); ss.del('son-cagri-pending'); return p || {}; } catch { return {}; } },
    touch(s) {   // app.js her kayıtta çağırır
      const slot = active(); if (!slot) return;
      Object.assign(slot, summary(s)); slot.name = s.guild?.name || slot.name; writeMeta(meta);
      // Günde bir otomatik kayıt noktası
      const cps = readCps(slot.id);
      if (!cps.length || cps[0].day !== s.day) addCp(slot.id, s, 'Gün ' + s.day + ' başlangıcı', true);
    },
    checkpoint(s, label) { const slot = active(); if (slot) return addCp(slot.id, s, label || 'Elle alınan kayıt noktası', false); return false; },
    open: () => openManager(),
    openNew: () => openNew(),
    title: () => showTitle(true)
  };
  window.Kayit = api;

  function readCps(id) { try { const a = JSON.parse(ls.get(cpKey(id))); return Array.isArray(a) ? a : []; } catch { return []; } }
  function addCp(id, s, label, auto) {
    let cps = readCps(id);
    cps.unshift({ at: Date.now(), day: s.day, floor: s.floor, label, auto, data: JSON.stringify(s) });
    // otomatik noktalar en fazla MAX_CP; elle alınan son nokta korunur
    const manual = cps.filter(c => !c.auto).slice(0, 2), autos = cps.filter(c => c.auto).slice(0, MAX_CP);
    cps = [...autos, ...manual].sort((a, b) => b.at - a.at);
    while (cps.length && !ls.set(cpKey(id), JSON.stringify(cps))) cps.pop();   // yer kalmazsa en eskiyi at
    if (!cps.length) ls.del(cpKey(id));
    return true;
  }
  function reloadInto(id, skipTitle = true) { window.__scNoSave = true; meta.active = id; writeMeta(meta); if (skipTitle) ss.set('son-cagri-skip-title', '1'); location.reload(); }

  /* ---------- Arayüz ---------- */
  function overlay(html, cls = '') {
    close();
    const el = document.createElement('div'); el.className = 'kayit-layer ' + cls; el.id = 'kayit-layer'; el.innerHTML = html;
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
    el.addEventListener('click', onClick);
    return el;
  }
  function close() { document.getElementById('kayit-layer')?.remove(); }
  function slotCard(x, current) {
    const fresh = x.fresh || !x.day;
    return '<div class="slot-card' + (current ? ' current' : '') + '" style="--slot:' + esc(x.color || '#d5b376') + '"><div class="slot-crest">✦</div><div class="slot-info"><strong>' + esc(fresh ? 'Boş yuva' : x.name) + '</strong>' +
      (fresh ? '<small>Henüz başlanmadı</small>' : '<small>' + esc(x.base || '') + ' · Gün ' + x.day + ' · ' + x.floor + '. kat · ' + x.heroes + ' kahraman</small><span class="diff-tag ' + esc(x.difficulty) + '">' + (DIFF_NAMES[x.difficulty] || 'Normal') + '</span>') +
      (x.updated ? '<small class="when">Son oynama: ' + new Date(x.updated).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</small>' : '') + '</div>' +
      '<div class="slot-actions">' + (current ? '<span class="here">OYNANIYOR</span>' : (fresh ? '' : '<button class="k-btn gold" data-k="load" data-id="' + x.id + '">Yükle</button>')) +
      (!fresh ? '<button class="k-btn" data-k="cps" data-id="' + x.id + '">Kayıt noktaları</button>' : '') +
      '<button class="k-btn danger" data-k="del" data-id="' + x.id + '">Sil</button></div></div>';
  }
  function openManager() {
    const list = meta.list.map(x => slotCard(x, x.id === meta.active)).join('');
    overlay('<div class="k-panel"><div class="k-head"><div><span class="k-eyebrow">KAYIT DEFTERİ</span><h2>Kampanyaların</h2></div><button class="k-x" data-k="close" aria-label="Kapat">✕</button></div>' +
      '<p class="k-note">En fazla ' + MAX_SLOTS + ' kampanya saklayabilirsin. Her kampanya her gün otomatik bir kayıt noktası alır; istediğinde önceki bir güne geri dönebilirsin.</p>' +
      '<div class="slot-list">' + list + '</div><div class="k-foot"><button class="k-btn" data-k="cp-now">💾 Şimdi kayıt noktası al</button><button class="k-btn" data-k="import">⬆ Dosyadan kampanya yükle</button><button class="k-btn gold" data-k="new">＋ Yeni oyun</button></div></div>', 'manager');
  }
  function openCps(id) {
    const slot = meta.list.find(x => x.id === id), cps = readCps(id);
    overlay('<div class="k-panel"><div class="k-head"><div><span class="k-eyebrow">' + esc(slot?.name || '') + '</span><h2>Önceki kayda dön</h2></div><button class="k-x" data-k="close" aria-label="Kapat">✕</button></div>' +
      '<p class="k-note">Bir kayıt noktasını seçersen kampanya o ana döner. O noktadan sonraki ilerleme silinir.</p>' +
      (cps.length ? '<div class="slot-list">' + cps.map((c, i) => '<div class="slot-card"><div class="slot-crest">' + (c.auto ? '☀' : '💾') + '</div><div class="slot-info"><strong>' + esc(c.label) + '</strong><small>Gün ' + c.day + ' · ' + c.floor + '. kat · ' + new Date(c.at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</small></div><div class="slot-actions"><button class="k-btn gold" data-k="cp-load" data-id="' + id + '" data-i="' + i + '">Bu ana dön</button></div></div>').join('') + '</div>' : '<p class="k-note">Henüz kayıt noktası yok. Bir gün geçince otomatik oluşur.</p>') +
      '<div class="k-foot"><button class="k-btn" data-k="manager">← Kampanyalar</button></div></div>', 'manager');
  }
  function openNew() {
    const full = meta.list.filter(x => !x.fresh && !(x.auto && (x.day || 1) <= 1 && !x.floor)).length >= MAX_SLOTS;
    overlay('<div class="k-panel wide"><div class="k-head"><div><span class="k-eyebrow">YENİ BİR ÇAĞRI</span><h2>Yeni oyun</h2></div><button class="k-x" data-k="close" aria-label="Kapat">✕</button></div>' +
      (full ? '<p class="k-warn">' + MAX_SLOTS + ' kampanya yuvası dolu. Yeni oyun için önce bir kampanyayı sil.</p><div class="k-foot"><button class="k-btn" data-k="manager">Kampanyaları aç</button></div></div>' :
      '<div class="k-grid"><label class="k-field">Birlik adı<input id="k-guild" maxlength="40" value="Şafak Birliği"></label><label class="k-field">Yerleşim adı<input id="k-base" maxlength="40" value="Yıldız Sığınağı"></label></div>' +
      '<div class="k-label">Zorluk</div><div class="diff-grid">' + Object.entries(SC.DIFFICULTY).map(([k, d]) => '<button class="diff-card ' + k + (k === 'normal' ? ' on' : '') + '" data-k="diff" data-d="' + k + '"><span class="diff-ico">' + (k === 'easy' ? '🌿' : k === 'normal' ? '⚔️' : '🔥') + '</span><strong>' + d.name + '</strong><small>' + d.desc + '</small></button>').join('') + '</div>' +
      '<label class="k-check hidden" id="k-perm-row"><input type="checkbox" id="k-perm"> Kalıcı ölüm (Boss ve hazine savaşlarında düşen kahraman kaybedilebilir)</label>' +
      '<div class="k-foot"><button class="k-btn" data-k="close">Vazgeç</button><button class="k-btn gold big" data-k="start">✦ Çağrıyı başlat</button></div></div>'), 'manager');
  }
  let chosen = 'normal';
  function confirmBox(title, text, yes, fn) {
    const el = overlay('<div class="k-panel small"><h2>' + title + '</h2><p class="k-note">' + text + '</p><div class="k-foot"><button class="k-btn" data-k="manager">Vazgeç</button><button class="k-btn danger" data-k="yes">' + yes + '</button></div></div>', 'manager');
    el._yes = fn;
  }
  function onClick(ev) {
    const t = ev.target.closest('[data-k]'), layer = document.getElementById('kayit-layer');
    if (!t) { if (ev.target === layer && !layer.classList.contains('title')) close(); return; }
    const k = t.dataset.k, id = t.dataset.id;
    window.FX && FX.click && FX.click();
    if (k === 'close') close();
    else if (k === 'manager') openManager();
    else if (k === 'new') openNew();
    else if (k === 'continue') { layer.classList.add('out'); setTimeout(close, 650); }
    else if (k === 'load') reloadInto(id);
    else if (k === 'cps') openCps(id);
    else if (k === 'diff') { chosen = t.dataset.d; layer.querySelectorAll('.diff-card').forEach(c => c.classList.toggle('on', c === t)); layer.querySelector('#k-perm-row').classList.toggle('hidden', chosen !== 'hard'); }
    else if (k === 'start') {
      const guild = layer.querySelector('#k-guild').value.trim() || 'Şafak Birliği', base = layer.querySelector('#k-base').value.trim() || 'Yıldız Sığınağı';
      ss.set('son-cagri-pending', JSON.stringify({ difficulty: chosen, guild, base, permanent: !!layer.querySelector('#k-perm')?.checked }));
      const cur = active();
      let slot = meta.list.find(x => x.fresh) || (cur && cur.auto && (cur.day || 1) <= 1 && !cur.floor ? cur : null);
      if (slot) delete slot.auto;
      if (!slot) { slot = { id: 's' + Date.now().toString(36), created: Date.now() }; meta.list.push(slot); }
      Object.assign(slot, { name: guild, fresh: false, difficulty: chosen, day: 1, floor: 0, heroes: 8, base, updated: Date.now() });
      ls.del(slotKey(slot.id)); ls.del(cpKey(slot.id));
      ss.set('son-cagri-intro', '1');
      reloadInto(slot.id);
    }
    else if (k === 'del') {
      const slot = meta.list.find(x => x.id === id);
      confirmBox('Kampanya silinsin mi?', '“' + esc(slot?.name) + '” ve bütün kayıt noktaları kalıcı olarak silinecek. Bu işlem geri alınamaz. Saklamak istersen önce Ayarlar → Kaydı dışa aktar ile yedek al.', 'Kalıcı olarak sil', () => {
        ls.del(slotKey(id)); ls.del(cpKey(id)); meta.list = meta.list.filter(x => x.id !== id);
        if (meta.active === id) { const next = meta.list.find(x => !x.fresh) || meta.list[0]; if (next) reloadInto(next.id, false); else { window.__scNoSave = true; meta.active = null; writeMeta(meta); ss.del('son-cagri-skip-title'); location.reload(); } }
        else { writeMeta(meta); openManager(); }
      });
    }
    else if (k === 'yes') { const fn = layer._yes; fn && fn(); }
    else if (k === 'cp-now') { if (window.__scState) { api.checkpoint(window.__scState(), 'Elle alınan kayıt noktası · ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })); openCps(meta.active); } }
    else if (k === 'cp-load') {
      const cps = readCps(id), c = cps[Number(t.dataset.i)];
      confirmBox('Bu ana dönülsün mü?', 'Kampanya “' + esc(c.label) + '” (Gün ' + c.day + ') anına dönecek. Sonraki ilerleme silinir.', 'Geri dön', () => { if (ls.set(slotKey(id), c.data)) reloadInto(id); });
    }
    else if (k === 'import') {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
      inp.onchange = async () => {
        const f = inp.files[0]; if (!f) return;
        try {
          if (meta.list.filter(x => !x.fresh).length >= MAX_SLOTS) throw new Error('Kampanya yuvaları dolu. Önce birini sil.');
          const s = SC.Engine.validate(JSON.parse(await f.text())), slot = meta.list.find(x => x.fresh) || { id: 's' + Date.now().toString(36), created: Date.now() };
          if (!meta.list.includes(slot)) meta.list.push(slot);
          Object.assign(slot, summary(s), { name: s.guild?.name || 'Yüklenen birlik' });
          if (!ls.set(slotKey(slot.id), JSON.stringify(s))) throw new Error('Tarayıcı deposunda yer yok.');
          reloadInto(slot.id);
        } catch (err) { alertBox(err.message || 'Dosya okunamadı.'); }
      };
      inp.click();
    }
  }
  function alertBox(msg) { overlay('<div class="k-panel small"><h2>Yüklenemedi</h2><p class="k-note">' + esc(msg) + '</p><div class="k-foot"><button class="k-btn" data-k="manager">Tamam</button></div></div>', 'manager'); }

  /* ---------- Açılış ekranı ---------- */
  function showTitle(force) {
    if (!force && ss.get('son-cagri-skip-title')) { ss.del('son-cagri-skip-title'); return; }
    const slot = active(), fresh = !slot || slot.fresh;
    const sparks = Array.from({ length: 26 }, (_, i) => '<i style="left:' + ((i * 37) % 100) + '%;animation-delay:-' + (i * .7).toFixed(1) + 's;animation-duration:' + (7 + i % 5) + 's"></i>').join('');
    overlay('<div class="title-bg"></div><div class="title-fog"></div><div class="title-sparks">' + sparks + '</div>' +
      '<div class="title-box"><div class="title-star">✦</div><h1 class="title-logo">SON ÇAĞRI</h1><div class="title-sub">KULE USTASI</div>' +
      '<div class="title-menu">' +
      (fresh ? '<button class="t-btn primary" data-k="new">✦ Yeni oyun</button>' :
        '<button class="t-btn primary" data-k="continue"><span>Devam et</span><small>' + esc(slot.name) + ' · Gün ' + slot.day + ' · ' + slot.floor + '. kat · ' + (DIFF_NAMES[slot.difficulty] || 'Normal') + '</small></button><button class="t-btn" data-k="new">Yeni oyun</button>') +
      (meta.list.some(x => !x.fresh) ? '<button class="t-btn" data-k="manager">Kampanyalar ve kayıtlar</button>' : '') +
      '</div><div class="title-foot">Özgün hayran projesi · v2.0</div></div>', 'title');
  }
  // app.js ilk çizimi yaptıktan sonra açılış ekranını göster
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => showTitle(false), 0));
})();
