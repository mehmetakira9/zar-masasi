/* Zar Masası 3 — Karakter, Savaş, Ölüm & Kader, Envanter, Kampanya, Lifepath
   Tüm veriler bu cihazda (localStorage 'zm3-data') tutulur. Yedek menüsüyle dışa/içe aktarılır. */
(() => {
'use strict';
const KEY='zm3-data', PAGE_KEY='zm3-page';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
const uid=()=>Math.random().toString(36).slice(2,10);
const sgn=n=>(n>=0?'+':'−')+Math.abs(n);
const ZM=window.ZM||{toast:m=>alert(m),rnd:n=>1+Math.floor(Math.random()*n),rollOne:(s,c)=>c?Math.floor(s/2)+Math.floor(Math.random()*(s-Math.floor(s/2)+1)):1+Math.floor(Math.random()*s),getRes:()=>({rr:1,tk:0}),setRes(){},load(){},redraw(){},sound(){}};
const toast=(m,k)=>ZM.toast(m,k||'');
const roll=n=>ZM.rnd(n);

/* ---------- Sabitler ---------- */
const STATS=[['guc','Güç'],['cev','Çeviklik'],['day','Dayanıklılık'],['zek','Zeka'],['bil','Bilgelik'],['kar','Karizma']];
const SN=Object.fromEntries(STATS);
const SHORT={guc:'Güç',cev:'Çev',day:'Day',zek:'Zek',bil:'Bil',kar:'Kar'};
const SKILLS=[['Akrobasi','cev'],['Aldatma','kar'],['Algı','bil'],['Araştırma','zek'],['Atletizm','guc'],['Büyü Bilgisi','zek'],['Din','zek'],['Doğa','zek'],['El Çabukluğu','cev'],['Gizlilik','cev'],['Gözdağı','kar'],['Hayatta Kalma','bil'],['Hayvan Terbiyesi','bil'],['İkna','kar'],['Performans','kar'],['Sezgi','bil'],['Tarih','zek'],['Tıp','bil']];
const RAR={sira:['⚪','Sıradan'],nadir:['🟢','Nadir'],ender:['🔵','Ender'],destan:['🟣','Destansı'],efsane:['🟠','Efsanevi'],bilinmez:['❓','??? Bilinmiyor']};
const LIFE=[['dogum','🏘️ Doğum yeri',10],['aile','👨‍👩‍👧 Aile durumu',10],['cocukluk','🎒 Çocukluk olayı',10],['genclik','⚡ Gençlikte dönüm noktası',10],['dost','🤝 Dost',6],['dusman','🗡️ Düşman',6]];
const KADER=[[1,2,'⚰️ Gerçek Ölüm','Hikâye biter. Efsane özeti yazılır; sonraki karaktere 1 küçük miras bonusu kalır.'],[3,4,'👻 Huzursuz Ruh','Hayalet olarak kalırsın; yarım kalan bir görevi bitirirsen dirilme şansı kazanırsın.'],[5,6,'🧬 Mirasçı','Öğrencin, çocuğun ya da yoldaşınla aynı dünyada devam edersin; itibar ve bazı eşyalar ona geçer.'],[7,8,'🐉 Canavar Olarak Doğuş','Aynı dünyada zayıf bir canavar olarak doğarsın; evrimleşerek güçlenirsin.'],[9,10,'🎭 Beden Ele Geçirme','Yeni ölmüş birinin bedenine geçersin; hayatı, borçları ve düşmanları da sana kalır.'],[11,12,'😈 Tanrıyla Pazarlık','Bir tanrı, şeytan ya da takımyıldız seni bir bedel karşılığında diriltir.'],[13,15,'🔄 Reenkarnasyon','Aynı dünyada bebek olarak doğarsın; anıların bulanık, eski bir yeteneğin kalır.'],[16,18,'🌀 İsekai','Başka bir evrende yeni bir hikâye; bir yeteneğin ya da eşyan seninle gelir.'],[19,20,'⏳ Gerileme','Tüm anılarınla geçmişe dönersin; güçlerin sıfırlanır ama geleceği bilirsin.']];
const STD=[15,14,13,12,10,8];

/* ---------- Veri modeli ---------- */
function newCamp(name){return{id:uid(),name:name||'Yeni Kampanya',evren:'',ton:'',zorluk:'',yasam:1,created:new Date().toISOString(),
  char:{ad:'',yas:'',cins:'',seviye:1,xp:0,xpNext:300,stats:{guc:10,cev:10,day:10,zek:10,bil:10,kar:10},save:{},skills:{},custom:[],
    hp:10,hpMax:10,enAd:'Enerji',en:0,enMax:0,zirh:0,kalkan:0,acDiger:0,kusur:'',yetenek:'',egIK:'Nötr',egDK:'Nötr',
    unvan:'',basarim:'',yaralar:[],etkiler:[],rr:1,tk:0,kart:0,kartlar:''},
  inv:{para:0,birim:'Altın',items:[]},
  combat:{tur:1,sira:0,list:[]},
  death:{s:0,f:0,durum:'',hileli:false,last:null,log:[],sd:0,kader:null,kaderDis:false},
  notes:{kehanet:'',son:'',npc:[],gorev:[],itibar:[],borc:[],notlar:''},
  life:{r:{},st:[],method:'roll',assign:{}},
  world:{gun:1,saat:8,dk:0,hava:'',mevsim:'',yer:'',olaylar:[],sureli:[]},
  map:{img:'',places:[]},
  recipes:[],ach:[]};}
function fill(def,obj){ // eksik alanları varsayılanla tamamla (eski yedekler için)
  if(obj==null||typeof obj!=='object'||Array.isArray(def))return obj??def;
  for(const k of Object.keys(def)){if(!(k in obj))obj[k]=def[k];else if(def[k]&&typeof def[k]==='object'&&!Array.isArray(def[k]))fill(def[k],obj[k]);}
  return obj;
}
function seedTowerOfGod(){
  const c=newCamp('Tower of God — Akira');
  Object.assign(c,{evren:'Tower of God (Kule)',ton:'ciddi ve epik',zorluk:'orta'});
  Object.assign(c.char,{ad:'Akira',yas:'17',cins:'Erkek',egIK:'İyi',egDK:'Nötr',enAd:'Shinsu',rr:1,tk:0,
    yaralar:[{t:'Sol avuçta kızgın Shinsu mührü izi (içinden yatay çizgi geçen daire)'}]});
  c.inv.birim='Para';
  c.inv.items=[
    {id:uid(),ad:'Mühürlü sınav davetiyesi',nad:'sira',adet:1,eq:false,gorunus:'',acik:'Mührünün üzerinde, avucumdaki izle aynı çizgi var.'},
    {id:uid(),ad:'',nad:'bilinmez',adet:1,eq:false,gorunus:"Yuna'nın son mektubu (?)",acik:''},
    {id:uid(),ad:'Mülteci kıyafeti',nad:'sira',adet:1,eq:true,gorunus:'',acik:''}];
  c.notes.kehanet='Kapıyı sen açmadın, ama kapı seni hatırlıyor.\nKırk dokuzuncu basamakta bir dostun sırtını göreceksin;\nya bıçağı sen tutarsın, ya da o.\nIşık taşıyan seni karanlıkta bulacak,\nve Kule bir gün senin adını fısıldayacak:\nyanlış adını.';
  c.notes.son="Karakter oluşturma sürüyor: kusur seçimi ve özellik yöntemi bekleniyor. Açılış: 2. Kat, Evankhell'in Cehennemi, soğuk taş sınav salonu, yüzlerce aday. Ilan yanımda, Dario salonun öbür ucunda.";
  c.notes.npc=[
    {id:uid(),ad:'Yuna',rol:'Kayıp abla',il:'Aile',not:'8 yaşımdayken Kule\'ye gitti. Son mektubu: "Kimseye benim adımı söyleme."'},
    {id:uid(),ad:'Ilan Sorre',rol:'Dost · Wave Controller',il:'Yanımda',not:'18 yaşında, az konuşur. Davetiyesi önce geldi ama beni bekledi.'},
    {id:uid(),ad:'Mera',rol:'Kampın şifacısı',il:'Güvenilir',not:'Ilan\'ın annesi; avucumdaki yarayı sardı.'},
    {id:uid(),ad:'Lio',rol:'Hespera\'dan çocuk (13)',il:'Beni abisi gibi görüyor',not:'Konvoydan kurtardığım çocuk; Hespera\'da kaldı.'},
    {id:uid(),ad:'Dario Vost',rol:'Düşman',il:'Düşmanca',not:'Albay Vost\'un oğlu. Sınavda, yanında 2 kiralık adam var.'},
    {id:uid(),ad:'Albay Vost',rol:'Hespera garnizon komutanı',il:'Düşmanca',not:'Ailemin su payını yarıya indirdi.'},
    {id:uid(),ad:'Gözleri bağlı Ranker',rol:'Gizemli kadın',il:'Bilinmiyor',not:'"Sende akan şey bu kata ait değil." Davetiyeyi o gönderdi.'}];
  c.notes.gorev=[{id:uid(),ad:"Yuna'yı bul",tur:'Ana',durum:'Aktif',not:''},{id:uid(),ad:'2. Kat sınavını geç',tur:'Ana',durum:'Aktif',not:''}];
  c.life.r={
    dogum:{v:5,not:'Hespera mülteci katı: üst üste konteyner evler, kesilen ışık hatları, su kuyrukları, Shinsu fırtınaları.'},
    aile:{v:7,not:'Ablam Yuna, ben 8 yaşındayken yeşil ışıklı davetiyeyle Kule\'ye gitti. 2 yıl mektup geldi, sonra hiç haber gelmedi.'},
    cocukluk:{v:2,not:'11 yaşımda sarı bayraklı sahte yardım konvoyu çocuk kaçırdı. Lio\'yu kurtardım; sol avucum mühürle dağlandı.'},
    genclik:{v:4,not:'16 yaşımda gözleri bağlı bir Ranker kadın geldi. 3 gün sonra mühürlü davetiye geldi; 17\'mde yola çıktım.'},
    dost:{v:4,not:'Ilan Sorre (18), şifacı Mera\'nın oğlu, Wave Controller.'},
    dusman:{v:3,not:'Dario Vost: 4 yıl önce Lio\'yu itti, burnunu kırdım.'}};
  c.world.yer="2. Kat · Evankhell'in Cehennemi";
  c.map.places=[
    {id:uid(),ad:'Hespera',bolge:'Mülteci katı',durum:'Keşfedildi',not:'Doğduğum yer. Konteyner evler, Shinsu fırtınaları.',x:null,y:null},
    {id:uid(),ad:"Evankhell'in Cehennemi",bolge:'2. Kat',durum:'Keşfedildi',not:'Sınav salonu.',x:null,y:null}];
  return c;
}

let S=null;
try{S=JSON.parse(localStorage.getItem(KEY));}catch{}
if(!S||typeof S!=='object'||!S.campaigns||!Object.keys(S.campaigns).length){
  const c=seedTowerOfGod();S={v:3,active:c.id,campaigns:{[c.id]:c}};
}
Object.values(S.campaigns).forEach(c=>{fill(newCamp(),c);
  // eski düz metin başarımları vitrine taşı
  if(!c._achMig){if(c.char.basarim&&!c.ach.length)c.ach=c.char.basarim.split(/\n|,/).map(s=>s.trim()).filter(Boolean).map(ad=>({id:uid(),ic:'🏆',ad,acik:'',gun:''}));c._achMig=true;}});
if(!S.campaigns[S.active])S.active=Object.keys(S.campaigns)[0];
const C=()=>S.campaigns[S.active];

let saveT,locked=false;
function save(){if(locked)return;clearTimeout(saveT);saveT=setTimeout(flush,250);}
function flush(){clearTimeout(saveT);if(locked)return true;try{localStorage.setItem(KEY,JSON.stringify(S));return true;}catch(e){toast('Kaydedilemedi: depolama dolu olabilir','fumble');return false;}}
addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});

function getP(o,p){return p.split('.').reduce((a,k)=>a==null?a:a[k],o);}
function setP(o,p,v){const ks=p.split('.');let a=o;for(let i=0;i<ks.length-1;i++){if(a[ks[i]]==null||typeof a[ks[i]]!=='object')a[ks[i]]={};a=a[ks[i]];}a[ks[ks.length-1]]=v;}

/* ---------- Hesaplar ---------- */
const mod=v=>Math.floor((num(v)-10)/2);
const prof=()=>2+Math.floor((Math.max(1,num(C().char.seviye))-1)/4);
const acOf=()=>{const ch=C().char;return 10+mod(ch.stats.cev)+num(ch.zirh)+num(ch.kalkan)+num(ch.acDiger);};
const saveB=s=>mod(C().char.stats[s])+(C().char.save[s]?prof():0);
function skillB(key){const ch=C().char;
  if(key.startsWith('c:')){const x=ch.custom[+key.slice(2)];if(!x)return 0;return mod(ch.stats[x.stat]||10)+(x.pro?prof():0);}
  const nm=key.slice(2),sk=SKILLS.find(s=>s[0]===nm);if(!sk)return 0;return mod(ch.stats[sk[1]])+(ch.skills[nm]?prof():0);}
function hpState(hp,max){hp=num(hp);if(hp<=0)return['ko','0 HP · Baygın'];const p=hp/Math.max(1,num(max));
  if(p>.5)return['ok','Normal'];if(p>.25)return['warn','Yaralı'];return['bad','Ağır Yaralı'];}
function bonusOf(src){
  const [k,a,b]=src.split(':');
  if(k==='save')return saveB(a);if(k==='stat')return mod(C().char.stats[a]);if(k==='ini')return mod(C().char.stats.cev);
  if(k==='skill')return skillB(a+':'+b);return 0;}

/* ---------- HTML yardımcıları ---------- */
function inp(k,o={}){
  const v=getP(C(),k),t=o.type||'text',rr=o.rr?' data-rr':'',ex=o.attr||'';
  if(t==='area')return `<textarea class="in" data-k="${k}" rows="${o.rows||3}" placeholder="${esc(o.ph||'')}"${rr} ${ex}>${esc(v??'')}</textarea>`;
  if(t==='check')return `<input type="checkbox" data-k="${k}" ${v?'checked':''}${rr} ${ex}>`;
  if(t==='select')return `<select class="in" data-k="${k}"${rr} ${ex}>${o.opts.map(x=>{const[val,lab]=Array.isArray(x)?x:[x,x];return `<option value="${esc(val)}" ${String(val)===String(v??'')?'selected':''}>${esc(lab)}</option>`;}).join('')}</select>`;
  const n=t==='n';
  return `<input class="in" type="${n?'number':'text'}" ${n?'data-t="n" inputmode="numeric"':''} data-k="${k}" value="${esc(v??'')}" placeholder="${esc(o.ph||'')}"${rr} ${ex}>`;
}
const fld=(label,k,o={})=>`<label class="fld ${o.cls||''}"><span>${label}</span>${inp(k,o)}</label>`;
const card=(title,body,extra='')=>`<section class="card"><h2>${title}${extra}</h2>${body}</section>`;
const dz=(src,label,t='d20')=>`<button type="button" class="die-btn" data-act="dz" data-src="${src}" data-label="${esc(label)}" title="${esc(label)} için zar masasına git">${t==='d20'?'🎲':t}</button>`;
function pipsHTML(k,max,cls,icon){return `<div class="pips" data-c="pips" data-p="${k}" data-max="${max}" data-cls="${cls}" data-ic="${icon}"></div>`;}
/* Liste editörü: path = kampanya içindeki dizi; fields = [{k,ph,type,opts}] */
const TPL={
  'char.etkiler':()=>({ad:'',sure:''}),'char.yaralar':()=>({t:''}),
  'notes.npc':()=>({id:uid(),ad:'',rol:'',il:'',not:''}),'notes.gorev':()=>({id:uid(),ad:'',tur:'Ana',durum:'Aktif',not:''}),
  'notes.itibar':()=>({id:uid(),yer:'',durum:''}),'notes.borc':()=>({id:uid(),t:''}),
  'world.olaylar':()=>({id:uid(),t:'',kaynak:'',durum:'❔ Doğrulanmadı',gun:C().world.gun}),
  'world.sureli':()=>({id:uid(),ad:'',gun:num(C().world.gun)+1,saat:C().world.saat}),
  'map.places':()=>({id:uid(),ad:'',bolge:'',durum:'Duyuldu',not:'',x:null,y:null}),
  'recipes':()=>({id:uid(),ad:'',tur:'Simya',mal:'',sonuc:'',zar:'',durum:'Öğrenildi',kaynak:'',not:''}),
  'ach':()=>({id:uid(),ic:'🏆',ad:'',acik:'',gun:C().world.gun+'. gün'})};
function listHTML(path,fields,cols,empty,addLabel,extra){
  const arr=getP(C(),path)||[];
  const rows=arr.map((_,i)=>`<div class="li"><div class="grow li-grid" style="--cols:${cols}">${fields.map(f=>inp(`${path}.${i}.${f.k}`,f)).join('')}${extra?extra(i):''}</div><button type="button" class="x" data-act="del" data-p="${path}" data-i="${i}" aria-label="Sil">✕</button></div>`).join('');
  return `<div class="list">${rows||`<div class="empty-note">${empty}</div>`}</div><div class="btnrow" style="margin-top:10px"><button type="button" class="btn sm" data-act="add" data-p="${path}">＋ ${addLabel||'Ekle'}</button></div>`;
}

/* ---------- Canlı hesaplanan alanlar ---------- */
const CALC={
  mod:(el,a)=>el.textContent=sgn(mod(C().char.stats[a])),
  save:(el,a)=>el.textContent=sgn(saveB(a)),
  skill:(el,a,b)=>el.textContent=sgn(skillB(a+':'+b)),
  prof:el=>el.textContent=sgn(prof()),
  ac:el=>el.textContent=acOf(),
  ini:el=>el.textContent=sgn(mod(C().char.stats.cev)),
  pasif:el=>el.textContent=10+skillB('b:Algı'),
  meter:(el,a)=>{const ch=C().char;let v,m;if(a==='en'){v=num(ch.en);m=num(ch.enMax);}else{v=num(ch.hp);m=num(ch.hpMax);}
    const p=m>0?Math.max(0,Math.min(100,v/m*100)):0;el.querySelector('i').style.width=p+'%';
    if(a!=='en'){const st=hpState(v,m)[0];el.className='meter'+(st==='warn'?' warn':st==='bad'||st==='ko'?' bad':'');}},
  hpst:el=>{const ch=C().char,[k,t]=hpState(ch.hp,ch.hpMax);el.className='state '+k;el.textContent=t;},
  hpko:el=>{el.hidden=num(C().char.hp)>0;},
  cbst:(el,i)=>{const x=C().combat.list[+i];if(!x)return;const ch=C().char;const[k,t]=x.link?hpState(ch.hp,ch.hpMax):hpState(x.hp,x.hpMax);el.className='state '+k;el.textContent=t;},
  res:(el,a)=>{const ch=C().char;el.textContent=a==='rr'?ch.rr+'/4':a==='tk'?ch.tk+'/2':ch.kart+'/2';},
  pips:el=>{const p=el.dataset.p,max=+el.dataset.max,n=num(getP(C(),p));
    el.innerHTML=Array.from({length:max},(_,j)=>`<button type="button" class="pip ${el.dataset.cls}${j<n?' full':''}" data-act="pip" data-p="${p}" data-i="${j+1}" aria-label="${j+1} olarak ayarla">${el.dataset.ic}</button>`).join('');},
  lpv:(el,k)=>{const v=getP(C(),'life.r.'+k+'.v');el.textContent=v||'—';el.classList.toggle('empty',!v);},
  clock:el=>{el.textContent=clockText();},
  phase:el=>{const[i,t]=phase(C().world.saat);el.textContent=i+' '+t;el.className='state '+(t==='Gece'?'warn':'ok');},
  remain:(el,i)=>{const o=C().world.sureli[+i];if(!o)return;const t=remain(o);el.textContent=t;el.style.color=t.startsWith('⌛')?'var(--fumble)':'var(--gold2)';},
  achn:el=>{el.textContent=C().ach.length;}
};
/* ---------- Zaman yardımcıları ---------- */
const pad=n=>String(Math.max(0,num(n))).padStart(2,'0');
const tNow=()=>{const w=C().world;return(num(w.gun)-1)*1440+num(w.saat)*60+num(w.dk);};
function tAdd(min){const w=C().world;let t=Math.max(0,tNow()+min);w.gun=Math.floor(t/1440)+1;t%=1440;w.saat=Math.floor(t/60);w.dk=t%60;}
function phase(h){h=num(h);if(h>=5&&h<7)return['🌅','Şafak'];if(h>=7&&h<18)return['☀️','Gündüz'];if(h>=18&&h<20)return['🌇','Akşam'];return['🌙','Gece'];}
const clockText=()=>{const w=C().world;return num(w.gun)+'. gün · '+pad(w.saat)+':'+pad(w.dk);};
function remain(o){if(o.gun===''||o.gun==null)return'—';const d=(num(o.gun)-1)*1440+num(o.saat)*60-tNow();if(d<=0)return'⌛ Süre doldu';
  const g=Math.floor(d/1440),s=Math.floor(d%1440/60),m=d%60;return'⏳ '+[(g?g+' gün':''),(s?s+' saat':''),(!g&&m?m+' dk':'')].filter(Boolean).join(' ')+' kaldı';}
function refresh(scope=document){scope.querySelectorAll('[data-c]').forEach(el=>{const[n,...a]=el.dataset.c.split(':');CALC[n]&&CALC[n](el,...a);});}

/* ======================= SAYFALAR ======================= */
const PAGES={};

/* ---------- Karakter ---------- */
PAGES.karakter=()=>{
  const c=C(),ch=c.char;
  const stats=STATS.map(([k,n])=>`<div class="stat"><span class="nm">${n}</span><span class="md" data-c="mod:${k}"></span>${inp('char.stats.'+k,{type:'n',attr:'aria-label="'+n+' değeri" min="1" max="30"'})}
    <span class="sv"><label title="Kurtarma zarında uzman">${inp('char.save.'+k,{type:'check'})} Kurt.</label><b data-c="save:${k}"></b>${dz('save:'+k,n+' kurtarma zarı')}</span></div>`).join('');
  const skills=SKILLS.map(([nm,st])=>`<div class="sk ${ch.skills[nm]?'pro':''}">${inp('char.skills.'+nm,{type:'check',rr:1,attr:'aria-label="'+nm+' uzmanlığı"'})}<span class="sn">${nm}<em>${SHORT[st]}</em></span><span class="sb" data-c="skill:b:${nm}"></span>${dz('skill:b:'+nm,nm)}</div>`).join('');
  const custom=ch.custom.map((x,i)=>`<div class="sk ${x.pro?'pro':''}">${inp(`char.custom.${i}.pro`,{type:'check',rr:1})}<input class="in" style="height:30px" data-k="char.custom.${i}.ad" value="${esc(x.ad)}" placeholder="Beceri adı (örn. Denizcilik)"><select class="in" style="height:30px;width:80px" data-k="char.custom.${i}.stat" data-rr>${STATS.map(([k])=>`<option value="${k}" ${x.stat===k?'selected':''}>${SHORT[k]}</option>`).join('')}</select><span class="sb" data-c="skill:c:${i}"></span>${dz('skill:c:'+i,x.ad||'Beceri')}<button type="button" class="x" data-act="del" data-p="char.custom" data-i="${i}">✕</button></div>`).join('');
  return `
  <div class="page-title"><h2>📋 Karakter Kağıdı</h2><span class="sp"></span><span class="faint small">💀 ${num(c.yasam)}. yaşam · ${esc(c.name)}</span></div>
  <div class="cols"><div class="stack">
    ${card('Kimlik',`<div class="frow">${fld('Ad','char.ad',{ph:'Karakter adı'})}${fld('Yaş','char.yas')}${fld('Cinsiyet','char.cins')}</div>
      <div class="frow">${fld('Seviye','char.seviye',{type:'n',attr:'min="1" max="30"'})}${fld('XP','char.xp',{type:'n'})}${fld('Sonraki seviye XP','char.xpNext',{type:'n'})}</div>`)}
    ${card('Özellikler',`<div class="stats">${stats}</div><p class="hint">Bonus = (değer − 10) ÷ 2, aşağı yuvarlanır. "Kurt." işaretliyse kurtarma zarına Yeterlilik eklenir. 🎲 tuşu zarı bonusla birlikte masaya koyar.</p>`)}
    ${card('Beceriler',`<div class="skills">${skills}</div>
      <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px"><div class="muted small" style="font-weight:700;margin-bottom:6px">EVRENE ÖZEL BECERİLER</div><div class="list">${custom||'<div class="empty-note">Örn. Denizcilik, Shinsu Kontrolü, Simya…</div>'}</div>
      <div class="btnrow" style="margin-top:8px"><button type="button" class="btn sm" data-act="add-skill">＋ Beceri ekle</button></div></div>`,`<span class="count">Pasif Algı <b data-c="pasif"></b></span>`)}
  </div><div class="stack">
    ${card('Can &amp; savunma',`
      <div class="banner bad" data-c="hpko" hidden>💀 0 HP: baygınsın. <button type="button" class="btn sm red" data-act="go" data-page="olum">Ölüm ekranına git →</button></div>
      <div class="hp" style="margin-top:8px"><div class="hp-top"><span class="lbl2">❤️ HP</span><span data-c="hpst"></span><span class="hp-num">${inp('char.hp',{type:'n',attr:'aria-label="Mevcut HP"'})}<span class="faint">/</span>${inp('char.hpMax',{type:'n',attr:'aria-label="Maksimum HP"'})}</span></div>
        <div class="meter" data-c="meter:hp"><i></i></div>
        <div class="quick"><input id="hpq" type="number" inputmode="numeric" placeholder="miktar" aria-label="Hasar veya iyileşme miktarı"><button type="button" class="btn sm red" data-act="hp" data-s="-1">− Hasar</button><button type="button" class="btn sm green" data-act="hp" data-s="1">＋ İyileş</button></div></div>
      <div class="hp" style="margin-top:10px"><div class="hp-top"><input class="in" style="width:130px;height:30px" data-k="char.enAd" value="${esc(ch.enAd)}" aria-label="Kaynak adı" placeholder="Enerji / Qi / Mana"><span class="hp-num">${inp('char.en',{type:'n'})}<span class="faint">/</span>${inp('char.enMax',{type:'n'})}</span></div><div class="meter en" data-c="meter:en"><i></i></div></div>
      <div class="vbox" style="margin-top:12px">
        <div class="vb"><small>🛡️ AC</small><b data-c="ac"></b><div class="sub">10 + Çev + zırh + kalkan</div></div>
        <div class="vb"><small>⚡ İnisiyatif</small><b data-c="ini"></b> ${dz('ini','İnisiyatif')}</div>
        <div class="vb"><small>⭐ Yeterlilik</small><b data-c="prof"></b><div class="sub">seviyeye göre</div></div>
      </div>
      <div class="frow" style="margin-top:10px">${fld('Zırh','char.zirh',{type:'n'})}${fld('Kalkan','char.kalkan',{type:'n'})}${fld('Diğer AC','char.acDiger',{type:'n'})}</div>`)}
    ${card('Kaynaklar',`<div class="respips">
      <div class="res-row"><span class="res-name">🎲 Reroll <small data-c="res:rr"></small></span>${pipsHTML('char.rr',4,'','🎲')}</div>
      <div class="res-row"><span class="res-name">🎲✨ Hileli <small data-c="res:tk"></small></span>${pipsHTML('char.tk',2,'arc','✦')}</div>
      <div class="res-row"><span class="res-name">🃏 Kader Kartı <small data-c="res:kart"></small></span>${pipsHTML('char.kart',2,'card-pip','🃏')}</div></div>
      ${fld('Kartlarım','char.kartlar',{type:'area',rows:2,ph:'Örn. "Düşman bir hata yapar"'})}
      <p class="hint">Reroll ve Hileli jeton, Zar sekmesindeki sayaçla aynıdır.</p>`)}
    ${card('Durum etkileri <span class="count">geçici</span>',listHTML('char.etkiler',[{k:'ad',ph:'Örn. Sersemlemiş'},{k:'sure',ph:'tur',type:'n'}],'1fr 80px','Aktif etki yok.','Etki ekle'))}
    ${card('Kalıcı yaralar',listHTML('char.yaralar',[{k:'t',ph:'Örn. Sağ omuzda derin kesik'}],'1fr','Kalıcı yara yok.','Yara ekle'))}
    ${card('Kişilik &amp; gelişim',`${fld('😈 Kusur','char.kusur',{ph:'Örn. Koruyucu Öfke'})}
      <div class="frow">${fld('Eğilim: İyi ↔ Kötü','char.egIK',{type:'select',opts:['İyi','Nötr','Kötü']})}${fld('Düzenli ↔ Kaotik','char.egDK',{type:'select',opts:['Düzenli','Nötr','Kaotik']})}</div>
      ${fld('🎁 Yetenekler &amp; teknikler','char.yetenek',{type:'area',rows:3,ph:'Başlangıç yeteneği, teknikler, kaynak maliyetleri…'})}
      ${fld('🏅 Unvanlar','char.unvan',{type:'area',rows:2})}
      <div class="btnrow" style="margin-top:10px"><button type="button" class="btn sm" data-act="go" data-page="basarim">🏆 Başarım vitrini (<span data-c="achn"></span>) →</button></div>`)}
  </div></div>`;
};

/* ---------- Savaş ---------- */
const effPath=i=>{const x=C().combat.list[i];return x&&x.link?'char.etkiler':`combat.list.${i}.etk`;};
PAGES.savas=()=>{
  const cb=C().combat,L=cb.list,cur=L[cb.sira];
  const hasPC=L.some(x=>x.link);
  const rows=L.map((x,i)=>{
    const hpK=x.link?'char.hp':`combat.list.${i}.hp`,hpM=x.link?'char.hpMax':`combat.list.${i}.hpMax`;
    const ep=effPath(i),effs=(getP(C(),ep)||[]);
    const down=x.link?num(C().char.hp)<=0:num(x.hp)<=0&&num(x.hpMax)>0;
    return `<article class="cbt ${i===cb.sira?'active':''} ${down?'down':''}">
      <div class="cbt-head">${i===cb.sira?'<span class="turn">SIRADA</span>':''}<span class="side-tag ${x.taraf}">${x.taraf==='oyuncu'?'Oyuncu':x.taraf==='dost'?'Dost':'Düşman'}</span><span data-c="cbst:${i}"></span><span style="flex:1"></span>
        ${x.link?dz('ini','İnisiyatif'):''}<button type="button" class="x" data-act="del" data-p="combat.list" data-i="${i}" aria-label="Savaştan çıkar">✕</button></div>
      <div class="cbt-grid">
        ${x.link?`<label class="fld wide"><span>Ad</span><input class="in" value="${esc(C().char.ad||'Karakterim')}" disabled></label>`:fld('Ad',`combat.list.${i}.ad`,{cls:'wide',ph:'Örn. Haydut 1'})}
        ${fld('İnis.',`combat.list.${i}.ini`,{type:'n'})}
        ${x.link?`<label class="fld"><span>AC</span><input class="in" value="${acOf()}" disabled></label>`:fld('AC',`combat.list.${i}.ac`,{type:'n'})}
        <label class="fld"><span>HP</span><span class="hpx">${inp(hpK,{type:'n'})}<span class="faint">/</span>${inp(hpM,{type:'n'})}</span></label>
      </div>
      <div class="quick" style="margin-top:0"><input type="number" inputmode="numeric" class="cbq" placeholder="miktar" aria-label="Miktar"><button type="button" class="btn sm red" data-act="cb-hp" data-i="${i}" data-s="-1">− Hasar</button><button type="button" class="btn sm green" data-act="cb-hp" data-i="${i}" data-s="1">＋ İyileş</button>
        ${!x.link?`<select class="in" style="height:30px;width:auto" data-k="combat.list.${i}.taraf" data-rr><option value="dusman" ${x.taraf==='dusman'?'selected':''}>Düşman</option><option value="dost" ${x.taraf==='dost'?'selected':''}>Dost</option></select>`:''}</div>
      <div class="acts">${[['ana','Ana Aksiyon'],['hareket','Hareket'],['bonus','Bonus'],['reaksiyon','Reaksiyon']].map(([k,l])=>`<label class="act">${inp(`combat.list.${i}.aks.${k}`,{type:'check'})}${l}</label>`).join('')}</div>
      <div class="effs">${effs.map((e,j)=>`<span class="eff">${esc(e.ad||'?')}${e.sure!==''&&e.sure!=null?' · '+num(e.sure)+' tur':''}<button type="button" data-act="cb-eff-del" data-i="${i}" data-j="${j}" aria-label="Etkiyi kaldır">✕</button></span>`).join('')}
        <span class="eff-add"><input placeholder="Etki (örn. Yanıyor)" class="ea" aria-label="Etki adı"><input class="d ed" type="number" inputmode="numeric" placeholder="tur" aria-label="Süre"><button type="button" class="btn sm arc" data-act="cb-eff-add" data-i="${i}">＋</button></span></div>
      ${!x.link?fld('Notlar (direnç, zayıflık, taktik)',`combat.list.${i}.not`,{ph:'Örn. Ateşe zayıf, buza dirençli'}):''}
    </article>`;}).join('');
  return `
  <div class="page-title"><h2>⚔️ Savaş Takipçisi</h2><span class="sp"></span>
    <button type="button" class="btn sm" data-act="cb-add-pc" ${hasPC?'disabled':''}>＋ Karakterim</button><button type="button" class="btn sm" data-act="cb-add" data-t="dost">＋ Dost</button><button type="button" class="btn sm red" data-act="cb-add" data-t="dusman">＋ Düşman</button></div>
  <section class="card" style="margin-bottom:14px"><div class="round">
    <div><div class="muted small" style="font-weight:800;letter-spacing:.1em">TUR</div><div class="rn">${cb.tur}</div></div>
    <div style="flex:1;min-width:160px"><div class="muted small" style="font-weight:800;letter-spacing:.1em">SIRADAKİ</div><div style="font-weight:700;font-size:16px">${cur?esc(cur.link?(C().char.ad||'Karakterim'):(cur.ad||'İsimsiz')):'—'}</div></div>
    <div class="btnrow"><button type="button" class="btn sm ghosty" data-act="cb-turn" data-d="-1">◀ Geri</button><button type="button" class="btn gold" data-act="cb-turn" data-d="1" ${L.length?'':'disabled'}>Sonraki ▶</button><button type="button" class="btn sm" data-act="cb-sort">⇅ İnisiyatife göre sırala</button><button type="button" class="btn sm ghosty" data-act="cb-reset">Savaşı bitir</button></div>
  </div><p class="hint">Sırası gelen kişinin aksiyon kutuları sıfırlanır, durum etkilerinin süresi 1 tur azalır. İnisiyatif: d20 + Çeviklik (${sgn(mod(C().char.stats.cev))}).</p></section>
  <div class="list">${rows||'<div class="empty-note">Savaşta kimse yok. Önce karakterini, sonra düşmanları ekle; inisiyatifleri girip sırala.</div>'}</div>`;
};
function cbTurn(d){
  const cb=C().combat,L=cb.list;if(!L.length)return;
  cb.started=true;
  let s=cb.sira+d;
  if(s>=L.length){s=0;cb.tur++;toast('⚔️ Tur '+cb.tur);}
  if(s<0){s=L.length-1;cb.tur=Math.max(1,cb.tur-1);}
  cb.sira=s;
  if(d>0){const x=L[s];x.aks={};const arr=getP(C(),effPath(s))||[];const bit=[];
    arr.forEach(e=>{if(e.sure!==''&&e.sure!=null&&num(e.sure)>0){e.sure=num(e.sure)-1;if(e.sure===0)bit.push(e.ad||'etki');}});
    setP(C(),effPath(s),arr.filter(e=>!(e.sure===0)));
    if(bit.length)toast('Biten etki: '+bit.join(', '));}
}

/* ---------- Ölüm & Kader ---------- */
PAGES.olum=()=>{
  const c=C(),ch=c.char,D=c.death,hp=num(ch.hp);
  let banner;
  if(D.durum==='oldu')banner='<div class="banner bad">⚰️ 3 başarısızlık: karakterin öldü. Şimdi Kader Zarı\'nı at.</div>';
  else if(D.durum==='stabil')banner='<div class="banner gold">🩹 Stabil: artık zar atmıyorsun ama hâlâ 0 HP\'desin ve baygınsın.</div>';
  else if(hp<=0)banner='<div class="banner bad">💀 0 HP: baygınsın. Sıran geldikçe Ölüm Kurtarma Zarı at.</div>';
  else banner=`<div class="banner ok">❤️ Ayaktasın (HP ${hp}/${num(ch.hpMax)}). Bu ekran 0 HP'ye düştüğünde kullanılır.</div>`;
  const L=D.last,lc=L?(L.v===20?'crit':L.v===1?'fumble':L.cheat?'arc':''):'';
  const dots=(n,cls)=>Array.from({length:3},(_,i)=>`<span class="dot ${cls}${i<n?' on':''}"></span>`).join('');
  const K=D.kader,kc=K?(K.v>=19?'crit':K.v<=2?'fumble':''):'';
  const krow=KADER.map(([a,b,t,s])=>`<div class="krow ${K&&K.v>=a&&K.v<=b?'hit':''}"><b>${a===b?a:a+'–'+b}</b><div><strong>${t}</strong><span>${s}</span></div></div>`).join('');
  const done=D.durum==='oldu'||D.durum==='stabil';
  return `
  <div class="page-title"><h2>💀 Ölüm &amp; Kader</h2><span class="sp"></span><span class="faint small">${num(c.yasam)}. yaşam</span></div>
  <div class="stack" style="margin-bottom:14px">${banner}</div>
  <div class="cols"><div class="stack">
    ${card('Ölüm Kurtarma Zarları',`
      <div class="saves"><div class="save-row"><small>Başarı</small><div class="dots">${dots(D.s,'s')}</div></div><div class="save-row"><small>Başarısızlık</small><div class="dots">${dots(D.f,'f')}</div></div></div>
      <div class="bigroll"><div class="bigres ${lc}">${L?L.v:'—'}</div><div class="verdict">${L?esc(L.msg):'Henüz atılmadı'}<small>10–19 başarı · 2–9 başarısızlık · Doğal 20: 1 HP ile uyanırsın · Doğal 1: 2 başarısızlık</small></div></div>
      <div class="btnrow" style="margin-top:14px"><button type="button" class="btn gold" data-act="ds-roll" ${done?'disabled':''}>🎲 d20 At</button>
        <label class="chk">${inp('death.hileli',{type:'check',attr:ch.tk>0?'':'disabled'})} ✦ Hileli jeton kullan (${ch.tk}/2)</label></div>
      <div class="btnrow" style="margin-top:10px"><input id="ds-man" class="in" style="width:110px;height:38px" type="number" inputmode="numeric" min="1" max="20" placeholder="Sonuç" aria-label="Kendi attığın sonuç"><button type="button" class="btn" data-act="ds-man" ${done?'disabled':''}>Kendi sonucumu gir</button>
        <button type="button" class="btn arc" data-act="ds-rr" ${L&&ch.rr>0?'':'disabled'}>🎲 Reroll (${ch.rr}/4)</button></div>
      <div class="btnrow" style="margin-top:10px"><span class="muted small" style="font-weight:700">Baygınken darbe aldın:</span><button type="button" class="btn sm red" data-act="ds-hit" data-n="1">Normal darbe (+1 ✖)</button><button type="button" class="btn sm red" data-act="ds-hit" data-n="2">Kritik / infaz (+2 ✖)</button></div>
      <div class="btnrow end" style="margin-top:10px"><button type="button" class="btn sm ghosty" data-act="ds-reset">Sayaçları sıfırla</button></div>
      ${D.log.length?`<ul class="logl" style="margin-top:10px">${D.log.slice(0,12).map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:''}`)}
    ${card('🔥 Son Direniş <span class="count">kampanya başına 1 kez</span>',`
      <p class="muted small" style="margin:0 0 10px">Çok kritik bir anda 1 HP'de kalıp tek bir son aksiyon yaparsın. Ardından bayılırsın, 1 ölüm başarısızlığı ve ciddi bir yara alırsın.</p>
      ${D.sd===0?`<button type="button" class="btn red" data-act="sd-use">🔥 Son Direniş'i kullan</button>`:D.sd===1?`<div class="banner gold" style="margin-bottom:10px">🔥 Son Direniş aktif: 1 HP, tek aksiyon.</div><button type="button" class="btn" data-act="sd-end">Son aksiyonu yaptım → bayıl</button>`:'<div class="banner ok" style="color:var(--muted);border-color:var(--line);background:transparent">Bu kampanyada kullanıldı.</div>'}`)}
  </div><div class="stack">
    ${card('🎲 Kader Zarı',`
      <p class="muted small" style="margin:0 0 10px">Ölünce atılır. <b>Hileli Zar kullanılamaz</b>; Reroll kullanılabilir. Çok daha güçlü bir düşmana intihar niteliğinde meydan okuyarak öldüysen dezavantajlı atılır.</p>
      <label class="chk">${inp('death.kaderDis',{type:'check'})} Dezavantajlı at (2 zar, düşük olan)</label>
      <div class="bigroll"><div class="bigres ${kc}">${K?K.v:'—'}</div><div class="verdict">${K?esc((KADER.find(([a,b])=>K.v>=a&&K.v<=b)||[])[2]||''):'Henüz atılmadı'}<small>${K&&K.dis?'Dezavantaj: '+K.a+' ve '+K.b+' atıldı':''}</small></div></div>
      <div class="btnrow" style="margin-top:14px"><button type="button" class="btn gold" data-act="kd-roll">🎲 Kader Zarı At</button><button type="button" class="btn arc" data-act="kd-rr" ${K&&ch.rr>0?'':'disabled'}>🎲 Reroll (${ch.rr}/4)</button><button type="button" class="btn" data-act="kd-new" ${K?'':'disabled'}>➜ Yeni yaşama geç</button></div>
      <div class="ktable" style="margin-top:14px">${krow}</div>`)}
  </div></div>`;
};
function dsApply(v,cheat,isRR){
  const c=C(),D=c.death,ch=c.char;
  const prev={s:D.s,f:D.f,durum:D.durum,hp:ch.hp};
  let msg;
  if(v===20){ch.hp=Math.max(1,num(ch.hp)>0?num(ch.hp):1);D.s=0;D.f=0;D.durum='';msg='Doğal 20! 1 HP ile bilincin yerine geldi.';}
  else if(v===1){D.f+=2;msg='Doğal 1: 2 başarısızlık.';}
  else if(v>=10){D.s+=1;msg='Başarı.';}
  else{D.f+=1;msg='Başarısızlık.';}
  if(D.s>=3){D.s=3;D.durum='stabil';msg+=' 3 başarı: stabil!';}
  if(D.f>=3){D.f=3;D.durum='oldu';msg+=' 3 başarısızlık: öldün.';}
  D.last={v,cheat,msg,prev};
  D.log.unshift(new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})+' · d20 = '+v+(cheat?' ✦':'')+(isRR?' (reroll)':'')+' → '+msg);D.log.length=Math.min(D.log.length,30);
  if(v===20){toast('✦ KRİTİK BAŞARI! ✦','crit');ZM.sound('crit');}else if(v===1){toast('KRİTİK BAŞARISIZLIK','fumble');ZM.sound('fumble');}
  else if(D.durum==='oldu'){toast('⚰️ Öldün. Kader Zarı\'nı at.','fumble');}else toast('d20 = '+v+' · '+msg);
}
function dsRoll(isRR){
  const c=C(),D=c.death;let cheat=false;
  if(!isRR&&D.hileli&&c.char.tk>0){cheat=true;ZM.setRes(c.char.rr,c.char.tk-1);D.hileli=false;}
  dsApply(ZM.rollOne(20,cheat),cheat,isRR);
}
function kdRoll(isRR){
  const D=C().death,dis=!!D.kaderDis;const a=roll(20),b=dis?roll(20):null;const v=dis?Math.min(a,b):a;
  D.kader={v,a,b,dis};const r=KADER.find(([x,y])=>v>=x&&v<=y);
  toast('Kader Zarı: '+v+' · '+(r?r[2]:''),v>=19?'crit':v<=2?'fumble':'');if(v>=19)ZM.sound('crit');
  D.log.unshift('Kader Zarı'+(isRR?' (reroll)':'')+(dis?' [dezavantaj '+a+'/'+b+']':'')+' = '+v+' → '+(r?r[2]:''));
}

/* ---------- Envanter ---------- */
let invF='hepsi';
PAGES.envanter=()=>{
  const inv=C().inv,items=inv.items;
  const show=x=>invF==='hepsi'||(invF==='eq'&&x.eq)||(invF==='bil'&&x.nad==='bilinmez')||invF===x.nad;
  const cnt={eq:items.filter(x=>x.eq).length,bil:items.filter(x=>x.nad==='bilinmez').length};
  const list=items.map((x,i)=>{if(!show(x))return'';const R=RAR[x.nad]||RAR.sira,unk=x.nad==='bilinmez';
    return `<article class="item ${unk?'unknown':''} ${x.eq?'eq':''}" data-search="${esc((x.ad+' '+x.gorunus+' '+x.acik).toLowerCase())}">
      <div class="item-head"><span class="rar r-${x.nad}">${R[0]} ${R[1]}</span>${unk?`<b style="flex:1;color:var(--arcane2)">???</b>`:inp(`inv.items.${i}.ad`,{ph:'Eşya adı'})}
        <label class="chk" title="Kuşanılı / üzerinde">${inp(`inv.items.${i}.eq`,{type:'check',rr:1})} Kuşanılı</label><button type="button" class="x" data-act="del" data-p="inv.items" data-i="${i}" aria-label="Eşyayı sil">✕</button></div>
      <div class="item-grid">${fld('Adet',`inv.items.${i}.adet`,{type:'n'})}${fld('Nadirlik',`inv.items.${i}.nad`,{type:'select',rr:1,opts:Object.entries(RAR).map(([k,v])=>[k,v[0]+' '+v[1]])})}
        ${fld(unk?'Görünüşü (bildiğin tek şey)':'Görünüş',`inv.items.${i}.gorunus`,{cls:'wide',ph:unk?"Örn. mor ışık saçan kırık bir boynuz":'İsteğe bağlı'})}</div>
      ${unk?`<div class="btnrow"><button type="button" class="btn sm arc" data-act="inv-id" data-i="${i}">🔍 Tanımlandı, gerçek bilgisini gir</button><span class="faint small">Zeka zarı, eksper NPC, kitap ya da riskini alıp deneyerek.</span></div>`:fld('Açıklama &amp; özellikler',`inv.items.${i}.acik`,{type:'area',rows:2,ph:'Etkisi, bonusları, geçmişi, gizli özellikler…'})}
    </article>`;}).join('');
  return `
  <div class="page-title"><h2>🎒 Envanter</h2><span class="sp"></span><button type="button" class="btn sm" data-act="inv-add" data-t="sira">＋ Eşya</button><button type="button" class="btn sm arc" data-act="inv-add" data-t="bilinmez">＋ ??? Bilinmeyen eşya</button></div>
  <section class="card" style="margin-bottom:14px"><div class="frow" style="align-items:end">
    ${fld('💰 Para','inv.para',{type:'n'})}${fld('Birim','inv.birim',{ph:'Altın / Berry / Ruh Taşı'})}
    <div class="fld"><span>Hızlı ekle / çıkar</span><div class="quick" style="margin:0"><input id="moneyq" type="number" inputmode="numeric" placeholder="miktar" style="flex:1;width:auto;height:40px" aria-label="Para miktarı"><button type="button" class="btn red" data-act="money" data-s="-1">−</button><button type="button" class="btn green" data-act="money" data-s="1">＋</button></div></div>
  </div></section>
  <div class="btnrow" style="margin-bottom:12px;justify-content:space-between">
    <div class="filters">${[['hepsi','Tümü ('+items.length+')'],['eq','Kuşanılı ('+cnt.eq+')'],['bil','❓ ??? ('+cnt.bil+')'],['nadir','🟢'],['ender','🔵'],['destan','🟣'],['efsane','🟠']].map(([k,l])=>`<button type="button" data-act="inv-f" data-f="${k}" aria-pressed="${invF===k}">${l}</button>`).join('')}</div>
    <input id="inv-q" class="in" style="max-width:220px;height:34px" placeholder="Ara…" aria-label="Envanterde ara"></div>
  <div class="list" id="inv-list">${list.trim()||'<div class="empty-note">Bu filtrede eşya yok.</div>'}</div>`;
};

/* ---------- Kampanya ---------- */
PAGES.kampanya=()=>{
  const c=C();
  const camps=Object.values(S.campaigns).sort((a,b)=>String(a.created).localeCompare(String(b.created))).map(x=>`<div class="camp ${x.id===S.active?'on':''}"><span class="cn">${esc(x.name)}<small>${esc(x.evren||'Evren belirtilmedi')} · ${esc(x.char.ad||'karakter yok')}</small></span>
    ${x.id===S.active?'<span class="state ok">Aktif</span>':`<button type="button" class="btn sm" data-act="camp-open" data-id="${x.id}">Aç</button>`}<button type="button" class="x" data-act="camp-del" data-id="${x.id}" aria-label="Kampanyayı sil">✕</button></div>`).join('');
  return `
  <div class="page-title"><h2>📚 Kampanya Defteri</h2></div>
  <div class="cols"><div class="stack">
    ${card('Kampanyalar',`<div class="camps">${camps}</div><div class="btnrow" style="margin-top:10px"><button type="button" class="btn sm gold" data-act="camp-new">＋ Yeni kampanya</button></div>`)}
    ${card('Ayarlar',`${fld('Kampanya adı','name')}<div class="frow">${fld('Evren','evren',{ph:'Örn. One Piece'})}${fld('Ton','ton',{type:'select',opts:['','ciddi ve epik','esprili','gerilimli']})}${fld('Zorluk','zorluk',{type:'select',opts:['','kolay','orta','zor']})}${fld('Yaşam no','yasam',{type:'n'})}</div>`)}
    ${card('🔮 Kehanet',inp('notes.kehanet',{type:'area',rows:6,ph:'DM\'in söylediği kehanet…'}))}
    ${card('📍 Son durum',inp('notes.son',{type:'area',rows:4,ph:'Hikâyede şu an neredeyim, ne oluyor?'}))}
    ${card('📝 Kaydet metni',`<p class="muted small" style="margin:0 0 10px">Yeni bir sohbette Claude'a yapıştır, oyun kaldığı yerden devam etsin. Tüm sekmelerdeki bilgiler bu metne girer.</p>
      <div class="btnrow"><button type="button" class="btn gold" data-act="savetext">📋 Oluştur ve kopyala</button><button type="button" class="btn" data-act="claude-json" title="Claude'a 'içe aktar' diyip yapıştır">📤 Claude için kod kopyala</button></div><textarea id="savebox" class="in savebox" readonly style="margin-top:10px" placeholder="Metin burada görünecek"></textarea>
      <p class="hint">Claude'dan gelen kodu eklemek için üstteki <b>Yedek → Claude'dan aktar</b>.</p>`)}
  </div><div class="stack">
    ${card("👥 NPC'ler &amp; ilişkiler",listHTML('notes.npc',[{k:'ad',ph:'Ad'},{k:'rol',ph:'Kim? (rol)'},{k:'il',ph:'İlişki (örn. Sana güveniyor)'},{k:'not',ph:'Not'}],'1fr 1fr','Henüz NPC yok.','NPC ekle'))}
    ${card('📜 Görevler',listHTML('notes.gorev',[{k:'ad',ph:'Görev'},{k:'tur',type:'select',opts:['Ana','Yan','Kişisel','Nadir fırsat']},{k:'durum',type:'select',opts:['Aktif','Tamamlandı','Başarısız','Beklemede']},{k:'not',ph:'Not / süre sınırı'}],'1fr 1fr','Henüz görev yok.','Görev ekle'))}
    ${card('🏴 İtibar <span class="count">bölge / fraksiyon</span>',listHTML('notes.itibar',[{k:'yer',ph:'Bölge / fraksiyon'},{k:'durum',ph:'Örn. Kahraman, Aranan'}],'1fr 1fr','Henüz itibar kaydı yok.','İtibar ekle'))}
    ${card('🤲 İyilikler &amp; borçlar',listHTML('notes.borc',[{k:'t',ph:'Örn. Silas Crow bana bir iyilik borçlu'}],'1fr','Kayıt yok.','Ekle'))}
    ${card('🗒️ Serbest notlar',inp('notes.notlar',{type:'area',rows:6,ph:'Söylentiler, haritalar, tarifler, ipuçları…'}))}
  </div></div>`;
};
function saveText(c){
  const ch=c.char,L=c.life.r||{},J=(a,f)=>a.map(f).filter(Boolean).join(' | ');
  const st=STATS.map(([k,n])=>`${n} ${num(ch.stats[k])}(${sgn(mod(ch.stats[k]))})`).join(' ');
  const sk=[...SKILLS.filter(([n])=>ch.skills[n]).map(([n])=>n),...ch.custom.filter(x=>x.pro&&x.ad).map(x=>x.ad)];
  const sv=STATS.filter(([k])=>ch.save[k]).map(([,n])=>n);
  const lines=[
    `[DND KAYIT — ${c.name} — ${new Date().toLocaleDateString('tr-TR')}] (Zar Masası uygulamasından oluşturuldu)`,
    `AYARLAR: Evren ${c.evren||'?'} | Ton ${c.ton||'?'} | Zorluk ${c.zorluk||'?'} | Dil Türkçe | ${num(c.yasam)}. yaşam`,
    `KARAKTER: ${ch.ad||'?'}${ch.cins?', '+ch.cins:''}${ch.yas?', '+ch.yas:''}. Seviye ${num(ch.seviye)}, XP ${num(ch.xp)}/${num(ch.xpNext)}.`,
    `LIFEPATH: ${J(LIFE,([k,n,s])=>L[k]&&(L[k].v||L[k].not)?`${n.replace(/^\S+\s/,'')} d${s}=${L[k].v||'?'} ${L[k].not||''}`.trim():'')||'—'}`,
    `KUSUR: ${ch.kusur||'—'}`,
    `ÖZELLİKLER: ${st}. Yeterlilik ${sgn(prof())}. HP ${num(ch.hp)}/${num(ch.hpMax)}${num(ch.enMax)?`, ${ch.enAd||'Enerji'} ${num(ch.en)}/${num(ch.enMax)}`:''}, AC ${acOf()}, İnisiyatif ${sgn(mod(ch.stats.cev))}.`,
    sv.length?`KURTARMA UZMANLIKLARI: ${sv.join(', ')}`:'',
    `UZMANLIKLAR: ${sk.join(', ')||'—'}`,
    ch.yetenek?`YETENEKLER: ${ch.yetenek.replace(/\n+/g,' / ')}`:'',
    `REROLL ${ch.rr}/4 | 🎲✨ HİLELİ ZAR ${ch.tk}/2 | KADER KARTI ${ch.kart}/2${ch.kartlar?' ('+ch.kartlar.replace(/\n+/g,'; ')+')':''} | Para ${num(c.inv.para)} ${c.inv.birim||''}`,
    `ENVANTER: ${c.inv.items.map(x=>x.nad==='bilinmez'?`??? (${x.gorunus||'bilinmeyen eşya'})`:`${RAR[x.nad]?RAR[x.nad][0]+' ':''}${x.ad||'?'}${num(x.adet)>1?' ×'+num(x.adet):''}${x.eq?' [kuşanılı]':''}${x.acik?' ('+x.acik.replace(/\n+/g,' ')+')':''}`).join(', ')||'—'}`,
    ch.etkiler.length?`DURUM ETKİLERİ: ${ch.etkiler.map(e=>e.ad+(e.sure!==''&&e.sure!=null?' ('+num(e.sure)+' tur)':'')).join(', ')}`:'',
    ch.yaralar.length?`YARALAR: ${ch.yaralar.map(y=>y.t).filter(Boolean).join(', ')}`:'',
    `EĞİLİM: ${ch.egIK} / ${ch.egDK}`,
    ch.unvan?`UNVANLAR: ${ch.unvan.replace(/\n+/g,', ')}`:'',
    c.ach.length?`BAŞARIMLAR: ${c.ach.filter(a=>a.ad).map(a=>a.ic+' '+a.ad).join(', ')}`:'',
    c.death.sd===2?'SON DİRENİŞ: kullanıldı':'',
    c.notes.kehanet?`KEHANET: "${c.notes.kehanet.replace(/\n+/g,' / ')}"`:'',
    c.notes.npc.length?`NPC'LER: ${c.notes.npc.map(n=>[n.ad,n.rol,n.il,n.not].filter(Boolean).join(': ')).join(' | ')}`:'',
    c.notes.gorev.length?`GÖREVLER: ${c.notes.gorev.map(g=>`[${g.tur}${g.durum!=='Aktif'?' · '+g.durum:''}] ${g.ad}${g.not?' ('+g.not+')':''}`).join(' | ')}`:'',
    c.notes.itibar.length?`İTİBAR: ${c.notes.itibar.map(r=>r.yer+': '+r.durum).join(' | ')}`:'',
    c.notes.borc.length?`İYİLİKLER/BORÇLAR: ${c.notes.borc.map(b=>b.t).join(' | ')}`:'',
    c.notes.notlar?`NOTLAR: ${c.notes.notlar.replace(/\n+/g,' / ')}`:'',
    `ZAMAN: ${num(c.world.gun)}. gün, ${pad(c.world.saat)}:${pad(c.world.dk)} (${phase(c.world.saat)[1]})${c.world.hava?' | Hava: '+c.world.hava:''}${c.world.mevsim?' | '+c.world.mevsim:''}${c.world.yer?' | Yer: '+c.world.yer:''}`,
    c.world.sureli.length?`SÜRELİ OLAYLAR: ${c.world.sureli.map(o=>`${o.ad} (son: ${num(o.gun)}. gün ${pad(o.saat)}:00)`).join(' | ')}`:'',
    c.world.olaylar.length?`SÖYLENTİLER: ${c.world.olaylar.filter(o=>o.t).map(o=>`${o.t.replace(/\n+/g,' ')}${o.kaynak?' ['+o.kaynak+']':''} ${o.durum}`).join(' | ')}`:'',
    c.map.places.length?`BİLİNEN YERLER: ${c.map.places.filter(p=>p.ad).map(p=>`${p.ad}${p.bolge?' ('+p.bolge+')':''} [${p.durum}]${p.not?': '+p.not:''}`).join(' | ')}`:'',
    c.recipes.length?`TARİFLER: ${c.recipes.filter(r=>r.ad).map(r=>`${r.ad} [${r.tur}, ${r.durum}]${r.mal?' — '+r.mal.replace(/\n+/g,', '):''}${r.sonuc?' → '+r.sonuc.replace(/\n+/g,' '):''}${r.zar?' ('+r.zar+')':''}`).join(' | ')}`:'',
    `SON DURUM: ${c.notes.son||'—'}`];
  return lines.filter(Boolean).join('\n');
}

/* ---------- Lifepath ---------- */
PAGES.lifepath=()=>{
  const c=C(),Lf=c.life,rr=c.char.rr;
  const rows=LIFE.map(([k,n,s])=>{const v=getP(c,'life.r.'+k+'.v');return `<div class="lp"><div class="lp-die"><span class="v" data-c="lpv:${k}"></span><span class="t">d${s}</span>
      <button type="button" class="btn sm gold" data-act="lp-roll" data-k="${k}" data-s="${s}" ${v?'disabled':''}>At</button>
      ${v?`<button type="button" class="btn sm arc" data-act="lp-rr" data-k="${k}" data-s="${s}" ${rr>0?'':'disabled'} title="1 reroll harcar">Reroll</button>`:''}
      ${inp('life.r.'+k+'.v',{type:'n',attr:'min="1" max="'+s+'" aria-label="'+n+' sonucu"'})}</div>
    <div><h3>${n}</h3>${inp('life.r.'+k+'.not',{type:'area',rows:3,ph:'DM bu sonuca göre ne anlattı?'})}</div></div>`;}).join('');
  const m=Lf.method||'roll';
  const vals=m==='std'?STD.map(t=>({t})):Lf.st;
  const cells=Array.from({length:6},(_,i)=>{const x=vals[i];if(!x)return `<div class="st-cell"><b class="faint">—</b><span>${i+1}. zar</span></div>`;
    return `<div class="st-cell"><b>${x.t}</b><span>${x.d?x.d.map((v,j)=>j===x.drop?`<s>${v}</s>`:v).join(' · '):'standart'}</span></div>`;}).join('');
  const opts=vals.map((x,i)=>[String(i),x.t+' ('+(i+1)+'.)']);
  const assign=STATS.map(([k,n])=>`<label class="fld"><span>${n}</span><select class="in" data-k="life.assign.${k}"><option value="">—</option>${opts.map(([v,l])=>`<option value="${v}" ${String(Lf.assign[k])===v?'selected':''}>${l}</option>`).join('')}</select></label>`).join('');
  return `
  <div class="page-title"><h2>🧬 Lifepath &amp; Özellikler</h2><span class="sp"></span><span class="faint small">🎲 Reroll ${rr}/4</span></div>
  <p class="lead">Zarları sen atarsın, sonucu Claude'a (DM) söylersin. DM'in anlattığını alttaki kutuya yaz. Kendi zarınla attıysan sonucu sayı kutusuna gir.</p>
  <div class="cols"><div class="stack">${rows}
    ${card('🎁 Başlangıç &amp; 😈 Kusur',`${fld('😈 Kusur','char.kusur',{ph:'Örn. Koruyucu Öfke / Kibir / Altın tutkusu'})}${fld('🎁 Başlangıç yeteneği / eşyası','char.yetenek',{type:'area',rows:2})}`)}
    <div class="btnrow"><button type="button" class="btn gold" data-act="lp-copy">📋 Lifepath'i Claude için kopyala</button><button type="button" class="btn sm ghosty" data-act="lp-clear">Zarları temizle</button></div>
  </div><div class="stack">
    ${card('📊 Özellik zarları',`
      <div class="seg" style="grid-template-columns:1fr 1fr;margin-bottom:12px"><button type="button" data-act="st-m" data-m="roll" aria-pressed="${m==='roll'}">4d6, en düşüğü at ×6</button><button type="button" data-act="st-m" data-m="std" aria-pressed="${m==='std'}">15, 14, 13, 12, 10, 8</button></div>
      ${m==='roll'?`<div class="btnrow" style="margin-bottom:12px"><button type="button" class="btn gold" data-act="st-one" ${Lf.st.length>=6?'disabled':''}>🎲 Sıradakini at (${Math.min(6,Lf.st.length+1)}/6)</button><button type="button" class="btn sm" data-act="st-all" ${Lf.st.length>=6?'disabled':''}>Kalanları at</button><button type="button" class="btn sm ghosty" data-act="st-clear">Temizle</button></div>`:''}
      <div class="st-roll">${cells}</div>
      ${vals.length?`<div class="muted small" style="font-weight:800;letter-spacing:.08em;margin-top:14px">DEĞERLERİ DAĞIT</div><div class="assign">${assign}</div>
      <div class="btnrow" style="margin-top:12px"><button type="button" class="btn gold" data-act="st-apply">Karakter kağıdına aktar →</button><span class="faint small">Toplam: ${vals.reduce((a,x)=>a+x.t,0)}</span></div>`:''}`)}
  </div></div>`;
};

/* ---------- Dünya & Zaman ---------- */
const HAVA=['Açık','Bulutlu','Yağmurlu','Fırtınalı','Sisli','Karlı','Çok sıcak','Dondurucu soğuk','Rüzgârlı'];
PAGES.dunya=()=>{
  const w=C().world;
  return `
  <div class="page-title"><h2>🌍 Dünya &amp; Zaman</h2><span class="sp"></span><span class="faint small">Dünya seni beklemez.</span></div>
  <div class="cols"><div class="stack">
    ${card('🕐 Zaman',`
      <div class="clock"><div><div class="clock-t" data-c="clock"></div><div class="muted small">${esc(w.yer||'Konum belirtilmedi')}</div></div><span data-c="phase"></span></div>
      <div class="btnrow" style="margin:12px 0">${[[10,'+10 dk'],[60,'+1 saat'],[240,'+4 saat'],[480,'💤 +8 saat (uyku)'],[1440,'+1 gün']].map(([m,l])=>`<button type="button" class="btn sm" data-act="time" data-m="${m}">${l}</button>`).join('')}<button type="button" class="btn sm ghosty" data-act="time" data-m="-60">−1 saat</button></div>
      <div class="frow">${fld('Gün','world.gun',{type:'n',attr:'min="1"'})}${fld('Saat','world.saat',{type:'n',attr:'min="0" max="23"'})}${fld('Dakika','world.dk',{type:'n',attr:'min="0" max="59"'})}</div>
      <div class="frow">${fld('🌦️ Hava','world.hava',{ph:'Örn. Shinsu fırtınası',attr:'list="hava-list"'})}${fld('🍂 Mevsim / ay','world.mevsim')}</div>
      ${fld('📍 Şu anki yer','world.yer',{ph:'Şehir, kat, bölge…'})}
      <datalist id="hava-list">${HAVA.map(h=>`<option value="${h}">`).join('')}</datalist>
      <p class="hint">Gece (20:00–05:00) daha tehlikeli canavarlar çıkabilir. Yolculuk, eğitim ve iyileşme zaman alır.</p>`)}
    ${card('⏳ Süreli olaylar',listHTML('world.sureli',[{k:'ad',ph:'Örn. Simsar Wren\'i satacak'},{k:'gun',type:'n',ph:'gün'},{k:'saat',type:'n',ph:'saat'}],'1fr 64px 64px','Zaman sınırı olan bir olay yok.','Süreli olay ekle',i=>`<span class="small" style="grid-column:1/-1;font-weight:700" data-c="remain:${i}"></span>`)+'<p class="hint">Son gün ve saati gir; kalan süre yukarıdaki saate göre hesaplanır.</p>')}
  </div><div class="stack">
    ${card('📰 Söylentiler &amp; dünya olayları',listHTML('world.olaylar',[{k:'t',type:'area',rows:2,ph:'Ne duydun? (Örn. Hasırşapka Enies Lobby\'ye saldırmış)',attr:'style="grid-column:1/-1"'},{k:'kaynak',ph:'Kimden / nereden'},{k:'durum',type:'select',opts:['❔ Doğrulanmadı','✅ Doğru çıktı','⚠️ Abartılı','❌ Yalanmış']},{k:'gun',type:'n',ph:'gün',attr:'title="Kaçıncı gün duydun"'}],'1fr 1fr 70px','Henüz söylenti duymadın.','Söylenti ekle'))}
  </div></div>`;
};

/* ---------- Harita ---------- */
let pinFor=null;
const PL_DUR=['Keşfedildi','Duyuldu','Gizli bölge','Tehlikeli','Üs / güvenli'];
const plCls=d=>({'Keşfedildi':'k','Duyuldu':'d','Gizli bölge':'g','Tehlikeli':'t','Üs / güvenli':'u'}[d]||'d');
/* Çizim modu: çizgiler ayrı bir katmanda tutulur (0–1 koordinat), Kaydet'te haritanın üstüne işlenir */
let drw=null;
const DCOL=[['#2b1d0e','Mürekkep'],['#c0392b','Kırmızı'],['#2e86c1','Su'],['#2f9e5b','Orman'],['#e8b45a','Altın'],['#ffffff','Beyaz']];
const DSZ=[[.003,'İnce'],[.007,'Orta'],[.016,'Kalın']];
function blankMap(){const cv=document.createElement('canvas');cv.width=1600;cv.height=1000;const g=cv.getContext('2d');
  const gr=g.createRadialGradient(800,500,100,800,500,950);gr.addColorStop(0,'#efe2c4');gr.addColorStop(1,'#d2bd92');g.fillStyle=gr;g.fillRect(0,0,1600,1000);
  g.strokeStyle='rgba(90,60,20,.10)';g.lineWidth=1;for(let x=0;x<=1600;x+=80){g.beginPath();g.moveTo(x,0);g.lineTo(x,1000);g.stroke();}for(let y=0;y<=1000;y+=80){g.beginPath();g.moveTo(0,y);g.lineTo(1600,y);g.stroke();}
  g.strokeStyle='rgba(90,60,20,.45)';g.lineWidth=6;g.strokeRect(18,18,1564,964);return cv.toDataURL('image/jpeg',.9);}
function paintStrokes(g,W,H,strokes){strokes.forEach(s=>{g.save();g.globalCompositeOperation=s.e?'destination-out':'source-over';g.strokeStyle=s.c;g.lineWidth=Math.max(1,s.s*W*(s.e?2.2:1));g.lineCap='round';g.lineJoin='round';
  g.beginPath();s.p.forEach(([x,y],i)=>i?g.lineTo(x*W,y*H):g.moveTo(x*W,y*H));if(s.p.length===1)g.lineTo(s.p[0][0]*W+.01,s.p[0][1]*H);g.stroke();g.restore();});}
function setupDraw(){
  const wrap=document.querySelector('.mapwrap.drawing');if(!wrap)return;const img=wrap.querySelector('img'),cv=wrap.querySelector('canvas');
  const fit=()=>{const r=img.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);cv.style.width=r.width+'px';cv.style.height=r.height+'px';redraw();};
  const redraw=()=>{const g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);paintStrokes(g,cv.width,cv.height,drw.strokes);};
  drw.redraw=redraw;
  if(img.complete&&img.naturalWidth)fit();else img.onload=fit;
  let cur=null;
  const pt=e=>{const r=cv.getBoundingClientRect();return[Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
  cv.onpointerdown=e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);cur={c:drw.c,s:drw.s,e:drw.e,p:[pt(e)]};drw.strokes.push(cur);redraw();};
  cv.onpointermove=e=>{if(!cur)return;e.preventDefault();cur.p.push(pt(e));redraw();};
  cv.onpointerup=cv.onpointercancel=()=>{cur=null;};
}
async function saveDrawing(){
  const m=C().map,src=drw.base||m.img;
  const im=new Image();await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=src;});
  let W=im.naturalWidth||1600,H=im.naturalHeight||1000;const s=Math.min(1,1600/Math.max(W,H),W<800?1600/W:1);W=Math.round(W*s);H=Math.round(H*s);
  const layer=document.createElement('canvas');layer.width=W;layer.height=H;paintStrokes(layer.getContext('2d'),W,H,drw.strokes);
  const out=document.createElement('canvas');out.width=W;out.height=H;const g=out.getContext('2d');g.fillStyle='#0c0e14';g.fillRect(0,0,W,H);g.drawImage(im,0,0,W,H);g.drawImage(layer,0,0);
  const old=m.img;m.img=out.toDataURL('image/jpeg',.86);
  if(!flush()){m.img=old;flush();toast('Çizim kaydedilemedi: depolama dolu','fumble');return;}
  drw=null;render();toast('🗺️ Harita kaydedildi');
}
PAGES.harita=()=>{
  const m=C().map,P=m.places,target=pinFor&&P.find(p=>p.id===pinFor);
  if(drw){const src=drw.base||m.img;
    return `
  <div class="page-title"><h2>✏️ Harita çiz</h2><span class="sp"></span><button type="button" class="btn sm ghosty" data-act="draw-cancel">Vazgeç</button><button type="button" class="btn gold" data-act="draw-save">✓ Kaydet</button></div>
  <section class="card drawbar">
    <div class="btnrow">${DCOL.map(([c,l])=>`<button type="button" class="sw ${!drw.e&&drw.c===c?'on':''}" style="--c:${c}" data-act="draw-col" data-c="${c}" title="${l}" aria-label="${l}"></button>`).join('')}
      <span class="vsep"></span>${DSZ.map(([s,l])=>`<button type="button" class="btn sm ${!drw.e&&drw.s===s?'gold':''}" data-act="draw-size" data-s="${s}">${l}</button>`).join('')}
      <span class="vsep"></span><button type="button" class="btn sm ${drw.e?'arc':''}" data-act="draw-erase">🧽 Silgi</button><button type="button" class="btn sm" data-act="draw-undo" ${drw.strokes.length?'':'disabled'}>↶ Geri al</button><button type="button" class="btn sm ghosty" data-act="draw-clear" ${drw.strokes.length?'':'disabled'}>Çizgileri temizle</button></div>
    <p class="hint" style="margin-bottom:0">Parmağınla ya da fareyle çiz. Silgi yalnızca yeni çizgileri siler, alttaki haritayı değil. Yer işaretlerini kaydettikten sonra 📍 ile koyabilirsin.</p>
  </section>
  <section class="card" style="padding:12px;margin-top:14px"><div class="mapwrap drawing"><img src="${src}" alt="" draggable="false"><canvas aria-label="Çizim alanı"></canvas></div></section>`;}
  const pins=P.map((p,i)=>p.x==null?'':`<button type="button" class="pin p-${plCls(p.durum)}" style="left:${p.x}%;top:${p.y}%" data-act="pin-info" data-i="${i}" title="${esc(p.ad)}">${i+1}</button>`).join('');
  const rows=P.map((p,i)=>`<div class="li place"><span class="pnum p-${plCls(p.durum)}">${i+1}</span><div class="grow li-grid" style="--cols:1fr 1fr">
      ${inp(`map.places.${i}.ad`,{ph:'Yer adı'})}${inp(`map.places.${i}.bolge`,{ph:'Bölge / kat / ada'})}${inp(`map.places.${i}.durum`,{type:'select',opts:PL_DUR,rr:1})}${inp(`map.places.${i}.not`,{ph:'Not (tehlike, kim var, ne bulunur)'})}</div>
      <button type="button" class="x" data-act="map-pin" data-i="${i}" title="Haritada işaretle" ${m.img?'':'disabled'} style="color:${p.x!=null?'var(--gold2)':''}">📍</button><button type="button" class="x" data-act="del" data-p="map.places" data-i="${i}" aria-label="Sil">✕</button></div>`).join('');
  return `
  <div class="page-title"><h2>🗺️ Harita</h2><span class="sp"></span>
    <button type="button" class="btn sm gold" data-act="draw-start">✏️ ${m.img?'Üstüne çiz':'Boş haritaya çiz'}</button><button type="button" class="btn sm" data-act="map-up">🖼️ ${m.img?'Resmi değiştir':'Resim yükle'}</button>${m.img?'<button type="button" class="btn sm ghosty" data-act="map-rm">Resmi kaldır</button>':''}<input type="file" id="map-file" accept="image/*" hidden></div>
  <p class="lead">Dünyanın tamamını bilmezsin; haritalar eksik ya da yanlış olabilir. Kendin çiz, bir resim yükle ya da Claude'a "dışa aktar" deyip çizdiği haritayı Yedek → Claude'dan aktar ile ekle.</p>
  ${target?`<div class="banner gold" style="margin-bottom:12px">📍 "${esc(target.ad||'İsimsiz yer')}" için haritada bir noktaya dokun. <button type="button" class="btn sm" data-act="map-pin-cancel">İptal</button></div>`:''}
  <div class="cols"><section class="card" style="padding:12px">
    ${m.img?`<div class="mapwrap ${target?'placing':''}" data-act="map-click"><img src="${m.img}" alt="Kampanya haritası" draggable="false">${pins}</div>`:'<div class="empty-note" style="padding:60px 20px">Henüz harita resmi yok.<br>Yerleri yandaki listeye yine de not edebilirsin.</div>'}
  </section>
  ${card('Bilinen yerler',`<div class="list">${rows||'<div class="empty-note">Henüz yer yok.</div>'}</div><div class="btnrow" style="margin-top:10px"><button type="button" class="btn sm" data-act="add" data-p="map.places">＋ Yer ekle</button></div>
    <div class="legend">${PL_DUR.map(d=>`<span><i class="p-${plCls(d)}"></i>${d}</span>`).join('')}</div>`)}</div>`;
};
function loadImg(file){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const im=new Image();im.onerror=rej;im.onload=()=>{
  const M=1600,s=Math.min(1,M/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*s);cv.height=Math.round(im.height*s);
  const g=cv.getContext('2d');g.fillStyle='#0c0e14';g.fillRect(0,0,cv.width,cv.height);g.drawImage(im,0,0,cv.width,cv.height);res(cv.toDataURL('image/jpeg',.82));};im.src=r.result;};r.readAsDataURL(file);});}

/* ---------- Tarifler ---------- */
const REC_TUR=['Simya','İksir','Hap arıtma','Zehir / panzehir','Demircilik','Büyü basma','Teknoloji / mod','Yemek','Diğer'];
PAGES.tarifler=()=>{
  const R=C().recipes;
  const list=R.map((x,i)=>`<article class="item rec" data-search="${esc((x.ad+' '+x.mal+' '+x.sonuc+' '+x.tur).toLowerCase())}">
    <div class="item-head">${inp(`recipes.${i}.ad`,{ph:'Tarif adı (örn. Küçük Şifa İksiri)'})}${inp(`recipes.${i}.tur`,{type:'select',opts:REC_TUR,attr:'style="width:auto;height:34px"'})}${inp(`recipes.${i}.durum`,{type:'select',opts:['Öğrenildi','Denenmedi','Başarısız oldu','Ustalaşıldı'],attr:'style="width:auto;height:34px"'})}<button type="button" class="x" data-act="del" data-p="recipes" data-i="${i}" aria-label="Tarifi sil">✕</button></div>
    <div class="rec-grid">${fld('🌿 Malzemeler',`recipes.${i}.mal`,{type:'area',rows:2,ph:'Örn. 2 Ay Otu, 1 canavar çekirdeği, kaynamış su'})}${fld('✨ Sonuç / etki',`recipes.${i}.sonuc`,{type:'area',rows:2,ph:'Örn. 2d4+2 HP iyileştirir'})}</div>
    <div class="frow">${fld('🎲 Zar / DC',`recipes.${i}.zar`,{ph:'Örn. Zeka DC 13'})}${fld('📖 Nereden öğrendim',`recipes.${i}.kaynak`,{ph:'Kitap, usta, deneme…'})}</div>
    ${fld('Not',`recipes.${i}.not`,{ph:'Başarısız denemeler, yan etkiler…'})}
  </article>`).join('');
  return `
  <div class="page-title"><h2>⚗️ Tarifler</h2><span class="sp"></span><input id="rec-q" class="in" style="max-width:200px;height:34px" placeholder="Ara…" aria-label="Tariflerde ara"><button type="button" class="btn sm gold" data-act="rec-add">＋ Tarif</button></div>
  <p class="lead">Simya, hap, zehir, demircilik… Öğrendiğin tarifler burada. Başarısız denemeler patlama ya da zehirlenme yaratabilir; onları da not et.</p>
  <div class="list" id="rec-list">${list||'<div class="empty-note">Henüz tarif öğrenmedin. Kitaplardan, ustalardan ya da deneyerek öğrenebilirsin.</div>'}</div>`;
};

/* ---------- Başarımlar ---------- */
const ACH_IC=['🏆','🥇','⭐','🔥','💀','🎲','🗡️','🛡️','👑','🐉','🍀','😂','💔','🧠','🌊','⚡'];
PAGES.basarim=()=>{
  const A=C().ach;
  const cards=A.map((x,i)=>`<article class="ach">
    <div class="ach-ic"><select data-k="ach.${i}.ic" data-rr aria-label="Simge">${[...new Set([x.ic,...ACH_IC])].map(e=>`<option ${e===x.ic?'selected':''}>${esc(e)}</option>`).join('')}</select><span>${esc(x.ic)}</span></div>
    <div class="ach-body">${inp(`ach.${i}.ad`,{ph:'Başarım adı (örn. Demir Çene Eridi)'})}${inp(`ach.${i}.acik`,{ph:'Nasıl kazandım?'})}${inp(`ach.${i}.gun`,{ph:'Ne zaman'})}</div>
    <button type="button" class="x" data-act="del" data-p="ach" data-i="${i}" aria-label="Başarımı sil">✕</button></article>`).join('');
  return `
  <div class="page-title"><h2>🏆 Başarımlar</h2><span class="sp"></span><span class="faint small">${A.length} rozet</span><button type="button" class="btn sm gold" data-act="add" data-p="ach">＋ Başarım</button></div>
  <p class="lead">DM'in verdiği komik ya da havalı rozetler. Unvanlar Karakter sekmesinde.</p>
  <div class="achs">${cards||'<div class="empty-note" style="grid-column:1/-1">Henüz başarım yok. İlk rozetin yolda!</div>'}</div>`;
};

/* ======================= OLAYLAR ======================= */
let page='zar';
function show(p){
  if(p!=='zar'&&!PAGES[p])p='zar';page=p;try{localStorage.setItem(PAGE_KEY,p);}catch{}
  document.querySelectorAll('.page').forEach(el=>el.hidden=el.id!=='page-'+p);
  document.querySelectorAll('#mainnav button').forEach(b=>{if(b.dataset.page===p)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  const nav=$('mainnav'),nb=nav.querySelector('button[aria-current]');
  if(nb){const l=nb.offsetLeft-nav.offsetLeft,r=l+nb.offsetWidth;if(l<nav.scrollLeft)nav.scrollLeft=l-8;else if(r>nav.scrollLeft+nav.clientWidth)nav.scrollLeft=r-nav.clientWidth+8;}
  if(p==='zar')ZM.redraw();else render();
}
function render(){if(page==='zar'||!PAGES[page])return;const el=$('page-'+page);el.innerHTML=PAGES[page]();refresh(el);if(page==='harita'&&drw)setupDraw();}
let rzT;addEventListener('resize',()=>{if(page!=='harita'||!drw)return;clearTimeout(rzT);rzT=setTimeout(render,150);});
function campSel(){$('camp-sel').innerHTML=Object.values(S.campaigns).sort((a,b)=>String(a.created).localeCompare(String(b.created))).map(x=>`<option value="${x.id}" ${x.id===S.active?'selected':''}>${esc(x.name)}</option>`).join('')+'<option value="__new">＋ Yeni kampanya…</option>';}
function switchCamp(id){if(!S.campaigns[id])return;S.active=id;drw=null;pinFor=null;save();const ch=C().char;ZM.setRes(ch.rr,ch.tk);campSel();render();toast('📚 '+C().name);}
function newCampaign(){const n=prompt('Yeni kampanyanın adı:','Yeni Kampanya');if(n===null)return false;const c=newCamp(n.trim()||'Yeni Kampanya');S.campaigns[c.id]=c;switchCamp(c.id);return true;}

$('mainnav').addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(b)show(b.dataset.page);});
$('camp-sel').addEventListener('change',e=>{const v=e.target.value;if(v==='__new'){if(!newCampaign())campSel();}else switchCamp(v);});
addEventListener('zm-res',e=>{const ch=C().char;ch.rr=e.detail.rr;ch.tk=e.detail.tk;save();if(page!=='zar'){if(page==='olum'||page==='lifepath')render();else refresh($('page-'+page));}});

function readVal(el){if(el.type==='checkbox')return el.checked;if(el.dataset.t==='n')return el.value===''?'':Number(el.value);return el.value;}
const pagesRoot=document.querySelector('.shell');
pagesRoot.addEventListener('input',e=>{const el=e.target.closest('.page [data-k]');if(!el)return;setP(C(),el.dataset.k,readVal(el));save();
  if(el.dataset.k==='name')campSel();refresh(el.closest('.page'));});
pagesRoot.addEventListener('change',e=>{const el=e.target.closest('.page [data-k]');if(!el)return;setP(C(),el.dataset.k,readVal(el));save();
  if('rr' in el.dataset)render();});
pagesRoot.addEventListener('input',e=>{if(e.target.id!=='inv-q')return;const q=e.target.value.trim().toLowerCase();document.querySelectorAll('#inv-list .item').forEach(it=>it.hidden=!!q&&!it.dataset.search.includes(q));});

const ACT={
  go:b=>show(b.dataset.page),
  dz:b=>{const bon=bonusOf(b.dataset.src);if(ZM.load([20],bon)!==false){show('zar');toast('🎲 '+b.dataset.label+': d20 '+sgn(bon));}},
  pip:b=>{const p=b.dataset.p,i=+b.dataset.i,cur=num(getP(C(),p)),v=cur===i?i-1:i,ch=C().char;
    if(p==='char.rr')ZM.setRes(v,ch.tk);else if(p==='char.tk')ZM.setRes(ch.rr,v);else{setP(C(),p,v);save();}refresh(b.closest('.page'));},
  add:b=>{const p=b.dataset.p,arr=getP(C(),p)||[];arr.push(TPL[p]?TPL[p]():{});setP(C(),p,arr);save();render();},
  del:b=>{const p=b.dataset.p,i=+b.dataset.i,arr=getP(C(),p)||[];const it=arr[i];
    const name=it&&(it.ad||it.t||it.yer)||'';if(name&&!confirm('"'+name+'" silinsin mi?'))return;
    arr.splice(i,1);if(p==='combat.list'){const cb=C().combat;if(cb.sira>=arr.length)cb.sira=0;}save();render();},
  'add-skill':()=>{C().char.custom.push({ad:'',stat:'bil',pro:true});save();render();},
  hp:b=>{const q=$('hpq'),n=Math.abs(num(q.value));if(!n){q.focus();return;}const ch=C().char,s=+b.dataset.s;
    const before=num(ch.hp);ch.hp=Math.max(0,Math.min(num(ch.hpMax)||9999,before+s*n));
    if(before>0&&ch.hp===0){toast('💀 0 HP! Ölüm Kurtarma Zarları başlıyor','fumble');}
    if(before<=0&&ch.hp>0){const D=C().death;D.s=0;D.f=0;D.durum='';}
    save();render();},
  /* savaş */
  'cb-add-pc':()=>{const L=C().combat.list;if(L.some(x=>x.link))return;L.push({id:uid(),link:true,taraf:'oyuncu',ini:'',aks:{}});save();render();},
  'cb-add':b=>{const L=C().combat.list,t=b.dataset.t,n=L.filter(x=>x.taraf===t).length+1;L.push({id:uid(),link:false,taraf:t,ad:(t==='dusman'?'Düşman ':'Dost ')+n,ini:'',hp:'',hpMax:'',ac:'',etk:[],aks:{},not:''});save();render();},
  'cb-turn':b=>{cbTurn(+b.dataset.d);save();render();},
  'cb-sort':()=>{const cb=C().combat,cur=cb.list[cb.sira];cb.list.sort((a,b)=>num(b.ini)-num(a.ini));cb.sira=cb.started?Math.max(0,cb.list.indexOf(cur)):0;save();render();toast('⇅ İnisiyatife göre sıralandı');},
  'cb-reset':()=>{const cb=C().combat;if(!confirm('Savaş bitsin mi? Düşmanlar ve dostlar listeden çıkar, tur sıfırlanır.'))return;cb.list=cb.list.filter(x=>x.link);cb.list.forEach(x=>{x.aks={};x.ini='';});cb.tur=1;cb.sira=0;cb.started=false;save();render();},
  'cb-hp':b=>{const i=+b.dataset.i,x=C().combat.list[i],q=b.closest('.cbt').querySelector('.cbq'),n=Math.abs(num(q.value));if(!n){q.focus();return;}const s=+b.dataset.s;
    if(x.link){const ch=C().char,before=num(ch.hp);ch.hp=Math.max(0,Math.min(num(ch.hpMax)||9999,before+s*n));if(before>0&&ch.hp===0)toast('💀 0 HP! Ölüm ekranına geç','fumble');}
    else{const before=num(x.hp);x.hp=Math.max(0,num(x.hpMax)?Math.min(num(x.hpMax),before+s*n):before+s*n);if(before>0&&x.hp===0)toast('☠️ '+(x.ad||'Hedef')+' düştü!');}
    save();render();},
  'cb-eff-add':b=>{const i=+b.dataset.i,box=b.closest('.eff-add'),ad=box.querySelector('.ea').value.trim(),d=box.querySelector('.ed').value;if(!ad){box.querySelector('.ea').focus();return;}
    const p=effPath(i),arr=getP(C(),p)||[];arr.push({ad,sure:d===''?'':Math.max(1,num(d))});setP(C(),p,arr);save();render();},
  'cb-eff-del':b=>{const p=effPath(+b.dataset.i),arr=getP(C(),p)||[];arr.splice(+b.dataset.j,1);save();render();},
  /* ölüm */
  'ds-roll':()=>{dsRoll(false);save();render();},
  'ds-man':()=>{const el=$('ds-man'),v=Math.round(num(el.value));if(v<1||v>20){toast('1 ile 20 arasında bir sonuç gir');el.focus();return;}dsApply(v,false,false);save();render();},
  'ds-rr':()=>{const c=C(),D=c.death;if(!D.last||c.char.rr<1)return;const p=D.last.prev;D.s=p.s;D.f=p.f;D.durum=p.durum;c.char.hp=p.hp;ZM.setRes(c.char.rr-1,c.char.tk);dsRoll(true);save();render();},
  'ds-hit':b=>{const D=C().death,n=+b.dataset.n;if(D.durum==='oldu')return;D.durum='';D.f=Math.min(3,D.f+n);if(D.f>=3){D.durum='oldu';toast('⚰️ Öldün. Kader Zarı\'nı at.','fumble');}
    D.log.unshift('Baygınken '+(n===2?'kritik/infaz':'normal')+' darbe → +'+n+' başarısızlık');D.last=null;save();render();},
  'ds-reset':()=>{const D=C().death;D.s=0;D.f=0;D.durum='';D.last=null;save();render();},
  'sd-use':()=>{const c=C();if(!confirm('Son Direniş kampanya başına 1 kez kullanılır. Şimdi kullanılsın mı?'))return;c.death.sd=1;c.char.hp=1;c.death.durum='';c.death.s=0;c.death.f=0;c.death.log.unshift('🔥 Son Direniş kullanıldı: 1 HP, tek aksiyon');save();render();toast('🔥 SON DİRENİŞ','crit');},
  'sd-end':()=>{const c=C();c.death.sd=2;c.char.hp=0;c.death.f=Math.min(3,c.death.f+1);c.char.yaralar.push({t:'Son Direniş: ciddi yara (DM ile belirle)'});c.death.log.unshift('Son aksiyon bitti → bayıldın, +1 başarısızlık, ciddi yara');save();render();},
  'kd-roll':()=>{kdRoll(false);save();render();},
  'kd-rr':()=>{const c=C();if(!c.death.kader||c.char.rr<1)return;ZM.setRes(c.char.rr-1,c.char.tk);kdRoll(true);save();render();},
  'kd-new':()=>{const c=C();if(!confirm('Yeni yaşama geçilsin mi? Yaşam sayısı artar, ölüm sayaçları sıfırlanır. Karakter bilgileri silinmez; yeni karakteri Lifepath ve Karakter sekmelerinde düzenleyebilirsin.'))return;
    const r=KADER.find(([a,b])=>c.death.kader.v>=a&&c.death.kader.v<=b);c.notes.notlar=(c.notes.notlar?c.notes.notlar+'\n':'')+`[${num(c.yasam)}. yaşam sona erdi → Kader Zarı ${c.death.kader.v}: ${r?r[2]:''}]`;
    c.yasam=num(c.yasam)+1;Object.assign(c.death,{s:0,f:0,durum:'',last:null,kader:null,kaderDis:false});save();render();toast('✨ '+c.yasam+'. yaşam başladı','crit');},
  /* envanter */
  'inv-add':b=>{const t=b.dataset.t;C().inv.items.unshift({id:uid(),ad:'',nad:t,adet:1,eq:false,gorunus:'',acik:''});if(invF!=='hepsi'&&invF!==(t==='bilinmez'?'bil':t))invF='hepsi';save();render();
    const f=document.querySelector('#inv-list .item input.in');f&&f.focus();},
  'inv-id':b=>{const x=C().inv.items[+b.dataset.i];x.nad='sira';if(!x.ad)x.ad='';save();render();toast('🔍 Tanımlandı: adını, nadirliğini ve açıklamasını gir');},
  'inv-f':b=>{invF=b.dataset.f;render();},
  money:b=>{const q=$('moneyq'),n=Math.abs(num(q.value));if(!n){q.focus();return;}const inv=C().inv;inv.para=num(inv.para)+(+b.dataset.s)*n;if(inv.para<0){toast('Yeterli para yok!','fumble');inv.para=0;}save();render();},
  /* kampanya */
  'camp-new':()=>newCampaign(),
  'camp-open':b=>switchCamp(b.dataset.id),
  'camp-del':b=>{const x=S.campaigns[b.dataset.id];if(!x)return;if(Object.keys(S.campaigns).length<2){toast('Son kampanya silinemez');return;}
    if(!confirm('"'+x.name+'" kampanyası tamamen silinsin mi? Bu geri alınamaz (önce Yedek ile dışa aktarabilirsin).'))return;
    delete S.campaigns[x.id];if(S.active===x.id){S.active=Object.keys(S.campaigns)[0];const ch=C().char;ZM.setRes(ch.rr,ch.tk);}save();campSel();render();},
  savetext:()=>{const t=saveText(C());$('savebox').value=t;copy(t,'📋 Kaydet metni kopyalandı');},
  'claude-json':()=>{const t='İçe aktar:\n```json\n'+JSON.stringify(exportCamp(C()))+'\n```';$('savebox').value=t;copy(t,'📤 Kod kopyalandı. Claude\'a yapıştır');},
  /* lifepath */
  'lp-roll':b=>{const k=b.dataset.k,s=+b.dataset.s,v=roll(s);setP(C(),'life.r.'+k+'.v',v);save();render();toast('🎲 d'+s+' = '+v);},
  'lp-rr':b=>{const c=C();if(c.char.rr<1)return;const k=b.dataset.k,s=+b.dataset.s,v=roll(s);ZM.setRes(c.char.rr-1,c.char.tk);setP(c,'life.r.'+k+'.v',v);save();render();toast('🎲 Reroll: d'+s+' = '+v);},
  'lp-copy':()=>{const L=C().life.r;const t='Lifepath zarlarım: '+LIFE.map(([k,n,s])=>`${n.replace(/^\S+\s/,'')} d${s}=${(L[k]&&L[k].v)||'?'}`).join(', ');copy(t,'📋 Kopyalandı');},
  'lp-clear':()=>{if(!confirm('Lifepath zar sonuçları ve notları silinsin mi?'))return;C().life.r={};save();render();},
  /* dünya */
  time:b=>{const before=phase(C().world.saat)[1];tAdd(+b.dataset.m);save();render();const now=phase(C().world.saat);
    const due=C().world.sureli.filter(o=>remain(o).startsWith('⌛')).map(o=>o.ad||'olay');
    toast('🕐 '+clockText()+(now[1]!==before?' · '+now[0]+' '+now[1]:'')+(due.length?' · ⌛ '+due.join(', '):''));},
  /* harita */
  'map-up':()=>$('map-file').click(),
  'map-rm':()=>{if(!confirm('Harita resmi kaldırılsın mı? Yer listesi kalır.'))return;C().map.img='';C().map.places.forEach(p=>{p.x=null;p.y=null;});save();render();},
  'map-pin':b=>{pinFor=C().map.places[+b.dataset.i].id;render();},
  'map-pin-cancel':()=>{pinFor=null;render();},
  'map-click':(b,e)=>{if(!pinFor)return;const p=C().map.places.find(x=>x.id===pinFor);pinFor=null;if(!p){render();return;}
    const r=b.getBoundingClientRect();p.x=Math.round(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*1000)/10;p.y=Math.round(Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))*1000)/10;save();render();toast('📍 '+(p.ad||'Yer')+' işaretlendi');},
  'draw-start':()=>{pinFor=null;drw={strokes:[],c:'#2b1d0e',s:.007,e:false,base:C().map.img?null:blankMap()};render();},
  'draw-cancel':()=>{if(drw&&drw.strokes.length&&!confirm('Çizim kaydedilmeden kapatılsın mı?'))return;drw=null;render();},
  'draw-save':()=>{saveDrawing().catch(()=>toast('Çizim kaydedilemedi','fumble'));},
  'draw-col':b=>{drw.c=b.dataset.c;drw.e=false;render();},
  'draw-size':b=>{drw.s=+b.dataset.s;drw.e=false;render();},
  'draw-erase':()=>{drw.e=!drw.e;render();},
  'draw-undo':()=>{drw.strokes.pop();render();},
  'draw-clear':()=>{if(confirm('Bu oturumdaki tüm çizgiler silinsin mi?')){drw.strokes=[];render();}},
  'pin-info':b=>{const p=C().map.places[+b.dataset.i];if(p)toast('📍 '+(p.ad||'İsimsiz')+(p.bolge?' · '+p.bolge:'')+' · '+p.durum);},
  /* tarifler */
  'rec-add':()=>{C().recipes.unshift(TPL.recipes());save();render();const f=document.querySelector('#rec-list .item input.in');f&&f.focus();},
  'st-m':b=>{C().life.method=b.dataset.m;C().life.assign={};save();render();},
  'st-one':()=>{const L=C().life;if(L.st.length<6)L.st.push(r4d6());save();render();const x=L.st[L.st.length-1];toast('🎲 4d6: '+x.d.join(', ')+' → '+x.t);},
  'st-all':()=>{const L=C().life;while(L.st.length<6)L.st.push(r4d6());save();render();},
  'st-clear':()=>{C().life.st=[];C().life.assign={};save();render();},
  'st-apply':()=>{const L=C().life,vals=L.method==='std'?STD.map(t=>({t})):L.st,used=new Set();
    for(const[k,n]of STATS){const a=L.assign[k];if(a===''||a==null){toast(n+' için değer seçmedin');return;}if(used.has(a)){toast('Aynı değer iki kez kullanılmış');return;}used.add(a);}
    STATS.forEach(([k])=>C().char.stats[k]=vals[+L.assign[k]].t);save();toast('📊 Özellikler karakter kağıdına aktarıldı');show('karakter');}
};
function r4d6(){const d=[roll(6),roll(6),roll(6),roll(6)];let lo=0;d.forEach((v,i)=>{if(v<d[lo])lo=i;});return{d,drop:lo,t:d.reduce((a,v)=>a+v,0)-d[lo]};}
function copy(t,msg){
  const ok=()=>toast(msg);
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(ok,fallback);else fallback();
  function fallback(){const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.append(ta);ta.select();try{document.execCommand('copy');ok();}catch{toast('Kopyalanamadı; metni elle seç');}ta.remove();}
}
/* ---------- Claude ile kampanya aktarımı ----------
   Biçim: {"app":"zar-masasi","tur":"kampanya","v":1,"kampanya":{...}}
   Aynı adlı kampanya varsa birleştirilir (gelen alanlar üzerine yazılır, gelmeyenler kalır; listeler bütün olarak değişir). */
const isObj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
function merge(t,s){for(const k of Object.keys(s)){if(isObj(s[k])&&isObj(t[k]))merge(t[k],s[k]);else t[k]=s[k];}return t;}
function pick(v,opts,def){if(v==null||v==='')return def;const s=String(v).toLocaleLowerCase('tr').trim();const bare=o=>o.toLocaleLowerCase('tr').replace(/^[^a-zçğıöşü0-9]+/i,'').trim();
  return opts.find(o=>o.toLocaleLowerCase('tr')===s||bare(o)===s)||opts.find(o=>bare(o).startsWith(s)||s.startsWith(bare(o)))||def;}
const NAD_ALIAS={'sıradan':'sira','siradan':'sira','sira':'sira','nadir':'nadir','ender':'ender','destansı':'destan','destansi':'destan','destan':'destan','efsanevi':'efsane','efsane':'efsane','bilinmez':'bilinmez','bilinmiyor':'bilinmez','???':'bilinmez','?':'bilinmez'};
const arr=(a,str)=>(Array.isArray(a)?a:[]).map(x=>typeof x==='string'&&str?{[str]:x}:x).filter(isObj).map(x=>(x.id||(x.id=uid()),x));
const n0=(v,d=0)=>v===''||v==null?d:num(v);
function normCamp(c){
  const ch=c.char;
  STATS.forEach(([k])=>ch.stats[k]=Math.max(1,Math.min(30,n0(ch.stats[k],10))));
  ['seviye','xp','xpNext','hp','hpMax','en','enMax','zirh','kalkan','acDiger'].forEach(k=>ch[k]=n0(ch[k],k==='seviye'?1:0));
  ch.rr=Math.max(0,Math.min(4,n0(ch.rr)));ch.tk=Math.max(0,Math.min(2,n0(ch.tk)));ch.kart=Math.max(0,Math.min(2,n0(ch.kart)));
  if(!isObj(ch.save))ch.save={};if(!isObj(ch.skills))ch.skills={};
  ch.custom=arr(ch.custom,'ad').map(x=>({ad:String(x.ad||''),stat:STATS.some(([k])=>k===x.stat)?x.stat:'bil',pro:x.pro!==false}));
  ch.yaralar=arr(ch.yaralar,'t');ch.etkiler=arr(ch.etkiler,'ad').map(e=>({ad:e.ad||'',sure:e.sure===''||e.sure==null?'':n0(e.sure)}));
  ch.egIK=pick(ch.egIK,['İyi','Nötr','Kötü'],'Nötr');ch.egDK=pick(ch.egDK,['Düzenli','Nötr','Kaotik'],'Nötr');
  ['kusur','yetenek','unvan','kartlar'].forEach(k=>{if(Array.isArray(ch[k]))ch[k]=ch[k].join('\n');});
  c.inv.para=n0(c.inv.para);
  c.inv.items=arr(c.inv.items,'ad').map(x=>({id:x.id,ad:x.ad||'',adet:n0(x.adet,1),eq:!!x.eq,gorunus:x.gorunus||'',acik:x.acik||'',
    nad:NAD_ALIAS[String(x.nad||'').toLocaleLowerCase('tr')]||(RAR[x.nad]?x.nad:'sira')}));
  const N=c.notes;N.npc=arr(N.npc,'ad');N.itibar=arr(N.itibar,'yer');N.borc=arr(N.borc,'t');
  N.gorev=arr(N.gorev,'ad').map(g=>Object.assign(g,{tur:pick(g.tur,['Ana','Yan','Kişisel','Nadir fırsat'],'Ana'),durum:pick(g.durum,['Aktif','Tamamlandı','Başarısız','Beklemede'],'Aktif')}));
  if(!isObj(c.life.r))c.life.r={};LIFE.forEach(([k])=>{const r=c.life.r[k];if(r!=null&&!isObj(r))c.life.r[k]={v:n0(r)||'',not:''};});
  const W=c.world;['gun','saat','dk'].forEach(k=>W[k]=n0(W[k],k==='gun'?1:0));W.gun=Math.max(1,W.gun);W.saat=Math.min(23,Math.max(0,W.saat));W.dk=Math.min(59,Math.max(0,W.dk));
  W.olaylar=arr(W.olaylar,'t').map(o=>Object.assign(o,{durum:pick(o.durum,['❔ Doğrulanmadı','✅ Doğru çıktı','⚠️ Abartılı','❌ Yalanmış'],'❔ Doğrulanmadı')}));
  W.sureli=arr(W.sureli,'ad');
  c.map.places=arr(c.map.places,'ad').map(p=>Object.assign(p,{durum:pick(p.durum,PL_DUR,'Duyuldu'),x:p.x==null||p.x===''?null:Math.max(0,Math.min(100,num(p.x))),y:p.y==null||p.y===''?null:Math.max(0,Math.min(100,num(p.y)))}));
  c.recipes=arr(c.recipes,'ad').map(r=>Object.assign({mal:'',sonuc:'',zar:'',kaynak:'',not:''},r,{tur:pick(r.tur,REC_TUR,'Diğer'),durum:pick(r.durum,['Öğrenildi','Denenmedi','Başarısız oldu','Ustalaşıldı'],'Öğrenildi')}));
  ['mal','sonuc'].forEach(k=>c.recipes.forEach(r=>{if(Array.isArray(r[k]))r[k]=r[k].join(', ');}));
  c.ach=arr(c.ach,'ad').map(a=>Object.assign(a,{ic:a.ic||'🏆'}));
  c.yasam=Math.max(1,n0(c.yasam,1));
  return c;
}
function svgToImg(svg){svg=String(svg).trim();if(!/^<svg[\s>]/i.test(svg))return'';
  if(!/xmlns=/.test(svg))svg=svg.replace(/^<svg/i,'<svg xmlns="http://www.w3.org/2000/svg"');
  const open=svg.match(/^<svg[^>]*>/i)[0];
  if(!/\swidth=/.test(open)){const vb=open.match(/viewBox=["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);const w=vb?+vb[1]:1000,h=vb?+vb[2]:700,k=1600/Math.max(w,h);
    svg=svg.replace(/^<svg/i,`<svg width="${Math.round(w*k)}" height="${Math.round(h*k)}"`);}
  return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
function parseLoose(t){t=String(t||'').trim();const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a<0||b<=a)throw new Error('json yok');return JSON.parse(t.slice(a,b+1));}
function importCampaign(o){
  const src=o&&(o.kampanya||o.campaign);if(!isObj(src))throw new Error('kampanya yok');
  const s=JSON.parse(JSON.stringify(src));delete s.id;delete s.created;delete s.combat;delete s.death;
  if(isObj(s.map)){if(typeof s.map.svg==='string'){const im=svgToImg(s.map.svg);if(im)s.map.img=im;}delete s.map.svg;if(typeof s.map.img==='string'&&!/^data:image\//.test(s.map.img))delete s.map.img;}
  const name=String(s.name||'').trim()||'Claude\'dan gelen kampanya';
  const ex=Object.values(S.campaigns).find(c=>c.name.trim().toLocaleLowerCase('tr')===name.toLocaleLowerCase('tr'));
  let t,upd=false;
  if(ex&&confirm('"'+ex.name+'" kampanyası zaten var.\n\nTamam = Claude\'dan gelen bilgilerle GÜNCELLE\nİptal = YENİ kampanya olarak ekle')){t=ex;upd=true;}
  else{t=newCamp(name);t.char.yaralar=[];S.campaigns[t.id]=t;}
  const keep={id:t.id,created:t.created};
  merge(t,s);Object.assign(t,keep);fill(newCamp(),t);normCamp(t);t._achMig=true;if(!t.name)t.name=name;
  flush();switchCamp(t.id);
  return{t,upd};
}
function exportCamp(c){
  const x=JSON.parse(JSON.stringify(c));
  ['id','created','combat','death','_achMig'].forEach(k=>delete x[k]);delete x.life.st;delete x.life.assign;delete x.life.method;delete x.char.basarim;
  if(x.map.img)x.map.img='(uygulamada bir harita resmi var; yeni harita çizersen map.svg olarak gönder)';else delete x.map.img;
  const strip=a=>Array.isArray(a)&&a.forEach(i=>isObj(i)&&delete i.id);
  [x.char.yaralar,x.char.etkiler,x.char.custom,x.inv.items,x.notes.npc,x.notes.gorev,x.notes.itibar,x.notes.borc,x.world.olaylar,x.world.sureli,x.map.places,x.recipes,x.ach].forEach(strip);
  return{app:'zar-masasi',tur:'kampanya',v:1,kampanya:x};
}

pagesRoot.addEventListener('click',e=>{const b=e.target.closest('.page [data-act]');if(!b||b.disabled)return;const f=ACT[b.dataset.act];if(f){e.preventDefault();f(b,e);}});
pagesRoot.addEventListener('input',e=>{if(e.target.id!=='rec-q')return;const q=e.target.value.trim().toLowerCase();document.querySelectorAll('#rec-list .item').forEach(it=>it.hidden=!!q&&!it.dataset.search.includes(q));});
pagesRoot.addEventListener('change',async e=>{if(e.target.id!=='map-file')return;const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const old=C().map.img;C().map.img=await loadImg(f);if(!flush()){C().map.img=old;flush();toast('Resim kaydedilemedi: depolama dolu. Daha küçük bir resim dene.','fumble');}else toast('🗺️ Harita yüklendi. 📍 ile yerleri işaretle.');render();}
  catch{toast('Bu resim açılamadı','fumble');}});

/* ---------- Yedek: dışa / içe aktar ---------- */
const dlg=$('backup-dlg');
$('backup-btn').onclick=()=>{if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');};
$('export-btn').onclick=async()=>{
  flush();const data={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^zm[23]-/.test(k))data[k]=localStorage.getItem(k);}
  const json=JSON.stringify({app:'zar-masasi',v:3,at:new Date().toISOString(),data},null,1);
  const name='zar-masasi-yedek-'+new Date().toISOString().slice(0,10)+'.json';
  const blob=new Blob([json],{type:'application/json'});
  try{const file=new File([blob],name,{type:'application/json'});
    if(matchMedia('(pointer:coarse)').matches&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Zar Masası yedeği'});toast('⬇ Yedek paylaşıldı');return;}}catch(err){if(err&&err.name==='AbortError')return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);toast('⬇ '+name+' indirildi');
};
$('import-btn').onclick=()=>$('import-file').click();
$('import-file').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  let txt='';try{txt=await f.text();}catch{}
  try{const o=parseLoose(txt);if(o&&o.tur==='kampanya'){doClaudeImport(o);return;}}catch{}
  try{const o=JSON.parse(txt);if(!o||o.app!=='zar-masasi'||!o.data)throw new Error('bad');
    const n=o.data[KEY]?Object.keys((JSON.parse(o.data[KEY])||{}).campaigns||{}).length:0;
    if(!confirm('Yedek ('+new Date(o.at).toLocaleString('tr-TR')+', '+n+' kampanya) içe aktarılsın mı? Bu cihazdaki mevcut verilerin yerine geçer.'))return;
    clearTimeout(saveT);locked=true;
    Object.keys(localStorage).filter(k=>/^zm[23]-/.test(k)).forEach(k=>localStorage.removeItem(k));
    Object.entries(o.data).forEach(([k,v])=>{if(/^zm[23]-/.test(k)&&typeof v==='string')localStorage.setItem(k,v);});
    location.reload();
  }catch{toast('Bu dosya geçerli bir Zar Masası yedeği değil','fumble');}
};
function doClaudeImport(o){
  const {t,upd}=importCampaign(o);
  const parts=[t.char.ad&&'karakter',t.inv.items.length&&t.inv.items.length+' eşya',t.notes.npc.length&&t.notes.npc.length+' NPC',t.map.places.length&&t.map.places.length+' yer',t.map.img&&'harita'].filter(Boolean);
  toast((upd?'🔄 Güncellendi: ':'✨ Eklendi: ')+t.name+(parts.length?' · '+parts.join(', '):''),'crit');
  if(dlg.open)dlg.close();$('claude-in').value='';
}
$('claude-import').onclick=()=>{
  const t=$('claude-in').value;if(!t.trim()){toast("Önce Claude'un verdiği kodu yapıştır");$('claude-in').focus();return;}
  let o;try{o=parseLoose(t);}catch{toast('Kod okunamadı. Claude\'un verdiği ```json bloğunun tamamını kopyaladığından emin ol','fumble');return;}
  if(!o||o.app!=='zar-masasi'||o.tur!=='kampanya'){toast('Bu bir Zar Masası kampanya kodu değil','fumble');return;}
  try{doClaudeImport(o);}catch(e){toast('Aktarılamadı: '+(e&&e.message||'hata'),'fumble');}
};
$('claude-paste').onclick=async()=>{try{const t=await navigator.clipboard.readText();if(t){$('claude-in').value=t;toast('📋 Yapıştırıldı');}}catch{toast('Panoya erişilemedi; kutuya basılı tutup Yapıştır de');$('claude-in').focus();}};

/* ---------- Başlat ---------- */
campSel();
{const ch=C().char;ZM.setRes(ch.rr,ch.tk);}
let start='zar';try{start=localStorage.getItem(PAGE_KEY)||'zar';}catch{}
show(start);
save();
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
