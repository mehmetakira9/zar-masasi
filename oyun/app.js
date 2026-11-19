'use strict';
const G = GameCore, $ = id => document.getElementById(id);
let state, db = null, saving = false, saveAgain = false, saveTimer, toastTimer;
let activeView = 'today', spinning = false, relaxRepeats = false;
let wheelGames = null, rotation = 0, suggestions = [], resultRecordId = null;
let gameDraft = null, editingRecordId = null, pendingImport = null, audio = null;
const imageCache = new Map();
const coverColors = [['#64648e','#282b40'],['#ad704e','#402b28'],['#54897d','#203b3b'],['#805b8a','#382a49'],['#587c9d','#253745'],['#879257','#323e2b']];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function notify(message) {
  $('toast').textContent = message; $('toast').classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3500);
}
function invalidateChoices() { suggestions = []; wheelGames = null; rotation = 0; }
function pool() { return G.pools(state.games, state.history, state.prefs, {relaxRepeats}); }
function held(game) { return game.excluded || game.snoozeUntil > Date.now(); }
function tomorrow() { const date = new Date(); date.setHours(24,0,0,0); return date.getTime(); }
function formatDate(time) { return new Date(time).toLocaleString('tr-TR', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function moodName(id) { return G.MOODS.find(mood => mood.id === id)?.label || 'Hepsi'; }

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bugun-ne-oynasam', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('data');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
async function readState() {
  return new Promise((resolve, reject) => {
    const request = db.transaction('data','readonly').objectStore('data').get('state');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
async function persist() {
  if (!db) return false;
  if (saving) { saveAgain = true; return false; }
  saving = true;
  try {
    do {
      saveAgain = false;
      const snapshot = structuredClone(state);
      await new Promise((resolve, reject) => {
        const tx = db.transaction('data','readwrite'); tx.objectStore('data').put(snapshot,'state');
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    } while (saveAgain);
    $('saveStatus').textContent = '● Değişiklikler kaydedildi'; $('saveStatus').style.color = 'var(--soft)';
    return true;
  } catch (error) {
    $('saveStatus').textContent = 'Kayıt yapılamadı · Yedekle'; $('saveStatus').style.color = 'var(--danger)';
    notify('Kayıt yapılamadı. Kütüphaneni Yedekle düğmesiyle dışa aktar.'); return false;
  } finally { saving = false; }
}
function changed(resetChoices = true) {
  if (resetChoices) invalidateChoices();
  $('saveStatus').textContent = db ? 'Kaydediliyor…' : 'Kayıt kapalı · Yedekle';
  clearTimeout(saveTimer); saveTimer = setTimeout(persist, 150); render();
}

function showView(view) {
  if (spinning) return;
  activeView = view;
  document.querySelectorAll('.view').forEach(node => node.classList.toggle('active',node.id === 'view-' + view));
  document.querySelectorAll('[data-view]').forEach(node => {
    node.classList.toggle('active',node.dataset.view === view);
    node.setAttribute('aria-current',node.dataset.view === view ? 'page' : 'false');
  });
  render();
}
function renderAppearance() {
  document.body.dataset.theme = state.prefs.theme;
  document.documentElement.style.setProperty('--card-size',state.prefs.cardSize+'px');
  $('appBackground').style.backgroundImage = state.prefs.background ? 'url("'+state.prefs.background+'")' : '';
  $('appBackground').style.opacity = state.prefs.backgroundOpacity / 100;
  $('themeSelect').value = state.prefs.theme; $('cardSizeInput').value = state.prefs.cardSize;
  $('cardSizeLabel').textContent = '· '+state.prefs.cardSize+' px';
  $('backgroundOpacityInput').value = state.prefs.backgroundOpacity;
  $('soundInput').checked = state.prefs.sound;
  $('clearBackgroundBtn').disabled = !state.prefs.background;
}
function renderMoodButtons() {
  const container = $('moodButtons'); container.replaceChildren();
  [{id:'all',label:'Hepsi',icon:'✧'},...G.MOODS].forEach(mood => {
    const button = el('button','mood-chip'+(state.prefs.mood === mood.id?' active':''),mood.icon+' '+mood.label);
    button.setAttribute('aria-pressed',state.prefs.mood === mood.id);
    button.onclick = () => { state.prefs.mood = mood.id; relaxRepeats = false; changed(); };
    container.append(button);
  });
}
function renderDashboard() {
  const options = pool(), played = state.history.filter(item => item.outcome === 'played');
  $('navGameCount').textContent = state.games.length; $('totalGames').textContent = state.games.length;
  $('eligibleGames').textContent = options.eligible.length; $('playedSessions').textContent = played.length;
  $('todayDate').textContent = new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'});
  $('repeatSelect').value = state.prefs.repeatWindow; $('excludeFinishedInput').checked = state.prefs.excludeFinished;
  const last = $('lastPlayedBox'); last.replaceChildren(el('small','', 'SON OYNADIĞIN'),el('b','',played[0]?.name || 'Henüz bir oturum yok.'));
  if (played[0]) last.append(el('small','',formatDate(played[0].time)));
  document.querySelectorAll('[data-method]').forEach(node => {
    node.classList.toggle('active',node.dataset.method === state.prefs.method);
    node.setAttribute('aria-pressed',node.dataset.method === state.prefs.method);
  });
  $('chooseBtn').disabled = spinning || !options.eligible.length;
  $('chooseBtn').textContent = spinning ? 'ÇARK DÖNÜYOR…' : state.prefs.method === 'wheel' ? '↻  ÇARKI DÖNDÜR' : state.prefs.method === 'three' ? '▥  ÜÇ OYUN ÖNER' : '✦  OYUNUMU SEÇ';
  const title = !state.games.length ? 'Kütüphanene ilk oyununu ekle.'
    : !options.base.length ? 'Bu kurallara uyan oyun yok.'
      : !options.eligible.length ? 'Son seçimleri biraz dinlendirelim.' : 'Bir sonraki oyununu bulalım.';
  const text = !state.games.length ? 'Oyun ekle düğmesinden başlayabilirsin. Kapak ve ruh hali etiketlerini de ekle.'
    : !options.base.length ? 'Ruh halini değiştir veya kütüphanendeki oynama ve bekletme durumlarını düzenle.'
      : !options.eligible.length ? 'Tekrar sınırını bir seçim için esnetebilir veya kütüphanene yeni oyunlar ekleyebilirsin.'
        : options.eligible.length + ' oyun hazır. Önceliklerin ve favorilerin seçim şansını belirliyor.';
  $('stageTitle').textContent = title; $('stageText').textContent = text;
  $('relaxBtn').classList.toggle('hidden',!options.repeatBlocked || relaxRepeats || spinning);
  $('selectionHint').textContent = relaxRepeats ? 'Bu seçimde yalnızca son seçim sınırı esnetildi.'
    : state.prefs.method === 'three' ? 'Tekrarsız öneriler. İçlerinden seçtiğin oyun geçmişe kaydedilir.' : 'Favoriler ve önceliklerin seçim şansını etkiler.';
  const wheelVisible = state.prefs.method === 'wheel' && (!!wheelGames?.length || options.eligible.length > 0);
  const threeVisible = state.prefs.method === 'three' && suggestions.length > 0;
  $('idleScene').classList.toggle('hidden',wheelVisible || threeVisible);
  $('wheelScene').classList.toggle('hidden',!wheelVisible); $('threeScene').classList.toggle('hidden',!threeVisible);
  if (wheelVisible) drawWheel();
  $('liveStatus').textContent = options.eligible.length+' uygun oyun. Seçim yöntemi: '+G.METHODS[state.prefs.method];
}

function renderCover(container, game) {
  container.replaceChildren();
  if (game.cover) { const img = el('img'); img.src = game.cover; img.alt = game.name+' kapak görseli'; container.append(img); return; }
  const hash = Array.from(game.name || 'Oyun').reduce((sum,char) => sum+char.codePointAt(0),0);
  const colors = coverColors[hash % coverColors.length];
  const art = el('div','cover-fallback'); art.style.setProperty('--cover-a',colors[0]); art.style.setProperty('--cover-b',colors[1]);
  art.append(el('b','',(game.name || 'Oyun').split(/\s+/).slice(0,2).map(word=>word[0]).join('').toLocaleUpperCase('tr-TR')),
    el('span','',game.genre || 'SENİN OYUNUN')); container.append(art);
}
function appendTags(container, game) {
  container.replaceChildren();
  game.moods.forEach(id => container.append(el('span','tag',moodName(id))));
}
function renderLibrary() {
  const query = $('librarySearch').value.trim().toLocaleLowerCase('tr-TR'), status = $('libraryStatus').value, sort = $('librarySort').value;
  const games = state.games.filter(game => (status === 'all' || (status === 'held' ? held(game) : game.status === status))
    && (game.name+' '+game.genre+' '+game.platform).toLocaleLowerCase('tr-TR').includes(query));
  games.sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name,'tr')
    : sort === 'favorite' ? Number(b.favorite)-Number(a.favorite) || b.created-a.created
      : sort === 'priority' ? G.weight(b)-G.weight(a) || b.created-a.created : b.created-a.created);
  const grid = $('libraryGrid'); grid.replaceChildren();
  games.forEach(game => {
    const card = el('article','game-card'), cover = el('div','game-cover'); renderCover(cover,game);
    const favorite = el('button','card-favorite'+(game.favorite?' active':''),'★'); favorite.title = game.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle';
    favorite.setAttribute('aria-label',game.name+' favorisini değiştir');
    favorite.onclick = () => { game.favorite = !game.favorite; changed(); };
    cover.append(favorite,el('span','cover-status',held(game)?'⏸ Öneri dışında':G.STATUS[game.status]));
    const body = el('div','card-body'); body.append(el('h2','',game.name),el('p','card-meta',[game.genre,game.platform].filter(Boolean).join(' · ') || 'Tür ve platform ekleyebilirsin.'));
    const tags = el('div','tags'); appendTags(tags,game); body.append(tags);
    body.append(el('span','priority-pill',(game.favorite?'★ Favori · ':'')+'Seçim ağırlığı '+G.weight(game)+'×'));
    const actions = el('div','card-actions'), edit = el('button','btn','Düzenle'), pause = el('button','btn ghost',held(game)?'Öneriye aç':'Yarına kadar');
    edit.onclick = () => openGame(game.id);
    pause.onclick = () => { if(held(game)){game.excluded=false;game.snoozeUntil=0;}else game.snoozeUntil=tomorrow(); changed(); };
    actions.append(edit,pause); body.append(actions); card.append(cover,body); grid.append(card);
  });
  if (!games.length) {
    const box = el('div','empty'); box.append(el('h2','',state.games.length?'Bu aramada oyun bulunamadı.':'Kütüphanen seni bekliyor.'),el('p','',state.games.length?'Arama veya durum filtresini değiştir.':'Oyunlarını ekle; kapaklarını, ruh hallerini ve önceliklerini birlikte düzenleyelim.'));
    if(!state.games.length){const button=el('button','btn primary','＋ İlk oyunumu ekle');button.onclick=()=>openGame();box.append(button);}
    grid.append(box);
  }
}
function renderHistory() {
  const played = state.history.filter(item=>item.outcome==='played');
  $('historyTotal').textContent = state.history.length; $('historyPlayed').textContent = played.length;
  const minutes = played.reduce((sum,item)=>sum+item.minutes,0); $('historyMinutes').textContent = minutes < 60 ? minutes+' dk' : Math.floor(minutes/60)+' sa '+minutes%60+' dk';
  const filter=$('historyFilter').value, records=state.history.filter(item=>filter==='all'||item.outcome===filter), list=$('historyList');list.replaceChildren();
  records.forEach(record=>{
    const row=el('div','history-row'), cover=el('div','game-cover history-thumb');renderCover(cover,record);
    const text=el('div','history-text');text.append(el('b','',record.name),el('small','',formatDate(record.time)+' · '+G.METHODS[record.method]+' · '+moodName(record.mood)));
    if(record.minutes && record.outcome==='played')text.append(el('small','',record.minutes+' dakika oynadın.'));
    if(record.notes)text.append(el('p','',record.notes));
    const actions=el('div','history-buttons'), edit=el('button','btn',record.outcome==='played'?'Notu düzenle':'Oynadım / düzenle');
    edit.onclick=()=>openRecord(record.id,record.outcome==='played'?null:'played');actions.append(edit);
    row.append(cover,text,el('span','outcome '+record.outcome,G.OUTCOME[record.outcome]),actions);list.append(row);
  });
  if(!records.length)list.append(el('div','empty','Henüz bu görünümde kayıt yok. Seçtiğin oyunlar burada saklanır.'));
}
function render() {
  if(!state)return;renderAppearance();renderMoodButtons();renderDashboard();
  if(activeView==='library')renderLibrary();if(activeView==='history')renderHistory();
}

function openGame(id=null) {
  if(spinning)return;
  const existing=state.games.find(game=>game.id===id);
  if(!existing && state.games.length>=G.MAX_GAMES){notify('En fazla 500 oyun ekleyebilirsin.');return;}
  gameDraft=existing?structuredClone(existing):G.makeGame();
  $('gameDialogTitle').textContent=existing?'Oyunu düzenle':'Oyun ekle';
  [['gameName','name'],['gameGenre','genre'],['gamePlatform','platform'],['gameNotes','notes'],['gameStatus','status'],['gamePriority','priority']].forEach(([id,key])=>$(id).value=gameDraft[key]);
  $('gameFavorite').checked=gameDraft.favorite;
  $('gameSnooze').value=gameDraft.excluded?'excluded':gameDraft.snoozeUntil>Date.now()?'keep':'open';
  $('deleteGameBtn').classList.toggle('hidden',!existing);
  const moods=$('gameMoods');moods.replaceChildren();
  G.MOODS.forEach(mood=>{const label=el('label'), input=el('input');input.type='checkbox';input.value=mood.id;input.checked=gameDraft.moods.includes(mood.id);input.dataset.mood=mood.id;label.append(input,el('span','',mood.label));moods.append(label);});
  renderCover($('coverPreview'),gameDraft);$('removeCoverBtn').disabled=!gameDraft.cover;
  $('gameDialog').showModal();$('gameName').focus();
}
function saveGame(event) {
  event.preventDefault();if(!gameDraft)return;
  const name=$('gameName').value.trim();if(!name){notify('Bir oyun adı yaz.');$('gameName').focus();return;}
  Object.assign(gameDraft,{name:name.slice(0,100),genre:$('gameGenre').value.trim().slice(0,50),platform:$('gamePlatform').value.trim().slice(0,50),notes:$('gameNotes').value.slice(0,2000),status:$('gameStatus').value,priority:Number($('gamePriority').value),favorite:$('gameFavorite').checked});
  gameDraft.moods=Array.from($('gameMoods').querySelectorAll('input')).filter(input=>input.checked).map(input=>input.value);
  const snooze=$('gameSnooze').value;
  if(snooze!=='keep'){
    gameDraft.excluded=snooze==='excluded';gameDraft.snoozeUntil=snooze==='tomorrow'?tomorrow():snooze==='3days'?Date.now()+3*86400000:snooze==='7days'?Date.now()+7*86400000:0;
  }
  const index=state.games.findIndex(game=>game.id===gameDraft.id);
  if(index>=0)state.games[index]=gameDraft;else state.games.push(gameDraft);
  gameDraft=null;$('gameDialog').close();changed();notify('Oyun kütüphanene kaydedildi.');
}
async function compressImage(file,limit) {
  if(!file)return'';
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('JPG, PNG veya WebP dosyası seç.');
  if(file.size>20*1024*1024)throw Error('Görsel en fazla 20 MB olabilir.');
  const bitmap=await createImageBitmap(file);
  if(bitmap.width*bitmap.height>80000000){bitmap.close();throw Error('Daha küçük bir görsel seç.');}
  const scale=Math.min(1,limit/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL('image/webp',.86);
}

function lockSelection(value) {
  spinning=value;
  for(const selector of ['.sidebar','.mood-section','.rules-panel','.method-switch','.top-actions']){
    const node=document.querySelector(selector);if(node){node.inert=value;node.classList.toggle('busy-lock',value);}
  }
  $('chooseBtn').disabled=value;renderDashboard();
}
function chooseNow() {
  if(spinning)return;
  const games=pool().eligible;
  if(!games.length){renderDashboard();notify('Bu kurallara uyan oyun yok. Ruh halini veya tekrar sınırını değiştirebilirsin.');return;}
  if(state.prefs.method==='wheel'){spinWheel(games);return;}
  if(state.prefs.method==='three'){
    suggestions=G.chooseThree(games);renderThree();renderDashboard();
    if(suggestions.length<3)notify('Şu an '+suggestions.length+' uygun oyun var; hepsini gösteriyorum.');return;
  }
  commitChoice(G.choose(games),'single');
}
function renderThree() {
  const container=$('threeScene');container.replaceChildren();
  suggestions.forEach(game=>{
    const card=el('article','three-option'),cover=el('div','game-cover');renderCover(cover,game);
    const info=el('div','three-info');info.append(el('h3','',game.name),el('small','',[game.genre,game.platform].filter(Boolean).join(' · ')||'Senin kütüphanenden'),el('small','',(game.favorite?'★ Favori · ':'')+G.weight(game)+'× ağırlık'));
    const button=el('button','btn primary','Bunu seç');button.onclick=()=>{
      if(!pool().eligible.some(item=>item.id===game.id)){invalidateChoices();renderDashboard();notify('Bu oyun artık seçime uygun değil.');return;}
      commitChoice(game,'three');
    };info.append(button);card.append(cover,info);container.append(card);
  });
}
function commitChoice(game,method) {
  const record=G.makeRecord(game,method,state.prefs.mood);state.history.unshift(record);state.history=state.history.slice(0,G.MAX_HISTORY);
  resultRecordId=record.id;relaxRepeats=false;suggestions=[];
  renderCover($('resultCover'),game);$('resultName').textContent=game.name;
  $('resultMeta').textContent=[game.genre,game.platform,G.STATUS[game.status]].filter(Boolean).join(' · ');
  appendTags($('resultMoods'),game);$('resultNotes').textContent=game.notes;
  changed(false);persist();$('resultDialog').showModal();playSound(true);$('resultPlanBtn').focus();
}
function closeResult(outcome=null) {
  const record=state.history.find(item=>item.id===resultRecordId);if(record&&outcome)record.outcome=outcome;
  resultRecordId=null;$('resultDialog').close();changed(false);
}
function openRecord(id,outcome=null) {
  const record=state.history.find(item=>item.id===id);if(!record)return;
  editingRecordId=id;$('recordTitle').textContent=record.name;
  $('recordOutcome').value=outcome||record.outcome;$('recordMinutes').value=record.minutes;$('recordNotes').value=record.notes;$('recordFinished').checked=false;
  $('recordDialog').showModal();
}
function saveRecord(event) {
  event.preventDefault();const record=state.history.find(item=>item.id===editingRecordId);if(!record)return;
  record.outcome=$('recordOutcome').value;record.minutes=G.clamp(Math.round(Number($('recordMinutes').value)||0),0,1440);record.notes=$('recordNotes').value.slice(0,2000);
  const game=state.games.find(item=>item.id===record.gameId);
  if(game&&record.outcome==='played'){if($('recordFinished').checked)game.status='finished';else if(game.status!=='finished')game.status='playing';}
  editingRecordId=null;$('recordDialog').close();changed();notify('Oyun oturumun kaydedildi.');
}

function getImage(src) {
  if(!src)return null;
  if(!imageCache.has(src)){const image=new Image();image.onload=drawWheel;image.src=src;imageCache.set(src,image);}
  const image=imageCache.get(src);return image.complete&&image.naturalWidth?image:null;
}
function fitText(ctx,text,width) { if(ctx.measureText(text).width<=width)return text;while(text.length>1&&ctx.measureText(text+'…').width>width)text=text.slice(0,-1);return text+'…'; }
function drawWheel() {
  if(!state)return;const canvas=$('wheelCanvas'),size=canvas.clientWidth;if(!size)return;
  const games=wheelGames||pool().eligible,dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(size*dpr)){canvas.width=Math.round(size*dpr);canvas.height=Math.round(size*dpr);}
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size,size);if(!games.length)return;
  const colors=['#efb580','#93b9a6','#939cbc','#ce9da4','#b9b77e','#9cbed0','#bca0cc'];
  const radius=size*.43;ctx.translate(size/2,size/2);ctx.save();ctx.rotate(rotation);
  ctx.beginPath();ctx.arc(0,0,radius+5,0,G.TAU);ctx.fillStyle='#d7c7ad';ctx.fill();
  G.segments(games).forEach(slice=>{
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,slice.start,slice.end);ctx.closePath();ctx.fillStyle=colors[slice.index%colors.length];ctx.fill();ctx.strokeStyle='#23293130';ctx.lineWidth=1;ctx.stroke();
    const image=getImage(slice.game.cover),imageSize=Math.min(size*.12,radius*.66*slice.span*.7);
    if(image&&imageSize>12){
      ctx.save();ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,slice.start,slice.end);ctx.closePath();ctx.clip();ctx.translate(Math.cos(slice.center)*radius*.68,Math.sin(slice.center)*radius*.68);ctx.rotate(-rotation);
      ctx.beginPath();ctx.roundRect(-imageSize/2,-imageSize/2,imageSize,imageSize,imageSize*.14);ctx.clip();const scale=Math.max(imageSize/image.width,imageSize/image.height);ctx.drawImage(image,-image.width*scale/2,-image.height*scale/2,image.width*scale,image.height*scale);ctx.restore();
    }
    if(slice.span*radius*.65<7)return;
    ctx.save();ctx.rotate(slice.center);const font=Math.max(7,Math.min(19,size*.037,radius*slice.span*.34));ctx.font='600 '+font+'px "Segoe UI", sans-serif';ctx.fillStyle='#29313a';ctx.textBaseline='middle';
    if(slice.span>.43){const position=image&&imageSize>12?radius*.36:radius*.63;ctx.translate(position,0);ctx.rotate(Math.PI/2);ctx.textAlign='center';ctx.fillText(fitText(ctx,slice.game.name,Math.min(radius*.92,position*slice.span*.86)),0,0);}
    else{ctx.translate(radius*.86,0);ctx.textAlign='right';ctx.fillText(fitText(ctx,slice.game.name,radius*.58),0,0);}ctx.restore();
  });
  ctx.restore();ctx.beginPath();ctx.arc(0,0,size*.063,0,G.TAU);ctx.fillStyle='#273039';ctx.fill();ctx.strokeStyle='#efcc9c';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#efcc9c';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=size*.034+'px "Segoe UI", sans-serif';ctx.fillText('✦',0,0);
}
async function ensureAudio() {
  if(!state.prefs.sound)return;
  try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')await audio.resume();}catch{audio=null;}
}
function tone(freq,duration,delay=0) {
  if(!audio||!state.prefs.sound)return;const osc=audio.createOscillator(),gain=audio.createGain(),time=audio.currentTime+delay;
  osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(.10,time+.006);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(gain);gain.connect(audio.destination);osc.start(time);osc.stop(time+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
async function playSound(win=false) {await ensureAudio();if(win)[523,659,784].forEach((freq,i)=>tone(freq,.25,i*.10));else tone(620,.04);}
async function spinWheel(games) {
  const chosen=G.choose(games),slice=G.segments(games).find(slice=>slice.game.id===chosen.id);
  wheelGames=games.slice();lockSelection(true);drawWheel();await ensureAudio();
  const target=G.mod(-Math.PI/2-slice.center+(Math.random()-.5)*slice.span*.20,G.TAU),start=rotation;
  const delta=G.mod(target-G.mod(start,G.TAU),G.TAU)+6*G.TAU,began=performance.now();let previous='',tickTime=-100;
  function frame(now){const p=Math.min(1,(now-began)/4300);rotation=start+delta*(1-Math.pow(1-p,3));const at=G.atRotation(games,rotation);if(at.id!==previous&&now-tickTime>45){tone(680,.035);previous=at.id;tickTime=now;}drawWheel();if(p<1)requestAnimationFrame(frame);else{rotation=target;lockSelection(false);drawWheel();commitChoice(chosen,'wheel');}}
  requestAnimationFrame(frame);
}

function download(name,content,type) {const link=el('a'),url=URL.createObjectURL(new Blob([content],{type}));link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function backup() {download('Bugun-Ne-Oynasam-Yedek-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({format:'bugun-ne-oynasam',version:1,games:state.games,history:state.history,prefs:state.prefs},null,2),'application/json');notify('Oyunlar, kapaklar, geçmiş ve ayarlar yedeğe eklendi.');}
function confirmAction(title,text) {
  return new Promise(resolve=>{const dialog=$('confirmDialog');$('confirmTitle').textContent=title;$('confirmText').textContent=text;let finished=false;
    const finish=value=>{if(finished)return;finished=true;dialog.close();resolve(value);};$('confirmYes').onclick=()=>finish(true);$('confirmNo').onclick=()=>finish(false);dialog.oncancel=event=>{event.preventDefault();finish(false);};dialog.showModal();});
}
async function applyImport() {
  if(!pendingImport)return;const data=pendingImport,replace=$('importMode').value==='replace';
  if(!replace && state.games.length+data.games.length>G.MAX_GAMES){notify('Birleştirme sonrası oyun sayısı 500 sınırını aşıyor.');return;}
  if(replace&&!await confirmAction('Kütüphane geri yüklensin mi?','Mevcut oyunlar ve geçmiş, bu yedeğin içeriğiyle değiştirilecek.'))return;
  state.games=replace?data.games:[...state.games,...data.games];state.history=(replace?data.history:[...state.history,...data.history]).sort((a,b)=>b.time-a.time).slice(0,G.MAX_HISTORY);
  if($('importAppearance').checked)state.prefs=data.prefs;
  pendingImport=null;$('importDialog').close();relaxRepeats=false;changed();notify('Yedek içe aktarıldı.');
}

function bindEvents() {
  document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>showView(button.dataset.view));
  ['sidebarAddBtn','libraryAddBtn'].forEach(id=>$(id).onclick=()=>openGame());$('rulesLibraryBtn').onclick=()=>showView('library');
  ['librarySearch','libraryStatus','librarySort'].forEach(id=>$(id).oninput=renderLibrary);
  document.querySelectorAll('[data-method]').forEach(button=>button.onclick=()=>{if(spinning)return;state.prefs.method=button.dataset.method;changed();});
  $('chooseBtn').onclick=chooseNow;$('relaxBtn').onclick=()=>{relaxRepeats=true;invalidateChoices();renderDashboard();notify('Son seçimler bu kez dahil edildi. Diğer kurallar korunuyor.');};
  $('repeatSelect').onchange=()=>{state.prefs.repeatWindow=Number($('repeatSelect').value);relaxRepeats=false;changed();};
  $('excludeFinishedInput').onchange=()=>{state.prefs.excludeFinished=$('excludeFinishedInput').checked;changed();};
  $('gameForm').onsubmit=saveGame;$('closeGameBtn').onclick=()=>$('gameDialog').close();
  $('gameName').oninput=()=>{if(gameDraft){gameDraft.name=$('gameName').value;renderCover($('coverPreview'),gameDraft);}};
  $('coverBtn').onclick=()=>$('coverFile').click();
  $('coverFile').onchange=async()=>{const draft=gameDraft;try{const src=await compressImage($('coverFile').files[0],900);if(src&&draft===gameDraft){draft.cover=src;renderCover($('coverPreview'),draft);$('removeCoverBtn').disabled=false;}}catch(error){notify(error.message);}$('coverFile').value='';};
  $('removeCoverBtn').onclick=()=>{if(gameDraft){gameDraft.cover='';renderCover($('coverPreview'),gameDraft);$('removeCoverBtn').disabled=true;}};
  $('deleteGameBtn').onclick=async()=>{if(!gameDraft)return;const id=gameDraft.id;if(!await confirmAction('Oyun silinsin mi?',gameDraft.name+' kütüphaneden silinecek. Eski seçim kayıtları saklanır.'))return;state.games=state.games.filter(game=>game.id!==id);gameDraft=null;$('gameDialog').close();changed();notify('Oyun silindi.');};
  $('bulkBtn').onclick=()=>{const names=$('bulkInput').value.split(/\r?\n/).map(name=>name.trim()).filter(Boolean),slots=G.MAX_GAMES-state.games.length;if(!names.length){notify('Her satıra bir oyun adı yaz.');return;}if(slots<=0){notify('500 oyun sınırına ulaştın.');return;}names.slice(0,slots).forEach(name=>state.games.push(G.makeGame(name.slice(0,100))));$('bulkInput').value='';changed();notify(Math.min(names.length,slots)+' oyun eklendi.');};
  $('resultCloseBtn').onclick=()=>closeResult();$('resultPlanBtn').onclick=()=>{closeResult('planned');notify('Oyun planın geçmişe kaydedildi.');};
  $('resultSkipBtn').onclick=()=>{closeResult('skipped');chooseNow();};
  $('resultPlayedBtn').onclick=()=>{const id=resultRecordId;closeResult();openRecord(id,'played');};
  $('resultDialog').oncancel=event=>{event.preventDefault();closeResult();};
  $('recordForm').onsubmit=saveRecord;$('closeRecordBtn').onclick=()=>$('recordDialog').close();
  $('historyFilter').onchange=renderHistory;$('historyCsvBtn').onclick=()=>download('Oyun-Gecmisim.csv',G.csv(state.history),'text/csv;charset=utf-8');
  $('clearHistoryBtn').onclick=async()=>{if(!state.history.length){notify('Temizlenecek kayıt yok.');return;}if(!await confirmAction('Seçim geçmişi temizlensin mi?','Geçmiş ve oturum notları silinir. Oyun kütüphanen saklanır; tekrar sınırı da sıfırlanır.'))return;state.history=[];changed();};
  $('themeSelect').onchange=()=>{state.prefs.theme=$('themeSelect').value;changed(false);};
  $('cardSizeInput').oninput=()=>{state.prefs.cardSize=Number($('cardSizeInput').value);changed(false);};
  $('soundInput').onchange=()=>{state.prefs.sound=$('soundInput').checked;changed(false);};
  $('backgroundOpacityInput').oninput=()=>{state.prefs.backgroundOpacity=Number($('backgroundOpacityInput').value);changed(false);};
  $('backgroundBtn').onclick=()=>$('backgroundFile').click();$('backgroundFile').onchange=async()=>{try{const src=await compressImage($('backgroundFile').files[0],1600);if(src){state.prefs.background=src;changed(false);}}catch(error){notify(error.message);}$('backgroundFile').value='';};
  $('clearBackgroundBtn').onclick=()=>{state.prefs.background='';changed(false);};
  ['backupBtn','settingsBackupBtn'].forEach(id=>$(id).onclick=backup);$('importBtn').onclick=()=>$('importFile').click();
  $('importFile').onchange=async()=>{const file=$('importFile').files[0];if(!file)return;try{if(file.size>150*1024*1024)throw Error('Yedek en fazla 150 MB olabilir.');pendingImport=G.importBackup(JSON.parse(await file.text()));$('importSummary').textContent=pendingImport.games.length+' oyun ve '+pendingImport.history.length+' seçim bulundu.';$('importMode').value='merge';$('importAppearance').checked=true;$('importDialog').showModal();}catch(error){pendingImport=null;notify('İçe aktarılamadı: '+error.message);}$('importFile').value='';};
  $('confirmImportBtn').onclick=applyImport;$('cancelImportBtn').onclick=()=>{pendingImport=null;$('importDialog').close();};
  $('demoBtn').onclick=()=>{if(state.games.length+3>G.MAX_GAMES){notify('Örnekler için 3 boş oyun yeri gerekiyor.');return;}[['Hikâye oyunum','story','RPG'],['Sakin akşam','relax','Bulmaca'],['Aksiyon zamanı','action','Aksiyon']].forEach(([name,mood,genre])=>{const game=G.makeGame(name);game.moods=[mood];game.genre=genre;game.platform='Örnek kart';game.notes='Bu bir örnek kart. Kendi oyununun adı ve kapağıyla düzenleyebilirsin.';state.games.push(game);});changed();showView('library');notify('3 örnek kart eklendi. İstersen düzenle veya sil.');};
  $('fullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Tam ekran için F11 tuşunu kullanabilirsin.');}};
  new ResizeObserver(drawWheel).observe($('wheelCanvas'));
  const flush=()=>{clearTimeout(saveTimer);persist();};
  const refreshAvailability=()=>{
    if(spinning||document.querySelector('dialog[open]'))return;
    renderDashboard();if(activeView==='library')renderLibrary();
  };
  window.addEventListener('pagehide',flush);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();else refreshAvailability();});
  setInterval(refreshAvailability,60000);
}
async function init() {
  try{db=await openDatabase();state=await readState();}catch{notify('Yerel kayıt açılamadı. Kütüphaneni Yedekle ile saklayabilirsin.');}
  if(!state||!Array.isArray(state.games)||!Array.isArray(state.history))state={games:[],history:[],prefs:G.defaults()};
  state.prefs=G.cleanPreferences(state.prefs);bindEvents();render();
  if(db)await persist();else{$('saveStatus').textContent='Kayıt kapalı · Yedekle';$('saveStatus').style.color='var(--danger)';}
}
init();
