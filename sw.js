// Service worker di Lievita: permette di aprire l'app anche senza rete.
// Strategia:
// - pagina (index.html): prima la rete, così gli aggiornamenti arrivano subito;
//   se la rete manca si usa la copia salvata;
// - file dell'app (icone, manifest): prima la copia salvata;
// - font Google: copia salvata subito, aggiornata in background.
// Quando cambia l'elenco dei file da salvare, aumentare VERSION.
const VERSION = 'lievita-v1';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
  }
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put('./index.html', res.clone());
    return res;
  } catch (e) {
    return (await cache.match(req, { ignoreSearch: true }))
      || (await cache.match('./index.html'))
      || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  const update = fetch(req)
    .then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; })
    .catch(() => hit || Response.error());
  return hit || update;
}
