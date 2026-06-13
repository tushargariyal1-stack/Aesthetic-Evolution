const cacheName = 'myapp-v1';
const assets = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js'
];

// Files ko cache mein save karna
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Offline hone par cache se file chalana
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request);
    })
  );
});