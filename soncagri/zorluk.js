/* Son Çağrı v2 — zorluk modları, yeni sınıflar ve kahraman çeşitliliği.
   engine.js'ten sonra, app.js'ten önce yüklenir. Oyun kurallarını Engine.prototype üzerinden genişletir. */
(function () {
  'use strict';
  const { Engine, CLASSES, TRAITS, SPECS, REGIONS, clamp } = SC;

  /* ---------- Zorluk ---------- */
  const DIFF = {
    easy:   { name: 'Kolay',  desc: 'Düşmanlar daha zayıf, başlangıç kaynakları bol. Hikâyenin tadını çıkar.', ehp: .72, eatk: .7,  loot: 1.1, start: 1.5 },
    normal: { name: 'Normal', desc: 'Dengeli meydan okuma. Önerilen deneyim.', ehp: 1, eatk: 1, loot: 1, start: 1 },
    hard:   { name: 'Zor',    desc: 'Güçlü düşmanlar, az kaynak; zaferlerin ödülü daha büyük.', ehp: 1.38, eatk: 1.3, loot: 1.3, start: .75 }
  };
  SC.DIFFICULTY = DIFF;
  const diff = s => DIFF[s && s.difficulty] || DIFF.normal;

  /* ---------- Yeni sınıflar ---------- */
  Object.assign(CLASSES, {
    rogue: { name: 'Suikastçı', icon: 'eye', skill: 'Gölge Darbesi', text: 'Zırhı tamamen deler; hedefin canı yarının altındaysa iki kat vurur.', hp: 88, atk: 29, def: 4, portrait: 11 },
    bard:  { name: 'Ozan', icon: 'sound', skill: 'Cesaret Ezgisi', text: 'Bütün takımı az miktar iyileştirir ve herkese +1 enerji verir.', hp: 98, atk: 19, def: 5, portrait: 8 }
  });
  Object.assign(SPECS, { rogue: ['Gölge Ustası', 'Zehir Ustası'], bard: ['Savaş Ozanı', 'Şifa Ozanı'] });

  /* ---------- Yeni kişilikler ---------- */
  TRAITS.push(
    { id: 'fierce', name: 'Hiddetli', desc: 'Saldırı +%12, savunma −2.', atk: .12, def: -2 },
    { id: 'stoic', name: 'Metin', desc: 'Can +%8, savunma +2.', hp: .08, def: 2 },
    { id: 'clever', name: 'Kurnaz', desc: 'Saldırı +%5, meslek üretimi +%10.', atk: .05, work: .1 },
    { id: 'gentle', name: 'Yumuşak kalpli', desc: 'Can +%6, meslek üretimi +%15.', hp: .06, work: .15 },
    { id: 'proud', name: 'Gururlu', desc: 'Saldırı +%10.', atk: .1 },
    { id: 'diligent', name: 'Çalışkan', desc: 'Meslek üretimi +%30.', work: .3 }
  );

  /* ---------- İsim, köken ve unvan havuzu ---------- */
  const NAMES = ['Arden','Liora','Sera','Borin','Nyra','Doran','Mira','Eldrin','Kael','Tessa','Orin','Rhea','Eren','Alara','Veyra','Soren','Neris','Tarin','Elian','Yuna','Aren','Selin','Ren','Eira','Rowan','Asra',
    'Kaan','Ilgaz','Defne','Toprak','Aylin','Bora','Ece','Ozan','Lale','Atlas','Nehir','Poyraz','Yaren','Demir','Su','Tuna','Elara','Caspian','Isolde','Mireya','Thane','Vesper','Corin','Lysa','Darian','Zephyr',
    'Ayaz','Gökay','Ilsa','Brann','Kira','Nalan','Oberon','Riva','Sable','Taren','Una','Vale','Wren','Yasmin','Zara','Alric','Beren','Cassia','Delia','Emrys','Faela','Galen','Hale','Iris','Joren','Kestrel','Lior','Maren','Nima','Oren','Perrin','Quill','Rook','Sefa','Talya','Ulric','Vira'];
  const ORIGINS = ['Sis kıyısındaki bir kasaba','Yitik bir krallığın sınırı','Dağların ardındaki vadi','Sessiz bir liman','Kül yağmurları altındaki şehir',
    'Yıldızları sayan bir manastır','Kumların yuttuğu bir kervan yolu','Buzla kaplı bir kuzey kalesi','Dev ağaçların gölgesindeki köy','Batık bir şehrin kalıntıları',
    'Gezgin bir sirk kafilesi','Unutulmuş bir kütüphanenin mahzeni','Ejder kemiklerinin üstüne kurulmuş kasaba','Hiç güneş görmeyen bir maden ocağı','Gökyüzünde süzülen bir ada',
    'Sınırda bir paralı asker kampı','Fırtına adalarındaki deniz feneri','Kızıl çöldeki bir vaha','Ay ışığında açan bahçeler','Kulenin dibindeki sığınak'];
  const TITLES = ['Kül Yürüyen','Şafak Kılıcı','Yıldız Bekçisi','Sessiz Ok','Kırık Yemin','Gece Kuşu','Ayaz Pençesi','Son Işık','Kızıl Yemin','Boşluk Gezgini','Fırtına Kalbi','Altın Söz'];
  const pick = (eng, a) => a[Math.floor(eng.random() * a.length)];

  const baseMake = Engine.prototype.makeHero;
  Engine.prototype.makeHero = function (o = {}) {
    const h = baseMake.call(this, o);
    if (!o.name) {
      const used = new Set((this.s.heroes || []).map(x => x.name.split(' · ')[0]));
      let name = pick(this, NAMES); for (let i = 0; i < 8 && used.has(name); i++) name = pick(this, NAMES);
      h.name = name;
      if (h.stars >= 4 && this.random() < (h.stars === 5 ? 1 : .5)) h.name = (name + ' · ' + pick(this, TITLES)).slice(0, 40);
    }
    h.origin = pick(this, ORIGINS);
    // Aynı portreyi paylaşan kahramanlar renk tonuyla ayrışsın
    h.look = { hue: Math.round((this.random() - .5) * 50), sat: Math.round(90 + this.random() * 30) };
    // Savaş odaklı kahramanlar sınıfına uygun portreyle gelsin
    if (!o.civil && o.portrait === undefined) h.portrait = CLASSES[h.cls].portrait;
    return h;
  };

  /* ---------- Yeni oyun: zorluk ve başlangıç ---------- */
  const baseNew = Engine.prototype.newGame;
  Engine.prototype.newGame = function () {
    const pending = (window.Kayit && Kayit.pending()) || {};
    const s = baseNew.call(this);
    s.difficulty = DIFF[pending.difficulty] ? pending.difficulty : 'normal';
    const d = diff(s);
    Object.keys(s.r).forEach(k => { s.r[k] = Math.round(s.r[k] * d.start); });
    if (pending.guild) s.guild.name = String(pending.guild).slice(0, 40);
    if (pending.base) s.guild.base = String(pending.base).slice(0, 40);
    s.settings.sound = true;
    if (s.difficulty === 'hard') s.settings.permanent = !!pending.permanent;
    s.heroes.forEach(h => { if (!h.look) h.look = { hue: 0, sat: 100 }; });
    return s;
  };

  /* ---------- Savaş: zorluk çarpanları ---------- */
  const baseStart = Engine.prototype.startBattle;
  Engine.prototype.startBattle = function (opts) {
    const b = baseStart.call(this, opts), d = diff(this.s);
    if (d.ehp !== 1 || d.eatk !== 1) b.enemies.forEach(e => { e.hp = e.maxhp = Math.max(1, Math.round(e.maxhp * d.ehp)); e.atk = Math.round(e.atk * d.eatk); });
    return b;
  };
  const baseFinish = Engine.prototype.finishBattle;
  Engine.prototype.finishBattle = function (win, retreat) {
    baseFinish.call(this, win, retreat);
    const b = this.s.battle, d = diff(this.s);
    if (win && d.loot !== 1 && b.loot) {
      const extra = {};
      ['gold', 'crystals', 'wood', 'ore', 'herbs'].forEach(k => { if (b.loot[k]) { extra[k] = Math.round(b.loot[k] * (d.loot - 1)); b.loot[k] += extra[k]; } });
      this.gain(extra);
      if (this.s.lastResult) this.s.lastResult.loot = b.loot;
    }
  };

  /* ---------- Yeni sınıfların yetenekleri ---------- */
  const baseAction = Engine.prototype.action;
  Engine.prototype.action = function (kind, targetIndex = 0) {
    const b = this.s.battle, a = this.actor && this.actor();
    if (kind !== 'skill' || !a || !['rogue', 'bard'].includes(a.cls)) return baseAction.call(this, kind, targetIndex);
    if (b?.status !== 'active') throw new Error('Aktif savaş yok.');
    if (!(a.energy >= 2 && a.cd === 0)) throw new Error('Yetenek için 2 enerji ve hazır bekleme süresi gerekli.');
    a.guard = false; a.energy -= 2; a.cd = 3;
    if (a.cls === 'rogue') {
      const t = b.enemies[targetIndex]; if (!t || t.hp <= 0) throw new Error('Yaşayan bir düşman seç.');
      const low = t.hp < t.maxhp * .5, def = t.def; t.def = 0;
      const dmg = this.hit(t, a.atk * (low ? 2.9 : 1.8)); t.def = def;
      this.bLog(a.name + ' gölgelerden vurdu: ' + dmg + ' hasar' + (low ? ' (zayıf noktayı buldu!)' : '') + '.');
    } else {
      const live = b.heroes.filter(h => h.hp > 0);
      live.forEach(h => { h.hp = Math.min(h.maxhp, h.hp + Math.round(a.atk * 1.1 + h.maxhp * .06)); if (h !== a) h.energy = Math.min(3, h.energy + 1); });
      this.bLog(a.name + ' Cesaret Ezgisi söyledi. Takım iyileşti ve enerji kazandı.');
    }
    if (!b.enemies.some(e => e.hp > 0)) { this.finishBattle(true); return b; }
    let next = b.actor + 1; while (next < b.heroes.length && b.heroes[next].hp <= 0) next++;
    if (next < b.heroes.length) b.actor = next; else this.enemyTurn();
    return b;
  };
  const baseAuto = Engine.prototype.autoAction;
  Engine.prototype.autoAction = function () {
    const b = this.s.battle, a = this.actor();
    if (a && a.cls === 'bard' && a.energy >= 2 && !a.cd && b.heroes.some(h => h.hp > 0 && h.hp < h.maxhp * .75)) return this.action('skill', 0);
    if (a && a.cls === 'bard') return this.action(b.enemies.some(e => e.hp > 0 && e.charging) ? 'guard' : 'attack', b.enemies.findIndex(e => e.hp > 0));
    return baseAuto.call(this);
  };

  /* ---------- Doğrulama: yeni alanları koru ---------- */
  const baseValidate = Engine.validate;
  Engine.validate = function (s) {
    const out = baseValidate.call(Engine, s);
    out.difficulty = DIFF[s.difficulty] ? s.difficulty : 'normal';
    out.heroes.forEach((h, i) => { const look = s.heroes[i] && s.heroes[i].look; h.look = look && Number.isFinite(look.hue) ? { hue: clamp(Math.round(look.hue), -40, 40), sat: clamp(Math.round(look.sat || 100), 60, 140) } : { hue: 0, sat: 100 }; });
    return out;
  };
  void REGIONS;
})();
