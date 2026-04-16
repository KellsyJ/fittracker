const CACHE_NAME = 'fittracker-v3';
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

  // Never intercept external domains — let them go straight to network
  // This is critical for Firebase SDK scripts from gstatic.com
  if (!url.startsWith(self.location.origin)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For same-origin requests: cache-first, fall back to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cache new same-origin responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('index.html'));
    })
  );
});
