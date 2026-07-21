/* Snuggle O'Clock service worker.
   TO PUSH AN UPDATE: bump the number in CACHE_VERSION below,
   upload, then close & reopen the app. That's it. */
const CACHE_VERSION = 'snuggle-v2';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './models/bed.glb',
  './models/tato.glb'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* cache-first, then network; successful network fetches get cached
   (this also caches three.js and the font after first load, so the
   app works fully offline afterwards) */
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if(hit) return hit;
      return fetch(e.request).then(res => {
        if(res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')){
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
