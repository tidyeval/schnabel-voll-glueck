self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
const PREFIX = 'schnabel-voll-glueck:' + self.registration.scope + ':';
const CACHE = PREFIX + '__VERSION__';
const FILES = __ASSETS__;
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(Promise.all([
  caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))),
  self.clients.claim(),
])));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // The precache contains only this build's public assets. Origin-dependent CORS
  // headers must not turn a cached same-origin asset into an offline miss.
  event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request).catch(error => {
    if (event.request.mode === 'navigate') return cache.match(new URL('index.html', self.registration.scope).href);
    throw error;
  }))));
});
