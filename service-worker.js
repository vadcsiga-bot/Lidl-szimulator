const CACHE_NAME = 'lidl-vasarlo-szimulator-v2';

// A saját fájljainkat cache-eljük. A three.js CDN-t "network first, cache fallback"
// stratégiával kezeljük, hogy frissülhessen, de offline is működjön az első betöltés után.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './main.js',
  './store.js',
  './character.js',
  './game.js',
  './products.js',
  './joystick.js',
  './logo.svg',
  './logo-maskable.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {
      // Ha valamelyik fájl még nem létezik build közben, ne akadjon el a telepítés
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // App shell: cache first, hálózati fallback
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
        );
      })
    );
  } else {
    // CDN (three.js): network first, cache fallback offline esetére
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
