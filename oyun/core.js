/* İnternetsiz seçim hesapları. Aynı kod tarayıcıda ve Node testlerinde kullanılır. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GameCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const MOODS = [
    {id:'relax', label:'Rahatlamak', icon:'☕'},
    {id:'story', label:'Hikâyeye dalmak', icon:'✦'},
    {id:'action', label:'Aksiyon', icon:'⚡'},
    {id:'compete', label:'Rekabet', icon:'⚑'},
    {id:'explore', label:'Keşfetmek', icon:'◈'},
    {id:'create', label:'Yaratıcılık', icon:'✎'},
    {id:'social', label:'Arkadaşlarla eğlenmek', icon:'☺'}
  ];
  const STATUS = {new:'Başlamadım', playing:'Oynuyorum', finished:'Bitirdim', paused:'Ara verdim'};
  const OUTCOME = {selected:'Seçildi', planned:'Oynamayı planladım', played:'Oynadım', skipped:'Geçtim'};
  const METHODS = {single:'Rastgele seçim', wheel:'Çark', three:'Üç öneri', manual:'Kütüphaneden seçtim'};
  const MAX_GAMES = 500, MAX_HISTORY = 200;
  const TAU = Math.PI * 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mod = (value, size) => ((value % size) + size) % size;
  const uid = () => globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

  function defaults() {
    return {mood:'all', method:'single', repeatWindow:3, excludeFinished:true,
      theme:'night', cardSize:220, background:'', backgroundOpacity:20, sound:true};
  }

  function makeGame(name = '') {
    return {id:uid(), name, genre:'', platform:'', notes:'', cover:'', moods:[],
      status:'new', favorite:false, priority:1, excluded:false, snoozeUntil:0, created:Date.now()};
  }

  // Öncelik normal=1, öncelikli=3, çok istiyorum=5. Favori çarpanı=2.
  function weight(game) {
    return [1,3,5].includes(game.priority) ? game.priority * (game.favorite ? 2 : 1) : 1;
  }

  function pools(games, history, prefs, options = {}) {
    const now = options.now ?? Date.now();
    const base = games.filter(game => !game.excluded && !(game.snoozeUntil > now)
      && (!prefs.excludeFinished || game.status !== 'finished')
      && (prefs.mood === 'all' || game.moods.includes(prefs.mood)));
    const recent = new Set(history.slice(0, prefs.repeatWindow).map(item => item.gameId));
    const eligible = options.relaxRepeats ? base : base.filter(game => !recent.has(game.id));
    return {base, eligible, recent, repeatBlocked:base.length - eligible.length};
  }

  function randomInt(max, cryptoApi = globalThis.crypto) {
    if (!Number.isSafeInteger(max) || max < 1 || max > 0xffffffff) throw Error('Geçersiz seçim aralığı.');
    const sample = new Uint32Array(1), limit = Math.floor(0x100000000 / max) * max;
    do { cryptoApi.getRandomValues(sample); } while (sample[0] >= limit);
    return sample[0] % max;
  }

  function choose(games, draw = randomInt) {
    if (!games.length) return null;
    let ticket = draw(games.reduce((sum, game) => sum + weight(game), 0));
    for (const game of games) {
      if (ticket < weight(game)) return game;
      ticket -= weight(game);
    }
    return games[games.length - 1];
  }

  function chooseThree(games, draw = randomInt) {
    const remaining = games.slice(), selected = [];
    while (remaining.length && selected.length < 3) {
      const game = choose(remaining, draw); selected.push(game);
      remaining.splice(remaining.findIndex(item => item.id === game.id), 1);
    }
    return selected;
  }

  function segments(games) {
    const total = games.reduce((sum, game) => sum + weight(game), 0);
    let start = -Math.PI / 2;
    return games.map((game, index) => {
      const span = weight(game) / total * TAU;
      const slice = {game, index, start, end:start+span, center:start+span/2, span, chance:weight(game)/total};
      start += span; return slice;
    });
  }

  function atRotation(games, rotation) {
    const angle = -Math.PI / 2 + mod(-rotation, TAU);
    return segments(games).find(slice => angle >= slice.start - 1e-10 && angle < slice.end)?.game
      || games[games.length - 1] || null;
  }

  function makeRecord(game, method, mood) {
    return {id:uid(), gameId:game.id, name:game.name, cover:game.cover,
      genre:game.genre, platform:game.platform, time:Date.now(), method, mood,
      outcome:'selected', minutes:0, notes:''};
  }

  function validImage(value) {
    return typeof value === 'string' && value.length < 5000000
      && (!value || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value));
  }

  function cleanPreferences(raw = {}) {
    const prefs = defaults();
    if (raw && typeof raw === 'object') {
      if (MOODS.some(mood => mood.id === raw.mood) || raw.mood === 'all') prefs.mood = raw.mood;
      if (['single','wheel','three'].includes(raw.method)) prefs.method = raw.method;
      if ([0,1,3,5,10].includes(raw.repeatWindow)) prefs.repeatWindow = raw.repeatWindow;
      prefs.excludeFinished = raw.excludeFinished !== false;
      if (['night','light','forest','retro'].includes(raw.theme)) prefs.theme = raw.theme;
      prefs.cardSize = clamp(Number(raw.cardSize) || 220, 180, 300);
      if (!validImage(raw.background || '')) throw Error('Geçersiz arka plan görseli.');
      prefs.background = raw.background || '';
      prefs.backgroundOpacity = clamp(Number(raw.backgroundOpacity) || 0, 0, 45);
      prefs.sound = raw.sound !== false;
    }
    return prefs;
  }

  // Bütün yedek doğrulanır; çağıran, doğrulama bitmeden mevcut veriyi değiştirmez.
  function importBackup(data) {
    if (!data || data.format !== 'bugun-ne-oynasam' || data.version !== 1
        || !Array.isArray(data.games) || data.games.length > MAX_GAMES) throw Error('Geçerli bir uygulama yedeği seç.');
    const ids = new Map();
    const games = data.games.map(raw => {
      if (!raw || !String(raw.name || '').trim() || !validImage(raw.cover || '')) throw Error('Geçersiz oyun veya kapak görseli.');
      if (typeof raw.id !== 'string' || ids.has(raw.id)) throw Error('Yedekte oyun kimlikleri geçersiz.');
      const game = makeGame(String(raw.name).trim().slice(0,100)); ids.set(raw.id, game.id);
      game.genre = String(raw.genre || '').slice(0,50); game.platform = String(raw.platform || '').slice(0,50);
      game.notes = String(raw.notes || '').slice(0,2000); game.cover = raw.cover || '';
      game.moods = Array.isArray(raw.moods) ? [...new Set(raw.moods.filter(id => MOODS.some(mood => mood.id === id)))] : [];
      game.status = Object.hasOwn(STATUS, raw.status) ? raw.status : 'new';
      game.priority = [1,3,5].includes(raw.priority) ? raw.priority : 1;
      game.favorite = !!raw.favorite; game.excluded = !!raw.excluded;
      game.snoozeUntil = Number.isFinite(raw.snoozeUntil) ? clamp(raw.snoozeUntil,0,8640000000000000) : 0;
      game.created = Number.isFinite(raw.created) ? clamp(raw.created,0,8640000000000000) : Date.now();
      return game;
    });
    const history = Array.isArray(data.history) ? data.history.slice(0,MAX_HISTORY).map(raw => {
      if (!raw || !validImage(raw.cover || '')) throw Error('Geçersiz geçmiş görseli.');
      return {id:uid(), gameId:ids.get(raw.gameId) || 'deleted-' + uid(),
        name:String(raw.name || 'Silinmiş oyun').slice(0,100), cover:raw.cover || '',
        genre:String(raw.genre || '').slice(0,50), platform:String(raw.platform || '').slice(0,50),
        time:Number.isFinite(raw.time) && raw.time > 0 && raw.time < 8640000000000000 ? raw.time : Date.now(),
        method:Object.hasOwn(METHODS,raw.method) ? raw.method : 'single',
        mood:MOODS.some(mood => mood.id === raw.mood) ? raw.mood : 'all',
        outcome:Object.hasOwn(OUTCOME,raw.outcome) ? raw.outcome : 'selected',
        minutes:clamp(Math.round(Number(raw.minutes) || 0),0,1440), notes:String(raw.notes || '').slice(0,2000)};
    }) : [];
    return {games, history, prefs:cleanPreferences(data.prefs)};
  }

  function csv(history) {
    const quote = value => '"' + String(value).replace(/"/g, '""') + '"';
    const safe = value => /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
    const rows = [['Tarih','Oyun','Yöntem','Durum','Dakika','Not'], ...history.map(item =>
      [new Date(item.time).toLocaleString('tr-TR'),safe(item.name),METHODS[item.method],OUTCOME[item.outcome],item.minutes,safe(item.notes)])];
    return '\ufeff' + rows.map(row => row.map(quote).join(';')).join('\r\n');
  }

  return {MOODS,STATUS,OUTCOME,METHODS,MAX_GAMES,MAX_HISTORY,TAU,clamp,mod,uid,defaults,makeGame,
    weight,pools,randomInt,choose,chooseThree,segments,atRotation,makeRecord,validImage,
    cleanPreferences,importBackup,csv};
});
