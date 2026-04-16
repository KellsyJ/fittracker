const CACHE_NAME = 'fittracker-v1';
const ASSETS = ['index.html', 'manifest.json', 'icon-192.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Never intercept external domains — Firebase, gstatic, APIs etc
  if (!url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first for index.html so updates always come through
  if (url.endsWith('/') || url.includes('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Cache-first for other assets
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request)
    )
  );
});
