// Bugün Ne Oynasam — çevrimdışı çalışma (service worker)
// Uygulamayı güncellediğinde VERSION'ı artır ki telefonlar yeni dosyaları alsın.
const VERSION = 'oyun-v1';
const FILES = ['./', './index.html', './styles.css', './ekler.css', './core.js', './app.js', './ekler.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  // Sadece bu uygulamanın eski önbelleklerini sil (aynı sitedeki diğer uygulamalara dokunma)
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('oyun-') && k !== VERSION && k !== 'oyun-fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.open('oyun-fonts').then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => new Response('', { status: 504 })))));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
});