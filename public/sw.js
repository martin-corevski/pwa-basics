var STATIC_CACHE_NAME = 'static-v3'
var DYNAMIC_CACHE_NAME = 'dynamic-v3'

// Dom events are not available, only specific service worker events are
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing... ', event)
  // Since everything is async the install event won't wait for caches.open() to
  // finish, that is why we are using event.waitUntil(), this way fetch won't
  // do anything until this is finished. Open or create (if it doesn't exist)
  // the static (pre-cached) cache. Caches references the overal cache storage.
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(function(cache) {
      // Here we can add content (files) to the cache
      console.log('[Service Worker] Precaching app shell... ')
      // Add the app.js file to static cache. Caching is essentially adding urls
      // or network requests as key value pairs. This is why '/' needs to be
      // added too. Otherwise every offline request to localhost:8080 will
      // return 'Site can't be reached' error.
      // cache.add('/')
      // cache.add('/index.html')
      // cache.add('/src/js/app.js')
      cache.addAll([
        '/',
        '/index.html',
        '/src/js/app.js',
        '/src/js/feed.js',
        '/src/js/material.min.js',
        '/src/css/app.css',
        '/src/css/feed.css',
        '/src/images/main-image.jpg',
        'https://fonts.googleapis.com/css?family=Roboto:400,700',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
      ])
      // Fetching from other CDNs (servers) is also possible but they need to
      // have the appropriate cors headers set in order to avoid errors.
    })
  )
})

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating... ', event)
  // Clean up old cache versions
  event.waitUntil(
    // Keys method gets all the keys of subcaches inside the cache storage
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.map(function(key) {
          if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Clean up old cache with key: ', key)
            return caches.delete(key)
          }
        })
      )
    })
  )
  return self.clients.claim()
})
// Fetch event is triggered by the application. See
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
// under 'Custom responses to requests'
self.addEventListener('fetch', function(event) {
  // console.log('[Service Worker] Fetching... ', event)
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Even if we don't get a Promise that resolves to the response associated
      // with the first matching request in the cache object we still don't use
      // catch because the response will be undefined and it can be handled in
      // this method.
      // https://developer.mozilla.org/en-US/docs/Web/API/Cache/match
      if (response) {
        return response
      } else {
        // In the case we don't get a response (cached asset) we continue
        // fetching from the network.
        return fetch(event.request)
          .then(function(res) {
            // Dynamic caching, caching files that are not part of the current
            // static cache (not pre-cached).
            return caches.open(DYNAMIC_CACHE_NAME).then(function(cache) {
              // Put unlike add needs two arguments to create the key value pair.
              // The response without clone function will be consumed (used) and
              // won't be available again, it will be empty.
              cache.put(event.request.url, res.clone())
              return res
            })
          })
          .catch(function(err) {
            // Handle fetch errors
          })
      }
      // PS: In other words these 'if else' conditions fetch assets from the
      // cache if they are there and if they are not it will fetch the network requests
    })
  )
})
