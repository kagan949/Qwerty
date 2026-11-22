/* eslint-disable no-restricted-globals */
/**
 * VYBE service worker — hand-written so its behaviour is auditable.
 *
 * Strategy
 *  - Navigation requests: network-first with a cached app shell fallback, so
 *    the UI works offline and deploys roll out immediately when online.
 *  - Static build assets (/_next/static): stale-while-revalidate, immutable.
 *  - API catalogue reads: network-first, cache as fallback (5 min TTL marker in
 *    a custom header) so Home/Search still render on a flaky connection.
 *  - Catalogue audio (/api/audio) and artwork: cache-first with a bounded cache
 *    so recently played tracks survive going offline.
 *  - Uploaded audio is never here: it lives in IndexedDB and is played from a
 *    blob: URL created by the page, which works offline by definition.
 */
const VERSION = "vybe-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const API_CACHE = `${VERSION}-api`;
const MEDIA_CACHE = `${VERSION}-media`;
const MAX_MEDIA_ENTRIES = 60;

const OFFLINE_URLS = ["/", "/search", "/library", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(OFFLINE_URLS.map((url) => cache.add(new Request(url, { cache: "reload" }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_RUNTIME_CACHES") {
    event.waitUntil(
      (async () => {
        await Promise.all([caches.delete(API_CACHE), caches.delete(MEDIA_CACHE)]);
      })(),
    );
  }
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  for (const key of keys.slice(0, keys.length - maxEntries)) await cache.delete(key);
}

async function networkFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const headers = new Headers(clone.headers);
      headers.set("x-vybe-cached-at", String(Date.now()));
      const body = await clone.blob();
      await cache.put(request, new Response(body, { status: clone.status, statusText: clone.statusText, headers }));
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      if (maxAgeSeconds) {
        const cachedAt = Number(cached.headers.get("x-vybe-cached-at") || 0);
        if (cachedAt && Date.now() - cachedAt < maxAgeSeconds * 1000) return cached;
      }
      return cached;
    }
    throw error;
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.status === 206) {
    await cache.put(request, response.clone());
    if (maxEntries) await trimCache(cacheName, maxEntries);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) void cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await network) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept cross-origin media; the audio proxy already handles it.
  if (url.origin !== self.location.origin) return;

  // Navigation → network first, fall back to cached shell.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match(request)) ||
            (await cache.match("/")) ||
            new Response("<!doctype html><title>VYBE offline</title><body style='background:#09090b;color:#fff;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0'><div style='text-align:center'><h1>VYBE</h1><p>You are offline. Your downloaded music and library are available once the app loads.</p></div></body>", {
              headers: { "content-type": "text/html; charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }

  // Next.js build output is content-hashed → immutable.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }

  // Icons / images / fonts served from /public.
  if (/\.(png|svg|jpg|jpeg|webp|avif|woff2?|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Audio proxy — cache-first with a bounded store for offline playback.
  if (url.pathname === "/api/audio") {
    // Range requests can't be satisfied from a full-body cache safely; skip
    // caching those but allow normal network streaming.
    if (request.headers.has("range")) return;
    event.respondWith(
      cacheFirst(request, MEDIA_CACHE, MAX_MEDIA_ENTRIES).catch(() => fetch(request)),
    );
    return;
  }

  if (url.pathname === "/api/artwork") {
    event.respondWith(cacheFirst(request, MEDIA_CACHE, MAX_MEDIA_ENTRIES).catch(() => fetch(request)));
    return;
  }

  // Catalogue API reads — network first with short-lived cache fallback.
  if (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/local-")) {
    event.respondWith(networkFirst(request, API_CACHE, 600).catch(() => Response.error()));
    return;
  }

  // Everything else: normal network, fall back to any cache entry.
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(ASSET_CACHE);
        return (await cache.match(request)) || Response.error();
      }
    })(),
  );
});
