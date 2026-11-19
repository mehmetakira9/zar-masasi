(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Turnuva=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const COLORS=['#9d8aff','#60cbb2','#ffbc72','#77b8f5','#ef8fb3','#d7be69','#89cc79','#ae9fe9'];
  function uid(){return globalThis.crypto?.randomUUID?.()||'t'+Date.now().toString(36)+Math.random().toString(36).slice(2);}
  function shuffle(items,random=Math.random){const list=[...items];for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}
  function seedOrder(size){let order=[1,2];while(order.length<size){const total=order.length*2+1;order=order.flatMap(seed=>[seed,total-seed]);}return order;}
  function create(name,names,randomize=true){
    if(!Array.isArray(names)||names.length<2||names.length>64)throw Error('2 ile 64 arasında katılımcı ekle.');
    const clean=names.map(n=>String(n).trim());if(clean.some(n=>!n||n.length>60))throw Error('İsimler 1–60 karakter olmalı.');
    const players=clean.map((name,i)=>({id:uid(),name,color:COLORS[i%COLORS.length]}));
    const ordered=randomize?shuffle(players):players;
    const size=2**Math.ceil(Math.log2(players.length));
    return{id:uid(),name:String(name||'Yeni turnuva').trim().slice(0,80)||'Yeni turnuva',players,slots:seedOrder(size).map(seed=>ordered[seed-1]?.id||null),results:{},undo:[],createdAt:Date.now(),updatedAt:Date.now()};
  }
  function bracket(t){
    const players=new Map(t.players.map(p=>[p.id,p]));let feeds=t.slots.map(id=>({resolved:true,id:id||null}));const rounds=[];let r=0;
    while(feeds.length>1){const next=[],matches=[];for(let i=0;i<feeds.length;i+=2){
      const left=feeds[i],right=feeds[i+1],id=`r${r}m${i/2}`,a=players.get(left.id)||null,b=players.get(right.id)||null;
      const signature=JSON.stringify([a?.id||null,b?.id||null]);const saved=t.results[id];let winner=null,status='waiting',resolved=false;
      if(left.resolved&&right.resolved){
        if(!a&&!b){status='empty';resolved=true;}
        else if(!a||!b){winner=a||b;status='bye';resolved=true;}
        else if(saved&&saved.signature===signature&&(saved.winner===a.id||saved.winner===b.id)){winner=players.get(saved.winner);status='done';resolved=true;}
        else status='ready';
      }
      matches.push({id,round:r,index:i/2,a,b,status,winner,signature,scoreA:status==='done'?saved.scoreA:null,scoreB:status==='done'?saved.scoreB:null});next.push({resolved,id:winner?.id||null});
    }rounds.push(matches);feeds=next;r++;}
    const matches=rounds.flat();return{rounds,matches,champion:feeds[0]?.resolved?players.get(feeds[0].id)||null:null,completed:matches.filter(m=>m.status==='done').length,total:t.players.length-1,ready:matches.filter(m=>m.status==='ready'),byes:matches.filter(m=>m.status==='bye').length};
  }
  function record(t,matchId,winnerId,scoreA=null,scoreB=null){
    const match=bracket(t).matches.find(m=>m.id===matchId);if(!match||!['ready','done'].includes(match.status))throw Error('Bu eşleşme henüz hazır değil.');
    if(![match.a.id,match.b.id].includes(winnerId))throw Error('Geçerli bir kazanan seç.');
    const validScore=s=>s===null||(Number.isInteger(s)&&s>=0&&s<=999);if(!validScore(scoreA)||!validScore(scoreB))throw Error('Skor 0–999 arasında olmalı.');
    if((scoreA===null)!==(scoreB===null))throw Error('İki skoru da gir veya ikisini de boş bırak.');
    if(scoreA!==null){if(scoreA===scoreB)throw Error('Eleme maçında beraberlik olamaz.');if((winnerId===match.a.id)!==(scoreA>scoreB))throw Error('Kazanan ile skorlar uyuşmuyor.');}
    t.undo.push(JSON.parse(JSON.stringify(t.results)));if(t.undo.length>100)t.undo.shift();
    // Değişen maçın bütün sonraki eşleşmeleri yeniden oynanır.
    let childIndex=match.index;for(let r=match.round+1;r<bracket(t).rounds.length;r++){childIndex=Math.floor(childIndex/2);delete t.results[`r${r}m${childIndex}`];}
    t.results[matchId]={winner:winnerId,signature:match.signature,scoreA,scoreB,at:Date.now()};t.updatedAt=Date.now();return bracket(t);
  }
  function undo(t){if(!t.undo.length)return false;t.results=t.undo.pop();t.updatedAt=Date.now();return true;}
  function roundName(round,total){const remaining=total-round;if(remaining===1)return'Final';if(remaining===2)return'Yarı final';if(remaining===3)return'Çeyrek final';return`${2**remaining}’lı tur`;}
  function validateTournament(raw){
    if(!raw||typeof raw.id!=='string'||!raw.id||raw.id.length>100||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>80)throw Error('Geçersiz turnuva kaydı.');
    if(!Array.isArray(raw.players)||raw.players.length<2||raw.players.length>64)throw Error('Katılımcı sayısı geçersiz.');
    const ids=new Set();const players=raw.players.map((p,i)=>{if(!p||typeof p.id!=='string'||!p.id||p.id.length>100||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>60)throw Error('Katılımcı kaydı geçersiz.');ids.add(p.id);return{id:p.id,name:p.name.trim(),color:/^#[0-9a-f]{6}$/i.test(p.color)?p.color:COLORS[i%COLORS.length]};});
    const size=2**Math.ceil(Math.log2(players.length));if(!Array.isArray(raw.slots)||raw.slots.length!==size||raw.slots.some(id=>id!==null&&!ids.has(id)))throw Error('Eşleşme ağacı geçersiz.');
    const seeded=raw.slots.filter(Boolean);if(seeded.length!==ids.size||new Set(seeded).size!==ids.size)throw Error('Katılımcılar bir kez yerleştirilmeli.');
    if(!raw.results||typeof raw.results!=='object'||Array.isArray(raw.results))throw Error('Sonuç listesi geçersiz.');
    const allowed=new Set();for(let r=0;r<Math.log2(size);r++)for(let i=0;i<size/(2**(r+1));i++)allowed.add(`r${r}m${i}`);if(Object.keys(raw.results).some(id=>!allowed.has(id)))throw Error('Bilinmeyen eşleşme kaydı.');
    const t={id:raw.id,name:raw.name.trim(),players,slots:[...raw.slots],results:{},undo:[],createdAt:Number(raw.createdAt)||Date.now(),updatedAt:Number(raw.updatedAt)||Date.now()};
    for(let r=0;r<Math.log2(size);r++)for(const m of bracket(t).rounds[r]){const result=raw.results?.[m.id];if(result){if(m.status!=='ready'||result.signature!==m.signature)throw Error('Sonuç kaydı eşleşmeyle uyuşmuyor.');record(t,m.id,result.winner,result.scoreA??null,result.scoreB??null);}}
    t.undo=[];return t;
  }
  function demo(){const t=create('Hafta sonu kupası',['Nova','Atlas','Luna','Vega','Orion','Mira','Echo','Zenith'],false);const first=bracket(t).rounds[0];first.forEach((m,i)=>record(t,m.id,i%2?m.b.id:m.a.id, i%2?1:3,i%2?3:1));bracket(t).rounds[1].forEach((m,i)=>record(t,m.id,i?m.b.id:m.a.id,i?1:2,i?2:0));t.undo=[];t.isDemo=true;return t;}
  return{COLORS,uid,shuffle,seedOrder,create,bracket,record,undo,roundName,validateTournament,demo};
});
