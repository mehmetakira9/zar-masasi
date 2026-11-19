'use strict';
/* Kart Atölyesi v3 ekleri: kamera ile kart tarama, Claude'dan deste aktarma,
   parlayan nadir kartlar, masadaki deste yığını ve nadir kart efekti.
   app.js'teki genel fonksiyonları (active, changed, toast, paint, C …) kullanır. */
(() => {
  const RANK = { common: 0, rare: 1, epic: 2, legendary: 3 };

  /* ---------- Parlama ve eğilme (imleç / dokunuş) ---------- */
  document.addEventListener('pointermove', e => {
    const s = e.target.closest && e.target.closest('.card-surface, .flip-surface');
    if (!s) return;
    const r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    s.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    s.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    s.style.setProperty('--ang', Math.round(x * 180 + y * 90) + 'deg');
    if (s.classList.contains('card-surface') && e.pointerType === 'mouse')
      s.style.transform = `perspective(800px) rotateY(${((x - .5) * 12).toFixed(2)}deg) rotateX(${((.5 - y) * 12).toFixed(2)}deg)`;
  });
  document.addEventListener('pointerout', e => {
    const s = e.target.closest && e.target.closest('.card-surface');
    if (s && !s.contains(e.relatedTarget)) s.style.transform = '';
  });

  /* ---------- Deste yığını, uçarak gelen kartlar, nadir kart efekti ---------- */
  const glowIds = new Set();
  let pileKey = '';
  function paintPile() {
    const d = active(), pile = $('deckPile');
    if (!d || !pile) return;
    const n = C.pool(d).length;
    $('pileCount').textContent = n;
    pile.classList.toggle('empty', !n);
    pile.disabled = drawing || !n;
    const key = d.id + '|' + d.back.color + '|' + d.back.pattern + '|' + d.back.text + '|' + (d.back.image || '').length;
    if (key !== pileKey) { pileKey = key; pile.querySelectorAll('canvas').forEach(cv => paint(cv, null, d, 'back', .4)); }
  }
  const baseRenderTable = renderTable;
  renderTable = function () {
    baseRenderTable();
    paintPile();
    const stage = $('tableStage').getBoundingClientRect(), p = $('deckPile').getBoundingClientRect();
    document.querySelectorAll('.table-token').forEach(tok => {
      if (tok.classList.contains('dealing')) {
        tok.style.setProperty('--fx', (p.left - stage.left - tok.offsetLeft) + 'px');
        tok.style.setProperty('--fy', (p.top - stage.top - tok.offsetTop) + 'px');
      }
      if (glowIds.has(tok.dataset.tokenId)) tok.classList.add('rare-glow');
    });
  };
  $('deckPile').onclick = () => { if (!drawing) drawCards(); };

  let fx = null;
  function fanfare(level) {
    if (state.prefs.sound === 'none' || state.prefs.volume <= 0) return;
    try {
      fx = fx || new (window.AudioContext || window.webkitAudioContext)(); fx.resume();
      const now = fx.currentTime, v = state.prefs.volume * .18;
      const notes = level === 'legendary' ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [587.33, 739.99, 880, 1174.7];
      notes.forEach((f, i) => {
        const o = fx.createOscillator(), g = fx.createGain(), t = now + i * .085;
        o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 1.2);
        o.connect(g); g.connect(fx.destination); o.start(t); o.stop(t + 1.3);
      });
    } catch { }
  }
  // app.js çekimden sonra bunu çağırır
  window.afterDraw = (drawn, d) => {
    let best = 'common';
    const rare = [];
    for (const t of drawn) {
      const c = d.cards.find(x => x.id === t.cardId); if (!c) continue;
      if (RANK[c.rarity] >= 2) rare.push(t.id);
      if (RANK[c.rarity] > RANK[best]) best = c.rarity;
    }
    if (RANK[best] < 2) return;
    const wait = 650 + Math.min(drawn.length - 1, 10) * 60;
    setTimeout(() => {
      rare.forEach(id => glowIds.add(id));
      document.querySelectorAll('.table-token').forEach(tok => { if (glowIds.has(tok.dataset.tokenId)) tok.classList.add('rare-glow'); });
      const f = $('rareFlash'); f.className = 'rare-flash on ' + best; void f.offsetWidth;
      fanfare(best);
      toast(best === 'legendary' ? '✦ Efsanevi bir kart çektin!' : '✧ Destansı bir kart çektin!');
      setTimeout(() => { f.className = 'rare-flash'; }, 1600);
      setTimeout(() => { rare.forEach(id => glowIds.delete(id)); document.querySelectorAll('.rare-glow').forEach(t => t.classList.remove('rare-glow')); }, 4200);
    }, wait);
  };

  /* ---------- Kamera ile kart tarama ---------- */
  const scan = { mode: 'single', src: null, data: null, pts: null, raf: 0 };
  const DEFAULT_PTS = () => [{ x: .12, y: .1 }, { x: .88, y: .1 }, { x: .88, y: .9 }, { x: .12, y: .9 }];
  function openScan(mode) {
    const d = active(); if (!d) return;
    if (mode === 'batch' && (d.cards.length >= 200 || !canAddCards())) { toast('Bu desteye yeni kart eklenemiyor.', true); return; }
    scan.mode = mode; scan.src = null; scan.data = null;
    $('scanTitle').textContent = mode === 'batch' ? '“' + d.name + '” destesine kart tara' : 'Kartını tara';
    $('scanBatchFields').classList.toggle('hidden', mode !== 'batch');
    $('scanNext').classList.toggle('hidden', mode !== 'batch');
    $('scanDone').textContent = mode === 'batch' ? '✓ Kaydet ve bitir' : '✓ Görseli karta ekle';
    $('scanName').value = ''; $('scanError').textContent = '';
    showStart();
    $('scanDialog').showModal();
  }
  function showStart() { $('scanStart').classList.remove('hidden'); $('scanWork').classList.add('hidden'); }
  async function loadPhoto(input) {
    const file = input.files[0]; input.value = '';
    if (!file) return;
    try {
      if (!/^image\//.test(file.type)) throw Error('Bir fotoğraf seç.');
      if (file.size > 40 * 1024 * 1024) throw Error('Fotoğraf en fazla 40 MB olabilir.');
      let bmp;
      try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { bmp = await createImageBitmap(file); }
      const max = 2200, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close && bmp.close();
      setSource(cv); scan.pts = guessCorners(cv) || DEFAULT_PTS();
      $('scanStart').classList.add('hidden'); $('scanWork').classList.remove('hidden');
      layout(); refresh();
    } catch (e) { $('scanError').textContent = e.message || 'Fotoğraf açılamadı.'; }
  }
  function setSource(cv) { scan.src = cv; scan.data = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height); }
  function layout() {
    const cv = $('scanCanvas'), src = scan.src, k = Math.min(1, 900 / src.width);
    cv.width = Math.round(src.width * k); cv.height = Math.round(src.height * k);
    cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
  }
  // Basit otomatik köşe tahmini: kenarlara göre farklı parlaklıktaki en büyük bölge
  function guessCorners(cv) {
    try {
      const w = 160, h = Math.round(cv.height / cv.width * 160), t = document.createElement('canvas'); t.width = w; t.height = h;
      const c = t.getContext('2d'); c.drawImage(cv, 0, 0, w, h); const px = c.getImageData(0, 0, w, h).data;
      const lum = i => px[i] * .3 + px[i + 1] * .59 + px[i + 2] * .11;
      let bg = 0, n = 0;
      for (let x = 0; x < w; x++) { bg += lum(x * 4) + lum(((h - 1) * w + x) * 4); n += 2; }
      for (let y = 0; y < h; y++) { bg += lum(y * w * 4) + lum((y * w + w - 1) * 4); n += 2; }
      bg /= n;
      const mask = new Uint8Array(w * h); let count = 0;
      for (let i = 0; i < w * h; i++) if (Math.abs(lum(i * 4) - bg) > 38) { mask[i] = 1; count++; }
      if (count < w * h * .08 || count > w * h * .92) return null;
      // dört köşe: x+y en küçük/en büyük, x−y en büyük/en küçük
      let tl = [0, 0, 1e9], br = [0, 0, -1e9], tr = [0, 0, -1e9], bl = [0, 0, 1e9];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        const s = x + y, d = x - y;
        if (s < tl[2]) tl = [x, y, s]; if (s > br[2]) br = [x, y, s];
        if (d > tr[2]) tr = [x, y, d]; if (d < bl[2]) bl = [x, y, d];
      }
      const pts = [tl, tr, br, bl].map(([x, y]) => ({ x: x / (w - 1), y: y / (h - 1) }));
      const area = Math.abs((pts[0].x * pts[1].y - pts[1].x * pts[0].y) + (pts[1].x * pts[2].y - pts[2].x * pts[1].y) + (pts[2].x * pts[3].y - pts[3].x * pts[2].y) + (pts[3].x * pts[0].y - pts[0].x * pts[3].y)) / 2;
      return area > .08 ? pts : null;
    } catch { return null; }
  }
  function refresh() {
    const pts = scan.pts;
    document.querySelectorAll('.scan-handle').forEach(hd => { const p = pts[hd.dataset.i]; hd.style.left = p.x * 100 + '%'; hd.style.top = p.y * 100 + '%'; });
    $('scanPoly').setAttribute('points', pts.map(p => (p.x * 100).toFixed(2) + ',' + (p.y * 100).toFixed(2)).join(' '));
    cancelAnimationFrame(scan.raf);
    scan.raf = requestAnimationFrame(() => {
      const out = warp(340); const r = $('scanResult'); r.width = out.width; r.height = out.height; r.getContext('2d').drawImage(out, 0, 0);
    });
  }
  // Birim kareden dörtgene perspektif dönüşümü (Heckbert)
  function homography(q) {
    const [p0, p1, p2, p3] = q;
    const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
    const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;
    let g = 0, h = 0;
    const den = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(den) > 1e-12) { g = (dx3 * dy2 - dx2 * dy3) / den; h = (dx1 * dy3 - dx3 * dy1) / den; }
    return { a: p1.x - p0.x + g * p1.x, b: p3.x - p0.x + h * p3.x, c: p0.x, d: p1.y - p0.y + g * p1.y, e: p3.y - p0.y + h * p3.y, f: p0.y, g, h };
  }
  function warp(H) {
    const ratio = Number($('scanRatio').value) || .5833, W = Math.round(H * ratio);
    const src = scan.data, sw = src.width, sh = src.height, s = src.data;
    const M = homography(scan.pts.map(p => ({ x: p.x * (sw - 1), y: p.y * (sh - 1) })));
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const ctx = out.getContext('2d'), img = ctx.createImageData(W, H), o = img.data;
    for (let j = 0; j < H; j++) {
      const v = (j + .5) / H;
      for (let i = 0; i < W; i++) {
        const u = (i + .5) / W, z = M.g * u + M.h * v + 1;
        let x = (M.a * u + M.b * v + M.c) / z, y = (M.d * u + M.e * v + M.f) / z;
        if (x < 0) x = 0; else if (x > sw - 1.001) x = sw - 1.001;
        if (y < 0) y = 0; else if (y > sh - 1.001) y = sh - 1.001;
        const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, k = (y0 * sw + x0) * 4, k2 = k + sw * 4, q = (j * W + i) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const top = s[k + ch] + (s[k + 4 + ch] - s[k + ch]) * fx, bot = s[k2 + ch] + (s[k2 + 4 + ch] - s[k2 + ch]) * fx;
          o[q + ch] = top + (bot - top) * fy;
        }
        o[q + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (!$('scanEnhance').checked) return out;
    const e = document.createElement('canvas'); e.width = W; e.height = H;
    const ec = e.getContext('2d'); ec.filter = 'contrast(1.12) saturate(1.15) brightness(1.04)'; ec.drawImage(out, 0, 0);
    return e;
  }
  function resultData() {
    for (const [h, q] of [[1000, .85], [1000, .7], [800, .7], [640, .6]]) {
      const data = warp(h).toDataURL('image/webp', q);
      if (/^data:image\/webp/.test(data) && data.length < 880000) return data;
      if (!/^data:image\/webp/.test(data)) { const j = warp(h).toDataURL('image/jpeg', q); if (j.length < 880000) return j; }
    }
    throw Error('Görsel çok büyük kaldı. Kartı biraz daha uzaktan çekmeyi dene.');
  }
  function saveScan(next) {
    try {
      if (!scan.src) throw Error('Önce bir fotoğraf çek.');
      const data = resultData();
      if (scan.mode === 'single') {
        cardDraft.image = data;
        $('cardLayoutInput').value = 'photo';
        $('cardImageStatus').textContent = 'Taranmış kart görseli eklendi. Yerleşim: Fotoğraf.';
        previewCard(); $('scanDialog').close(); return;
      }
      const d = active();
      if (d.cards.length >= 200 || !canAddCards()) throw Error('Bu desteye yeni kart eklenemiyor.');
      C.add(d, { title: $('scanName').value.trim().slice(0, 100), description: '', category: '', rarity: $('scanRarity').value, weight: 1, image: data, style: { ...C.STYLE, layout: 'photo', frame: 'minimal', accent: d.back.color } });
      d.updatedAt = Date.now(); changed();
      toast('Kart desteye eklendi · ' + d.cards.length + ' kart');
      if (next) { $('scanName').value = ''; $('scanError').textContent = ''; scan.src = null; showStart(); }
      else $('scanDialog').close();
    } catch (e) { $('scanError').textContent = e.message; }
  }
  // köşe tutamaçlarını sürükleme
  document.querySelectorAll('.scan-handle').forEach(hd => {
    hd.addEventListener('pointerdown', e => { e.preventDefault(); hd.setPointerCapture(e.pointerId); hd.classList.add('drag'); });
    hd.addEventListener('pointermove', e => {
      if (!hd.hasPointerCapture(e.pointerId)) return;
      const r = $('scanStage').getBoundingClientRect();
      scan.pts[hd.dataset.i] = { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
      refresh();
    });
    const up = e => { hd.classList.remove('drag'); if (hd.hasPointerCapture(e.pointerId)) hd.releasePointerCapture(e.pointerId); };
    hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
  });
  $('scanRotate').onclick = () => {
    if (!scan.src) return;
    const s = scan.src, cv = document.createElement('canvas'); cv.width = s.height; cv.height = s.width;
    const c = cv.getContext('2d'); c.translate(cv.width, 0); c.rotate(Math.PI / 2); c.drawImage(s, 0, 0);
    setSource(cv); scan.pts = scan.pts.map(p => ({ x: 1 - p.y, y: p.x }));
    // sıralamayı sol-üstten başlat
    scan.pts = [scan.pts[3], scan.pts[0], scan.pts[1], scan.pts[2]];
    layout(); refresh();
  };
  $('scanReset').onclick = () => { if (scan.src) { scan.pts = DEFAULT_PTS(); refresh(); } };
  $('scanRatio').onchange = () => scan.src && refresh();
  $('scanEnhance').onchange = () => scan.src && refresh();
  for (const id of ['scanCamera', 'scanFile', 'scanRetake']) $(id).onchange = () => loadPhoto($(id));
  $('scanDone').onclick = () => saveScan(false);
  $('scanNext').onclick = () => saveScan(true);
  $('scanSingleBtn').onclick = () => openScan('single');
  $('scanBatchBtn').onclick = () => openScan('batch');

  /* ---------- Claude'dan deste aktarma ---------- */
  const RARITY_MAP = { common: 'common', yaygin: 'common', 'yaygın': 'common', rare: 'rare', nadir: 'rare', epic: 'epic', destansi: 'epic', 'destansı': 'epic', legendary: 'legendary', efsanevi: 'legendary' };
  const hex = (v, f) => /^#[0-9a-f]{6}$/i.test(v || '') ? v : f;
  function parseLoose(t) { const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b < a) throw Error('Yapıştırılan metinde kod bulunamadı.'); return JSON.parse(t.slice(a, b + 1)); }
  function toCard(r, accent) {
    const rarity = RARITY_MAP[String(r.rarity || r.nadirlik || 'common').toLocaleLowerCase('tr')] || 'common';
    const weight = Number(r.weight ?? r.agirlik);
    return { title: String(r.title || r.ad || '').slice(0, 100).trim(), description: String(r.description || r.aciklama || r.açıklama || '').slice(0, 3000),
      category: String(r.category || r.kategori || '').slice(0, 50).trim(), rarity, weight: Number.isFinite(weight) && weight >= .01 ? Math.min(1000, weight) : 1,
      art: C.ART.includes(r.art) ? r.art : '', style: { ...C.STYLE, accent: hex(r.accent, accent) } };
  }
  function claudeImport(text) {
    const o = parseLoose(text), src = o.deste || o.deck || (Array.isArray(o.cards) ? o : null);
    if (!src || !Array.isArray(src.cards) || !src.cards.length) throw Error('Kodda kart listesi (cards) yok.');
    if (src.cards.length > 200) throw Error('Bir destede en fazla 200 kart olabilir.');
    const name = String(src.name || src.ad || 'Claude destesi').slice(0, 80).trim() || 'Claude destesi';
    const back = src.back || {};
    let d = state.decks.find(x => x.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')), added = 0, updated = 0;
    if (!d) {
      if (!canAddDeck() || !canAddCards(src.cards.length)) return;
      const color = hex(back.color, '#bfa374');
      const cards = src.cards.map(r => toCard(r, color)).filter(c => c.title || c.description || c.art);
      d = C.deck({ name, description: String(src.description || src.aciklama || '').slice(0, 500), back: { color, text: String(back.text || name).slice(0, 80), pattern: ['stars', 'diamonds', 'rings'].includes(back.pattern) ? back.pattern : 'stars' }, prefs: { weighted: cards.some(c => c.weight !== 1) }, cards });
      state.decks.unshift(d); added = d.cards.length;
    } else {
      for (const r of src.cards) {
        const c = toCard(r, d.back.color);
        if (!c.title && !c.description && !c.art) continue;
        const ex = c.title && d.cards.find(x => x.title.toLocaleLowerCase('tr') === c.title.toLocaleLowerCase('tr'));
        if (ex) { if (c.description) ex.description = c.description; if (c.category) ex.category = c.category; ex.rarity = c.rarity; ex.weight = c.weight; if (c.art && !ex.image) ex.art = c.art; updated++; }
        else { if (d.cards.length >= 200 || !canAddCards()) break; C.add(d, c); added++; }
      }
      d.updatedAt = Date.now();
    }
    state.activeId = d.id; screen = 'deck'; view = 'cards'; resetFilters(); changed();
    return { d, added, updated };
  }
  $('claudeBtn').onclick = () => { $('claudeIn').value = ''; $('claudeDialog').showModal(); };
  $('claudePaste').onclick = async () => { try { $('claudeIn').value = await navigator.clipboard.readText(); } catch { toast('Panoya erişilemedi. Uzun basıp “Yapıştır” de.', true); } };
  $('claudeImport').onclick = () => {
    try {
      const r = claudeImport($('claudeIn').value); if (!r) return;
      $('claudeDialog').close();
      toast('“' + r.d.name + '”: ' + r.added + ' kart eklendi' + (r.updated ? ', ' + r.updated + ' kart güncellendi' : '') + '.');
    } catch (e) { toast('Aktarılamadı: ' + (e.message || 'kod okunamadı'), true); }
  };
  $('claudeCopy').onclick = async () => {
    const d = active(); if (!d) { toast('Önce bir deste aç.', true); return; }
    const out = { app: 'kart-atolyesi', tur: 'deste', v: 1, deste: { name: d.name, description: d.description, back: { color: d.back.color, pattern: d.back.pattern },
      cards: d.cards.map(c => { const x = { title: c.title, description: c.description, category: c.category, rarity: c.rarity, weight: c.weight }; if (c.art) x.art = c.art; return x; }) } };
    const text = '```json\n' + JSON.stringify(out) + '\n```';
    try { await navigator.clipboard.writeText(text); toast('Kopyalandı. Claude\'a yapıştırabilirsin (görseller dahil değil).'); }
    catch { $('claudeIn').value = text; $('claudeIn').select(); toast('Kod aşağıya yazıldı; seçip kopyala.'); }
  };

  // ilk çizim
  if (view === 'table') renderTable();
})();
