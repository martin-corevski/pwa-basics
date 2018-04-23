// Dom events are not available, only specific service worker events are
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing... ', event)
})

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating... ', event)
  return self.clients.claim()
})
// Fetch event is triggered by the application. See
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers under 'Custom responses to requests'
self.addEventListener('fetch', function(event) {
  console.log('[Service Worker] Fetching... ', event)
})
