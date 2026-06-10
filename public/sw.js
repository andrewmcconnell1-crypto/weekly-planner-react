// Minimal offline service worker for the Meal Planner PWA.
//
// Strategy: network-first for same-origin GET requests, falling back to the
// cache when offline. Successful responses are cached so the app shell and its
// hashed assets become available without a connection (e.g. in-store). App data
// itself lives in localStorage, so nothing here needs to cache user data.

const CACHE = "meal-planner-v1";

// The app root, derived from where this service worker is served, so it works
// at the domain root or under a subpath (e.g. GitHub Pages).
const APP_SHELL = new URL("./", self.location).href;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") return caches.match(APP_SHELL);
          return Response.error();
        })
      )
  );
});
