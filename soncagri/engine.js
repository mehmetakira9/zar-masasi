/* Son Çağrı · Kule Ustası — deterministic, browser-independent game rules. */
(function (root) {
  'use strict';
  const VERSION = 1;
  const CLASSES = {
    warrior: { name: 'Savaşçı', icon: 'sword', skill: 'Yarık Darbe', text: 'Güçlü darbe. Hazırlanan düşmanın saldırısını keser.', hp: 120, atk: 22, def: 7, portrait: 0 },
    archer: { name: 'Okçu', icon: 'bow', skill: 'İkiz Ok', text: 'Tek hedefe yüksek hasar verir, zırhı kısmen deler.', hp: 93, atk: 27, def: 4, portrait: 1 },
    healer: { name: 'Şifacı', icon: 'heart', skill: 'Şafak Duası', text: 'Seçtiğin müttefiki iyileştirir ve zehrini temizler.', hp: 101, atk: 17, def: 5, portrait: 2 },
    guardian: { name: 'Muhafız', icon: 'shield', skill: 'Sarsılmaz Hat', text: 'Bütün takıma koruyucu kalkan verir.', hp: 150, atk: 17, def: 12, portrait: 3 },
    mage: { name: 'Büyücü', icon: 'spark', skill: 'Boşluk Mührü', text: 'Bütün düşmanları vurur ve hazırlanan saldırıları keser.', hp: 86, atk: 30, def: 3, portrait: 4 }
  };
  const JOBS = {
    smith: { name: 'Demirci', icon: 'hammer', resource: 'ore', amount: 5, building: 'forge', portrait: 5, desc: 'Cevher işler; silah üretiminde indirim sağlar.' },
    cook: { name: 'Aşçı', icon: 'flame', resource: 'food', amount: 8, building: 'kitchen', portrait: 6, desc: 'Birlik için günlük erzak hazırlar.' },
    scholar: { name: 'Araştırmacı', icon: 'book', resource: 'essence', amount: 1, building: 'library', portrait: 7, desc: 'Gelişim özü üretir, gizli yolları fark eder.' },
    merchant: { name: 'Tüccar', icon: 'coins', resource: 'gold', amount: 40, building: 'market', portrait: 8, desc: 'Ticaret yapar; üsse altın getirir.' },
    builder: { name: 'İnşaatçı', icon: 'home', resource: 'wood', amount: 8, building: 'hall', portrait: 9, desc: 'Kereste hazırlar; binaları daha ucuza geliştirir.' },
    alchemist: { name: 'Simyacı', icon: 'flask', resource: 'herbs', amount: 6, building: 'lab', portrait: 10, desc: 'Şifalı karışımlar için bitki toplar.' },
    scout: { name: 'İzci', icon: 'compass', resource: 'crystals', amount: 5, building: 'watch', portrait: 11, desc: 'Keşif yapar; yol risklerini ve sefer tehlikesini azaltır.' },
    farmer: { name: 'Çiftçi', icon: 'leaf', resource: 'herbs', amount: 9, building: 'farm', portrait: 6, desc: 'Şifalı bitkiler yetiştirir ve erzak üretir.' },
    medic: { name: 'Hekim', icon: 'heart', resource: 'food', amount: 4, building: 'infirmary', portrait: 2, desc: 'Üsteki yaralıların daha hızlı iyileşmesini sağlar.' }
  };
  const RESOURCES = { gold: 'Altın', crystals: 'Kristal', wood: 'Kereste', ore: 'Cevher', herbs: 'Bitki', food: 'Erzak', essence: 'Gelişim özü', relic: 'Kalıntı' };
  const ITEMS = { potion: { name: 'Şifa iksiri', icon: 'flask', desc: '%45 can yeniler.' }, antidote: { name: 'Panzehir', icon: 'leaf', desc: 'Zehri temizler, %15 can yeniler.' }, bomb: { name: 'Alev şişesi', icon: 'flame', desc: 'Bütün düşmanlara hasar verir.' }, meal: { name: 'Sefer yemeği', icon: 'food', desc: 'Sefer başında takımın gücünü %12 artırır.' }, warmMeal: { name: 'Sıcak yemek', icon: 'flame', desc: 'Buz bölgesindeki enerji kaybını önler.' } };
  const BUILDINGS = {
    hall: { name: 'Birlik konağı', icon: 'home', desc: 'Kahraman kapasitesini ve pasif geliri artırır.', cost: { gold: 180, wood: 40 } },
    forge: { name: 'Demirhane', icon: 'hammer', desc: 'Daha güçlü ekipman tarifleri açar.', cost: { gold: 160, wood: 25, ore: 30 } },
    kitchen: { name: 'Mutfak', icon: 'food', desc: 'Erzak üretimini ve yemek verimini artırır.', cost: { gold: 120, wood: 30 } },
    infirmary: { name: 'Revir', icon: 'heart', desc: 'İyileştirme maliyetini ve dinlenme süresini azaltır.', cost: { gold: 150, wood: 30, herbs: 20 } },
    farm: { name: 'Bitki bahçesi', icon: 'leaf', desc: 'Her gün erzak ve şifalı bitki üretir.', cost: { gold: 120, wood: 35 } },
    lab: { name: 'Simya laboratuvarı', icon: 'flask', desc: 'İksir, öz ve rün üretimini geliştirir.', cost: { gold: 190, wood: 30, ore: 20 } },
    watch: { name: 'Gözetleme kulesi', icon: 'compass', desc: 'İzcilere çalışma alanı ve savunma bonusu sağlar.', cost: { gold: 140, wood: 50 } },
    library: { name: 'Arşiv', icon: 'book', desc: 'Araştırmacılar gelişim özü üretir.', cost: { gold: 220, wood: 45, ore: 15 } },
    wall: { name: 'Surlar ve tuzaklar', icon: 'shield', desc: 'Üs savunmasında takımına kalkan verir.', cost: { gold: 140, wood: 40, ore: 30 } },
    market: { name: 'Ticaret meydanı', icon: 'coins', desc: 'Günlük altın ve tüccar üretimini artırır.', cost: { gold: 180, wood: 40 } }
  };
  const REGIONS = [
    { name: 'Unutulmuş Eşik', subtitle: 'Yıkık yerleşimler · Orman', min: 1, max: 20, color: '#8eb49b', effect: 'Dengeli savaşlar. Temel malzemeler bol bulunur.', enemies: ['Kül Kurdu', 'Yitik Muhafız', 'Diken Avcısı'], boss: 'Diken Tacı' },
    { name: 'Fısıldayan Derinlik', subtitle: 'Mezarlar · Zehirli mağaralar', min: 21, max: 40, color: '#a3b974', effect: 'Düşman saldırıları zehir bırakabilir. Panzehir hazırla.', enemies: ['Mezar Bekçisi', 'Zehir Dokuyucu', 'Kemik Avcısı'], boss: 'Solgun Rahip' },
    { name: 'Sessiz Kış', subtitle: 'Donmuş kaleler · Kar fırtınası', min: 41, max: 60, color: '#83bdd5', effect: 'Sıcak yemek olmadan kahramanlar 1 enerjiyle başlar.', enemies: ['Buz Hayaleti', 'Donmuş Şövalye', 'Kar Pençesi'], boss: 'Kışın Hükümdarı' },
    { name: 'Kızıl Kırılma', subtitle: 'Volkanik harabeler · Kül', min: 61, max: 80, color: '#d48b73', effect: 'Seferler daha fazla yorgunluk getirir.', enemies: ['Lav Yılanı', 'Kül Celladı', 'Kor Devi'], boss: 'Yanık Taht' },
    { name: 'Yıldızsız Gökyüzü', subtitle: 'Boşluk · Bozulan gerçeklik', min: 81, max: 100, color: '#b395e3', effect: 'Düşmanlar daha sık güçlü saldırı hazırlar.', enemies: ['Boşluk Yiyen', 'Ayna Şövalyesi', 'Son Gözlemci'], boss: 'Çağrının Ardındaki' }
  ];
  const ROUTES = {
    normal: { name: 'Ana geçit', icon: 'sword', desc: 'Dengeli savaş ve düzenli ödül.', mult: 1, reward: 1 },
    treasure: { name: 'Mühürlü hazine', icon: 'chest', desc: 'Daha güçlü düşmanlar; ek altın ve ekipman.', mult: 1.16, reward: 1.55 },
    rescue: { name: 'Yardım çağrısı', icon: 'heart', desc: 'Mahsur kalan bir kahramanı kurtar.', mult: 1.1, reward: .9 },
    shrine: { name: 'Şafak tapınağı', icon: 'spark', desc: 'Savaş öncesi yenilenme; daha az ödül.', mult: .9, reward: .8 },
    mystery: { name: 'Unutulmuş oda', icon: 'eye', desc: 'Gizemli bir seçim, kalıntı ve gizli bilgiler.', mult: 1.12, reward: 1.2 }
  };
  const RESEARCH = {
    logistics: { name: 'Geniş erzak çantası', desc: 'Sefer çantasının kapasitesi 5 → 8 olur.', cost: { gold: 500, essence: 12 }, floor: 5 },
    steel: { name: 'Yıldız çeliği', desc: 'Demirhanede 4 ve 5 yıldız tariflerinin kilidini açar.', cost: { gold: 900, essence: 25, relic: 2 }, floor: 15 },
    medicine: { name: 'Gelişmiş tıp', desc: 'İksirler %20 daha çok iyileştirir. Dinlenme verimi artar.', cost: { gold: 450, herbs: 80, essence: 10 }, floor: 5 },
    harmony: { name: 'Birlik öğretisi', desc: 'Takımın saldırısı %8 artar; bağlar daha hızlı gelişir.', cost: { gold: 650, essence: 20 }, floor: 10 },
    secrets: { name: 'Kayıp alfabe', desc: 'Gizli boss seferlerini ve gizem odalarının ek ödüllerini açar.', cost: { gold: 800, essence: 18, relic: 3 }, floor: 20 },
    industry: { name: 'Usta zanaatkârlık', desc: 'Meslek üretimi %30 artar, meslekler daha hızlı ilerler.', cost: { gold: 550, wood: 100, ore: 80 }, floor: 8 }
  };
  const MISSIONS = [
    { id: 'forest', name: 'Fısıltı Ormanı', desc: 'Şifalı bitki ve erzak topla.', days: 2, risk: .12, loot: { herbs: 28, food: 25, wood: 20 } },
    { id: 'mine', name: 'Terk Edilmiş Maden', desc: 'Cevher ve gelişim özü çıkar.', days: 3, risk: .22, loot: { ore: 50, essence: 6, gold: 120 } },
    { id: 'caravan', name: 'Kervan Yolu', desc: 'Kervana eşlik et; ticaret itibarını artır.', days: 3, risk: .18, loot: { gold: 320, crystals: 75, wood: 30 } }
  ];
  const CONTRACTS = [
    { id: 'first', name: 'Eşiğin Ötesi', text: 'Kulenin 3. katını tamamla.', metric: 'floor', target: 3, faction: 'council', loot: { gold: 250, crystals: 150 }, rep: 10 },
    { id: 'ten', name: 'İlk Taç', text: '10. katın bossunu yen.', metric: 'floor', target: 10, faction: 'council', loot: { gold: 600, essence: 15, crystals: 300 }, rep: 20 },
    { id: 'craft', name: 'Ocaktaki Ateş', text: 'Atölyede 5 üretim tamamla.', metric: 'craft', target: 5, faction: 'caravan', loot: { ore: 80, gold: 400 }, rep: 15 },
    { id: 'rescue', name: 'Bir Can Daha', text: 'Kulede 3 kahramanı kurtar.', metric: 'rescue', target: 3, faction: 'council', loot: { crystals: 350, essence: 12 }, rep: 20 },
    { id: 'dispatch', name: 'Uzak Yollar', text: '3 keşif görevi tamamla.', metric: 'dispatch', target: 3, faction: 'caravan', loot: { gold: 650, crystals: 200 }, rep: 20 },
    { id: 'synthesis', name: 'Özün Hafızası', text: '3 sentez işlemi tamamla.', metric: 'synthesis', target: 3, faction: 'scholars', loot: { essence: 25, relic: 2 }, rep: 20 },
    { id: 'mid', name: 'Kışın Sessizliği', text: '50. katı tamamla.', metric: 'floor', target: 50, faction: 'scholars', loot: { gold: 2500, crystals: 1000, relic: 8 }, rep: 35 },
    { id: 'hundred', name: 'Son Çağrı', text: '100. katı tamamla.', metric: 'floor', target: 100, faction: 'council', loot: { gold: 5000, crystals: 3000, essence: 100 }, rep: 50 }
  ];
  const LORE = [
    { floor: 5, title: 'İlk İz', body: 'Taşların arasında bulduğun sayfa, bir çağıranın el yazısını taşıyor: “Yıldızlar kaderi değil, başlangıcı gösterir.”' },
    { floor: 20, title: 'İsimlerini Unutanlar', body: 'Duvara kazınmış binlerce isim var. Hiçbiri bir sayıdan ibaret değildi. Birliğin anı defterini tutmaya karar veriyorsun.' },
    { floor: 40, title: 'Derinliğin Sesi', body: 'Mezarların altındaki mekanizma hâlâ çalışıyor. Kule, yitirilen dünyaların hatıralarıyla besleniyor.' },
    { floor: 60, title: 'Donmuş Mektup', body: '“Bizi kurtaracak biri gelmezse, birbirimizi kurtaracağız.” Buzun içindeki mühür, senin birliğinin armasına benziyor.' },
    { floor: 80, title: 'Son Nöbet', body: 'Kızıl tahtta bir silah değil, bir anahtar buluyorsun. Üzerindeki yazı açık: “Kapıyı açmak için birliğini geride bırakman gerekmiyor.”' },
    { floor: 100, title: 'Kulenin Ötesi', body: 'Zirvede bir ekran değil, sayısız dünyaya açılan yollar var. Son çağrı bir bitiş değil. Artık bu yolların koruyucusu sensin.' }
  ];
  const TRAITS = [
    { id: 'brave', name: 'Cesur', desc: 'Saldırı +%8.', atk: .08 }, { id: 'calm', name: 'Sakin', desc: 'Savunma +4.', def: 4 },
    { id: 'hardy', name: 'Dayanıklı', desc: 'Can +%12.', hp: .12 }, { id: 'curious', name: 'Meraklı', desc: 'Meslek üretimi +%20.', work: .2 },
    { id: 'shy', name: 'Çekingen', desc: 'Canı azalınca saldırısı düşer; meslekte +%25 verim.', work: .25 },
    { id: 'loyal', name: 'Sadık', desc: 'Morali yüksekken saldırı +%6.', atk: .06 }
  ];
  const SPECS = { warrior: ['Şövalye', 'Berserker'], archer: ['Keskin Nişancı', 'Avcı'], healer: ['Yaşam Bekçisi', 'Işık Elçisi'], guardian: ['Kale Muhafızı', 'Öncü'], mage: ['Yıldız Büyücüsü', 'Mühür Ustası'] };
  const NAMES = ['Arden', 'Liora', 'Sera', 'Borin', 'Nyra', 'Doran', 'Mira', 'Eldrin', 'Kael', 'Tessa', 'Orin', 'Rhea', 'Eren', 'Alara', 'Veyra', 'Soren', 'Neris', 'Tarin', 'Elian', 'Yuna', 'Aren', 'Selin', 'Ren', 'Eira', 'Rowan', 'Asra'];
  const SETS = ['Şafak', 'Gezgin', 'Yıldız', 'Kül'];
  const FACTIONS = { council: 'Şafak Meclisi', caravan: 'Gezginler Birliği', scholars: 'Yitik Arşiv' };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const copy = x => JSON.parse(JSON.stringify(x));
  const sum = x => Object.values(x).reduce((a, b) => a + b, 0);
  function region(floor) { return REGIONS[clamp(Math.floor((floor - 1) / 20), 0, 4)]; }
  function assert(ok, message) { if (!ok) throw new Error(message); }
  class Engine {
    constructor(state, random = Math.random) { this.random = random; this.s = state || this.newGame(); }
    pick(a) { return a[Math.floor(this.random() * a.length)]; }
    id(prefix) { return prefix + (++this.s.uid); }
    newGame() {
      this.s = { version: VERSION, uid: 0, guild: { name: 'Şafak Birliği', base: 'Yıldız Sığınağı', color: '#d5b376', emblem: 'spark' }, day: 1, floor: 0, challenge: 0,
        r: { gold: 1600, crystals: 1500, wood: 180, ore: 160, herbs: 100, food: 120, essence: 25, relic: 2 },
        heroes: [], squad: [], gear: [], items: { potion: 6, antidote: 3, bomb: 3, meal: 3, warmMeal: 2 },
        buildings: { hall: 1, forge: 1, kitchen: 1, infirmary: 1, farm: 1, lab: 1, watch: 0, library: 0, wall: 0, market: 1 },
        research: {}, pity: 0, totalSummons: 0, missions: [], bonds: {}, memories: [], log: [], lore: [], trophies: [], claimed: [],
        rep: { council: 0, caravan: 0, scholars: 0 }, decorations: { banner: { x: 14, y: 75 } }, counters: { craft: 0, rescue: 0, dispatch: 0, synthesis: 0, kills: 0, wins: 0 },
        pendingDefense: 0, battle: null, tutorial: true, settings: { permanent: false, sound: false, speed: 1, animations: true },
        pack: { potion: 2, antidote: 1, bomb: 1, meal: 1, warmMeal: 0 }, lastResult: null, eventDay: 0, events: [] };
      const starter = [ ['Arden', 'warrior', 'scout', 3], ['Liora', 'archer', 'farmer', 2], ['Sera', 'healer', 'medic', 3], ['Borin', 'guardian', 'builder', 2], ['Nyra', 'mage', 'scholar', 2], ['Doran', 'warrior', 'smith', 1], ['Mira', 'healer', 'cook', 1], ['Orin', 'mage', 'alchemist', 1] ];
      starter.forEach(([name, cls, job, stars], i) => { const h = this.makeHero({ name, cls, job, stars, civil: i >= 5, portrait: i < 5 ? i : (i === 7 ? 10 : i), potential: 78 + i }); h.locked = i < 3; h.working = i >= 5; this.s.heroes.push(h); });
      this.s.squad = this.s.heroes.slice(0, 3).map(h => h.id);
      ['weapon', 'armor', 'weapon'].forEach((slot, i) => { const g = this.makeGear(slot, 1); this.s.gear.push(g); this.s.heroes[i].equipment[slot] = g.id; });
      this.note('Birliğin kuruldu. Kuleye ilk adımını atmaya hazırsın.', 'story');
      return this.s;
    }
    makeHero(o = {}) {
      const cls = o.cls || this.pick(Object.keys(CLASSES)), job = o.job || this.pick(Object.keys(JOBS));
      const h = { id: this.id('h'), name: o.name || this.pick(NAMES), cls, job, stars: o.stars || 1, level: 1, xp: 0, potential: o.potential || 65 + Math.floor(this.random() * 36),
        trait: this.pick(TRAITS).id, inherited: null, portrait: o.portrait ?? (o.civil ? JOBS[job].portrait : CLASSES[cls].portrait),
        fatigue: 0, injury: 0, morale: 85, locked: false, working: false, jobTalent: o.civil ? 85 + Math.floor(this.random() * 16) : 55 + Math.floor(this.random() * 46), jobLevel: o.civil ? 2 : 1, jobXp: 0, spec: null, jobSpec: null,
        equipment: { weapon: null, armor: null, accessory: null, rune: null }, records: { wins: 0, bosses: 0, saved: 0, close: 0 },
        wish: { type: o.civil ? 'work' : 'wins', target: o.civil ? 5 : 5, progress: 0, claimed: false },
        origin: this.pick(['Sis kıyısındaki bir kasaba', 'Yitik bir krallığın sınırı', 'Dağların ardındaki vadi', 'Sessiz bir liman', 'Kül yağmurları altındaki şehir']) };
      return h;
    }
    hero(id) { return this.s.heroes.find(h => h.id === id); }
    trait(id) { return TRAITS.find(t => t.id === id) || TRAITS[0]; }
    deployed(id) { return this.s.missions.some(m => m.heroes.includes(id)); }
    fighting(id) { return this.s.battle?.status === 'active' && this.s.battle.heroes.some(h => h.id === id); }
    available(h) { return h && !this.deployed(h.id) && !this.fighting(h.id) && h.injury < 2; }
    capacity() { return 24 + this.s.buildings.hall * 8; }
    canPay(cost) { return Object.entries(cost).every(([k, v]) => (this.s.r[k] || 0) >= v); }
    pay(cost) { assert(this.canPay(cost), 'Kaynakların bu işlem için yeterli değil.'); Object.entries(cost).forEach(([k, v]) => { this.s.r[k] -= v; }); }
    gain(loot) { Object.entries(loot).forEach(([k, v]) => { if (k in this.s.r) this.s.r[k] = Math.min(1e9, this.s.r[k] + Math.round(v)); }); }
    note(message, type = 'info') { this.s.log.unshift({ day: this.s.day, message, type }); this.s.log = this.s.log.slice(0, 150); }
    stats(h) {
      const c = CLASSES[h.cls], tr = this.trait(h.trait), inherited = h.inherited ? this.trait(h.inherited) : {}, lv = h.level - 1;
      const mult = (1 + (h.stars - 1) * .13) * (.85 + h.potential / 400);
      let hp = (c.hp + lv * 17) * mult * (1 + (tr.hp || 0) + (inherited.hp || 0) / 2);
      let atk = (c.atk + lv * 3.8) * mult * (1 + (tr.atk || 0) + (inherited.atk || 0) / 2);
      let def = c.def + lv * 1.5 + (tr.def || 0) + (inherited.def || 0) / 2;
      const sets = {};
      Object.values(h.equipment).forEach(id => { const g = this.s.gear.find(x => x.id === id); if (!g) return; sets[g.set] = (sets[g.set] || 0) + 1; if (g.slot === 'weapon') atk += g.power; else if (g.slot === 'armor') { def += g.power * .48; hp += g.power * 2; } else if (g.slot === 'rune') atk += g.power * .5; else hp += g.power * 3; });
      if (Object.values(sets).some(n => n >= 2)) { hp *= 1.1; atk *= 1.1; }
      if (h.spec) { const first = SPECS[h.cls][0] === h.spec; if (first) { hp *= 1.16; def *= 1.1; } else atk *= 1.2; }
      if (h.wish.claimed) atk *= 1.05;
      if (this.s.research.harmony) atk *= 1.08;
      atk *= (1 - h.fatigue / 500) * (h.morale >= 40 ? 1 : .88);
      return { hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def), power: Math.round(hp / 5 + atk * 2 + def * 2), sets };
    }
    addXp(h, amount) { h.xp += amount; while (h.xp >= h.level * 65 && h.level < 99) { h.xp -= h.level * 65; h.level++; } }
    makeGear(slot = 'weapon', rarity = 1) {
      const set = this.pick(SETS), power = Math.round((5 + rarity * 8) * (.9 + this.random() * .2));
      return { id: this.id('g'), slot, rarity, power, set, name: set + ' ' + ({ weapon: 'Silahı', armor: 'Zırhı', accessory: 'Tılsımı', rune: 'Rünü' }[slot]) };
    }
    equipped(id) { return this.s.heroes.some(h => Object.values(h.equipment).includes(id)); }
    setSquad(ids) {
      assert(!this.s.battle || this.s.battle.status !== 'active', 'Savaş sürerken takım değiştirilemez.');
      assert(Array.isArray(ids) && ids.length > 0 && ids.length <= 3 && new Set(ids).size === ids.length, 'Takım 1–3 farklı kahramandan oluşmalı.');
      ids.forEach(id => assert(this.available(this.hero(id)), 'Bu kahraman şu anda sefere katılamaz.'));
      this.s.squad = ids; return ids;
    }
    summon(count = 1, mode = 'general') {
      assert([1, 10].includes(count), 'Geçersiz çağırma sayısı.');
      assert(['general', 'combat', 'civil'].includes(mode), 'Geçersiz çağırma türü.');
      assert(this.s.heroes.length + count <= this.capacity(), 'Kahraman kapasitesi dolu. Birlik konağını geliştir.');
      this.pay({ crystals: count === 10 ? 1080 : 120 }); const result = [];
      for (let i = 0; i < count; i++) {
        this.s.pity++; this.s.totalSummons++; const r = this.random();
        let stars = r < .015 ? 5 : r < .10 ? 4 : r < .30 ? 3 : r < .65 ? 2 : 1;
        if (this.s.totalSummons % 80 === 0) stars = 5;
        else if (this.s.pity >= 20) stars = Math.max(4, stars);
        if (stars >= 4) this.s.pity = 0;
        const civil = mode === 'civil' || (mode === 'general' && this.random() < .35);
        const h = this.makeHero({ stars, civil }); this.s.heroes.push(h); result.push(h);
      }
      this.note(count + ' kahraman çağrıldı. En yüksek yıldız: ' + Math.max(...result.map(h => h.stars)), 'summon'); return result;
    }
    train(id) { const h = this.hero(id); assert(this.available(h), 'Kahraman şu anda eğitim alamaz.'); assert(h.level < 99, 'En yüksek seviyede.'); this.pay({ gold: 55 + h.level * 20, food: 5 }); this.addXp(h, h.level * 65); h.fatigue = clamp(h.fatigue + 4, 0, 100); }
    ascend(id) { const h = this.hero(id); assert(this.available(h), 'Kahraman müsait değil.'); assert(h.stars < 5, 'En yüksek yıldızda.'); assert(h.level >= h.stars * 5, 'Yükseltmek için seviye ' + h.stars * 5 + ' gerekli.'); this.pay({ gold: h.stars * 250, essence: h.stars * 12 }); h.stars++; this.note(h.name + ', ' + h.stars + ' yıldıza yükseldi.', 'hero'); }
    specialize(id, choice) { const h = this.hero(id); assert(this.available(h), 'Kahraman müsait değil.'); assert(!h.spec && h.level >= 5 && SPECS[h.cls].includes(choice), 'Uzmanlık için seviye 5 gerekli.'); this.pay({ gold: 200, essence: 5 }); h.spec = choice; this.note(h.name + ' artık ' + choice + '.', 'hero'); }
    jobSpecialize(id, choice) { const h = this.hero(id); assert(this.available(h) && h.jobLevel >= 3 && !h.jobSpec, 'Meslek uzmanlığı için meslek seviyesi 3 gerekli.'); assert(['Usta Zanaatkâr', 'Sefer Uzmanı'].includes(choice), 'Geçersiz uzmanlık.'); this.pay({ gold: 200, essence: 5 }); h.jobSpec = choice; }
    changeJob(id, job) { const h = this.hero(id); assert(this.available(h), 'Kahraman müsait değil.'); assert(JOBS[job], 'Geçersiz meslek.'); if (h.job === job) return; this.pay({ gold: 100 }); h.job = job; h.jobLevel = 1; h.jobXp = 0; h.jobSpec = null; }
    work(id, active) { const h = this.hero(id); assert(this.available(h), 'Kahraman müsait değil.'); h.working = !!active; }
    heal(id) { const h = this.hero(id); assert(h && !this.deployed(id) && !this.fighting(id), 'Kahraman müsait değil.'); this.pay({ gold: Math.max(15, 70 - this.s.buildings.infirmary * 10) }); h.injury = 0; h.fatigue = Math.max(0, h.fatigue - 35); h.morale = Math.min(100, h.morale + 10); }
    claimWish(id) { const h = this.hero(id); assert(h && !h.wish.claimed && h.wish.progress >= h.wish.target, 'Kişisel hedef henüz tamamlanmadı.'); h.wish.claimed = true; h.morale = 100; this.gain({ crystals: 75, essence: 3 }); this.note(h.name + ' kişisel hedefini tamamladı. Birliğe bağlılığı arttı.', 'hero'); }
    equip(id, gearId, slot) {
      const h = this.hero(id); assert(this.available(h), 'Kahraman şu anda ekipman değiştiremez.'); assert(['weapon','armor','accessory','rune'].includes(slot), 'Geçersiz yuva.');
      if (!gearId) { h.equipment[slot] = null; return; } const g = this.s.gear.find(x => x.id === gearId);
      assert(g && g.slot === slot && (!this.equipped(gearId) || h.equipment[slot] === gearId), 'Ekipman başka bir kahramanda veya uyumsuz.'); h.equipment[slot] = gearId;
    }
    production() {
      const p = { gold: 25 + this.s.buildings.hall * 8 + this.s.buildings.market * 10, food: this.s.buildings.farm * 5, herbs: this.s.buildings.farm * 2, wood: 3, ore: 2 };
      this.s.heroes.filter(h => h.working && !this.s.squad.includes(h.id) && !this.deployed(h.id) && h.injury === 0).forEach(h => {
        const j = JOBS[h.job], level = this.s.buildings[j.building]; if (!level) return;
        let amount = j.amount * (.75 + h.jobTalent / 200) * (1 + (h.jobLevel - 1) * .25) * (1 + (level - 1) * .15) * (1 + (this.trait(h.trait).work || 0)) * (this.s.research.industry ? 1.3 : 1) * (h.jobSpec === 'Usta Zanaatkâr' ? 1.4 : 1);
        p[j.resource] = (p[j.resource] || 0) + Math.max(1, Math.round(amount)); if (h.job === 'farmer') p.food += 5;
      }); return p;
    }
    advanceDay(rest = false) {
      const p = this.production(); this.gain(p); this.s.day++;
      const medic = this.s.heroes.some(h => h.working && h.job === 'medic' && !this.deployed(h.id) && !this.s.squad.includes(h.id));
      this.s.heroes.forEach(h => {
        if (this.deployed(h.id)) return;
        const inTeam = this.s.squad.includes(h.id);
        if (rest || !inTeam) { h.fatigue = Math.max(0, h.fatigue - (rest ? 35 : 10)); h.injury = Math.max(0, h.injury - (rest ? 1 + (medic || this.s.research.medicine ? 1 : 0) : (medic ? 1 : 0))); h.morale = Math.min(100, h.morale + (rest ? 8 : 2)); }
        if (h.working && !inTeam && !h.injury && this.s.buildings[JOBS[h.job].building]) { h.jobXp += this.s.research.industry ? 2 : 1; if (h.jobXp >= h.jobLevel * 4) { h.jobXp = 0; h.jobLevel = Math.min(10, h.jobLevel + 1); } if (h.wish.type === 'work') h.wish.progress++; }
      });
      this.resolveMissions();
      if (this.s.day % 4 === 0 && !this.s.events.some(e => !e.resolved)) { this.s.events.push({ id: this.id('e'), type: this.pick(['visitor', 'recipe', 'stranger']), resolved: false }); this.s.events = this.s.events.slice(-8); }
      return p;
    }
    rest() { assert(this.s.battle?.status !== 'active', 'Savaş sırasında dinlenemezsin.'); this.pay({ gold: 30 }); this.advanceDay(true); this.note('Birlik bir gün dinlendi. Üretim ve keşifler ilerledi.', 'base'); }
    decorate(kind, x, y) { const costs = { banner: { gold: 50, wood: 5 }, lantern: { gold: 100, wood: 10 }, statue: { gold: 250, ore: 30 } }; assert(costs[kind] && Number.isFinite(x) && Number.isFinite(y), 'Geçersiz dekor konumu.'); if (!this.s.decorations[kind]) this.pay(costs[kind]); this.s.decorations[kind] = { x: Math.round(clamp(x, 8, 92)), y: Math.round(clamp(y, 12, 90)) }; }
    upgradeCost(key) { const b = BUILDINGS[key]; assert(b, 'Geçersiz bina.'); const lv = this.s.buildings[key]; const builder = this.s.heroes.some(h => h.working && h.job === 'builder' && !this.s.squad.includes(h.id) && !this.deployed(h.id)); return Object.fromEntries(Object.entries(b.cost).map(([k,v]) => [k, Math.ceil(v * Math.pow(1.55, lv) * (builder ? .85 : 1))])); }
    upgrade(key) { assert(this.s.buildings[key] < 5, 'Bina en yüksek seviyede.'); this.pay(this.upgradeCost(key)); this.s.buildings[key]++; this.note(BUILDINGS[key].name + ' seviye ' + this.s.buildings[key] + ' oldu.', 'base'); }
    research(key) { const r = RESEARCH[key]; assert(r && !this.s.research[key], 'Araştırma zaten tamamlandı.'); assert(this.s.floor >= r.floor, r.floor + '. katı tamamla.'); this.pay(r.cost); this.s.research[key] = true; this.note(r.name + ' araştırması tamamlandı.', 'base'); }
    craftCost(kind, rarity = 1) {
      if (['weapon','armor','accessory'].includes(kind)) { const smith = this.s.heroes.some(h => h.working && h.job === 'smith' && !this.s.squad.includes(h.id) && !this.deployed(h.id)); return { gold: Math.round(90 * rarity * (smith ? .8 : 1)), ore: 15 * rarity, wood: 8 * rarity }; }
      return ({ potion: { gold: 25, herbs: 8 }, antidote: { gold: 20, herbs: 5 }, bomb: { gold: 35, ore: 8, herbs: 3 }, meal: { food: 12, gold: 15 }, warmMeal: { food: 15, herbs: 4 }, rune: { gold: 120, essence: 5, ore: 10 } })[kind];
    }
    craft(kind, rarity = 1) {
      const cost = this.craftCost(kind, rarity); assert(cost, 'Geçersiz tarif.');
      if (['weapon','armor','accessory'].includes(kind)) { assert(Number.isInteger(rarity) && rarity >= 1 && rarity <= 5, 'Geçersiz nadirlik.'); assert(rarity <= this.s.buildings.forge + 1 && (rarity <= 3 || this.s.research.steel), 'Bu tarif için demirhaneyi veya yıldız çeliğini geliştir.'); }
      if (kind === 'rune') assert(this.s.buildings.lab >= 2, 'Rün üretimi için laboratuvar seviyesi 2 gerekli.');
      assert(this.s.gear.length < 500 || !['weapon','armor','accessory','rune'].includes(kind), 'Ekipman depon dolu. Sentezle yer aç.');
      this.pay(cost); let out;
      if (['weapon','armor','accessory','rune'].includes(kind)) { out = this.makeGear(kind, kind === 'rune' ? Math.min(5, this.s.buildings.lab) : rarity); this.s.gear.push(out); }
      else { this.s.items[kind]++; out = { name: ITEMS[kind].name }; }
      this.s.counters.craft++; this.note(out.name + ' üretildi.', 'craft'); return out;
    }
    synthPreview(targetId, sourceIds) {
      const h = this.hero(targetId); assert(h && this.available(h), 'Ana kahraman müsait değil.');
      assert(Array.isArray(sourceIds) && sourceIds.length >= 1 && sourceIds.length <= 10 && new Set(sourceIds).size === sourceIds.length, '1–10 farklı kaynak kahraman seç.');
      const sources = sourceIds.map(id => this.hero(id));
      sources.forEach(x => assert(x && x.id !== targetId && !x.locked && !this.s.squad.includes(x.id) && !this.deployed(x.id) && !this.fighting(x.id), 'Kilitli, takımda veya görevdeki kahraman sentez kaynağı olamaz.'));
      return { xp: sources.reduce((n,x) => n + x.stars * 150 + x.level * 40, 0), essence: sources.reduce((n,x) => n + x.stars * 2, 0), sources };
    }
    synthHeroes(targetId, sourceIds, inherit = false) {
      assert(this.s.floor >= 3, 'Sentez 3. kattan sonra açılır.'); const p = this.synthPreview(targetId, sourceIds), h = this.hero(targetId);
      this.pay({ gold: sourceIds.length * 60, ...(inherit ? { essence: 5 } : {}) });
      this.addXp(h, p.xp); this.gain({ essence: p.essence }); if (inherit) h.inherited = p.sources[0].trait;
      p.sources.forEach(x => this.s.memories.unshift({ name: x.name, portrait: x.portrait, level: x.level, day: this.s.day, reason: 'Birliğin gücüne katıldı', kind: 'synthesis' }));
      this.s.heroes = this.s.heroes.filter(x => !sourceIds.includes(x.id)); this.s.counters.synthesis++; this.note(h.name + ', ' + sourceIds.length + ' kahramanın özünü devraldı. +' + p.xp + ' deneyim.', 'synthesis'); return p;
    }
    synthGear(ids) {
      assert(this.s.floor >= 3, 'Sentez 3. kattan sonra açılır.'); assert(Array.isArray(ids) && ids.length === 3 && new Set(ids).size === 3, '3 farklı ekipman seç.');
      const gs = ids.map(id => this.s.gear.find(g => g.id === id)); assert(gs.every(Boolean) && gs.every(g => !this.equipped(g.id) && g.slot === gs[0].slot && g.rarity === gs[0].rarity && g.rarity < 5), 'Aynı türde ve yıldızda 3 kullanılmayan ekipman seç.');
      this.pay({ gold: 80 * gs[0].rarity }); const g = this.makeGear(gs[0].slot, gs[0].rarity + 1); this.s.gear = this.s.gear.filter(x => !ids.includes(x.id)); this.s.gear.push(g); this.s.counters.synthesis++; this.note(g.name + ' sentezlendi. ' + g.rarity + ' yıldız.', 'synthesis'); return g;
    }
    refine(kind) { assert(this.s.floor >= 3, 'Sentez 3. kattan sonra açılır.'); const recipe = { essence: [{ ore: 20, gold: 40 }, { essence: 5 }], relic: [{ essence: 15, herbs: 20, gold: 150 }, { relic: 1 }] }[kind]; assert(recipe, 'Geçersiz arıtma.'); this.pay(recipe[0]); this.gain(recipe[1]); this.s.counters.synthesis++; }
    dispatch(missionId, ids) {
      assert(this.s.floor >= 5, 'Keşif görevleri 5. kattan sonra açılır.'); const m = MISSIONS.find(x => x.id === missionId); assert(m, 'Geçersiz keşif.');
      assert(this.s.missions.length < 3, 'Aynı anda en fazla 3 keşif yapılabilir.'); assert(ids.length >= 1 && ids.length <= 2 && new Set(ids).size === ids.length, '1–2 farklı kahraman seç.');
      const heroes = ids.map(id => this.hero(id)); heroes.forEach(h => assert(this.available(h) && !this.s.squad.includes(h.id), 'Takım dışından müsait kahraman seç.'));
      this.pay({ food: ids.length * 10 }); const risk = Math.max(.02, m.risk - (heroes.length - 1) * .05 - heroes.filter(h => h.job === 'scout' || h.jobSpec === 'Sefer Uzmanı').length * .06);
      const active = { id: this.id('m'), type: m.id, heroes: ids, due: this.s.day + m.days, risk }; this.s.missions.push(active); this.note(m.name + ' keşfi başladı.', 'mission'); return active;
    }
    resolveMissions() {
      this.s.missions.filter(m => m.due <= this.s.day).forEach(m => { const def = MISSIONS.find(x => x.id === m.type), hurt = this.random() < m.risk; this.gain(def.loot); m.heroes.forEach(id => { const h = this.hero(id); if (!h) return; this.addXp(h, 120); h.fatigue = clamp(h.fatigue + 20,0,100); if (hurt) h.injury = Math.max(1,h.injury); }); if (m.type === 'caravan') this.s.rep.caravan += 3; this.s.counters.dispatch++; this.note(def.name + ' tamamlandı. Ödüller alındı.' + (hurt ? ' Ekip hafif yaralı döndü.' : ''), 'mission'); });
      this.s.missions = this.s.missions.filter(m => m.due > this.s.day);
    }
    eventChoice(id, choice) {
      const e = this.s.events.find(x => x.id === id); assert(e && !e.resolved && [0,1].includes(choice), 'Olay artık mevcut değil.');
      if (e.type === 'visitor') { if (choice === 0) { this.pay({ gold: 120 }); this.gain({ essence: 10, crystals: 50 }); this.s.rep.caravan += 2; } else this.gain({ gold: 40 }); }
      if (e.type === 'recipe') { if (choice === 0) { this.pay({ herbs: 15 }); this.s.items.potion += 3; } else this.gain({ essence: 3 }); }
      if (e.type === 'stranger') { if (choice === 0) { assert(this.s.heroes.length < this.capacity(), 'Kahraman kapasitesi dolu.'); this.pay({ food: 20 }); const h = this.makeHero({ stars: 2, civil: true }); this.s.heroes.push(h); this.note(h.name + ' birliğe katıldı.', 'hero'); } else this.gain({ wood: 20, gold: 30 }); }
      e.resolved = true; this.note('Üsteki olay çözüldü.', 'base');
    }
    claimContract(id) { const c = CONTRACTS.find(x => x.id === id); assert(c && !this.s.claimed.includes(id), 'Sözleşme zaten alındı.'); assert((c.metric === 'floor' ? this.s.floor : this.s.counters[c.metric]) >= c.target, 'Sözleşme henüz tamamlanmadı.'); this.gain(c.loot); this.s.rep[c.faction] += c.rep; this.s.claimed.push(id); this.note(c.name + ' sözleşmesinin ödülü alındı.', 'quest'); }
    buy(kind) { const price = { potion: 65, antidote: 40, bomb: 85, meal: 50, warmMeal: 65 }[kind]; assert(price, 'Geçersiz ürün.'); this.pay({ gold: Math.round(price * (this.s.rep.caravan >= 20 ? .85 : 1)) }); this.s.items[kind]++; }
    exchange(kind) { const rates = { ore: [20, 65], wood: [25, 55], herbs: [20, 50], food: [25, 40] }; assert(rates[kind], 'Geçersiz kaynak.'); this.pay({ [kind]: rates[kind][0] }); this.gain({ gold: rates[kind][1] }); }
    factionTrade(key) { assert(FACTIONS[key] && this.s.rep[key] >= 20, 'Bu toplulukta 20 itibar gerekli.'); if (key === 'council') { assert(!this.s.claimed.includes('special-council'), 'Bu temsilci zaten birliğine katıldı.'); assert(this.s.heroes.length < this.capacity(), 'Kahraman kapasitesi dolu.'); this.pay({ gold: 800, crystals: 240 }); const h = this.makeHero({ stars: 4 }); this.s.heroes.push(h); this.s.claimed.push('special-council'); this.note(h.name + ' meclisin temsilcisi olarak birliğe katıldı.', 'hero'); return h; } assert(this.s.gear.length < 500, 'Ekipman depon dolu.'); this.pay(key === 'caravan' ? { gold: 600 } : { gold: 250, essence: 10 }); const g = this.makeGear(key === 'caravan' ? this.pick(['weapon','armor','accessory']) : 'rune', 3); this.s.gear.push(g); return g; }
    packCapacity() { return this.s.research.logistics ? 8 : 5; }
    setPack(pack) { assert(Object.keys(pack).every(k => k in ITEMS), 'Geçersiz çanta eşyası.'); Object.values(pack).forEach(n => assert(Number.isInteger(n) && n >= 0 && n <= 8, 'Geçersiz eşya sayısı.')); assert(sum(pack) <= this.packCapacity(), 'Erzak çantası kapasitesini aştın.'); Object.entries(pack).forEach(([k,n]) => assert(n <= this.s.items[k], 'Depoda yeterli ' + ITEMS[k].name + ' yok.')); this.s.pack = { potion: 0, antidote: 0, bomb: 0, meal: 0, warmMeal: 0, ...pack }; }
    teamPower() { return this.s.squad.reduce((n,id) => n + (this.hero(id) ? this.stats(this.hero(id)).power : 0), 0); }
    bondBonus(ids) { let points = 0; for (let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++) points += this.s.bonds[[ids[i],ids[j]].sort().join(':')] || 0; return Math.min(.15, points * .002); }
    routes(floor) { if (floor % 10 === 0) return ['normal']; const options = ['normal', floor % 2 ? 'treasure' : 'rescue', floor % 3 ? 'shrine' : 'mystery']; return options; }
    startBattle({ floor = Math.min(100, this.s.floor + 1), route = 'normal', mode = 'tower', choice = 'study' } = {}) {
      assert(this.s.battle?.status !== 'active', 'Önce devam eden savaşı tamamla.'); assert(['tower','defense','secret','challenge'].includes(mode), 'Geçersiz sefer.');
      assert(Number.isInteger(floor) && floor >= 1 && floor <= 100, 'Kat 1–100 arasında olmalı.');
      assert(this.s.squad.length >= 1 && this.s.squad.length <= 3, 'Önce takımını kur.');
      if (mode === 'tower') { assert(floor <= this.s.floor + 1, 'Bu kata henüz ulaşmadın.'); assert(!this.s.pendingDefense, 'Önce üssünü savun.'); assert(this.routes(floor).includes(route), 'Bu katta yol mevcut değil.'); }
      if (mode === 'defense') { assert(this.s.pendingDefense, 'Şu anda üs saldırısı yok.'); floor = Math.max(1, this.s.pendingDefense - 2); route = 'normal'; }
      if (mode === 'secret') { assert(this.s.research.secrets && this.s.floor >= 20, 'Önce kayıp alfabeyi araştır.'); floor = Math.min(100,this.s.floor); route = 'treasure'; }
      if (mode === 'challenge') { assert(this.s.floor >= 100, 'Önce 100. katı tamamla.'); floor = 100; route = 'treasure'; }
      const team = this.s.squad.map(id => this.hero(id)); team.forEach(h => assert(this.available(h), 'Takımda ağır yaralı veya görevde bir kahraman var.'));
      const pack = {}; Object.entries(this.s.pack).forEach(([k,v]) => pack[k] = Math.min(v,this.s.items[k])); assert(sum(pack) <= this.packCapacity(), 'Çanta kapasitesi aşıldı.');
      this.pay({ food: team.length * 3 }); const reg = region(floor), meal = pack.meal > 0, warm = pack.warmMeal > 0;
      if (meal) { pack.meal--; this.s.items.meal--; } if (warm) { pack.warmMeal--; this.s.items.warmMeal--; }
      const bond = this.bondBonus(this.s.squad);
      const heroes = team.map(h => { const st = this.stats(h); return { id:h.id, name:h.name, cls:h.cls, portrait:h.portrait, maxhp:st.hp, hp:Math.round(st.hp * (h.injury ? .72 : 1)), atk:Math.round(st.atk * (meal ? 1.12 : 1) * (1+bond)), def:st.def, energy:floor>=41&&floor<=60&&!warm?1:2, cd:0, shield:mode==='defense'?this.s.buildings.wall*25:0, guard:false, poison:0 }; });
      if (route === 'shrine') heroes.forEach(h => { h.hp = h.maxhp; h.energy = 3; });
      let mult = ROUTES[route].mult * (mode === 'secret' ? 1.3 : 1) * (mode === 'challenge' ? 1.25 + this.s.challenge * .12 : 1);
      const boss = floor % 10 === 0 || mode === 'secret' || mode === 'challenge';
      const n = boss ? (floor >= 50 ? 3 : 2) : (floor >= 15 ? 3 : 2);
      const enemies = Array.from({length:n},(_,i) => { const isBoss = boss && i === 0, hp = Math.round((35 + floor * 6.5 + Math.pow(floor,1.18)) * mult * (isBoss?2.15:1)); return { id:'enemy'+i, name:isBoss ? (mode==='defense'?'Kuşatma Öncüsü':mode==='secret'?'Arşivin Gölgesi':reg.boss) : reg.enemies[(floor+i)%3], hp, maxhp:hp, atk:Math.round((7+floor*1.25)*mult*(isBoss?1.2:1)), def:Math.round(floor*.45), boss:isBoss, charging:false, phase:1, kind:i%3, shield:0 }; });
      this.s.battle = { floor, route, mode, region:REGIONS.indexOf(reg), heroes, enemies, pack, round:1, actor:0, status:'active', log:[], boss, kills:0, choice, reveal:route==='mystery'&&choice==='study' };
      if(route==='shrine')this.bLog('Tapınak ışığı takımın canını ve enerjisini yeniledi.');
      if(route==='mystery' && choice==='loot') { enemies.forEach(e=>e.atk=Math.round(e.atk*1.1)); this.bLog('Mühürlü sandığı açtın. Muhafızlar öfkelendi; zafer ödülü artacak.'); }
      this.bLog(mode === 'defense' ? 'Üs savunması başladı. Surlar takımına kalkan sağladı.' : floor + '. kat · ' + ROUTES[route].name + '.');
      if(floor>=41&&floor<=60&&!warm)this.bLog('Soğuk yüzünden başlangıç enerjisi azaldı.');
      return this.s.battle;
    }
    bLog(t) { if(this.s.battle){this.s.battle.log.unshift(t);this.s.battle.log=this.s.battle.log.slice(0,60);} }
    actor() { const b=this.s.battle; return b?.status==='active'?b.heroes[b.actor]:null; }
    hit(target, amount, piercing = false) { let damage=Math.max(1,Math.round(amount-(piercing?target.def*.4:target.def))); if(target.guard)damage=Math.max(1,Math.round(damage*.42)); const absorbed=Math.min(target.shield||0,damage);target.shield=(target.shield||0)-absorbed;damage-=absorbed;target.hp=Math.max(0,target.hp-damage);return damage; }
    action(kind, targetIndex = 0) {
      const b=this.s.battle;assert(b?.status==='active','Aktif savaş yok.');const a=this.actor();assert(a&&a.hp>0,'Sıra geçersiz.');
      let t=b.enemies[targetIndex];const live=b.enemies.filter(e=>e.hp>0);
      if(kind==='attack'||kind==='skill'&&!['healer','guardian'].includes(a.cls))assert(t&&t.hp>0,'Yaşayan bir düşman seç.');
      if(kind==='skill')assert(a.energy>=2&&a.cd===0,'Yetenek için 2 enerji ve hazır bekleme süresi gerekli.');
      assert(['attack','skill','guard','potion','antidote','bomb'].includes(kind),'Geçersiz eylem.');
      if((kind==='skill'&&a.cls==='healer')||kind==='potion'||kind==='antidote')assert(b.heroes[targetIndex]&&b.heroes[targetIndex].hp>0,'Yaşayan bir müttefik seç.');
      if(['potion','antidote','bomb'].includes(kind))assert((b.pack[kind]||0)>0&&(this.s.items[kind]||0)>0,'Bu eşya sefer çantanda yok.');
      a.guard=false;
      if(kind==='attack'){const shy=this.hero(a.id)?.trait==='shy'&&a.hp<a.maxhp*.3;const d=this.hit(t,a.atk*(shy?.75:1)*(this.random()<.1?1.5:1));this.bLog(a.name+' → '+t.name+': '+d+' hasar.');a.energy=Math.min(3,a.energy+1);}
      else if(kind==='guard'){a.guard=true;a.shield+=Math.round(a.maxhp*.13);a.energy=Math.min(3,a.energy+1);this.bLog(a.name+' savunmaya geçti.');}
      else if(kind==='skill'){
        a.energy-=2;a.cd=3;
        if(a.cls==='healer'){const ally=b.heroes[targetIndex];assert(ally&&ally.hp>0,'Yaşayan bir müttefik seç.');const heal=Math.round(a.atk*3+a.maxhp*.15);ally.hp=Math.min(ally.maxhp,ally.hp+heal);ally.poison=0;this.bLog(a.name+', '+ally.name+' için '+heal+' can yeniledi.');}
        else if(a.cls==='guardian'){b.heroes.filter(h=>h.hp>0).forEach(h=>h.shield+=Math.round(a.maxhp*.27));this.bLog(a.name+' bütün takımı kalkanla korudu.');}
        else if(a.cls==='mage'){live.forEach(e=>{this.hit(e,a.atk*1.35);e.charging=false;});this.bLog(a.name+' Boşluk Mührü kullandı. Hazırlanan saldırılar kesildi.');}
        else{const d=this.hit(t,a.atk*(a.cls==='archer'?2.3:1.95),a.cls==='archer');if(a.cls==='warrior')t.charging=false;this.bLog(a.name+' özel yetenek: '+d+' hasar.');}
      }else{
        assert((b.pack[kind]||0)>0&&(this.s.items[kind]||0)>0,'Bu eşya sefer çantanda yok.');
        if(kind==='bomb'){live.forEach(e=>this.hit(e,45+b.floor*3,true));this.bLog('Alev şişesi bütün düşmanları vurdu.');}
        else{const ally=b.heroes[targetIndex];assert(ally&&ally.hp>0,'Yaşayan bir müttefik seç.');const ratio=kind==='potion'?.45:.15;ally.hp=Math.min(ally.maxhp,ally.hp+Math.round(ally.maxhp*ratio*(this.s.research.medicine?1.2:1)));if(kind==='antidote')ally.poison=0;this.bLog(ally.name+': '+ITEMS[kind].name+' kullanıldı.');}
        b.pack[kind]--;this.s.items[kind]--;
      }
      if(!b.enemies.some(e=>e.hp>0)){this.finishBattle(true);return b;}
      let next=b.actor+1;while(next<b.heroes.length&&b.heroes[next].hp<=0)next++;
      if(next<b.heroes.length)b.actor=next;else this.enemyTurn();return b;
    }
    enemyTurn(){const b=this.s.battle;for(const e of b.enemies.filter(x=>x.hp>0)){
      let live=b.heroes.filter(h=>h.hp>0);if(!live.length)break;
      if(e.boss&&e.hp<e.maxhp*.5&&e.phase===1){e.phase=2;e.atk=Math.round(e.atk*1.2);this.bLog(e.name+' ikinci aşamaya geçti.');}
      if(e.boss&&b.region===0&&b.round%4===0&&b.enemies.some(x=>x!==e&&x.hp>0)){e.hp=Math.min(e.maxhp,e.hp+Math.round(e.maxhp*.08));this.bLog('Diken Tacı, yaşayan muhafızlarından güç çekti. Önce muhafızları yenebilirsin.');}
      if(e.charging){live.forEach(h=>{this.hit(h,e.atk*2.05);if(b.region===1)h.poison=2;if(b.region===2&&!h.guard)h.energy=Math.max(0,h.energy-1);});e.charging=false;this.bLog(e.name+' yıkıcı alan saldırısı yaptı!');if(b.region===1)this.bLog('Zehirli dalga takımına bulaştı.');if(b.region===2)this.bLog('Buz dalgası, savunmayan kahramanların enerjisini azalttı.');if(b.region===3){e.hp=Math.max(1,e.hp-Math.round(e.maxhp*.06));this.bLog('Kor patlaması bossun kendisini de yaktı.');}if(b.region===4){e.shield+=Math.round(e.maxhp*.08);this.bLog('Boşluk, bossun etrafında bir kalkan ördü.');}}
      else if(e.boss&&(b.round%(b.region===4?2:3)===0)){e.charging=true;this.bLog(e.name+' güçlü bir saldırı hazırlıyor! Yetenekle kes veya savun.');}
      else if(!e.boss&&e.kind===2&&b.round%4===0&&b.enemies.some(x=>x!==e&&x.hp>0&&x.hp<x.maxhp)){const ally=b.enemies.filter(x=>x.hp>0).sort((a,c)=>a.hp/a.maxhp-c.hp/c.maxhp)[0];ally.hp=Math.min(ally.maxhp,ally.hp+Math.round(ally.maxhp*.1));this.bLog(e.name+', '+ally.name+' için can yeniledi.');}
      else{const target=this.random()<.65?live[0]:this.pick(live);const d=this.hit(target,e.atk*(.9+this.random()*.2));this.bLog(e.name+' → '+target.name+': '+d+' hasar.');if(b.region===1&&this.random()<.2){target.poison=2;this.bLog(target.name+' zehirlendi.');}}
    }
      b.heroes.filter(h=>h.hp>0).forEach(h=>{if(h.poison){h.hp=Math.max(1,h.hp-Math.round(h.maxhp*.05));h.poison--;}h.cd=Math.max(0,h.cd-1);});
      if(!b.heroes.some(h=>h.hp>0)){this.finishBattle(false);return;}
      b.round++;b.actor=b.heroes.findIndex(h=>h.hp>0);
    }
    autoAction(){const b=this.s.battle,a=this.actor();if(!a)return;
      const ally=b.heroes.reduce((best,h,i)=>h.hp>0&&(!best||h.hp/h.maxhp<best.ratio)?{i,ratio:h.hp/h.maxhp}:best,null);
      if(ally&&ally.ratio<.32&&b.pack.potion>0&&this.s.items.potion>0)return this.action('potion',ally.i);
      if(a.cls==='healer'&&a.energy>=2&&!a.cd&&ally.ratio<.8)return this.action('skill',ally.i);
      let target=b.enemies.findIndex(e=>e.hp>0&&e.charging);if(target<0)target=b.enemies.findIndex(e=>e.hp>0);
      if(a.energy>=2&&!a.cd&&a.cls!=='healer')return this.action('skill',target);
      if(b.enemies.some(e=>e.hp>0&&e.charging))return this.action('guard',target);
      return this.action('attack',target);
    }
    retreat(){assert(this.s.battle?.status==='active','Aktif savaş yok.');this.finishBattle(false,true);}
    finishBattle(win, retreat=false){const b=this.s.battle;b.status=win?'won':retreat?'retreated':'lost';const first=b.mode==='tower'&&b.floor>this.s.floor;let loot={};const lost=[];
      if(win){const reward=ROUTES[b.route].reward*(b.route==='mystery'&&b.choice==='loot'?1.25:1);loot={gold:Math.round((85+b.floor*14)*reward),wood:12+Math.floor(b.floor*.5),ore:10+Math.floor(b.floor*.6),herbs:6+Math.floor(b.floor*.2),crystals:first?(b.boss?180:60):12,essence:b.boss?5:1};if(b.route==='mystery')loot.relic=this.s.research.secrets?2:1;if(b.mode==='secret')loot.relic=3;
        this.gain(loot);this.s.counters.wins++;this.s.counters.kills+=b.enemies.length;
        if(b.mode==='tower'&&first){this.s.floor=b.floor;if(b.floor%10===0){this.s.trophies.push(b.floor);this.s.pendingDefense=b.floor;}LORE.filter(l=>l.floor<=b.floor).forEach(l=>{if(!this.s.lore.includes(l.floor))this.s.lore.push(l.floor);});}
        if(b.mode==='defense'){this.s.pendingDefense=0;this.s.rep.council+=5;}
        if(b.mode==='challenge')this.s.challenge++;
        if(b.route==='rescue'&&this.s.heroes.length<this.capacity()){const h=this.makeHero({stars:this.random()<.2?3:2,civil:this.random()<.5});this.s.heroes.push(h);this.s.counters.rescue++;this.bLog(h.name+' kurtarıldı ve birliğe katıldı.');b.rescued=h.id;}
        if(b.boss||b.route==='treasure'||this.random()<.25){const rarity=clamp(1+Math.floor(b.floor/25)+(this.random()<.2?1:0),1,5),g=this.makeGear(this.pick(['weapon','armor','accessory']),rarity);if(this.s.gear.length<500){this.s.gear.push(g);b.gear=g.id;}}
      }else if(b.mode==='defense'){this.s.pendingDefense=0;this.s.r.gold=Math.max(0,this.s.r.gold-100);this.note('Savunma hattı geri çekildi. Onarıma 100 altın ayrıldı.', 'battle');}
      const ids=b.heroes.map(h=>h.id);
      b.heroes.forEach(bh=>{const h=this.hero(bh.id);if(!h)return;h.fatigue=clamp(h.fatigue+12+(b.region===3?8:0),0,100);h.morale=clamp(h.morale+(win?5:-12),0,100);
        if(bh.hp<=0){if(this.s.settings.permanent&&!retreat&&(b.boss||b.route==='treasure')&&this.random()<.4){lost.push(h.id);this.s.memories.unshift({name:h.name,portrait:h.portrait,level:h.level,day:this.s.day,reason:b.floor+'. katta düştü',kind:'death'});}else h.injury=2;}
        if(win){this.addXp(h,55+b.floor*14);h.records.wins++;if(b.boss)h.records.bosses++;if(b.rescued)h.records.saved++;if(bh.hp>0&&bh.hp<bh.maxhp*.2)h.records.close++;if(h.wish.type==='wins')h.wish.progress++;}
      });
      this.s.heroes=this.s.heroes.filter(h=>!lost.includes(h.id));this.s.squad=this.s.squad.filter(id=>!lost.includes(id));
      if(win)for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const key=[ids[i],ids[j]].sort().join(':');this.s.bonds[key]=Math.min(30,(this.s.bonds[key]||0)+(this.s.research.harmony?2:1));}
      b.loot=loot;b.lost=lost;this.advanceDay(false);this.s.lastResult={win,floor:b.floor,loot,lost,retreat};this.note(b.floor+'. kat '+(win?'tamamlandı.':retreat?'seferinden geri çekildin.':'seferinde yenildin.'), 'battle');
    }
    validate(){return Engine.validate(this.s);}
    static validate(s){
      assert(s&&typeof s==='object'&&s.version===VERSION,'Bu kayıt sürümü desteklenmiyor.');
      const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
      assert(integer(s.uid,0,1e8)&&integer(s.day,1,1e7)&&integer(s.floor,0,100)&&integer(s.challenge,0,100000),'Kayıt ilerlemesi geçersiz.');
      assert(s.guild&&typeof s.guild.name==='string'&&s.guild.name.length<=40&&typeof s.guild.base==='string'&&s.guild.base.length<=40&&/^#[0-9a-f]{6}$/i.test(s.guild.color),'Birlik bilgisi geçersiz.');
      for(const k of Object.keys(RESOURCES))assert(Number.isFinite(s.r?.[k])&&s.r[k]>=0&&s.r[k]<=1e9,'Kaynak bilgisi geçersiz.');
      assert(Array.isArray(s.heroes)&&s.heroes.length<=120&&new Set(s.heroes.map(h=>h.id)).size===s.heroes.length,'Kahraman listesi geçersiz.');
      s.heroes.forEach(h=>{assert(/^h\d+$/.test(h.id)&&typeof h.name==='string'&&h.name.length<=40&&CLASSES[h.cls]&&JOBS[h.job]&&integer(h.stars,1,5)&&integer(h.level,1,99)&&Number.isFinite(h.xp)&&h.xp>=0&&h.xp<1e8&&integer(h.potential,1,100)&&integer(h.portrait,0,11)&&TRAITS.some(t=>t.id===h.trait),'Kahraman verisi geçersiz.');assert(integer(h.fatigue,0,100)&&integer(h.injury,0,2)&&integer(h.morale,0,100)&&integer(h.jobLevel,1,10)&&integer(h.jobTalent,1,100)&&integer(h.jobXp,0,100)&&h.equipment&&h.records&&h.wish&&typeof h.locked==='boolean'&&typeof h.working==='boolean','Kahraman durumu geçersiz.');assert(typeof h.origin==='string'&&h.origin.length<150&&(!h.spec||SPECS[h.cls].includes(h.spec))&&(!h.jobSpec||['Usta Zanaatkâr','Sefer Uzmanı'].includes(h.jobSpec))&&(!h.inherited||TRAITS.some(t=>t.id===h.inherited)),'Kahraman uzmanlığı geçersiz.');assert(['wins','work'].includes(h.wish.type)&&integer(h.wish.target,1,100)&&integer(h.wish.progress,0,1e8)&&typeof h.wish.claimed==='boolean'&&['wins','bosses','saved','close'].every(k=>integer(h.records[k],0,1e8)),'Kahraman geçmişi geçersiz.');});
      assert(Array.isArray(s.squad)&&s.squad.length<=3&&new Set(s.squad).size===s.squad.length&&s.squad.every(id=>s.heroes.some(h=>h.id===id)),'Takım verisi geçersiz.');
      assert(Array.isArray(s.gear)&&s.gear.length<=500&&new Set(s.gear.map(g=>g.id)).size===s.gear.length,'Ekipman listesi geçersiz.');
      s.gear.forEach(g=>assert(/^g\d+$/.test(g.id)&&['weapon','armor','accessory','rune'].includes(g.slot)&&integer(g.rarity,1,5)&&Number.isFinite(g.power)&&g.power>=0&&g.power<=1e5&&typeof g.name==='string'&&g.name.length<80,'Ekipman geçersiz.'));
      const equippedIds=[];s.heroes.forEach(h=>Object.entries(h.equipment).forEach(([slot,id])=>{assert(['weapon','armor','accessory','rune'].includes(slot)&&(!id||s.gear.some(g=>g.id===id&&g.slot===slot)),'Ekipman yuvası geçersiz.');if(id)equippedIds.push(id);}));assert(new Set(equippedIds).size===equippedIds.length,'Bir ekipman birden fazla kahramanda olamaz.');
      Object.keys(BUILDINGS).forEach(k=>assert(integer(s.buildings?.[k],0,5),'Bina seviyesi geçersiz.'));
      Object.keys(ITEMS).forEach(k=>assert(integer(s.items?.[k],0,1e7)&&integer(s.pack?.[k],0,8),'Çanta verisi geçersiz.'));
      assert(Array.isArray(s.missions)&&s.missions.length<=3&&s.missions.every(m=>MISSIONS.some(x=>x.id===m.type)&&integer(m.due,1,1e7)&&Array.isArray(m.heroes)&&m.heroes.length<=2&&m.heroes.every(id=>s.heroes.some(h=>h.id===id))&&Number.isFinite(m.risk)&&m.risk>=0&&m.risk<=1),'Keşif verisi geçersiz.');
      assert(s.research&&s.settings&&[1,2,3].includes(s.settings.speed)&&typeof s.settings.permanent==='boolean','Ayarlar geçersiz.');
      assert(Object.keys(s.research).every(k=>RESEARCH[k]&&typeof s.research[k]==='boolean')&&typeof s.settings.sound==='boolean'&&typeof s.settings.animations==='boolean'&&typeof s.tutorial==='boolean','Kayıt ayarları geçersiz.');
      assert(integer(s.pity,0,19)&&integer(s.totalSummons,0,1e8)&&integer(s.pendingDefense,0,100)&&(!s.pendingDefense||s.pendingDefense%10===0&&s.pendingDefense<=s.floor),'Çağırma veya savunma kaydı geçersiz.');
      assert(s.bonds&&Object.entries(s.bonds).every(([k,v])=>/^h\d+:h\d+$/.test(k)&&integer(v,0,30)),'Takım bağları geçersiz.');
      assert(s.decorations&&Object.entries(s.decorations).every(([k,v])=>['banner','lantern','statue'].includes(k)&&Number.isFinite(v.x)&&v.x>=8&&v.x<=92&&Number.isFinite(v.y)&&v.y>=12&&v.y<=90),'Dekor kaydı geçersiz.');
      for(const k of ['log','memories','lore','trophies','claimed','events'])assert(Array.isArray(s[k])&&s[k].length<=1000,'Kayıt dizisi geçersiz.');
      assert(s.counters&&Object.values(s.counters).every(n=>Number.isFinite(n)&&n>=0&&n<1e9)&&s.rep&&Object.keys(FACTIONS).every(k=>Number.isFinite(s.rep[k])&&s.rep[k]>=0),'İlerleme sayaçları geçersiz.');
      assert(['craft','rescue','dispatch','synthesis','kills','wins'].every(k=>integer(s.counters[k],0,1e8)),'Sayaç kaydı eksik.');
      assert(s.claimed.every(k=>CONTRACTS.some(c=>c.id===k)||k==='special-council')&&s.lore.every(n=>LORE.some(l=>l.floor===n)&&n<=s.floor)&&s.trophies.every(n=>integer(n,10,100)&&n%10===0&&n<=s.floor),'Ödül kaydı geçersiz.');
      assert(s.events.every(x=>typeof x.id==='string'&&['visitor','recipe','stranger'].includes(x.type)&&typeof x.resolved==='boolean')&&s.memories.every(m=>typeof m.name==='string'&&m.name.length<=40&&typeof m.reason==='string'&&m.reason.length<200&&integer(m.level,1,99)&&integer(m.portrait,0,11)&&integer(m.day,1,1e7)&&['death','synthesis'].includes(m.kind)),'Hatıra veya olay kaydı geçersiz.');
      assert(s.log.every(l=>integer(l.day,1,1e7)&&typeof l.message==='string'&&l.message.length<600&&typeof l.type==='string'),'Günlük kaydı geçersiz.');
      const deployedIds=s.missions.flatMap(m=>m.heroes);assert(new Set(deployedIds).size===deployedIds.length&&deployedIds.every(id=>!s.squad.includes(id)),'Bir kahraman iki görevde bulunamaz.');
      assert(sum(s.pack)<=(s.research.logistics?8:5),'Sefer çantası kapasitesi geçersiz.');
      if(s.battle){const b=s.battle;assert(['active','won','lost','retreated'].includes(b.status)&&['tower','defense','secret','challenge'].includes(b.mode)&&integer(b.region,0,4)&&integer(b.floor,1,100)&&integer(b.round,1,100000)&&integer(b.actor,0,2)&&ROUTES[b.route]&&Array.isArray(b.heroes)&&b.heroes.length>=1&&b.heroes.length<=3&&Array.isArray(b.enemies)&&b.enemies.length>=1&&b.enemies.length<=4&&Array.isArray(b.log)&&b.log.every(t=>typeof t==='string'&&t.length<500),'Savaş kaydı geçersiz.');[...b.heroes,...b.enemies].forEach(u=>assert(typeof u.name==='string'&&u.name.length<100&&Number.isFinite(u.hp)&&u.hp>=0&&Number.isFinite(u.maxhp)&&u.maxhp>0&&u.hp<=u.maxhp&&u.maxhp<=1e7&&Number.isFinite(u.atk)&&u.atk>=0&&Number.isFinite(u.def)&&u.def>=0&&Number.isFinite(u.shield)&&u.shield>=0,'Savaşçı kaydı geçersiz.'));b.heroes.forEach(h=>assert(CLASSES[h.cls]&&integer(h.energy,0,3)&&integer(h.cd,0,3)&&integer(h.poison,0,2)&&integer(h.portrait,0,11)&&typeof h.guard==='boolean','Savaş yeteneği kaydı geçersiz.'));b.enemies.forEach(x=>assert(typeof x.charging==='boolean'&&typeof x.boss==='boolean'&&integer(x.phase,1,2)&&integer(x.kind,0,2),'Düşman durumu geçersiz.'));assert(b.pack&&Object.keys(ITEMS).every(k=>integer(b.pack[k],0,8)),'Savaş çantası geçersiz.');if(b.status==='active')assert(b.heroes[b.actor]?.hp>0&&b.heroes.every(h=>s.heroes.some(x=>x.id===h.id)),'Aktif savaş takımı geçersiz.');}
      assert([...s.heroes,...s.gear].every(x=>Number(x.id.slice(1))<=s.uid),'Kimlik sayacı geçersiz.');
      return copy(s);
    }
  }
  const api={Engine,VERSION,CLASSES,JOBS,RESOURCES,ITEMS,BUILDINGS,REGIONS,ROUTES,RESEARCH,MISSIONS,CONTRACTS,LORE,TRAITS,SPECS,FACTIONS,region,clamp,copy};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SC=api;
})(typeof globalThis!=='undefined'?globalThis:this);
