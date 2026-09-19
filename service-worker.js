/* Delivery Record — service worker
 *
 * Purpose: let the app open (and install to the home screen) even with a poor
 * or no connection. It caches the app shell only.
 *
 * It deliberately NEVER touches the shared data: only the app's own files and
 * a short allow-list of font/library hosts are cached. Everything else
 * (api.github.com, your sync Worker, data.json) goes straight to the network,
 * so every device sees the real, current data after a refresh.
 *
 * When you upload a new version of index.html, bump CACHE_VERSION below so
 * devices drop the old cached copy.
 */
const CACHE_VERSION = "delivery-record-v5";
const CACHEABLE_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./config.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // add one by one so a single failure doesn't abort the whole install
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Shared data: never cache, never intercept.
  if (url.origin === self.location.origin && url.pathname.endsWith("/data.json")) return;
  // Any other site that isn't on the allow-list (GitHub API, sync Worker, ...): network only.
  if (url.origin !== self.location.origin && !CACHEABLE_HOSTS.includes(url.hostname)) return;

  // App files (same origin): network first, fall back to cache when offline.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((hit) =>
            hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined)
          )
        )
    );
    return;
  }

  // Fonts and the spreadsheet library (cross-origin): serve from cache
  // instantly, refresh in the background.
  event.respondWith(
    caches.match(req).then((hit) => {
      const refresh = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || refresh;
    })
  );
});
