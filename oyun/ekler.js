'use strict';
/* Bugün Ne Oynasam? v3 ekleri: yeni çark görünümü, kazanan vurgusu,
   sonuç kutlaması ve İstatistiklerim sayfası. app.js'teki genel değişkenleri kullanır. */
(() => {
  const TAU = Math.PI * 2;
  const COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#748ffc', '#b197fc', '#f783ac'];
  let highlight = null, animRaf = 0;
  const css = k => getComputedStyle(document.body).getPropertyValue(k).trim();
  const lum = hex => { const n = hex.slice(1).match(/.{2}/g).map(x => parseInt(x, 16)); return n[0] * .299 + n[1] * .587 + n[2] * .114; };

  /* ---------- Çark ---------- */
  drawWheel = function () {
    if (!state) return;
    const canvas = $('wheelCanvas'), size = canvas.clientWidth; if (!size) return;
    const games = wheelGames || pool().eligible, dpr = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(size * dpr)) { canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr); }
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size); if (!games.length) return;
    const R = size * .40, rim = size * .042, now = performance.now(), accent = css('--accent') || '#f6b77f';
    const slices = G.segments(games), hl = highlight && slices.find(s => s.game.id === highlight.id), pulse = hl ? .5 + .5 * Math.sin((now - highlight.start) / 140) : 0;
    ctx.translate(size / 2, size / 2);
    ctx.save(); ctx.rotate(rotation);
    const metal = ctx.createLinearGradient(-R - rim, -R - rim, R + rim, R + rim);
    metal.addColorStop(0, '#fbe3b0'); metal.addColorStop(.35, '#9c7434'); metal.addColorStop(.55, '#f6d898'); metal.addColorStop(.8, '#8a6427'); metal.addColorStop(1, '#3a2a10');
    ctx.beginPath(); ctx.arc(0, 0, R + rim, 0, TAU); ctx.fillStyle = metal; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, R + 2.5, 0, TAU); ctx.fillStyle = '#2a1f10'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
    slices.forEach(s => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, s.start, s.end); ctx.closePath(); ctx.fillStyle = COLORS[s.index % COLORS.length]; ctx.fill(); });
    const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    shade.addColorStop(0, 'rgba(0,0,0,.28)'); shade.addColorStop(.32, 'rgba(0,0,0,0)'); shade.addColorStop(.8, 'rgba(255,255,255,.07)'); shade.addColorStop(1, 'rgba(0,0,0,.3)');
    ctx.fillStyle = shade; ctx.fillRect(-R, -R, 2 * R, 2 * R);
    if (hl) {
      ctx.save(); ctx.beginPath(); ctx.rect(-R, -R, 2 * R, 2 * R); ctx.moveTo(0, 0); ctx.arc(0, 0, R * 1.2, hl.end, hl.start, true); ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,' + (.5 * Math.min(1, (now - highlight.start) / 250)) + ')'; ctx.fill('evenodd'); ctx.restore();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, hl.start, hl.end); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,' + (.08 + .18 * pulse) + ')'; ctx.fill();
    }
    if (slices.length > 1) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = Math.max(1.2, size * .0035); slices.forEach(s => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(s.start) * R, Math.sin(s.start) * R); ctx.stroke(); }); }
    slices.forEach(slice => {
      const color = COLORS[slice.index % COLORS.length];
      const image = getImage(slice.game.cover), imageSize = Math.min(size * .12, R * .66 * slice.span * .7);
      if (image && imageSize > 12) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, slice.start, slice.end); ctx.closePath(); ctx.clip();
        ctx.translate(Math.cos(slice.center) * R * .68, Math.sin(slice.center) * R * .68); ctx.rotate(-rotation);
        ctx.beginPath(); ctx.roundRect(-imageSize / 2, -imageSize / 2, imageSize, imageSize, imageSize * .16); ctx.save(); ctx.clip();
        const sc = Math.max(imageSize / image.width, imageSize / image.height); ctx.drawImage(image, -image.width * sc / 2, -image.height * sc / 2, image.width * sc, image.height * sc); ctx.restore();
        ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      }
      if (slice.span * R * .65 < 7) return;
      ctx.save(); ctx.rotate(slice.center);
      const font = Math.max(7, Math.min(20, size * .038, R * slice.span * .34)), light = lum(color) <= 150;
      ctx.font = '700 ' + font + 'px "Outfit","Segoe UI",sans-serif'; ctx.fillStyle = light ? '#fff' : '#24192f'; ctx.textBaseline = 'middle';
      if (light) { ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 4; }
      if (slice.span > .43) { const pos = image && imageSize > 12 ? R * .36 : R * .62; ctx.translate(pos, 0); ctx.rotate(Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(fitText(ctx, slice.game.name, Math.min(R * .92, pos * slice.span * .86)), 0, 0); }
      else { ctx.translate(R * .9, 0); ctx.textAlign = 'right'; ctx.fillText(fitText(ctx, slice.game.name, R * .6), 0, 0); }
      ctx.restore();
    });
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    // kenar ışıkları
    const count = 24, br = Math.max(2.2, size * .0085), rr = R + rim * .55;
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + i * TAU / count, on = hl ? Math.floor((now - highlight.start) / 180) % 2 === 0 : spinning ? (i + Math.floor(now / 90)) % 3 !== 0 : true;
      if (on) { ctx.shadowColor = '#fff3c4'; ctx.shadowBlur = br * 3; }
      ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, br, 0, TAU); ctx.fillStyle = on ? '#fff3c4' : '#6b5428'; ctx.fill(); ctx.shadowBlur = 0;
    }
    // göbek
    const h = size * .075, hg = ctx.createRadialGradient(-h * .35, -h * .35, h * .1, 0, 0, h);
    hg.addColorStop(0, '#fff4d6'); hg.addColorStop(.7, '#b8892f'); hg.addColorStop(1, '#3a2a10');
    ctx.beginPath(); ctx.arc(0, 0, h, 0, TAU); ctx.shadowBlur = 18; ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.fillStyle = hg; ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = 2; ctx.strokeStyle = '#f5d98b'; ctx.stroke();
    ctx.fillStyle = '#3a2a10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '800 ' + Math.max(9, size * .03) + 'px "Outfit",sans-serif'; ctx.fillText(spinning ? '★' : '🎮', 0, 1);
    void accent;
  };
  function animate(ms) { cancelAnimationFrame(animRaf); const end = performance.now() + ms; const step = () => { drawWheel(); if (highlight && performance.now() < end) animRaf = requestAnimationFrame(step); }; animRaf = requestAnimationFrame(step); }
  function kick() { const p = document.querySelector('.wheel-pointer'); if (!p) return; p.classList.remove('kick'); void p.offsetWidth; p.classList.add('kick'); }
  const baseTone = tone;
  tone = function (freq, duration, delay) { if (freq === 680) kick(); return baseTone(freq, duration, delay); };
  // Göbeğe dokununca da dönsün
  $('wheelCanvas').addEventListener('click', e => { const r = $('wheelCanvas').getBoundingClientRect(); if (Math.hypot(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2) < r.width * .08 && !spinning) chooseNow(); });
  const baseCommit = commitChoice;
  commitChoice = function (game, method) {
    if (method !== 'wheel') return baseCommit(game, method);
    highlight = { id: game.id, start: performance.now() }; lockSelection(true); animate(4000);
    setTimeout(() => { lockSelection(false); baseCommit(game, method); }, 800);
  };
  $('resultDialog').addEventListener('close', () => { highlight = null; drawWheel(); });

  /* ---------- Sonuç kutlaması ---------- */
  function confetti() {
    const cv = $('confetti'); try { cv.setAttribute('popover', 'manual'); cv.hidePopover?.(); cv.showPopover?.(); } catch { }
    const ctx = cv.getContext('2d'), W = cv.width = innerWidth, H = cv.height = innerHeight; cv.classList.add('on');
    const cols = [css('--accent') || '#f6b77f', '#ffffff', ...COLORS];
    const ps = Array.from({ length: 140 }, (_, i) => { const a = Math.random() * TAU, sp = 5 + Math.random() * 10; return { x: W / 2, y: H * .42, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 5, r: Math.random() * 6, s: 4 + Math.random() * 6, c: cols[i % cols.length], sp: (Math.random() - .5) * .4 }; });
    const start = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, W, H); const k = (now - start) / 2600; ctx.globalAlpha = Math.max(0, 1 - Math.max(0, k - .5) / .5);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .25; p.vx *= .985; p.r += p.sp; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); ctx.restore(); });
      if (k < 1) requestAnimationFrame(frame); else { ctx.clearRect(0, 0, W, H); cv.classList.remove('on'); try { cv.hidePopover?.(); } catch { } }
    })(start);
  }
  new MutationObserver(() => { if ($('resultDialog').open) confetti(); }).observe($('resultDialog'), { attributes: true, attributeFilter: ['open'] });

  /* ---------- İstatistiklerim ---------- */
  const fmtMin = m => m < 60 ? m + ' dk' : Math.floor(m / 60) + ' sa' + (m % 60 ? ' ' + (m % 60) + ' dk' : '');
  const dayKey = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function tip(node, text) {
    node.addEventListener('pointerenter', () => { const t = $('chartTip'); t.textContent = text; t.classList.add('on'); });
    node.addEventListener('pointermove', e => { const t = $('chartTip'); t.style.left = e.clientX + 'px'; t.style.top = e.clientY + 'px'; });
    node.addEventListener('pointerleave', () => $('chartTip').classList.remove('on'));
  }
  function bins(played, days) {
    // 7/30 gün: günlük, 90 gün: haftalık, tümü: aylık (son 12 ay)
    const out = [], now = new Date();
    if (days && days <= 30) {
      for (let i = days - 1; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0); out.push({ from: d.getTime(), to: d.getTime() + 86400000, label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }), short: days === 7 ? d.toLocaleDateString('tr-TR', { weekday: 'short' }) : String(d.getDate()) }); }
    } else if (days === 90) {
      const end = dayKey(Date.now()) + 86400000;
      for (let i = 12; i >= 0; i--) { const to = end - i * 7 * 86400000, from = to - 7 * 86400000, d = new Date(from); out.push({ from, to, label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' haftası', short: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' }) }); }
    } else {
      for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1), e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1); out.push({ from: d.getTime(), to: e.getTime(), label: d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }), short: d.toLocaleDateString('tr-TR', { month: 'short' }) }); }
    }
    out.forEach(b => { const rs = played.filter(r => r.time >= b.from && r.time < b.to); b.min = rs.reduce((s, r) => s + (r.minutes || 0), 0); b.n = rs.length; });
    return out;
  }
  function card(title, sub) { const c = el('section', 'panel stat-card'); const h = el('div', 'stat-head'); h.append(el('h2', '', title)); if (sub) h.append(el('small', '', sub)); c.append(h); return c; }
  function renderStats() {
    const body = $('statsBody'); if (!body) return; body.replaceChildren();
    const days = Number($('statsRange').value), since = days ? Date.now() - days * 86400000 : 0;
    const recs = state.history.filter(r => r.time >= since), played = recs.filter(r => r.outcome === 'played');
    const minutes = played.reduce((s, r) => s + (r.minutes || 0), 0), timed = played.filter(r => r.minutes > 0);
    const finished = state.games.filter(g => g.status === 'finished').length;
    const tiles = el('div', 'stat-tiles');
    [[fmtMin(minutes), 'toplam oyun süresi'], [String(played.length), 'oynadığın oturum'], [timed.length ? fmtMin(Math.round(minutes / timed.length)) : '—', 'ortalama oturum'],
     [recs.length ? '%' + Math.round(played.length / recs.length * 100) : '—', 'seçimden oynamaya'], [String(finished), 'bitirdiğin oyun']].forEach(([v, l]) => { const t = el('div', 'panel stat-tile'); t.append(el('strong', '', v), el('span', '', l)); tiles.append(t); });
    body.append(tiles);
    if (!state.history.length) { const e = el('div', 'empty'); e.append(el('h2', '', 'Henüz istatistik yok.'), el('p', '', 'Oyun seç ve “Oynadım” ile süresini kaydet; grafiklerin burada dolacak.')); body.append(e); return; }

    // Zaman içinde oyun süresi (tek seri, sütun)
    const bs = bins(played, days), maxB = Math.max(1, ...bs.map(b => b.min || b.n));
    const useMin = bs.some(b => b.min > 0);
    const c1 = card(useMin ? 'Oyun süren' : 'Oturumların', days === 90 ? 'haftalık' : days === 0 ? 'son 12 ay · aylık' : 'günlük');
    const chart = el('div', 'bars'); chart.style.setProperty('--n', bs.length);
    const top = useMin ? Math.max(...bs.map(b => b.min), 1) : Math.max(...bs.map(b => b.n), 1);
    bs.forEach((b, i) => {
      const v = useMin ? b.min : b.n, col = el('div', 'bar-col'), bar = el('div', 'bar');
      bar.style.height = (v / top * 100) + '%'; if (!v) bar.classList.add('zero');
      col.append(bar);
      const showLabel = bs.length <= 13 || i % Math.ceil(bs.length / 10) === 0 || i === bs.length - 1;
      col.append(el('span', 'bar-x', showLabel ? b.short : ''));
      tip(col, b.label + ' · ' + (useMin ? fmtMin(b.min) + ' · ' : '') + b.n + ' oturum');
      chart.append(col);
    });
    const best = bs.reduce((a, b) => ((useMin ? b.min : b.n) > (useMin ? a.min : a.n) ? b : a), bs[0]);
    const axis = el('div', 'bar-axis'); axis.append(el('span', '', useMin ? fmtMin(top) : top + ' oturum'), el('span', '', '0'));
    const wrap = el('div', 'bars-wrap'); wrap.append(axis, chart); c1.append(wrap);
    if ((useMin ? best.min : best.n) > 0) c1.append(el('p', 'hint', 'En yoğun: ' + best.label + ' · ' + (useMin ? fmtMin(best.min) : best.n + ' oturum')));
    void maxB;

    // En çok oynananlar (yatay çubuk)
    const by = new Map();
    played.forEach(r => { const k = r.gameId || r.name; const x = by.get(k) || { name: r.name, rec: r, min: 0, n: 0 }; x.min += r.minutes || 0; x.n++; by.set(k, x); });
    const topGames = [...by.values()].sort((a, b) => b.min - a.min || b.n - a.n).slice(0, 6);
    const c2 = card('En çok oynadıkların', useMin ? 'süreye göre' : 'oturuma göre');
    if (!topGames.length) c2.append(el('p', 'hint', 'Bu aralıkta “Oynadım” kaydı yok.'));
    const mx = Math.max(1, ...topGames.map(g => useMin ? g.min : g.n));
    topGames.forEach((g, i) => {
      const row = el('div', 'hbar'), cover = el('div', 'game-cover hbar-cover'); const game = state.games.find(x => x.id === g.rec.gameId) || g.rec; renderCover(cover, game);
      const mid = el('div', 'hbar-mid'), track = el('div', 'hbar-track'), fill = el('div', 'hbar-fill');
      fill.style.width = ((useMin ? g.min : g.n) / mx * 100) + '%'; track.append(fill);
      mid.append(el('b', '', (i === 0 ? '🏆 ' : '') + g.name), track);
      row.append(cover, mid, el('span', 'hbar-val', (useMin ? fmtMin(g.min) + ' · ' : '') + g.n + ' oturum'));
      tip(row, g.name + ': ' + (useMin ? fmtMin(g.min) + ', ' : '') + g.n + ' oturum');
      c2.append(row);
    });

    // Ruh hali ve seçim yöntemi (yatay çubuk, tek renk)
    function countBars(title, sub, entries) {
      const c = card(title, sub), m = Math.max(1, ...entries.map(e => e[1]));
      if (!entries.length) c.append(el('p', 'hint', 'Bu aralıkta kayıt yok.'));
      entries.forEach(([label, v]) => { const row = el('div', 'hbar slim'), mid = el('div', 'hbar-mid'), track = el('div', 'hbar-track'), fill = el('div', 'hbar-fill'); fill.style.width = (v / m * 100) + '%'; track.append(fill); mid.append(el('b', '', label), track); row.append(mid, el('span', 'hbar-val', String(v))); tip(row, label + ': ' + v); c.append(row); });
      return c;
    }
    const moodCount = new Map(); played.forEach(r => moodCount.set(r.mood, (moodCount.get(r.mood) || 0) + 1));
    const moods = [...moodCount].map(([id, v]) => [(G.MOODS.find(m => m.id === id)?.icon || '✧') + ' ' + moodName(id), v]).sort((a, b) => b[1] - a[1]);
    const methodCount = new Map(); recs.forEach(r => methodCount.set(r.method, (methodCount.get(r.method) || 0) + 1));
    const methods = [...methodCount].map(([id, v]) => [G.METHODS[id] || id, v]).sort((a, b) => b[1] - a[1]);
    const c3 = countBars('Hangi ruh halinde oynadın?', 'oynanan oturum', moods);
    const c4 = countBars('Nasıl seçtin?', 'tüm seçimler', methods);
    const status = el('div', 'status-tiles');
    Object.entries(G.STATUS).forEach(([id, label]) => { const t = el('div', 'status-tile'); t.append(el('strong', '', String(state.games.filter(g => g.status === id).length)), el('span', '', label)); status.append(t); });
    const c5 = card('Kütüphanenin durumu', state.games.length + ' oyun'); c5.append(status);
    const grid = el('div', 'stats-grid'); grid.append(c1, c2, c3, c4, c5); body.append(grid);
  }
  $('statsRange').onchange = renderStats;
  const baseRender = render;
  render = function () { baseRender(); if (activeView === 'stats') renderStats(); };
  // Sonuç penceresinden “Oynadım” sonrası istatistik yenilensin
  if (state) render();
})();
