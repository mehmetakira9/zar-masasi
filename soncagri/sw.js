// Son Çağrı — çevrimdışı çalışma. Güncellemede VERSION'ı artır.
const VERSION = 'soncagri-v2';
const FILES = ['./','./index.html','./style.css','./oyun.css','./engine.js','./zorluk.js','./kayit.js','./sanat.js','./efekt.js','./app.js','./sw-kayit.js','./manifest.webmanifest','./assets/tower.png','./assets/portraits.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('soncagri-') && x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || caches.match('./index.html'))));
});