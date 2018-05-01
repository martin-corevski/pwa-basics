importScripts('/src/js/idb.js')
importScripts('/src/js/utility.js')

var STATIC_CACHE_NAME = 'static-v25'
var DYNAMIC_CACHE_NAME = 'dynamic-v6'
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/idb.js',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/utility.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
]

// Set your firebase url, add .json at the end
var getUrl = ''
// Set your firebase functions url
var postUrl = ''

// Trimming the cache can be done wherever we please in the fetch listener.
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(function(cache) {
    // Get all the requests from the cache
    return cache.keys().then(function(keys) {
      if (keys.length > maxItems) {
        // Remove oldest item from cache and continue trimming until the cache
        // has less items than the maxItems set.
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems))
      }
    })
  })
}

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
      cache.addAll(STATIC_FILES)
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

///////////////////////////////////////////
// STRATEGY: CACHE WITH NETWORK FALLBACK //
///////////////////////////////////////////

// Fetch event is triggered by the application. See
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
// under 'Custom responses to requests'
// self.addEventListener('fetch', function(event) {
//   // console.log('[Service Worker] Fetching... ', event)
//   // https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith
//   event.respondWith(
//     caches.match(event.request).then(function(response) {
//       // Even if we don't get a Promise that resolves to the response associated
//       // with the first matching request in the cache object we still don't use
//       // catch because the response will be undefined and it can be handled in
//       // this method.
//       // https://developer.mozilla.org/en-US/docs/Web/API/Cache/match
//       if (response) {
//         return response
//       } else {
//         // In the case we don't get a response (cached asset) we continue
//         // fetching from the network.
//         return fetch(event.request)
//           .then(function(res) {
//             // Dynamic caching, caching files that are not part of the current
//             // static cache (not pre-cached).
//             return caches.open(DYNAMIC_CACHE_NAME).then(function(cache) {
//               // Trim the dynamic cache because it might get too big. This
//               // way the maximum number of request in the dynamic cache is 4
//               trimCache(DYNAMIC_CACHE_NAME, 3)
//               // Put unlike add needs two arguments to create the key value pair.
//               // The response without clone function will be consumed (used) and
//               // won't be available again, it will be empty.
//               cache.put(event.request.url, res.clone())
//               return res
//             })
//           })
//           .catch(function(err) {
//             // Handle fetch errors
//             // In case some page wasn't cached use a fallback page
//             return caches.open(STATIC_CACHE_NAME).then(function(cache) {
//              // Go to the fallback page only if help route is requested
//              // and it's not in the cache.
//              // if (event.request.url.indexOf('/help')) {
//              if (event.request.headers.get('accept').includes('text/html')) {
//              // We can return any type of file, as long as we have it cached.
//              // If an image is not available we can return a dummy img...
//                return cache.match('/offline.html')
//              }
//             })
//           })
//       }
//       // PS: In other words these 'if else' conditions fetch assets from the
//       // cache if they are there and if they are not it will fetch the network requests
//     })
//   )
// })

//////////////////////////
// STRATEGY: CACHE ONLY //
//////////////////////////

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//   )
// })

////////////////////////////
// STRATEGY: NETWORK ONLY //
////////////////////////////

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//   )
// })

///////////////////////////////////////////
// STRATEGY: NETWORK WITH CACHE FALLBACK //
///////////////////////////////////////////

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function(res) {
//         // Dinamyc caching can be used with this strategy but it's still
//         // a bad user experience to wait for something that can be
//         // delivered from the cache (or a fallback page can be shown)
//         // right away.
//         return caches.open(DYNAMIC_CACHE_NAME).then(function(cache) {
//           cache.put(event.request.url, res.clone())
//           return res
//         })
//       })
//       .catch(function(err) {
//         return caches.match(event.request)
//       })
//   )
// })

//////////////////////////////////
// STRATEGY: CACHE THEN NETWORK //
//////////////////////////////////

function isInStaticFiles(request, files) {
  for (var i = 0; i < files.length; i++) {
    if (files[i] === request) {
      return true
    } else if ('http://localhost:8080' + files[i] === request) {
      return true
    }
  }
  return false
}

self.addEventListener('fetch', function(event) {
  // Only put assets in dynamic cache if the request is for specific url
  if (event.request.url.indexOf(getUrl) > -1) {
    event.respondWith(
      // intercept the event requests, including the one in feed.js
      fetch(event.request).then(function(res) {
        var clonedRes = res.clone()
        // A post might have been deleted, clear idb and add (cache) the posts again
        clearAllData('posts')
          .then(function() {
            return clonedRes.json()
          })
          .then(function(data) {
            for (var post in data) {
              writeData('posts', data[post])
            }
          })
        return res
      })
    )
  } else if (isInStaticFiles(event.request.url, STATIC_FILES)) {
    // else if (
    //   new RegExp('\\b' + STATIC_FILES.join('\\b|\\b') + '\\b').test(
    //     event.request.url
    //   )
    // )
    // The regex created looks like this: \b/a\b|\b/index.html\b|\b ...
    // \b/src/js/feed.js\b and so on until the last element in the array and at
    // the end it has \b. The \b creates word boundaries, when
    // event.request.url is http://localhost:8080/src/js/feed.js the regexp test
    // will return true because it has /src/js/feed.js in the url. More on \b
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
    // under 'Using special characters'

    // Use cache only strategy
    event.respondWith(caches.match(event.request))
  } else {
    // If we are in offline mode find assets from the static cache
    event.respondWith(
      caches.match(event.request).then(function(response) {
        if (response) {
          return response
        } else {
          return fetch(event.request)
            .then(function(res) {
              return caches.open(DYNAMIC_CACHE_NAME).then(function(cache) {
                // trimCache(DYNAMIC_CACHE_NAME, 3)
                cache.put(event.request.url, res.clone())
                return res
              })
            })
            .catch(function(err) {
              return caches.open(STATIC_CACHE_NAME).then(function(cache) {
                // Go to the fallback page only if help route is requested
                // and it's not in the cache.
                if (event.request.headers.get('accept').includes('text/html')) {
                  return cache.match('/offline.html')
                }
              })
            })
        }
      })
    )
  }
})

/////////////////////
// BACKGROUND SYNC //
/////////////////////

// This event will fire up when we have POST data for background sync, for both
// offline and online cases. For offline as soon as we get internet connection,
// for online right away or if the user closed the app on the next "login".
self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Syncing...')
  if (event.tag === 'sync-new-post') {
    console.log('[Service Worker] Syncing new posts...')
    // Ensure that we wait for data to be sent
    event.waitUntil(
      readAllData('sync-posts').then(function(data) {
        for (dt of data) {
          var postData = new FormData()
          postData.append('id', dt.id)
          postData.append('title', dt.title)
          postData.append('location', dt.location)
          postData.append('rawLocationLat', dt.rawLocation.lat)
          postData.append('rawLocationLng', dt.rawLocation.lng)
          postData.append('file', dt.picture, dt.id + '.png')

          fetch(postUrl, {
            method: 'POST',
            body: postData
          })
            .then(function(res) {
              console.log('Data sent: ', res)
              // If the response is in the range of 200 it means the data has
              // been added to the database.
              if (res.ok) {
                // Now we can clear the sync "buffer"
                res.json().then(function(resData) {
                  deleteItem('sync-posts', resData.id)
                })
              }
            })
            .catch(function(err) {
              console.log('Error while sending data: ', err)
            })
        }
      })
    )
  }
})

////////////////////////
// PUSH NOTIFICATIONS //
////////////////////////

// If an action is clicked, for this example there are two actions set in app.js
// confirm and cancel.
self.addEventListener('notificationclick', function(event) {
  var notification = event.notification
  var action = event.action

  console.log(notification)

  // This is a check against the defined actions in app js, the action property
  // serves as an id.
  if (action === 'confirm') {
    console.log('Confirm clicked')
  } else {
    // If the user clicks on the notification open or refresh the page in the
    // browser
    console.log(action)
    event.waitUntil(
      // clients refers to all browser tabs related to this service worker
      clients.matchAll().then(function(cls) {
        // In other words cls returns everything managed by the service worker.
        // Client will be one of the open window tabs in which the service worker
        // is active.
        var client = cls.find(function(c) {
          return (c.visibilityState = 'visible')
        })

        if (client !== undefined) {
          // If the application is open in the browser refresh it
          client.navigate(notification.data.url)
          client.focus()
        } else {
          // In any other case open it in the browser. Since it's the user that
          // clicked on the push notification this should be the expected
          // behaviour.
          clients.openWindow(notification.data.url)
        }
      })
    )
  }
  notification.close()
})

// Closing a notification can happen when swipping, pressing X or clearing all
// notifications
self.addEventListener('notificationclose', function(event) {
  console.log('Notification was closed', event)
})

// The service worker is always running in the background and that is why it's
// a good place to listen to push notifications here. The service worker will
// get a push notification only if sw is already subscribed (part of the subs)
// table in the database and the backend has notifications that are meant for
// this service worker. The service worker gets chrome id and every sw is
// connected to a specific browser.
self.addEventListener('push', function(event) {
  console.log('Push Notification received', event)

  var data = {
    title: 'Dummy title',
    content: 'Dummy push notification as fallback',
    openUrl: '/'
  }
  if (event.data) {
    data = JSON.parse(event.data.text())
  }

  // Push notification options
  var options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    // Additional data sent with the notification.
    data: {
      url: data.openUrl
    }
  }

  // Listen for and show push notifications
  event.waitUntil(self.registration.showNotification(data.title, options))
})
