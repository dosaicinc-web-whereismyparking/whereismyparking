/**
 * WIMP — WhereIsMyParking
 * sw.js | Service Worker v2 — Static data caching + shell
 *
 * Cache strategy:
 *   - Shell assets (HTML/CSS/JS/icons): cache-first
 *   - /data/kerala-parking.json: cache-first (large file, changes infrequently)
 *   - External requests (Nominatim, analytics beacon): network-only
 *   - Old /analytics.html path: intentional 404 (removed)
 */

const CACHE_NAME   = 'wimp-shell-v2';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/data/kerala-parking.json',
];

/* ── Install: pre-cache shell + static data ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

/* ── Activate: clean up old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch handler ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Block old analytics.html path — return 404
  if (url.pathname === '/analytics.html') {
    event.respondWith(new Response('Not Found', { status: 404, statusText: 'Not Found' }));
    return;
  }

  // External requests → network-only (Nominatim, analytics beacon)
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Static data file → cache-first (large file, serve from cache when available)
  if (url.pathname === '/data/kerala-parking.json') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Shell assets → cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return response;
      });
    })
  );
});
