/* Son Çağrı v2 — kodla çizilen görseller: düşmanlar ve yerleşim binaları (SVG). */
(function () {
  'use strict';
  let uid = 0;
  const PAL = [
    { body: '#5b7a4c', dark: '#24321e', acc: '#a8d08d', eye: '#ffd36e', aura: '#8eb49b' },   // Unutulmuş Eşik
    { body: '#5a5578', dark: '#211f33', acc: '#b6d36a', eye: '#c9ff6b', aura: '#a3b974' },   // Fısıldayan Derinlik
    { body: '#7a9ab6', dark: '#2a3d4d', acc: '#d6f1ff', eye: '#8fe3ff', aura: '#83bdd5' },   // Sessiz Kış
    { body: '#8a3d2e', dark: '#2e140e', acc: '#ff8a4c', eye: '#ffd23f', aura: '#d48b73' },   // Kızıl Kırılma
    { body: '#463470', dark: '#170f28', acc: '#c7a6ff', eye: '#ff7bf2', aura: '#b395e3' }    // Yıldızsız Gökyüzü
  ];
  const SHAPE_BY_NAME = { 'Kül Kurdu': 'beast', 'Yitik Muhafız': 'knight', 'Diken Avcısı': 'spirit', 'Mezar Bekçisi': 'knight', 'Zehir Dokuyucu': 'spider', 'Kemik Avcısı': 'beast',
    'Buz Hayaleti': 'spirit', 'Donmuş Şövalye': 'knight', 'Kar Pençesi': 'beast', 'Lav Yılanı': 'serpent', 'Kül Celladı': 'knight', 'Kor Devi': 'golem',
    'Boşluk Yiyen': 'spirit', 'Ayna Şövalyesi': 'knight', 'Son Gözlemci': 'eye' };

  function defs(id, p) {
    return '<defs><radialGradient id="g' + id + '" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="' + p.body + '"/><stop offset="1" stop-color="' + p.dark + '"/></radialGradient>' +
      '<radialGradient id="a' + id + '"><stop offset="0" stop-color="' + p.aura + '" stop-opacity=".55"/><stop offset="1" stop-color="' + p.aura + '" stop-opacity="0"/></radialGradient>' +
      '<filter id="f' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>';
  }
  const eyes = (p, id, pts, r = 3.2) => pts.map(([x, y]) => '<g class="eye"><circle cx="' + x + '" cy="' + y + '" r="' + (r * 2.2) + '" fill="' + p.eye + '" opacity=".35" filter="url(#f' + id + ')"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + p.eye + '"/></g>').join('');
  const shapes = {
    beast(p, id) {
      return '<path d="M22 92 C20 70 30 52 44 46 L36 22 L52 38 C56 37 64 37 68 38 L84 22 L76 46 C90 52 100 70 98 92 Z" fill="url(#g' + id + ')" stroke="' + p.dark + '" stroke-width="2"/>' +
        '<path d="M44 74 Q60 96 76 74 L70 80 L66 74 L60 82 L54 74 L50 80 Z" fill="' + p.dark + '"/><path d="M52 76 l3 7 l3 -7 M62 76 l3 7 l3 -7" fill="#f4ecd8"/>' +
        '<path d="M30 60 Q40 54 46 60 M90 60 Q80 54 74 60" stroke="' + p.acc + '" stroke-width="2" fill="none" opacity=".6"/>' + eyes(p, id, [[48, 60], [72, 60]]);
    },
    knight(p, id) {
      return '<path d="M20 100 Q22 72 38 66 L82 66 Q98 72 100 100 Z" fill="url(#g' + id + ')" stroke="' + p.dark + '" stroke-width="2"/>' +
        '<path d="M38 66 Q30 58 34 50 L44 56 Z M82 66 Q90 58 86 50 L76 56 Z" fill="' + p.acc + '" opacity=".55"/>' +
        '<path d="M40 64 L40 34 Q60 12 80 34 L80 64 Q60 72 40 64 Z" fill="url(#g' + id + ')" stroke="' + p.acc + '" stroke-width="1.6"/>' +
        '<path d="M60 18 L60 64" stroke="' + p.acc + '" stroke-width="1.2" opacity=".5"/><rect x="44" y="42" width="32" height="6" rx="3" fill="' + p.dark + '"/>' +
        '<rect class="eye" x="46" y="43.2" width="28" height="3.6" rx="1.8" fill="' + p.eye + '"/><rect x="46" y="43.2" width="28" height="3.6" rx="1.8" fill="' + p.eye + '" filter="url(#f' + id + ')" opacity=".8"/>';
    },
    spirit(p, id) {
      return '<path class="wisp" d="M30 96 Q34 80 32 64 Q30 30 60 20 Q90 30 88 64 Q86 80 90 96 Q82 88 76 98 Q70 88 62 100 Q54 88 46 98 Q40 88 30 96 Z" fill="url(#g' + id + ')" stroke="' + p.acc + '" stroke-width="1.4" opacity=".95"/>' +
        '<path d="M42 50 Q60 34 78 50 Q76 66 60 70 Q44 66 42 50 Z" fill="' + p.dark + '"/>' + eyes(p, id, [[52, 54], [68, 54]], 2.8) +
        '<circle class="orb" cx="60" cy="84" r="6" fill="' + p.acc + '" filter="url(#f' + id + ')"/><circle cx="60" cy="84" r="3" fill="#fff"/>';
    },
    spider(p, id) {
      const legs = [[-1, 0], [-1, 1], [-1, 2], [1, 0], [1, 1], [1, 2]].map(([s, i]) => '<path d="M60 62 Q' + (60 + s * (26 + i * 6)) + ' ' + (40 + i * 8) + ' ' + (60 + s * (40 + i * 4)) + ' ' + (70 + i * 10) + '" stroke="' + p.dark + '" stroke-width="4" fill="none" stroke-linecap="round"/>').join('');
      return legs + '<ellipse cx="60" cy="74" rx="22" ry="18" fill="url(#g' + id + ')" stroke="' + p.acc + '" stroke-width="1.4"/><circle cx="60" cy="54" r="14" fill="url(#g' + id + ')"/>' +
        '<path d="M52 82 Q60 90 68 82" stroke="' + p.acc + '" stroke-width="2" fill="none"/>' + eyes(p, id, [[54, 52], [66, 52], [57, 46], [63, 46]], 2.2);
    },
    serpent(p, id) {
      return '<path d="M18 100 Q16 78 40 78 Q70 78 70 60 Q70 44 56 40 Q44 36 46 26 Q50 14 66 16 Q86 20 86 40 Q86 58 72 70 Q56 86 84 96 Q96 100 102 100 Z" fill="url(#g' + id + ')" stroke="' + p.dark + '" stroke-width="2"/>' +
        '<path d="M30 92 Q46 84 62 88 M58 30 Q70 26 78 34" stroke="' + p.acc + '" stroke-width="2" fill="none" opacity=".7"/><path d="M64 20 Q60 12 54 14 M70 18 Q76 10 82 14" stroke="' + p.acc + '" stroke-width="2" fill="none"/>' +
        eyes(p, id, [[62, 26], [74, 26]], 2.6) + '<path d="M66 34 l-2 6 M70 34 l2 6" stroke="#f4ecd8" stroke-width="1.6"/>';
    },
    golem(p, id) {
      return '<path d="M16 102 L22 70 L36 60 L84 60 L98 70 L104 102 Z" fill="url(#g' + id + ')" stroke="' + p.dark + '" stroke-width="2"/>' +
        '<path d="M38 60 L40 30 L60 20 L80 30 L82 60 Z" fill="url(#g' + id + ')" stroke="' + p.dark + '" stroke-width="2"/>' +
        '<path d="M44 34 L52 44 M76 34 L68 46 M30 76 L40 86 M90 74 L82 90 M56 70 L64 82" stroke="' + p.acc + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M44 34 L52 44 M76 34 L68 46 M30 76 L40 86 M90 74 L82 90 M56 70 L64 82" stroke="' + p.acc + '" stroke-width="5" opacity=".4" filter="url(#f' + id + ')"/>' + eyes(p, id, [[51, 44], [69, 44]], 3.4);
    },
    eye(p, id) {
      return '<g class="spin-slow"><path d="M60 10 L66 30 L86 18 L78 38 L102 40 L82 52 L98 70 L76 66 L74 90 L60 74 L46 90 L44 66 L22 70 L38 52 L18 40 L42 38 L34 18 L54 30 Z" fill="' + p.dark + '" stroke="' + p.acc + '" stroke-width="1.2" opacity=".9"/></g>' +
        '<circle cx="60" cy="52" r="22" fill="#f1e9ff"/><circle cx="60" cy="52" r="13" fill="url(#g' + id + ')"/><circle class="eye" cx="60" cy="52" r="6" fill="' + p.eye + '"/><circle cx="56" cy="48" r="2.4" fill="#fff"/>' +
        '<circle cx="60" cy="52" r="24" fill="none" stroke="' + p.eye + '" stroke-width="2" opacity=".5" filter="url(#f' + id + ')"/>';
    }
  };
  function crown(p, id, region) {
    const spikes = region === 2 ? 'M36 30 L42 6 L50 24 L60 0 L70 24 L78 6 L84 30 Z' : region === 3 ? 'M34 30 L40 10 L48 22 L54 2 L60 18 L66 2 L72 22 L80 10 L86 30 Z' : region === 4 ? 'M38 30 L60 -2 L82 30 L70 22 L60 10 L50 22 Z' : 'M36 30 L40 12 L50 22 L60 6 L70 22 L80 12 L84 30 Z';
    return '<path d="' + spikes + '" fill="' + p.acc + '" stroke="' + p.dark + '" stroke-width="1.5"/><circle cx="60" cy="22" r="3.4" fill="' + p.eye + '"/>' +
      '<path d="' + spikes + '" fill="' + p.acc + '" opacity=".4" filter="url(#f' + id + ')"/>';
  }
  function enemy(e, region = 0, index = 0) {
    const p = PAL[Math.max(0, Math.min(4, region | 0))], id = 'e' + (++uid);
    let shape = SHAPE_BY_NAME[e.name] || ['beast', 'knight', 'spirit'][e.kind || 0];
    if (e.boss) shape = region === 3 || region === 2 ? 'golem' : region === 4 ? 'eye' : region === 1 ? 'spirit' : 'knight';
    const body = shapes[shape](p, id);
    const boss = e.boss ? '<g class="boss-crown" transform="translate(0,' + (shape === 'eye' ? -6 : shape === 'golem' ? 2 : -2) + ')">' + crown(p, id, region) + '</g>' : '';
    const aura = '<circle class="aura" cx="60" cy="62" r="' + (e.boss ? 56 : 44) + '" fill="url(#a' + id + ')"/>';
    const ring = e.boss ? '<g class="spin-slow"><circle cx="60" cy="62" r="54" fill="none" stroke="' + p.aura + '" stroke-width="1" stroke-dasharray="3 7" opacity=".7"/></g>' : '';
    return '<svg class="enemy-svg ' + shape + (e.boss ? ' boss' : '') + (e.charging ? ' charging' : '') + '" viewBox="6 2 108 108" style="--d:' + (index * .37).toFixed(2) + 's">' + defs(id, p) + aura + ring + '<g class="body">' + body + boss + '</g></svg>';
  }

  /* ---------- Binalar ---------- */
  const W = { wall: '#6d6a74', wallD: '#47444f', roof: '#7a3f35', roofD: '#55291f', wood: '#6b4a32', woodD: '#45301f', win: '#ffd88a', stone: '#8a8792' };
  function lit(x, y, w, h, on) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1" fill="' + (on ? W.win : '#2a2c38') + '"' + (on ? ' class="win"' : '') + '/>'; }
  function smoke(x, y) { return '<g class="smoke"><circle cx="' + x + '" cy="' + y + '" r="3"/><circle cx="' + x + '" cy="' + y + '" r="3"/><circle cx="' + x + '" cy="' + y + '" r="3"/></g>'; }
  function flag(x, y, color) { return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y - 16) + '" stroke="#3a3440" stroke-width="1.4"/><path class="flag" d="M' + x + ' ' + (y - 16) + ' l12 3 l-12 4 Z" fill="' + color + '"/>'; }
  const B = {
    hall(l) {
      const two = l >= 3;
      return '<rect x="22" y="' + (two ? 34 : 44) + '" width="56" height="' + (two ? 32 : 22) + '" fill="' + W.wall + '"/><path d="M16 ' + (two ? 36 : 46) + ' L50 ' + (two ? 12 : 24) + ' L84 ' + (two ? 36 : 46) + ' Z" fill="' + W.roof + '"/><path d="M50 ' + (two ? 12 : 24) + ' L84 ' + (two ? 36 : 46) + ' L76 ' + (two ? 36 : 46) + ' Z" fill="' + W.roofD + '"/>' +
        '<rect x="44" y="52" width="12" height="14" rx="6" fill="' + W.woodD + '"/>' + lit(28, 52, 8, 7, l >= 1) + lit(64, 52, 8, 7, l >= 2) + (two ? lit(30, 40, 7, 6, l >= 3) + lit(63, 40, 7, 6, l >= 4) : '') +
        (l >= 4 ? '<rect x="8" y="40" width="12" height="26" fill="' + W.wallD + '"/><path d="M6 42 L14 30 L22 42 Z" fill="' + W.roof + '"/><rect x="80" y="40" width="12" height="26" fill="' + W.wallD + '"/><path d="M78 42 L86 30 L94 42 Z" fill="' + W.roof + '"/>' : '') +
        flag(50, two ? 12 : 24, 'var(--accent,#d5b376)');
    },
    forge(l) {
      return '<rect x="26" y="42" width="48" height="24" fill="' + W.stone + '"/><path d="M22 44 L50 30 L78 44 Z" fill="#4d4a55"/><rect x="58" y="' + (24 - l) + '" width="9" height="' + (20 + l) + '" fill="' + W.wallD + '"/>' + smoke(62.5, 22 - l) +
        '<rect x="34" y="50" width="16" height="16" rx="2" fill="#2a1c16"/><rect class="fire" x="36" y="54" width="12" height="12" rx="2" fill="#ff8a3d"/>' + (l >= 2 ? '<g class="sparks"><circle cx="42" cy="52" r="1"/><circle cx="45" cy="50" r=".9"/><circle cx="39" cy="51" r=".8"/></g>' : '') +
        '<path d="M56 62 h14 v-3 h-4 v-3 h-6 v3 h-4 Z" fill="#3a3a44"/>';
    },
    kitchen(l) {
      return '<rect x="26" y="44" width="48" height="22" fill="#9a7b5a"/><path d="M20 46 L50 28 L80 46 Z" fill="#a14f3a"/><rect x="34" y="' + (30 - l) + '" width="7" height="' + (12 + l) + '" fill="' + W.wallD + '"/>' + smoke(37.5, 28 - l) +
        lit(32, 50, 10, 8, true) + '<rect x="52" y="52" width="10" height="14" rx="5" fill="' + W.woodD + '"/><ellipse cx="72" cy="64" rx="6" ry="3" fill="#2d2d35"/><path class="steam" d="M70 60 q2 -4 0 -7 M74 60 q2 -4 0 -7" stroke="#ddd" stroke-width="1" fill="none" opacity=".6"/>';
    },
    infirmary(l) {
      return '<path d="M18 66 L50 30 L82 66 Z" fill="#e8e2d4"/><path d="M50 30 L82 66 L74 66 Z" fill="#c9c1b0"/><rect x="45" y="50" width="10" height="16" fill="#8a3b3b"/>' +
        '<path d="M50 38 v10 M45 43 h10" stroke="#d94b4b" stroke-width="3"/>' + (l >= 3 ? '<path d="M14 66 L26 50 L38 66 Z" fill="#d9d2c2"/>' : '') + (l >= 2 ? '<circle class="win" cx="50" cy="43" r="8" fill="#ff9b9b" opacity=".25"/>' : '');
    },
    farm(l) {
      const rows = Array.from({ length: 2 + Math.min(l, 4) }, (_, i) => '<path d="M' + (12 + i * 2) + ' ' + (60 + i * 2.2) + ' h' + (42 - i * 2) + '" stroke="#6f8f3f" stroke-width="2.4" stroke-dasharray="3 2"/>').join('');
      return '<ellipse cx="38" cy="66" rx="30" ry="9" fill="#4f5b2c"/>' + rows + '<rect x="58" y="42" width="26" height="24" fill="#8b3a2e"/><path d="M54 44 L71 30 L88 44 Z" fill="#5a2a22"/><rect x="66" y="52" width="10" height="14" fill="#3e1f19"/>' +
        (l >= 3 ? '<g class="mill"><line x1="20" y1="44" x2="20" y2="60" stroke="#6b4a32" stroke-width="2"/><g class="blades" style="transform-origin:20px 44px"><path d="M20 44 l0 -12 M20 44 l12 0 M20 44 l0 12 M20 44 l-12 0" stroke="#d8c9a8" stroke-width="2.4"/></g></g>' : '');
    },
    lab(l) {
      return '<rect x="36" y="' + (36 - l * 2) + '" width="28" height="' + (30 + l * 2) + '" fill="#5a5470"/><path d="M34 ' + (38 - l * 2) + ' Q50 ' + (16 - l * 2) + ' 66 ' + (38 - l * 2) + ' Z" fill="#6c4fa1"/>' +
        '<circle class="glow" cx="50" cy="' + (28 - l * 2) + '" r="3" fill="#b8ff9a"/>' + lit(44, 44, 12, 9, true) + '<g class="bubbles"><circle cx="47" cy="50" r="1.4"/><circle cx="52" cy="50" r="1"/><circle cx="50" cy="50" r="1.2"/></g>' +
        '<path d="M70 66 l3 -12 h4 l3 12 Z" fill="#7cd38c" opacity=".85"/>';
    },
    watch(l) {
      const h = 34 + l * 4;
      return '<path d="M42 66 L46 ' + (66 - h) + ' L54 ' + (66 - h) + ' L58 66 Z" fill="' + W.wood + '"/><path d="M42 66 L54 ' + (66 - h * .5) + ' M58 66 L46 ' + (66 - h * .5) + '" stroke="' + W.woodD + '" stroke-width="1.4"/>' +
        '<rect x="40" y="' + (60 - h) + '" width="20" height="9" fill="' + W.woodD + '"/><path d="M38 ' + (60 - h) + ' L50 ' + (50 - h) + ' L62 ' + (60 - h) + ' Z" fill="' + W.roof + '"/>' +
        '<circle class="lamp" cx="50" cy="' + (64.5 - h) + '" r="2.4" fill="#ffd36e"/>' + flag(50, 50 - h, '#86aeda');
    },
    library(l) {
      return '<rect x="20" y="40" width="60" height="26" fill="#cfc6b2"/><path d="M16 42 L50 24 L84 42 Z" fill="#8f8573"/>' +
        [26, 38, 56, 68].map(x => '<rect x="' + x + '" y="44" width="5" height="22" fill="#e9e1cf"/>').join('') + '<rect x="44" y="48" width="12" height="18" rx="6" fill="#3a3248"/>' +
        '<path class="glow" d="M50 30 l2 4 l4 1 l-4 1 l-2 4 l-2 -4 l-4 -1 l4 -1 Z" fill="#ad8fe6"/>' + (l >= 3 ? '<circle class="win" cx="50" cy="56" r="5" fill="#ad8fe6" opacity=".35"/>' : '');
    },
    wall(l) {
      const towers = 2 + Math.min(2, Math.floor(l / 2));
      let s = '<rect x="10" y="48" width="80" height="18" fill="' + W.stone + '"/>' + Array.from({ length: 10 }, (_, i) => '<rect x="' + (10 + i * 8) + '" y="44" width="5" height="5" fill="' + W.stone + '"/>').join('');
      for (let i = 0; i < towers; i++) { const x = 10 + i * (70 / (towers - 1)); s += '<rect x="' + (x - 5) + '" y="34" width="12" height="32" fill="' + W.wallD + '"/><path d="M' + (x - 7) + ' 36 L' + (x + 1) + ' 26 L' + (x + 9) + ' 36 Z" fill="' + W.roof + '"/>'; }
      return s + (l >= 2 ? '<path d="M14 70 l3 -6 l3 6 M26 70 l3 -6 l3 6 M70 70 l3 -6 l3 6 M82 70 l3 -6 l3 6" fill="#3a3a44"/>' : '');
    },
    market(l) {
      const stalls = Math.min(3, 1 + Math.floor(l / 2)), cols = ['#c94f4f', '#3f7fbf', '#d5b376'];
      return Array.from({ length: stalls }, (_, i) => { const x = 18 + i * 24; return '<rect x="' + x + '" y="50" width="20" height="16" fill="' + W.wood + '"/><path d="M' + (x - 3) + ' 50 L' + (x + 23) + ' 50 L' + (x + 20) + ' 40 L' + x + ' 40 Z" fill="' + cols[i] + '"/><path d="M' + (x - 3) + ' 50 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 4 0" fill="' + cols[i] + '" opacity=".8"/><circle class="coin" cx="' + (x + 10) + '" cy="56" r="2.2" fill="#ffd36e"/>'; }).join('');
    }
  };
  function building(key, level = 0) {
    const l = Math.max(0, Math.min(5, level | 0)), fn = B[key];
    if (!fn) return '';
    const body = fn(Math.max(1, l));
    const sparkle = l >= 5 ? '<g class="sparkle"><path d="M84 18 l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5 -3.5 l-3.5 -1.5 l3.5 -1.5 Z" fill="#ffe7a8"/><path d="M14 24 l1 2.5 l2.5 1 l-2.5 1 l-1 2.5 l-1 -2.5 l-2.5 -1 l2.5 -1 Z" fill="#ffe7a8"/></g>' : '';
    return '<svg class="bld ' + key + ' lv' + l + (l ? '' : ' ruin') + '" viewBox="0 0 100 76"><ellipse cx="50" cy="68" rx="42" ry="7" fill="#000" opacity=".28"/>' + body + sparkle + '</svg>';
  }
  window.ART = { enemy, building };
})();
