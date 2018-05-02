importScripts('workbox-sw.prod.v2.1.3.js')
importScripts('/src/js/idb.js')
importScripts('/src/js/utility.js')

// Set your firebase url, add .json at the end
var getUrl = ''
// Set your firebase functions url
var postUrl = ''

const workboxSW = new self.WorkboxSW()
// Catch any route that passes the regex and then using the staleWhileRevalidate
// function we get the "Cache then network" strategy with dynamic caching.
// With this regex we will get the icons and fonts that we need for the precache
// to look good.
workboxSW.router.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts',
    cacheExpiration: {
      maxEntries: 4,
      maxAgeSeconds: 30 * 24 * 60 * 60
    }
  })
)
// Add the images in a separate cache.
workboxSW.router.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'post-images'
  })
)
// Here we are fetching the material theme.
workboxSW.router.registerRoute(
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'material-css'
  })
)
// Custom handler for indexedDB.
workboxSW.router.registerRoute(getUrl, function(args) {
  // With args we get access to fetch event.
  return fetch(args.event.request).then(function(res) {
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
})
// Offline html fallback.
workboxSW.router.registerRoute(
  function(routeData) {
    // This way we handle every request that asks for html.
    return routeData.event.request.headers.get('accept').includes('text/html')
  },
  function(args) {
    // With args we get access to fetch event.
    return caches.match(args.event.request).then(function(response) {
      if (response) {
        return response
      } else {
        return fetch(args.event.request)
          .then(function(res) {
            return caches.open('dynamic').then(function(cache) {
              cache.put(args.event.request.url, res.clone())
              return res
            })
          })
          .catch(function(err) {
            return caches.match('/offline.html').then(function(res) {
              return res
            })
          })
      }
    })
  }
)

workboxSW.precache([])

/////////////////////
// BACKGROUND SYNC //
/////////////////////

self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Syncing...')
  if (event.tag === 'sync-new-post') {
    console.log('[Service Worker] Syncing new posts...')
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
              if (res.ok) {
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

self.addEventListener('notificationclick', function(event) {
  var notification = event.notification
  var action = event.action

  console.log(notification)

  if (action === 'confirm') {
    console.log('Confirm clicked')
  } else {
    console.log(action)
    event.waitUntil(
      clients.matchAll().then(function(cls) {
        var client = cls.find(function(c) {
          return (c.visibilityState = 'visible')
        })

        if (client !== undefined) {
          client.navigate(notification.data.url)
          client.focus()
        } else {
          clients.openWindow(notification.data.url)
        }
      })
    )
  }
  notification.close()
})

self.addEventListener('notificationclose', function(event) {
  console.log('Notification was closed', event)
})

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

  var options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})
