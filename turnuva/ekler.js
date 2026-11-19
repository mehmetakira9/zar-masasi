'use strict';
/* Turnuva Atölyesi v3 ekleri: çift eleme / lig ekranları, kura animasyonu,
   şampiyon kutlaması ve Çark Atölyesi listelerinden katılımcı alma. */
(() => {
  const esc = s => String(s);
  $('bracketView').prepend($('formatView'));

  /* ---------- Format ekranı (çift eleme ve lig) ---------- */
  function avatar(p) { const s = el('span', p.name.charAt(0).toLocaleUpperCase('tr'), 'player-avatar'); s.style.background = p.color + '25'; s.style.color = p.color; return s; }
  function matchCard(m) {
    const card = el('button', undefined, 'm-card ' + m.status);
    card.type = 'button';
    card.disabled = !['ready', 'done'].includes(m.status);
    card.append(el('span', m.status === 'ready' ? 'KAZANANI SEÇ' : m.status === 'done' ? 'TAMAMLANDI' : m.status === 'bye' ? 'BAY GEÇTİ' : m.status === 'empty' ? '—' : 'BEKLİYOR', 'm-state'));
    for (const [p, s] of [[m.a, m.scoreA], [m.b, m.scoreB]]) {
      const row = el('div', undefined, 'm-row');
      if (p) { row.append(avatar(p), el('span', p.name, 'm-name')); if (m.winner && m.winner !== T.DRAW && m.winner.id === p.id) row.classList.add('win'); }
      else row.append(el('span', m.status === 'waiting' ? 'Bekleniyor…' : 'Boş', 'm-name muted'));
      row.append(el('span', s === null || s === undefined ? '' : String(s), 'm-score'));
      card.append(row);
    }
    if (m.winner === T.DRAW) card.append(el('span', 'BERABERE', 'm-draw'));
    card.onclick = () => openMatch(m.id);
    return card;
  }
  function renderDouble(t, b) {
    const box = $('formatView');
    const groups = [['W', 'Kazananlar ağacı', 'Kaybeden alttaki ağaca düşer.'], ['L', 'Kaybedenler ağacı', 'Burada kaybeden elenir.'], ['F', 'Büyük final', 'Kazananlar ve kaybedenler ağacının şampiyonları.']];
    for (const [g, title, hint] of groups) {
      const ms = b.matches.filter(m => m.group === g); if (!ms.length) continue;
      const sec = el('section', undefined, 'fmt-group fmt-' + g);
      const head = el('div', undefined, 'fmt-head'); head.append(el('h2', title), el('span', hint, 'field-note')); sec.append(head);
      const cols = el('div', undefined, 'fmt-cols');
      const byCol = new Map(); ms.forEach(m => { if (!byCol.has(m.col)) byCol.set(m.col, []); byCol.get(m.col).push(m); });
      for (const list of byCol.values()) {
        const col = el('div', undefined, 'fmt-col'); col.append(el('span', list[0].round, 'fmt-col-title'));
        const stack = el('div', undefined, 'fmt-stack'); list.forEach(m => stack.append(matchCard(m))); col.append(stack); cols.append(col);
      }
      if (g === 'F') { const cup = el('div', undefined, 'fmt-cup'); cup.append(el('span', '🏆', 'cup-ico'), el('span', b.champion ? 'ŞAMPİYON' : 'KUPA SENİ BEKLİYOR', 'eyebrow'), el('strong', b.champion ? b.champion.name : 'Sıradaki efsane kim?')); cols.append(cup); }
      sec.append(cols); box.append(sec);
    }
  }
  function renderLeague(t, b) {
    const box = $('formatView'), wrap = el('div', undefined, 'league');
    const tableBox = el('section', undefined, 'fmt-group league-table');
    const head = el('div', undefined, 'fmt-head'); head.append(el('h2', 'Puan tablosu'), el('span', 'Galibiyet 3 · Beraberlik 1 · Mağlubiyet 0', 'field-note')); tableBox.append(head);
    const table = el('table'), thead = el('tr');
    for (const h of ['#', 'Katılımcı', 'O', 'G', 'B', 'M', 'AV', 'P']) thead.append(el('th', h));
    table.append(thead);
    b.standings.forEach((r, i) => {
      const tr = el('tr'); if (i === 0 && r.o) tr.className = 'leader';
      const name = el('td'); name.append(avatar(r.player), el('span', r.player.name));
      const diff = r.at - r.ye;
      tr.append(el('td', String(i + 1), 'rank'), name, el('td', String(r.o)), el('td', String(r.g)), el('td', String(r.b)), el('td', String(r.m)), el('td', (diff > 0 ? '+' : '') + diff), el('td', String(r.puan), 'pts'));
      table.append(tr);
    });
    tableBox.append(table);
    if (b.champion) tableBox.append(el('div', '🏆 Lig şampiyonu: ' + b.champion.name, 'winner-note'));
    const fx = el('section', undefined, 'fmt-group league-fixtures');
    const h2 = el('div', undefined, 'fmt-head'); h2.append(el('h2', 'Fikstür'), el('span', b.completed + ' / ' + b.total + ' maç oynandı', 'field-note')); fx.append(h2);
    const weeks = new Map(); b.matches.forEach(m => { if (!weeks.has(m.round)) weeks.set(m.round, []); weeks.get(m.round).push(m); });
    for (const [label, list] of weeks) {
      const wk = el('div', undefined, 'week'); wk.append(el('span', label, 'fmt-col-title'));
      const grid = el('div', undefined, 'week-grid'); list.forEach(m => grid.append(matchCard(m))); wk.append(grid); fx.append(wk);
    }
    wrap.append(tableBox, fx); box.append(wrap);
  }
  const baseRender = render;
  render = function () {
    baseRender();
    const t = active(), gen = T.isGen(t);
    $('formatView').classList.toggle('hidden', !gen);
    $('canvasScroller').classList.toggle('hidden', gen);
    document.querySelector('.arena-note').classList.toggle('hidden', gen);
    $('zoomSelect').closest('label').classList.toggle('hidden', gen);
    $('bracketTab').textContent = t && t.format === 'league' ? 'Fikstür ve tablo' : 'Eşleşme ağacı';
    $('formatView').replaceChildren();
    if (gen) { const b = T.bracket(t); t.format === 'league' ? renderLeague(t, b) : renderDouble(t, b); }
    // kenar çubuğunda format etiketi
    [...$('tournamentList').children].forEach((btn, i) => { const tt = state.tournaments[i]; if (tt && tt.format && tt.format !== 'single') btn.querySelector('.item-meta').textContent = T.FORMAT_NAMES[tt.format] + ' · ' + btn.querySelector('.item-meta').textContent; });
  };

  /* ---------- Maç penceresi: lig için Berabere seçeneği, yeni formatlar için kayıt ---------- */
  const baseOpen = openMatch;
  openMatch = function (id) {
    baseOpen(id);
    const t = active(); if (!t || t.format !== 'league' || !$('matchDialog').open) return;
    const b = el('button', undefined, 'winner-choice draw-choice'); b.type = 'button'; b.dataset.playerId = 'draw';
    b.append(el('span', '=', 'player-avatar'), el('strong', 'Berabere'), el('small', selectedWinner === 'draw' ? '✓ Kazanan' : 'Berabere olarak kaydet'));
    b.onclick = () => selectWinner('draw'); $('winnerChoices').append(b);
    if (selectedWinner === 'draw') selectWinner('draw');
  };
  const baseSubmit = $('matchForm').onsubmit;
  $('matchForm').onsubmit = event => {
    const t = active();
    if (!T.isGen(t)) return baseSubmit(event);
    event.preventDefault();
    try {
      if (!selectedWinner) throw Error('Önce bir sonuç seç.');
      const before = T.bracket(t).champion, score = id => $(id).value.trim() === '' ? null : Number($(id).value);
      const b = T.recordGeneric(t, currentMatchId, selectedWinner, score('scoreA'), score('scoreB'));
      $('matchDialog').close(); changed();
      if (b.champion && !before) { $('championName').textContent = b.champion.name; $('championText').textContent = t.name + ' şampiyonu. Tebrikler!'; $('championDialog').showModal(); }
      else toast('Maç sonucu kaydedildi.');
    } catch (error) { $('matchError').textContent = error.message; }
  };

  /* ---------- Yeni turnuva: format, Çark listeleri, kura animasyonu ---------- */
  $('formatSelect').onchange = () => { $('legsLabel').classList.toggle('hidden', $('formatSelect').value !== 'league'); };
  const baseNew = newTournament;
  newTournament = function () { baseNew(); $('formatSelect').value = 'single'; $('legsLabel').classList.add('hidden'); $('wheelLists').classList.add('hidden'); };
  $('newBtn').onclick = newTournament; $('emptyNewBtn').onclick = newTournament;
  const baseCreate = $('newForm').onsubmit;
  $('newForm').onsubmit = event => {
    const format = $('formatSelect').value, before = state.activeId;
    if (format === 'single') { baseCreate(event); if (state.activeId !== before) showDraw(active()); return; }
    event.preventDefault();
    try {
      const t = T.createGeneric($('tournamentName').value, names(), format, { randomize: $('pairingSelect').value === 'random', legs: Number($('legsSelect').value) });
      state.tournaments.unshift(t); state.activeId = t.id; view = 'bracket'; $('newDialog').close(); changed(); showDraw(t);
    } catch (error) { $('newError').textContent = error.message; }
  };
  $('shuffleNamesBtn').onclick = () => { const list = T.shuffle(names()); $('namesInput').value = list.join('\n'); $('namesInput').oninput(); };

  async function wheelSources() {
    const out = [];
    try {
      if (!indexedDB.databases) return out;
      const dbs = await indexedDB.databases();
      if (!dbs.some(d => d.name === 'cark-atolyesi')) return out;   // yoksa açma (boş veritabanı oluşturmasın)
      const db = await new Promise((res, rej) => { const r = indexedDB.open('cark-atolyesi'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      if (!db.objectStoreNames.contains('data')) { db.close(); return out; }
      const st = await new Promise((res, rej) => { const r = db.transaction('data', 'readonly').objectStore('data').get('state'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      db.close();
      if (st) collect(st, out);
    } catch { }
    return out;
  }
  function collect(st, out) {
    (st.lists || []).forEach(l => out.push({ kind: '📚 Liste', name: l.name, names: (l.entries || []).map(e => e.name) }));
    (st.wheels || []).forEach(w => out.push({ kind: '🎡 Çark', name: w.name, names: (w.entries || []).map(e => e.name) }));
    return out;
  }
  function showSources(list) {
    const box = $('wheelLists'); box.replaceChildren(); box.classList.remove('hidden');
    if (!list.length) {
      box.append(el('p', 'Bu cihazda Çark Atölyesi listesi bulunamadı. Çark Atölyesi\'nden “Yedekle” ile aldığın dosyayı seçebilirsin.', 'field-note'));
    }
    for (const s of list) {
      const n = s.names.map(x => String(x).trim()).filter(Boolean).slice(0, 64);
      if (n.length < 2) continue;
      const b = el('button', undefined, 'wheel-src'); b.type = 'button';
      b.append(el('span', s.kind, 'ws-kind'), el('strong', s.name), el('small', n.length + ' isim'));
      b.onclick = () => { $('namesInput').value = n.join('\n'); $('namesInput').oninput(); if (!$('tournamentName').value.trim()) $('tournamentName').value = s.name + ' kupası'; box.classList.add('hidden'); toast(n.length + ' katılımcı eklendi.'); };
      box.append(b);
    }
    const f = el('button', '📁 Çark yedeği seç (.json)', 'quiet'); f.type = 'button'; f.onclick = () => $('wheelFile').click(); box.append(f);
  }
  $('wheelListBtn').onclick = async () => showSources(await wheelSources());
  $('wheelFile').onchange = async () => {
    const file = $('wheelFile').files[0]; $('wheelFile').value = ''; if (!file) return;
    try { const raw = JSON.parse(await file.text()); if (raw.format !== 'cark-atolyesi') throw Error(); showSources(collect(raw, [])); }
    catch { toast('Bu dosya bir Çark Atölyesi yedeği değil.', true); }
  };

  let drawTimer = 0;
  function showDraw(t) {
    if (!t) return;
    const b = T.bracket(t);
    const first = t.format === 'league' ? b.matches.filter(m => m.col === 0)
      : t.format === 'double' ? b.matches.filter(m => m.group === 'W' && m.col === 0) : b.rounds[0];
    const pairs = first.filter(m => m.a || m.b).slice(0, 16);
    $('drawTitle').textContent = t.name; $('drawEyebrow').textContent = 'KURA ÇEKİLİYOR…';
    $('drawClose').classList.add('hidden');
    const box = $('drawPairs'); box.replaceChildren();
    const cells = [];
    pairs.forEach((m, i) => {
      const row = el('div', undefined, 'draw-pair'); row.style.animationDelay = i * 70 + 'ms';
      const a = el('span', '', 'dp-name'), vs = el('span', 'VS', 'dp-vs'), c = el('span', '', 'dp-name');
      row.append(a, vs, c); box.append(row); cells.push([a, m.a], [c, m.b]);
    });
    $('drawOverlay').classList.remove('hidden');
    const pool = t.players.map(p => p.name); let n = 0;
    clearInterval(drawTimer);
    drawTimer = setInterval(() => {
      n++;
      cells.forEach(([cell, p], i) => {
        if (n > 10 + i) { cell.textContent = p ? p.name : 'Bay'; cell.classList.add('set'); if (p) cell.style.color = p.color; }
        else cell.textContent = pool[(Math.random() * pool.length) | 0];
      });
      if (n % 2) tick();
      if (n > 12 + cells.length) { clearInterval(drawTimer); $('drawEyebrow').textContent = 'KURA TAMAMLANDI'; $('drawClose').classList.remove('hidden'); $('drawClose').focus(); }
    }, 80);
  }
  $('drawClose').onclick = () => $('drawOverlay').classList.add('hidden');
  $('drawOverlay').onclick = e => { if (e.target === $('drawOverlay') && !$('drawClose').classList.contains('hidden')) $('drawOverlay').classList.add('hidden'); };

  /* ---------- Ses ve şampiyon kutlaması ---------- */
  let ac = null;
  function tone(f, len, delay = 0, type = 'sine', vol = .12) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume();
      const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + len);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + len + .05);
    } catch { }
  }
  function tick() { tone(900 + Math.random() * 300, .04, 0, 'triangle', .04); }
  function fanfare() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, .5, i * .14, 'triangle', .14)); tone(1318.5, 1.2, .62, 'sine', .12); tone(783.99, 1.2, .62, 'sine', .08); }
  function confetti() {
    const cv = $('confetti'), ctx = cv.getContext('2d'), W = cv.width = innerWidth, H = cv.height = innerHeight;
    cv.classList.add('on');
    const cols = ['#edc777', '#ffe3a0', '#a495ef', '#67ceb1', '#ef8fb3', '#77b8f5', '#ffffff'];
    const ps = Array.from({ length: 220 }, (_, i) => ({ x: (i % 2 ? W * .12 : W * .88) + (Math.random() - .5) * 90, y: H * .8 + (Math.random() - .5) * 60, vx: (i % 2 ? 1 : -1) * (3 + Math.random() * 9), vy: -(10 + Math.random() * 12), r: Math.random() * 6.28, s: 5 + Math.random() * 6, c: cols[i % cols.length], sp: (Math.random() - .5) * .4 }));
    const start = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, W, H); const k = (now - start) / 3600;
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, k - .6) / .4);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .32; p.vx *= .985; p.r += p.sp; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); ctx.restore(); });
      if (k < 1) requestAnimationFrame(frame); else { ctx.clearRect(0, 0, W, H); cv.classList.remove('on'); }
    })(start);
  }
  new MutationObserver(() => { if ($('championDialog').open) {
      // Konfeti, açık pencerenin üstünde görünsün diye "üst katman"a (popover) alınır
      const cv = $('confetti'); try { cv.setAttribute('popover', 'manual'); cv.hidePopover?.(); cv.showPopover?.(); } catch { }
      confetti(); fanfare();
    } }).observe($('championDialog'), { attributes: true, attributeFilter: ['open'] });

  render();
})();
