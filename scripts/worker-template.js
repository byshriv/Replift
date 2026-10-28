/* Build replaces the version and exact public-asset allowlist. */
const PREFIX =
  'replift-shell-v1-' + encodeURIComponent(self.registration.scope) + ':';
const CACHE = PREFIX + '__VERSION__';
const ASSETS = __ASSETS__;
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // A failed download rejects installation; the active worker stays usable.
      await cache.addAll(
        ASSETS.map((url) => new Request(url, { cache: 'reload' })),
      );
    })(),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // No skipWaiting or clients.claim: all existing tabs keep their version.
      for (const key of await caches.keys()) {
        if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      }
    })(),
  );
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin)
    return;
  const shell = event.request.mode === 'navigate' && url.pathname === '/';
  const asset = !url.search && ASSETS.includes(url.pathname);
  if (!shell && !asset) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      return (
        (await cache.match(shell ? '/index.html' : url.pathname)) ||
        fetch(event.request)
      );
    })(),
  );
});
