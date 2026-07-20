// Librarian service worker — installable + offline app shell.
// Live data (search APIs, AI, proxy) always hits the network; the app shell,
// built assets, fonts, and PDF.js are cached so the app + your PDF library work offline.
const VERSION = 'v1';
const SHELL = `librarian-shell-${VERSION}`;
const RUNTIME = `librarian-runtime-${VERSION}`;
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(['/', '/manifest.webmanifest', '/apple-touch-icon.png', '/pwa-192x192.png', '/pwa-512x512.png']).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/.netlify/')) return; // functions: always live

  if (req.mode === 'navigate') { // app shell: network-first, offline fallback
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(SHELL).then(x => x.put('/', c)); return r; }).catch(() => caches.match('/')));
    return;
  }
  if (url.origin === self.location.origin) { // built assets: cache-first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(RUNTIME).then(x => x.put(req, c)); } return r; })));
    return;
  }
  if (CDN_HOSTS.includes(url.host)) { // fonts + PDF.js: stale-while-revalidate
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(RUNTIME).then(x => x.put(req, c)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
