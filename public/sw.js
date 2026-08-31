/*
 * Linoscore Legal service worker — intentionally conservative.
 *
 * This is an authenticated, data-heavy app, so the SW MUST NOT cache API
 * responses or authenticated page HTML (that would risk stale legal data or
 * leaking one user's view to another on a shared device). It only:
 *   - precaches the offline fallback + app icons
 *   - serves immutable static assets (/_next/static, /icons) cache-first
 *   - falls back to an offline page when a navigation fails while offline
 * Everything else — and everything under /api — is network-only, untouched.
 */
const VERSION = "v1";
const CACHE = `linoscore-legal-${VERSION}`;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // third-party → untouched
  if (url.pathname.startsWith("/api/")) return;     // never cache API / auth data

  // Immutable hashed assets: cache-first, then populate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
      )
    );
    return;
  }

  // Page navigations: network-first; offline fallback if the network fails.
  // We do NOT cache the HTML (it's per-user, authenticated).
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
  }
});
