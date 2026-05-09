const CACHE_NAME = 'fleetopsx-driver-v1'
const STATIC_ASSETS = ['/', '/driver', '/index.html']
const API_CACHE = 'fleetopsx-api-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Cache-first for static assets
  if (event.request.method === 'GET' && !url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached ?? fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone))
          }
          return response
        })
      )
    )
    return
  }

  // Network-first for driver API calls, fallback to cache
  if (event.request.method === 'GET' && url.pathname.includes('/driver/my-stops')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(API_CACHE).then((c) => c.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
  }
})
