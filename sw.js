// Jaque de Piedra · service worker
// Cambiar VERSION cada vez que se publica, para que los celulares bajen lo nuevo.
const VERSION = 'jp-2026-10-07a';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './iconos/icon-192.png', './iconos/icon-512.png', './iconos/icon-maskable-512.png',
  './modelos/rey-patriota.glb', './modelos/dama-patriota.glb', './modelos/rey-realista.glb', './modelos/dama-realista.glb',
  './motor/stockfish-18-lite-single.js', './motor/stockfish-18-lite-single.wasm',
];
const CDN = ['https://cdn.jsdelivr.net/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // La página: primero internet (para recibir actualizaciones), si no hay, la guardada.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Archivos propios (modelos, motor, íconos): primero lo guardado.
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r;
    })));
    return;
  }
  // Librerías y tipografías de CDN: lo guardado al instante y se actualiza por detrás.
  if (CDN.some(p => req.url.startsWith(p))) {
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
  // Todo lo demás (el servidor de conexión online) va directo a internet.
});
