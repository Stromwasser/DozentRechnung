// service-worker.js
const CACHE_NAME = 'dozent-rechnungen-v1'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(['/', '/index.html', '/src/assets/logo.svg', OFFLINE_URL])
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request)
        } catch (error) {
          console.error('Ошибка:', error)
          return await caches.match(OFFLINE_URL)
        }
      })(),
    )
  }
})
