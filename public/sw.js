// StudyVerse service worker: an offline fallback page and push reminders. Pages themselves are never cached,
// so signed-in data is always fresh and never left on the device.
const CACHE = 'sv-offline-v1'
const OFFLINE = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)))
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  event.waitUntil(
    self.registration.showNotification(data.title || 'StudyVerse', {
      body: data.body || '',
      icon: '/icons/192',
      badge: '/icons/192',
      tag: data.tag || 'studyverse',
      data: { url: data.url || '/dashboard' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => w.url.startsWith(self.location.origin))
      return open ? open.focus().then((w) => w.navigate(url)) : self.clients.openWindow(url)
    }),
  )
})
