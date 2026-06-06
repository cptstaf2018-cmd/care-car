// Care Car service worker — offline app shell + last-data caching.
// Bump CACHE when deploying to drop the previous cache.
const CACHE = 'carecar-v1'
const PRECACHE = ['/', '/favicon.svg', '/manifest.webmanifest']

const API_PREFIX = /^\/(auth|tenants|cars|services|invoices|inventory|debts|reports|settings|vision|platform|users|mobile-camera)\b/

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

function cachePut(request, response) {
  const copy = response.clone()
  caches.open(CACHE).then((cache) => cache.put(request, copy))
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Never interfere with writes — they must hit the network.
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // SPA navigation: network-first so the app stays fresh online, cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((res) => cachePut('/', res)).catch(() => caches.match('/'))
    )
    return
  }

  // Hashed build assets never change — cache-first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => cachePut(request, res)))
    )
    return
  }

  // API reads: network-first, fall back to the last cached copy when offline.
  if (API_PREFIX.test(url.pathname)) {
    event.respondWith(
      fetch(request).then((res) => cachePut(request, res)).catch(() => caches.match(request))
    )
    return
  }

  // Other same-origin assets (images, icons): cache-first with network fallback.
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})
