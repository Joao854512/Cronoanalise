self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('atividade-tempo-cache-v1').then(cache => {
      return cache.addAll([
        '/',
  '/index.html',
  '/script.js',
  '/manifest.json',
  '/libs/xlsx.js',
  '/libs/sql-wasm.js',
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});
