(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.Turnuva);if(typeof module==='object'&&module.exports)module.exports=api;else root.ArenaRenderer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(T){
 'use strict';
 const theme={bg:'#0d111a',panel:'#151b28',line:'#30394d',text:'#f0f2fa',muted:'#8b95aa',gold:'#edc777',purple:'#a495ef',green:'#67ceb1'};
 function roundRect(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
 function label(c,text,x,y,size=14,color=theme.text,weight='400'){c.font=`${weight} ${size}px "Segoe UI", sans-serif`;c.fillStyle=color;c.fillText(text,x,y);}
 function fit(c,text,max,size=14){c.font=`600 ${size}px "Segoe UI", sans-serif`;let s=text;while(c.measureText(s+'…').width>max&&s.length>1)s=s.slice(0,-1);return s===text?s:s+'…';}
 function trophy(c,x,y,size=26,color=theme.gold){c.save();c.translate(x,y);c.scale(size/30,size/30);c.strokeStyle=color;c.lineWidth=2;c.lineJoin='round';c.beginPath();c.moveTo(7,3);c.lineTo(23,3);c.lineTo(22,13);c.quadraticCurveTo(15,26,8,13);c.closePath();c.moveTo(7,6);c.lineTo(2,6);c.quadraticCurveTo(1,16,10,15);c.moveTo(23,6);c.lineTo(28,6);c.quadraticCurveTo(29,16,20,15);c.moveTo(15,20);c.lineTo(15,26);c.moveTo(9,28);c.lineTo(21,28);c.stroke();c.restore();}
 function dimensions(t){const b=T.bracket(t),cw=224,left=32,step=128,width=Math.max(700,left*2+(b.rounds.length+1)*(cw+42)-42),gap=(width-left*2-(b.rounds.length+1)*cw)/b.rounds.length;return{width,height:Math.max(680,277+b.rounds[0].length*step+48),cw,gap,left,step};}
 function render(canvas,t,options={}){
   const b=T.bracket(t),d=dimensions(t),ratio=options.ratio||1;
   canvas.width=Math.round(d.width*ratio);canvas.height=Math.round(d.height*ratio);
   const c=canvas.getContext('2d');c.scale(ratio,ratio);c.fillStyle=theme.bg;c.fillRect(0,0,d.width,d.height);
   const glow=c.createRadialGradient(d.width*.78,90,0,d.width*.78,90,500);glow.addColorStop(0,'rgba(122,96,180,.12)');glow.addColorStop(1,'rgba(122,96,180,0)');c.fillStyle=glow;c.fillRect(0,0,d.width,d.height);
   label(c,'T U R N U V A  A T Ö L Y E S İ',32,35,11,theme.purple,'600');
   label(c,fit(c,t.name,d.width-260,30),32,79,30,theme.text,'700');
   label(c,t.isDemo?'Örnek turnuva · Kendi turnuvanı oluşturmak için “Yeni turnuva”ya tıkla.':'Eşleşmeye tıkla, kazananı seç ve kupaya giden yolu tamamla.',33,107,13,theme.muted);
   roundRect(c,d.width-185,43,151,34,17,b.champion?'#27271f':'#1e2634','#3a4152');label(c,b.champion?'●  TAMAMLANDI':'●  DEVAM EDİYOR',d.width-172,65,11,b.champion?theme.gold:theme.green,'600');
   const stats=[['KATILIMCI',String(t.players.length),'Oyuncu veya takım'],['OYNANAN MAÇ',`${b.completed} / ${b.total}`,'Tek maçla eleme'],['KALAN MAÇ',String(b.total-b.completed),b.champion?'Kupa sahibini buldu':'Şampiyona doğru'],['EŞLEŞTİRME',t.isDemo?'Örnek':'Hazır',b.byes?`${b.byes} doğrudan geçiş`:'Tüm katılımcılar eşleşti']];
   const sw=(d.width-64-36)/4;stats.forEach((s,i)=>{const x=32+i*(sw+12);roundRect(c,x,134,sw,87,12,theme.panel,'#242c3d');label(c,s[0],x+17,156,10,theme.muted,'600');label(c,s[1],x+17,186,26,i===2?theme.gold:theme.text,'700');label(c,s[2],x+17,205,11,theme.muted);});
   const hitboxes=[],top=277;const center=(r,i)=>top+d.step*(2**r)*(i+.5);
   // Önce bağlantılar çizilir; kartlar çizgilerin üstünde kalır.
   for(let r=0;r<b.rounds.length-1;r++)for(const m of b.rounds[r]){const x=d.left+r*(d.cw+d.gap)+d.cw,y=center(r,m.index),nx=x+d.gap,ny=center(r+1,Math.floor(m.index/2));c.strokeStyle=m.winner?'#65577f':'#30394d';c.lineWidth=m.winner?2:1.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+d.gap/2,y);c.lineTo(x+d.gap/2,ny);c.lineTo(nx,ny);c.stroke();}
   b.rounds.forEach((round,r)=>{const x=d.left+r*(d.cw+d.gap);label(c,T.roundName(r,b.rounds.length).toLocaleUpperCase('tr'),x,255,11,r===b.rounds.length-1?theme.gold:theme.muted,'600');label(c,`${round.length} eşleşme`,x+d.cw-74,255,10,theme.muted);
     round.forEach(m=>{const y=center(r,m.index)-49,ready=m.status==='ready',final=r===b.rounds.length-1;
       roundRect(c,x,y,d.cw,98,11,theme.panel,ready?(final?'#b79550':'#77669e'):'#2c3446');
       label(c,`MAÇ ${m.index+1}`,x+12,y+18,9,theme.muted,'600');label(c,m.status==='done'?'TAMAMLANDI':m.status==='bye'?'DOĞRUDAN GEÇİŞ':ready?'KAZANANI SEÇ':'BEKLENİYOR',x+84,y+18,9,ready?theme.gold:theme.muted,'600');
       [m.a,m.b].forEach((p,j)=>{const py=y+29+j*32,win=p&&m.winner?.id===p.id;if(win)roundRect(c,x+5,py-2,d.cw-10,30,5,'#292a2a');
         if(p){roundRect(c,x+12,py+3,21,21,6,p.color+'25');label(c,p.name.charAt(0).toLocaleUpperCase('tr'),x+18,py+18,10,p.color,'700');label(c,fit(c,p.name,d.cw-89),x+41,py+18,13,win?theme.gold:theme.text,win?'600':'400');const score=j===0?m.scoreA:m.scoreB;if(score!==null)label(c,String(score),x+d.cw-26,py+18,12,win?theme.gold:theme.muted,'600');else if(win)label(c,'✓',x+d.cw-26,py+18,14,theme.gold,'700');}
         else label(c,m.status==='bye'?'Doğrudan geçiş':m.status==='empty'?'Boş':'Önceki maç bekleniyor',x+13,py+18,11,theme.muted);
       });
       if(ready||m.status==='done')hitboxes.push({x,y,w:d.cw,h:98,id:m.id});
     });
   });
   const fx=d.left+b.rounds.length*(d.cw+d.gap),fy=center(b.rounds.length-1,0);
   c.strokeStyle=b.champion?'#ae9156':'#30394d';c.lineWidth=2;c.beginPath();c.moveTo(fx-d.gap,fy);c.lineTo(fx,fy);c.stroke();
   label(c,'KUPA SAHİBİ',fx,255,11,theme.gold,'600');
   roundRect(c,fx,fy-95,d.cw,190,15,'#1d1e24','#655234');
   const goldGlow=c.createRadialGradient(fx+d.cw/2,fy-30,0,fx+d.cw/2,fy-30,85);goldGlow.addColorStop(0,'rgba(232,185,100,.17)');goldGlow.addColorStop(1,'rgba(232,185,100,0)');c.fillStyle=goldGlow;c.fillRect(fx+1,fy-94,d.cw-2,188);
   trophy(c,fx+d.cw/2-23,fy-68,46);c.textAlign='center';label(c,b.champion?'ŞAMPİYON':'KUPA SENİ BEKLİYOR',fx+d.cw/2,fy+6,10,theme.gold,'600');label(c,b.champion?fit(c,b.champion.name,d.cw-30,19):'Sıradaki efsane kim?',fx+d.cw/2,fy+37,19,theme.text,'700');label(c,b.champion?'Tebrikler! Turnuva tamamlandı.':'Finali tamamla ve şampiyonu belirle.',fx+d.cw/2,fy+63,11,theme.muted);c.textAlign='left';
   label(c,'HER EŞLEŞME YENİ BİR HİKÂYE.',32,d.height-22,10,theme.muted,'600');label(c,'Tek eleme · 2–64 katılımcı',d.width-195,d.height-22,10,theme.muted);
   return{...d,hitboxes};
 }
 return{render,dimensions,theme};
});
