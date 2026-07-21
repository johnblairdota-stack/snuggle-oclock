/* Snuggle O'Clock service worker.
   HTML is fetched network-first so game updates appear immediately.
   Models/icons/fonts are cache-first (big, rarely change). */
const CACHE_VERSION = 'snuggle-v3';
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

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const isDoc = e.request.mode === 'navigate' ||
                e.request.destination === 'document' ||
                e.request.url.endsWith('/index.html');
  if(isDoc){
    /* network-first: always try for the freshest game; fall back to cache offline */
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    /* cache-first for everything else */
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
  }
});
