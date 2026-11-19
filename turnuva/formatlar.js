/* Turnuva Atölyesi v3 — yeni formatlar: çift eleme ve lig.
   Tek eleme eski motorla (core.js) çalışmaya devam eder; burada Turnuva ve
   ArenaRenderer nesnelerindeki fonksiyonlar formatı tanıyacak şekilde sarılır. */
(function () {
  'use strict';
  const T = Turnuva, R = ArenaRenderer;
  const base = { bracket: T.bracket, roundName: T.roundName, validate: T.validateTournament, render: R.render, undo: T.undo };
  const isGen = t => !!t && (t.format === 'double' || t.format === 'league');
  const DRAW = { id: 'draw', name: 'Berabere', color: '#929caf' };

  function cleanNames(names) {
    if (!Array.isArray(names) || names.length < 2 || names.length > 64) throw Error('2 ile 64 arasında katılımcı ekle.');
    const clean = names.map(n => String(n).trim());
    if (clean.some(n => !n || n.length > 60)) throw Error('İsimler 1–60 karakter olmalı.');
    return clean;
  }
  function doubleDefs(ids) {
    const size = 2 ** Math.ceil(Math.log2(ids.length)), k = Math.log2(size);
    const slots = T.seedOrder(size).map(s => ids[s - 1] || null);
    const defs = [], W = (r, i) => `W${r}-${i}`, L = (j, i) => `L${j}-${i}`;
    for (let r = 0; r < k; r++) {
      const count = size / 2 ** (r + 1);
      for (let i = 0; i < count; i++) defs.push({ id: W(r, i), group: 'W', col: r, index: i,
        label: r === k - 1 ? 'Kazananlar finali' : 'Kazananlar · ' + base.roundName(r, k),
        a: r ? { m: W(r - 1, 2 * i), t: 'w' } : { p: slots[2 * i] }, b: r ? { m: W(r - 1, 2 * i + 1), t: 'w' } : { p: slots[2 * i + 1] } });
    }
    const lbRounds = 2 * (k - 1);
    let prevCount = 0;
    for (let j = 0; j < lbRounds; j++) {
      const label = j === lbRounds - 1 ? 'Kaybedenler finali' : 'Kaybedenler · ' + (j + 1) + '. tur';
      if (j === 0) {
        const count = size / 4;
        for (let i = 0; i < count; i++) defs.push({ id: L(0, i), group: 'L', col: 0, index: i, label, a: { m: W(0, 2 * i), t: 'l' }, b: { m: W(0, 2 * i + 1), t: 'l' } });
        prevCount = count;
      } else if (j % 2 === 1) {
        const wr = (j + 1) / 2, count = size / 2 ** (wr + 1);
        // Üst ağaçtan düşenler ters sırayla eşleşir, böylece aynı rakiple hemen tekrar karşılaşma azalır
        for (let i = 0; i < count; i++) defs.push({ id: L(j, i), group: 'L', col: j, index: i, label, a: { m: L(j - 1, i), t: 'w' }, b: { m: W(wr, count - 1 - i), t: 'l' } });
        prevCount = count;
      } else {
        const count = prevCount / 2;
        for (let i = 0; i < count; i++) defs.push({ id: L(j, i), group: 'L', col: j, index: i, label, a: { m: L(j - 1, 2 * i), t: 'w' }, b: { m: L(j - 1, 2 * i + 1), t: 'w' } });
        prevCount = count;
      }
    }
    defs.push({ id: 'GF', group: 'F', col: 0, index: 0, label: 'Büyük final', a: { m: W(k - 1, 0), t: 'w' }, b: lbRounds ? { m: L(lbRounds - 1, 0), t: 'w' } : { p: null } });
    return defs;
  }
  function leagueDefs(ids, legs) {
    const list = [...ids]; if (list.length % 2) list.push(null);
    const n = list.length, defs = [];
    for (let leg = 0; leg < legs; leg++) {
      const rot = [...list];
      for (let r = 0; r < n - 1; r++) {
        let index = 0;
        for (let i = 0; i < n / 2; i++) {
          let a = rot[i], b = rot[n - 1 - i];
          if (a === null || b === null) continue;
          if ((r + leg) % 2) [a, b] = [b, a];
          const week = leg * (n - 1) + r;
          defs.push({ id: `H${week}-${index}`, group: 'H', col: week, index: index++, label: (week + 1) + '. hafta', a: { p: a }, b: { p: b } });
        }
        rot.splice(1, 0, rot.pop());
      }
    }
    return defs;
  }
  function createGeneric(name, names, format, opts = {}) {
    const clean = cleanNames(names);
    if (format === 'double' && clean.length < 3) throw Error('Çift eleme için en az 3 katılımcı gerekir.');
    const players = clean.map((n, i) => ({ id: T.uid(), name: n, color: T.COLORS[i % T.COLORS.length] }));
    const ordered = opts.randomize === false ? players : T.shuffle(players);
    const legs = opts.legs === 2 ? 2 : 1;
    return { id: T.uid(), name: String(name || 'Yeni turnuva').trim().slice(0, 80) || 'Yeni turnuva', format, legs, players,
      defs: format === 'double' ? doubleDefs(ordered.map(p => p.id)) : leagueDefs(ordered.map(p => p.id), legs),
      results: {}, undo: [], createdAt: Date.now(), updatedAt: Date.now() };
  }
  function standings(t, matches) {
    const rows = new Map(t.players.map(p => [p.id, { player: p, o: 0, g: 0, b: 0, m: 0, at: 0, ye: 0, puan: 0 }]));
    for (const m of matches) {
      if (m.status !== 'done' || !m.a || !m.b) continue;
      const A = rows.get(m.a.id), B = rows.get(m.b.id); A.o++; B.o++;
      if (m.scoreA !== null) { A.at += m.scoreA; A.ye += m.scoreB; B.at += m.scoreB; B.ye += m.scoreA; }
      if (m.winner === DRAW) { A.b++; B.b++; A.puan++; B.puan++; }
      else if (m.winner.id === m.a.id) { A.g++; B.m++; A.puan += 3; } else { B.g++; A.m++; B.puan += 3; }
    }
    return [...rows.values()].sort((x, y) => y.puan - x.puan || (y.at - y.ye) - (x.at - x.ye) || y.at - x.at || y.g - x.g || x.player.name.localeCompare(y.player.name, 'tr'));
  }
  function compute(t) {
    const P = new Map(t.players.map(p => [p.id, p])), res = new Map(), matches = [];
    for (const d of t.defs) {
      const side = s => { if ('p' in s) return { ready: true, id: s.p }; const r = res.get(s.m); if (!r || !r.resolved) return { ready: false }; return { ready: true, id: s.t === 'w' ? r.winner : r.loser }; };
      const A = side(d.a), B = side(d.b), a = A.ready ? P.get(A.id) || null : null, b = B.ready ? P.get(B.id) || null : null;
      const signature = JSON.stringify([a?.id || null, b?.id || null]), saved = t.results[d.id];
      let status = 'waiting', winner = null, loser = null, resolved = false;
      if (A.ready && B.ready) {
        if (!a && !b) { status = 'empty'; resolved = true; }
        else if (!a || !b) { status = 'bye'; winner = a || b; resolved = true; }
        else if (saved && saved.signature === signature && (saved.winner === a.id || saved.winner === b.id || (saved.winner === 'draw' && t.format === 'league'))) {
          status = 'done'; resolved = true;
          if (saved.winner === 'draw') winner = DRAW; else { winner = P.get(saved.winner); loser = winner === a ? b : a; }
        } else status = 'ready';
      }
      matches.push({ id: d.id, round: d.label, index: d.index, group: d.group, col: d.col, a, b, status, winner, signature,
        scoreA: status === 'done' ? saved.scoreA ?? null : null, scoreB: status === 'done' ? saved.scoreB ?? null : null });
      res.set(d.id, { resolved, winner: winner && winner !== DRAW ? winner.id : null, loser: loser?.id || null });
    }
    let champion = null, table = null;
    if (t.format === 'double') { const gf = matches.find(m => m.id === 'GF'); if (gf && (gf.status === 'done' || gf.status === 'bye')) champion = gf.winner; }
    else { table = standings(t, matches); if (matches.length && matches.every(m => m.status === 'done')) champion = table[0].player; }
    const real = matches.filter(m => m.status !== 'empty' && m.status !== 'bye');
    const groups = new Map(); matches.forEach(m => { const k = m.group + m.col; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(m); });
    return { rounds: [...groups.values()], matches, champion, standings: table, completed: matches.filter(m => m.status === 'done').length,
      total: real.length, ready: matches.filter(m => m.status === 'ready'), byes: matches.filter(m => m.status === 'bye').length };
  }
  function recordGeneric(t, matchId, winnerId, scoreA = null, scoreB = null) {
    const m = compute(t).matches.find(x => x.id === matchId);
    if (!m || !['ready', 'done'].includes(m.status)) throw Error('Bu eşleşme henüz hazır değil.');
    const league = t.format === 'league';
    if (!(winnerId === m.a.id || winnerId === m.b.id || (league && winnerId === 'draw'))) throw Error('Geçerli bir sonuç seç.');
    const valid = s => s === null || (Number.isInteger(s) && s >= 0 && s <= 999);
    if (!valid(scoreA) || !valid(scoreB)) throw Error('Skor 0–999 arasında olmalı.');
    if ((scoreA === null) !== (scoreB === null)) throw Error('İki skoru da gir veya ikisini de boş bırak.');
    if (scoreA !== null) {
      if (winnerId === 'draw' && scoreA !== scoreB) throw Error('Berabere için skorlar eşit olmalı.');
      if (winnerId !== 'draw') { if (scoreA === scoreB) throw Error(league ? 'Skorlar eşitse “Berabere” seç.' : 'Eleme maçında beraberlik olamaz.'); if ((winnerId === m.a.id) !== (scoreA > scoreB)) throw Error('Kazanan ile skorlar uyuşmuyor.'); }
    }
    t.undo.push(JSON.parse(JSON.stringify(t.results))); if (t.undo.length > 100) t.undo.shift();
    t.results[matchId] = { winner: winnerId, signature: m.signature, scoreA, scoreB, at: Date.now() };
    t.updatedAt = Date.now();
    return compute(t);
  }
  function validateGeneric(raw) {
    if (!raw || typeof raw.id !== 'string' || !raw.id || raw.id.length > 100 || typeof raw.name !== 'string' || !raw.name.trim() || raw.name.length > 80) throw Error('Geçersiz turnuva kaydı.');
    if (!Array.isArray(raw.players) || raw.players.length < 2 || raw.players.length > 64) throw Error('Katılımcı sayısı geçersiz.');
    const ids = new Set();
    const players = raw.players.map((p, i) => { if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 60) throw Error('Katılımcı kaydı geçersiz.'); ids.add(p.id); return { id: p.id, name: p.name.trim(), color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : T.COLORS[i % T.COLORS.length] }; });
    if (!Array.isArray(raw.defs) || !raw.defs.length || raw.defs.length > 4200) throw Error('Fikstür kaydı geçersiz.');
    const seen = new Set(), src = s => { if (!s || typeof s !== 'object') throw Error('Fikstür kaydı geçersiz.'); if ('p' in s) { if (s.p !== null && !ids.has(s.p)) throw Error('Fikstürde bilinmeyen katılımcı.'); return { p: s.p }; } if (!seen.has(s.m) || !['w', 'l'].includes(s.t)) throw Error('Fikstür bağlantısı geçersiz.'); return { m: s.m, t: s.t }; };
    const defs = raw.defs.map(d => { if (!d || typeof d.id !== 'string' || seen.has(d.id)) throw Error('Fikstür kaydı geçersiz.'); const x = { id: d.id, group: ['W', 'L', 'F', 'H'].includes(d.group) ? d.group : 'H', col: Number(d.col) || 0, index: Number(d.index) || 0, label: String(d.label || '').slice(0, 60), a: src(d.a), b: src(d.b) }; seen.add(d.id); return x; });
    const results = {};
    if (raw.results && typeof raw.results === 'object') for (const [k, v] of Object.entries(raw.results)) {
      if (!seen.has(k) || !v || typeof v.winner !== 'string' || typeof v.signature !== 'string') continue;
      results[k] = { winner: v.winner, signature: v.signature, scoreA: Number.isInteger(v.scoreA) ? v.scoreA : null, scoreB: Number.isInteger(v.scoreB) ? v.scoreB : null, at: Number(v.at) || Date.now() };
    }
    return { id: raw.id, name: raw.name.trim(), format: raw.format, legs: raw.legs === 2 ? 2 : 1, players, defs, results, undo: [], createdAt: Number(raw.createdAt) || Date.now(), updatedAt: Number(raw.updatedAt) || Date.now() };
  }

  T.bracket = t => isGen(t) ? compute(t) : base.bracket(t);
  T.roundName = (round, total) => typeof round === 'string' ? round : base.roundName(round, total);
  T.validateTournament = raw => isGen(raw) ? validateGeneric(raw) : base.validate(raw);
  R.render = (canvas, t, opt) => { if (isGen(t)) { canvas.width = 1; canvas.height = 1; return { width: 1, height: 1, hitboxes: [] }; } return base.render(canvas, t, opt); };
  Object.assign(T, { isGen, createGeneric, recordGeneric, DRAW, FORMAT_NAMES: { single: 'Tek eleme', double: 'Çift eleme', league: 'Lig' } });
})();
