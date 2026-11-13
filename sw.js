/* Mr. Earthling service worker: lets the site open instantly and work offline once visited.
   Pages: network first (always fresh), falling back to the saved copy offline.
   Images, icons and fonts: served from cache, refreshed in the background.
   Videos are never cached (large, and the page works without them). */
const CACHE = 'me-v3';
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/assets/icon-192.png', '/assets/icon-512.png',
  '/assets/favicon.svg', '/assets/img/hero.webp', '/assets/img/jar.webp', '/assets/img/creature.webp', '/assets/img/firstbite-still.webp'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || req.headers.has('range') || /\.(mp4|webm)$/i.test(url.pathname)) return;
  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('/index.html', copy)); return r; })
      .catch(() => caches.match('/index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
