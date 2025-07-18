self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('atividade-tempo-cache-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/script.js',
        '/manifest.json',
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/sql-wasm.js',
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
