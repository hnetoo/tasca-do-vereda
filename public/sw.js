const CACHE_NAME = 'tasca-vereda-v5';
const getScopeBase = () => self.registration?.scope || `${self.location.origin}/`;
const toCacheUrl = (path) => new URL(path, getScopeBase()).toString();
const ASSETS_TO_CACHE = [
  toCacheUrl('./'),
  toCacheUrl('./index.html'),
  toCacheUrl('./manifest.json'),
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    (async () => {
      if (event.request.mode === 'navigate') {
        try {
          const response = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(toCacheUrl('./index.html'), response.clone());
          return response;
        } catch {
          return caches.match(toCacheUrl('./index.html'));
        }
      }

      const cached = await caches.match(event.request);
      if (cached) return cached;

      return fetch(event.request);
    })()
  );
});
