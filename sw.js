/**
 * WIMP — WhereIsMyParking
 * sw.js | Service Worker — Cache-first for shell, network-first for API
 */

const CACHE_NAME  = 'wimp-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/analytics.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/* ── Install: pre-cache shell ── */
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

/* ── Fetch: strategy per request type ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // External API calls (Overpass, Nominatim, analytics) → always network, no cache
  const isExternal = url.origin !== self.location.origin;
  if (isExternal) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Shell assets → cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
