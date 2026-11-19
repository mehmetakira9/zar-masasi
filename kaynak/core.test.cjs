const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const G = require('./core.js');
const make = (id, extra = {}) => ({...G.makeGame(id), id, moods:['relax'], ...extra});

const games = [make('A'), make('B',{priority:3,favorite:true}), make('C',{priority:5,favorite:true})];
const counts = [0,0,0];
for(let ticket=0;ticket<17;ticket++) counts[games.indexOf(G.choose(games,()=>ticket))]++;
assert.deepEqual(counts,[1,6,10]);
assert.equal(G.choose([],()=>0),null);
const three=G.chooseThree(games,()=>0);
assert.equal(new Set(three.map(game=>game.id)).size,3);
assert.equal(G.chooseThree(games.slice(0,1),()=>0).length,1);

const prefs={...G.defaults(),mood:'relax',repeatWindow:3};
const all=[...games,make('finished',{status:'finished'}),make('excluded',{excluded:true}),make('snoozed',{snoozeUntil:2000}),make('wrongMood',{moods:['action']})];
const history=[{gameId:'B'},{gameId:'A'}];
assert.deepEqual(G.pools(all,history,prefs,{now:1000}).eligible.map(game=>game.id),['C']);
assert.deepEqual(G.pools(all,history,prefs,{now:1000,relaxRepeats:true}).eligible.map(game=>game.id),['A','B','C']);
assert(G.pools(all,history,prefs,{now:3000}).eligible.some(game=>game.id==='snoozed'));
const none=G.pools(games,history,{...prefs,repeatWindow:3},{now:1000});assert.equal(none.base.length,3);
assert.equal(G.pools(games,[{gameId:'A'},{gameId:'B'},{gameId:'C'}],prefs).eligible.length,0);
assert(G.pools(all,[],{...prefs,excludeFinished:false},{now:1000}).eligible.some(game=>game.id==='finished'));

for(const slice of G.segments(games)){
 for(const jitter of [-.1,0,.1]){
  const rotation=G.mod(-Math.PI/2-slice.center+jitter*slice.span,G.TAU);
  assert.equal(G.atRotation(games,rotation).id,slice.game.id);
 }
}
for(let i=0;i<50;i++){const draw=G.randomInt(17,webcrypto);assert(draw>=0&&draw<17);}
let n=0;assert.equal(G.randomInt(10,{getRandomValues(a){a[0]=n++?7:0xffffffff}}),7);assert.equal(n,2);

const record=G.makeRecord(games[1],'wheel','relax');record.outcome='played';record.minutes=45;record.notes='Güzel bir oturum';
const imported=G.importBackup({format:'bugun-ne-oynasam',version:1,games,history:[record],prefs:{...prefs,theme:'forest'}});
assert.equal(imported.games[1].priority,3);assert(imported.games[1].favorite);assert.equal(imported.prefs.theme,'forest');
assert.equal(imported.history[0].gameId,imported.games[1].id);assert.notEqual(imported.games[1].id,games[1].id);
assert.equal(imported.history[0].minutes,45);
assert.throws(()=>G.importBackup({format:'x',version:1,games:[]}));
assert.throws(()=>G.importBackup({format:'bugun-ne-oynasam',version:1,games:[make('A',{cover:'javascript:alert(1)'})]}));
assert.throws(()=>G.importBackup({format:'bugun-ne-oynasam',version:1,games:[make('A'),make('A')]}));
assert.throws(()=>G.cleanPreferences({background:'https://example.com/image.jpg'}));
assert(G.csv([{...record,name:'=1+1',notes:'"alıntı"; yeni satır\nnot'}]).includes("'=1+1"));
assert(G.csv([record]).startsWith('\ufeff'));
console.log('PASS: ağırlıklı seçim, benzersiz üç öneri, ruh hali/durum/bekletme filtreleri, tekrar esnetme, çark işaretçisi, yedek eşleştirme/doğrulama, CSV.');
