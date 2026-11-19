/* Son Çağrı v2 — animasyonlar ve sesler. app.js kancaları: FX.summon, FX.battle, FX.result, FX.after, FX.sound. */
(function () {
  'use strict';
  const layer = () => document.getElementById('fx-layer');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rect = el => el.getBoundingClientRect();
  const center = el => { const r = rect(el); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const soundOn = () => { try { return !!window.__scState().settings.sound; } catch { return false; } };
  const animOn = () => { try { return window.__scState().settings.animations !== false; } catch { return true; } };
  const RAR = { 1: '#b8bccb', 2: '#9fd0b0', 3: '#7fb6ff', 4: '#c28bff', 5: '#ffd36e' };
  let lastPoint = { x: innerWidth / 2, y: innerHeight / 2 };
  document.addEventListener('pointerdown', e => { lastPoint = { x: e.clientX, y: e.clientY }; }, true);

  /* ================= SES ================= */
  let ac = null, master = null;
  function audio() {
    try {
      if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .5; master.connect(ac.destination); }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    } catch { return null; }
  }
  function tone(f, len, { type = 'sine', vol = .12, delay = 0, to = null, attack = .008 } = {}) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + len);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + len + .05);
  }
  function noise(len, { vol = .2, delay = 0, freq = 1200, q = .8, type = 'bandpass' } = {}) {
    const a = audio(); if (!a) return;
    const n = Math.floor(a.sampleRate * len), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + delay;
    src.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master); src.start(t);
  }
  const SFX = {
    click() { tone(1400, .04, { type: 'triangle', vol: .05 }); },
    hit() { noise(.12, { vol: .35, freq: 900 }); tone(140, .12, { type: 'triangle', vol: .18, to: 60 }); },
    crit() { noise(.18, { vol: .45, freq: 1600 }); tone(220, .2, { type: 'sawtooth', vol: .09, to: 70 }); tone(880, .15, { vol: .06, delay: .02 }); },
    slash() { noise(.16, { vol: .3, freq: 3000, q: 2, type: 'highpass' }); },
    arrow() { noise(.1, { vol: .18, freq: 4000, q: 3 }); tone(900, .08, { vol: .03, to: 1400 }); },
    magic() { [523, 784, 1046].forEach((f, i) => tone(f, .35, { vol: .06, delay: i * .05 })); tone(200, .5, { type: 'sawtooth', vol: .04, to: 60 }); },
    heal() { [659, 880, 1175].forEach((f, i) => tone(f, .45, { vol: .07, delay: i * .08 })); },
    shield() { tone(520, .6, { type: 'triangle', vol: .08 }); tone(1040, .5, { vol: .04, delay: .02 }); },
    hurt() { tone(110, .18, { type: 'square', vol: .06, to: 55 }); noise(.08, { vol: .2, freq: 500 }); },
    death() { tone(300, .6, { type: 'sawtooth', vol: .06, to: 40 }); noise(.4, { vol: .2, freq: 700 }); },
    bomb() { noise(.6, { vol: .6, freq: 300, type: 'lowpass' }); tone(80, .5, { type: 'sine', vol: .25, to: 30 }); },
    coin() { tone(1568, .12, { vol: .06 }); tone(2093, .18, { vol: .05, delay: .06 }); },
    level() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, .3, { type: 'triangle', vol: .07, delay: i * .07 })); },
    build() { [0, .12, .24].forEach(d => { noise(.08, { vol: .3, freq: 600, delay: d }); tone(180, .08, { type: 'square', vol: .04, delay: d }); }); tone(784, .4, { vol: .06, delay: .4 }); },
    craft() { tone(1200, .25, { type: 'triangle', vol: .08 }); noise(.08, { vol: .25, freq: 2500 }); tone(1800, .3, { vol: .04, delay: .05 }); },
    charge() { tone(110, 1.4, { type: 'sawtooth', vol: .05, to: 880, attack: .4 }); noise(1.4, { vol: .08, freq: 600 }); },
    reveal(stars) {
      if (stars >= 5) { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, .7, { type: 'triangle', vol: .09, delay: i * .07 })); tone(262, 1.4, { vol: .08 }); noise(.5, { vol: .15, freq: 5000, type: 'highpass' }); }
      else if (stars >= 4) { [587, 740, 880, 1175].forEach((f, i) => tone(f, .55, { vol: .08, delay: i * .06 })); }
      else tone(660 + stars * 110, .2, { type: 'triangle', vol: .06 });
    },
    victory() { [392, 523, 659, 784].forEach((f, i) => tone(f, .4, { type: 'triangle', vol: .1, delay: i * .12 })); tone(1046, 1.1, { vol: .09, delay: .5 }); tone(523, 1.1, { vol: .06, delay: .5 }); },
    defeat() { [392, 330, 262, 196].forEach((f, i) => tone(f, .6, { type: 'sine', vol: .08, delay: i * .2 })); },
    summon() { SFX.charge(); },
    battle() { SFX.hit(); }
  };
  function play(kind, arg) { if (SFX[kind]) try { SFX[kind](arg); } catch { } }
  // Düğme tıklama sesi
  document.addEventListener('click', e => { if (e.target.closest('button, .btn, [data-act]') && soundOn()) play('click'); }, true);

  /* ================= YARDIMCILAR ================= */
  function spawn(cls, x, y, html = '') {
    const el = document.createElement('div'); el.className = 'fx ' + cls; el.style.left = x + 'px'; el.style.top = y + 'px'; el.innerHTML = html;
    layer().appendChild(el); return el;
  }
  function floatText(el, text, cls) {
    if (!el) return; const c = center(el), r = rect(el);
    const f = spawn('float-num ' + cls, c.x + (Math.random() - .5) * r.width * .3, r.top + r.height * .35, text);
    setTimeout(() => f.remove(), 1300);
  }
  function burst(x, y, color, n = 14, spread = 70) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = spread * (.4 + Math.random() * .6);
      const p = spawn('spark', x, y); p.style.background = color; p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d + 'px');
      setTimeout(() => p.remove(), 800);
    }
  }
  function projectile(from, to, cls, ms = 260) {
    const a = center(from), b = center(to), p = spawn('proj ' + cls, a.x, a.y);
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    p.style.transform = 'translate(-50%,-50%) rotate(' + ang + 'deg)';
    p.style.transition = 'left ' + ms + 'ms cubic-bezier(.4,0,.8,.6), top ' + ms + 'ms cubic-bezier(.4,0,.8,.6)';
    requestAnimationFrame(() => { p.style.left = b.x + 'px'; p.style.top = b.y + 'px'; });
    setTimeout(() => p.remove(), ms + 40);
    return wait(ms);
  }
  function mark(el, cls, ms = 600) { if (!el) return; const c = center(el), m = spawn(cls, c.x, c.y); setTimeout(() => m.remove(), ms); }
  function klass(el, cls, ms) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); if (ms) setTimeout(() => el.classList.remove(cls), ms); }
  function bars(cards, before, after) {
    cards.forEach((card, i) => {
      const b = before[i], a = after[i]; if (!b || !a || !card) return;
      const span = card.querySelector('.health span'); if (!span || b.hp === a.hp) return;
      span.style.transition = 'none'; span.style.width = (b.hp / b.maxhp * 100) + '%'; void span.offsetWidth;
      span.style.transition = 'width .55s cubic-bezier(.2,.8,.3,1) .12s'; span.style.width = (a.hp / a.maxhp * 100) + '%';
    });
  }
  function shake(intensity = 1) { const m = document.getElementById('main-content'); if (!m) return; m.style.setProperty('--shake', intensity); klass(m, 'screen-shake', 380); }

  /* ================= SAVAŞ ================= */
  async function battle(before, after, info) {
    if (!info.anim) { if (info.sound) play('hit'); return; }
    const S = info.sound;
    const enemyCards = [...document.querySelectorAll('.enemy-card')], heroCards = [...document.querySelectorAll('.battle-hero')];
    const actorIdx = before.actor, actor = before.heroes[actorIdx], actorCard = heroCards[actorIdx];
    const kind = info.auto ? guessKind(before, after) : info.kind;
    const dmgE = before.enemies.map((e, i) => ({ i, d: e.hp - (after.enemies[i]?.hp ?? e.hp), died: e.hp > 0 && (after.enemies[i]?.hp ?? 1) <= 0, heal: (after.enemies[i]?.hp ?? 0) - e.hp }));
    const hitE = dmgE.filter(x => x.d > 0);
    // Kahraman eylemi kısmı: enemyTurn aynı anda işlendiyse kahraman hasarlarını ikinci aşamada göster
    const heroDelta = before.heroes.map((h, i) => ({ i, d: (after.heroes[i]?.hp ?? h.hp) - h.hp, sh: (after.heroes[i]?.shield || 0) - (h.shield || 0) }));
    // hasar çubukları önce eski hâlinde dursun
    bars(enemyCards, before.enemies, after.enemies);
    const heroBarsLater = () => bars(heroCards, before.heroes, after.heroes);
    heroCards.forEach((c, i) => { const s = c.querySelector('.health span'); if (s && before.heroes[i]) { s.style.transition = 'none'; s.style.width = (before.heroes[i].hp / before.heroes[i].maxhp * 100) + '%'; } });

    if (actorCard) klass(actorCard, 'lunge', 420);
    const cls = actor?.cls;
    const isSkill = kind === 'skill';
    // 1) saldırı görseli
    if (kind === 'attack' || (isSkill && ['warrior', 'archer', 'mage', 'rogue'].includes(cls)) || kind === 'bomb') {
      const targets = hitE.length ? hitE : [];
      if (kind === 'bomb') { S && play('bomb'); targets.forEach(t => mark(enemyCards[t.i], 'boom', 700)); shake(1.4); await wait(120); }
      else if (cls === 'archer') { S && play('arrow'); await Promise.all(targets.map(t => projectile(actorCard, enemyCards[t.i], isSkill ? 'arrow double' : 'arrow'))); }
      else if (cls === 'mage') { S && play('magic'); await Promise.all(targets.map(t => projectile(actorCard, enemyCards[t.i], 'orb', 340))); targets.forEach(t => mark(enemyCards[t.i], 'void-burst', 650)); }
      else { await wait(150); S && play(isSkill ? 'slash' : 'hit'); targets.forEach(t => mark(enemyCards[t.i], cls === 'rogue' ? 'slash x' : 'slash', 450)); }
      targets.forEach(t => {
        const card = enemyCards[t.i]; klass(card, 'hurt', 420);
        const big = isSkill || t.d >= (actor?.atk || 0) * 1.4;
        floatText(card, '−' + t.d, big ? 'dmg crit' : 'dmg');
        if (big) { S && play('crit'); shake(isSkill ? 1 : .6); }
        if (t.died) { setTimeout(() => { klass(card, 'dying'); S && play('death'); const c = center(card); burst(c.x, c.y, '#ffb48a', 18, 90); }, 200); }
      });
    }
    if (kind === 'guard') { S && play('shield'); mark(actorCard, 'shield-dome', 800); }
    if (isSkill && cls === 'guardian') { S && play('shield'); heroCards.forEach(c => mark(c, 'shield-dome', 900)); }
    if ((isSkill && (cls === 'healer' || cls === 'bard')) || kind === 'potion' || kind === 'antidote') {
      S && play('heal');
      heroDelta.filter(x => x.d > 0).forEach(x => { mark(heroCards[x.i], cls === 'bard' && isSkill ? 'notes' : 'heal-ray', 900); floatText(heroCards[x.i], '+' + x.d, 'heal'); });
    }
    heroDelta.filter(x => x.sh > 0).forEach(x => floatText(heroCards[x.i], '+' + x.sh + ' ◇', 'shield'));
    // 2) düşman turu (eğer işlendiyse)
    const enemyTurn = after.round > before.round || after.status === 'lost';
    if (enemyTurn) {
      await wait(480);
      const living = enemyCards.filter((c, i) => (after.enemies[i]?.hp || 0) > 0);
      living.forEach((c, k) => setTimeout(() => klass(c, 'enemy-lunge', 420), k * 120));
      await wait(220);
      heroBarsLater();
      let hurt = false;
      heroDelta.filter(x => x.d < 0).forEach(x => { klass(heroCards[x.i], 'hurt', 420); floatText(heroCards[x.i], '−' + (-x.d), 'dmg taken'); hurt = true; if ((after.heroes[x.i]?.hp || 0) <= 0) setTimeout(() => klass(heroCards[x.i], 'fallen'), 250); });
      if (hurt) { S && play('hurt'); shake(.5); }
      dmgE.filter(x => x.heal > 0).forEach(x => floatText(enemyCards[x.i], '+' + x.heal, 'heal'));
      after.enemies.forEach((e, i) => { if (e.charging && !before.enemies[i]?.charging) { klass(enemyCards[i], 'warn', 1200); floatText(enemyCards[i], '⚡ HAZIRLANIYOR', 'warn-text'); } });
    } else heroBarsLater();
  }
  function guessKind(before, after) {
    const a = before.heroes[before.actor]; if (!a) return 'attack';
    const aa = after.heroes[before.actor];
    if (aa && aa.cd === 3 && a.cd === 0) return 'skill';
    if (aa && aa.guard) return 'guard';
    return 'attack';
  }
  function result(b, { sound } = {}) {
    if (!animOn()) return;
    const win = b.status === 'won', retreat = b.status === 'retreated';
    if (retreat) return;
    const o = spawn('result-banner ' + (win ? 'win' : 'lose'), innerWidth / 2, innerHeight * .38, '<div class="rays"></div><strong>' + (win ? 'ZAFER!' : 'YENİLGİ') + '</strong><small>' + (win ? b.floor + '. kat fethedildi' : 'Birlik geri çekildi') + '</small>');
    sound && play(win ? 'victory' : 'defeat');
    if (win) { for (let i = 0; i < 4; i++) setTimeout(() => burst(innerWidth * (.3 + Math.random() * .4), innerHeight * (.3 + Math.random() * .2), ['#ffd36e', '#fff1c4', '#c28bff'][i % 3], 22, 160), i * 180); }
    setTimeout(() => o.classList.add('out'), 1900); setTimeout(() => o.remove(), 2500);
  }
  function intro(b, sound) {
    const region = window.SC && SC.region ? SC.region(b.floor) : null;
    const bossE = b.enemies.find(e => e.boss);
    const o = spawn('battle-intro' + (bossE ? ' boss' : ''), innerWidth / 2, innerHeight * .42,
      (bossE ? '<span class="warn">⚠ BOSS</span><strong>' + bossE.name + '</strong>' : '<span>' + (b.mode === 'defense' ? 'ÜS SAVUNMASI' : b.floor + '. KAT') + '</span><strong>' + (region ? region.name : '') + '</strong>') + '<i></i>');
    if (sound) { if (bossE) { play('charge'); setTimeout(() => play('bomb'), 700); } else play('slash'); }
    setTimeout(() => o.classList.add('out'), bossE ? 1900 : 1200); setTimeout(() => o.remove(), bossE ? 2500 : 1700);
  }

  /* ================= GENEL: kaynaklar, seviye, bina ================= */
  const RES_ORDER = ['gold', 'crystals', 'food', 'essence'];
  const RES_ICON = { gold: '●', crystals: '◆', food: '❖', essence: '✦' }, RES_COL = { gold: '#ffd36e', crystals: '#c28bff', food: '#8fd18f', essence: '#ffe9b0' };
  function after(before, s, opts) {
    if (!opts.anim) return;
    // Savaş başlangıcı
    if (s.battle?.status === 'active' && !(before.battle?.status === 'active')) setTimeout(() => intro(s.battle, opts.sound), 60);
    // Kaynak kazanımları
    const resEls = [...document.querySelectorAll('.topbar .resource')];
    RES_ORDER.forEach((k, i) => {
      const d = Math.round((s.r[k] || 0) - (before.r?.[k] || 0)), target = resEls[i]; if (!target || !d) return;
      if (d > 0) {
        const n = Math.min(10, 3 + Math.floor(Math.log10(d + 1) * 2)), tc = center(target);
        for (let j = 0; j < n; j++) setTimeout(() => {
          const p = spawn('coin-fly', lastPoint.x + (Math.random() - .5) * 60, lastPoint.y + (Math.random() - .5) * 40, RES_ICON[k]); p.style.color = RES_COL[k];
          requestAnimationFrame(() => { p.style.left = tc.x + 'px'; p.style.top = tc.y + 'px'; p.style.opacity = '.2'; p.style.transform = 'translate(-50%,-50%) scale(.6)'; });
          setTimeout(() => { p.remove(); klass(target, 'res-pop', 300); }, 620);
          if (opts.sound && j % 3 === 0) setTimeout(() => play('coin'), 600);
        }, j * 55);
        const tag = spawn('res-delta up', tc.x, tc.y + 16, '+' + d.toLocaleString('tr-TR')); setTimeout(() => tag.remove(), 1400);
      } else { const tc = center(target), tag = spawn('res-delta down', tc.x, tc.y + 16, '−' + (-d).toLocaleString('tr-TR')); setTimeout(() => tag.remove(), 1200); }
    });
    // Seviye atlama ve yıldız
    const prev = new Map((before.heroes || []).map(h => [h.id, h]));
    const ups = [];
    s.heroes.forEach(h => { const p = prev.get(h.id); if (!p) return; if (h.stars > p.stars) ups.push({ h, t: 'star' }); else if (h.level > p.level) ups.push({ h, t: 'level', n: h.level }); });
    ups.slice(0, 3).forEach((u, i) => setTimeout(() => {
      const o = spawn('level-pop ' + u.t, innerWidth / 2, innerHeight * (.28 + i * .1), u.t === 'star' ? '<b>★ YILDIZ YÜKSELDİ</b><span>' + u.h.name + ' · ' + u.h.stars + ' yıldız</span>' : '<b>▲ SEVİYE ' + u.n + '</b><span>' + u.h.name + '</span>');
      opts.sound && play(u.t === 'star' ? 'reveal' : 'level', 5);
      if (u.t === 'star') burst(innerWidth / 2, innerHeight * .3, '#ffd36e', 26, 150);
      setTimeout(() => o.classList.add('out'), 1600); setTimeout(() => o.remove(), 2100);
    }, 300 + i * 500));
    // Bina geliştirme
    Object.keys(s.buildings || {}).forEach(k => {
      if ((s.buildings[k] || 0) > (before.buildings?.[k] || 0)) {
        opts.sound && play('build');
        [document.getElementById('building-' + k), document.querySelector('.map-pin[data-key="' + k + '"]')].forEach(el => { if (!el) return; klass(el, 'built', 1200); const c = center(el); burst(c.x, c.y, '#e8d2a0', 16, 70); });
      }
    });
    // Üretim
    if ((s.counters?.craft || 0) > (before.counters?.craft || 0)) opts.sound && play('craft');
    // Yeni gün
    if (s.day > (before.day || s.day) && !s.battle?.status?.match(/won|lost|retreated/)) { const o = spawn('day-sweep', innerWidth / 2, innerHeight * .2, '☀ GÜN ' + s.day); setTimeout(() => o.remove(), 1800); }
  }

  /* ================= ÇAĞIRMA SAHNESİ ================= */
  function summon(cards, opts) {
    const best = Math.max(...cards.map(c => c.stars)), color = RAR[best] || '#fff', S = opts.sound;
    const ov = document.createElement('div'); ov.className = 'summon-scene tier' + best; ov.style.setProperty('--tier', color);
    ov.innerHTML = '<div class="ss-bg"></div><div class="ss-portal"><div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div><div class="core"></div></div>' +
      '<div class="ss-particles">' + Array.from({ length: 36 }, (_, i) => '<i style="--a:' + (i * 10) + 'deg;--d:' + (180 + (i % 5) * 40) + 'px;animation-delay:' + (i % 12) * .08 + 's"></i>').join('') + '</div>' +
      '<div class="ss-flash"></div><div class="ss-top"><button class="ss-btn" data-ss="all">Hepsini aç</button><button class="ss-btn" data-ss="skip">Atla ⏭</button></div>' +
      '<div class="ss-cards ' + (cards.length === 1 ? 'single' : '') + '">' + cards.map((c, i) => '<div class="ss-card r' + c.stars + '" data-i="' + i + '"><div class="ss-inner"><div class="ss-back"><span>✦</span><em>' + '★'.repeat(Math.min(c.stars, 3) > 0 ? 0 : 0) + '</em></div><div class="ss-front">' + c.html + '</div></div></div>').join('') + '</div>' +
      '<div class="ss-title"></div><div class="ss-bottom"><button class="ss-btn ghost" data-ss="roster">Kahramanlara git</button><button class="ss-btn gold" data-ss="close">Devam et</button></div>';
    document.body.appendChild(ov);
    const cardEls = [...ov.querySelectorAll('.ss-card')];
    let revealed = 0, skipping = false;
    const flip = (el, quick) => {
      if (el.classList.contains('open')) return;
      const st = cards[el.dataset.i].stars;
      el.classList.add('open'); revealed++;
      if (st >= 4 && !quick) { const c = center(el); burst(c.x, c.y, RAR[st], st >= 5 ? 30 : 18, st >= 5 ? 170 : 110); klass(ov, 'pulse' + st, 700); }
      S && play('reveal', st);
      if (revealed === cardEls.length) done();
    };
    const done = () => {
      ov.classList.add('finished');
      ov.querySelector('.ss-title').innerHTML = '<strong>' + (best >= 5 ? 'Efsanevi bir kader uyandı!' : best >= 4 ? 'Nadir bir kader uyandı.' : 'Çağrına cevap verdiler.') + '</strong><span>' + cards.length + ' yeni kahraman birliğine katıldı.</span>';
    };
    const sequence = async () => {
      S && play('charge');
      await wait(skipping ? 0 : 1350);
      ov.classList.add('flashed'); if (best >= 4) shakeEl(ov);
      await wait(380); ov.classList.add('cards-in');
      await wait(650);
      for (const el of cardEls) {
        if (skipping) break;
        const st = cards[el.dataset.i].stars;
        if (st >= 4) { el.classList.add('glowing'); await wait(st >= 5 ? 900 : 550); }
        if (skipping) break;
        flip(el); await wait(cards.length === 1 ? 0 : 170);
      }
    };
    ov.addEventListener('click', e => {
      e.stopPropagation(); e.preventDefault();
      const b = e.target.closest('[data-ss]'), card = e.target.closest('.ss-card');
      if (card && ov.classList.contains('cards-in')) { flip(card); return; }
      if (!b) return;
      const k = b.dataset.ss;
      if (k === 'all' || k === 'skip') { skipping = true; ov.classList.add('flashed', 'cards-in'); cardEls.forEach(el => flip(el, true)); }
      if (k === 'close' || k === 'roster') { ov.classList.add('out'); setTimeout(() => ov.remove(), 400); if (k === 'roster') opts.onRoster && opts.onRoster(); }
    }, true);
    sequence();
  }
  function shakeEl(el) { klass(el, 'ss-shake', 500); }

  window.FX = { summon, battle, result, after, sound: k => play(k), click: () => soundOn() && play('click'), play };
})();
