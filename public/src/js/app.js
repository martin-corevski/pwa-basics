var defferedPrompt
var btnsEnableNotifications = document.querySelectorAll('.enable-notifications')

// Set your firebase db url
var dbUrl = ''
// Set your generated vapid public key
var vapidPublicKey = ''

// navigator === browser
if ('serviceWorker' in navigator) {
  // If service worker is available in the browser, register it
  navigator.serviceWorker
    // .register('/sw.js')
    .register('/service-worker.js')
    .then(function() {
      console.log('Service worker registered!')
    })
    .catch(function(err) {
      console.log(err)
    })
  // We can set the scope of the service worker to listen for changes in
  // specific folder if we don't want it to listen in the public folder (as it
  // is set right now). The folder where sw.js is placed is the scope of the
  // service worker. We can't set the scope to an upper level, as an example if
  // sw.js is inside help folder we can't set the scope to '/'
  // navigator.serviceWorker
  //   .register('/sw.js', { scope: '/help/' })
  //   .then(function() {
  //     console.log('Service worker registered!')
  //   })
}
// Controlling the app install banner pop up
window.addEventListener('beforeinstallprompt', function(event) {
  console.log('[app] beforeinstallprompt...')
  // Prevent the default behaviour, set by the last criteria defined here:
  // https://developers.google.com/web/fundamentals/app-install-banners/
  // 'Meets a site engagement heuristic defined by Chrome (this is regularly being changed).'
  event.preventDefault()
  defferedPrompt = event
  return false
})

function displayNotification() {
  // The content that is a must see in the notification should be part of the
  // title and the body. This is because these two settings will mostly likely
  // be shown on every device whereas the others might not. For example the
  // image might be shown on some and not shown at all on other devices.
  var options = {
    // For text under the title, set body option
    body: 'You successfully subscribed to our notifications service!',
    // Icon appears on the right or left side of the pop-up notification
    icon: '/src/images/icons/app-icon-96x96.png',
    // Image unlike icon is part of the body content
    image: '/src/images/sf-boat.jpg',
    // Text direction (ltr is default)
    dir: 'ltr',
    // Set up for language that is BCP 47 compliant
    lang: 'en-US',
    // Vibration with pause in ms, 100ms vibration 50ms pause and then another
    // 200ms vibration and so on...
    vibrate: [100, 50, 200, 50, 100],
    // What appears as an "icon" besides the notification on the toolbar on
    // mobile devices. The badge recommended size is 96x96 and it will
    // automatically be updated into black and white color.
    badge: '/src/images/icons/app-icon-96x96.png',
    // Tag acts as an id for the notification, if more than one notification
    // is sent to the device, having the same tag will make the notifications
    // stack. The latest notification will be shown last.
    tag: 'confirm-notification',
    // Even if we use a tag and the same type of notification is sent to the
    // device renotify will make the device vibrate again if set to true.
    renotify: true,
    // PS: the tag and renotify as options together are like an anti spam method
    actions: [
      // The device might not support actions (buttons) or might support up to 2
      {
        // Id
        action: 'confirm',
        // Text displayed
        title: 'Ok',
        icon: '/src/images/icons/app-icon-96x96.png'
      },
      {
        // Id
        action: 'cancel',
        // Text displayed
        title: 'Cancel',
        icon: '/src/images/icons/app-icon-96x96.png'
      }
    ]
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function(sw) {
      console.log('Notifications subscription from SW')
      sw.showNotification('Successfully subscribed!', options)
    })
  } else {
    new Notification('Successfully subscribed!', options)
  }
}

// Push notification subscription
function configurePushSubscription() {
  if (!('serviceWorker' in navigator)) {
    return
  }
  var swReg
  navigator.serviceWorker.ready
    .then(function(sw) {
      swReg = sw
      // Check if this service worker for this browser has active subscription
      return sw.pushManager.getSubscription()
    })
    .then(function(sub) {
      if (sub === null) {
        // Create new subscription
        // The Push API Endpoint can't be set here because it would be a security
        // issue. That is why we use VAPID with WebPush
        // https://blog.mozilla.org/services/2016/04/04/using-vapid-with-webpush/
        // We generate 2 keys as private and public combination, the private goes
        // on the application server and the public is used in the JavaScript code
        // This way someone would need to hack the server in order to start
        // sending push notifications.
        var convertedKey = urlBase64ToUint8Array(vapidPublicKey)
        return swReg.pushManager.subscribe({
          // Only this user can see the specific push notification
          userVisibleOnly: true,
          // Set the vapid public key
          applicationServerKey: convertedKey
        })
      } else {
        // Active subscription available
      }
    })
    .then(function(newSub) {
      // POST new subscriptions to subs table
      return fetch(dbUrl + 'subs.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(newSub)
      })
    })
    .then(function(res) {
      if (res.ok) {
        displayNotification()
      }
    })
    .catch(function(err) {
      console.log('Subscription failed', err)
    })
}

function askForPermission() {
  // This function asks for permission to send basic notifications and push
  // notifications
  Notification.requestPermission(function(result) {
    if (result !== 'granted') {
      console.log('No permission granted!')
    } else {
      // displayNotification()
      configurePushSubscription()
    }
  })
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  for (var i = 0; i < btnsEnableNotifications.length; i++) {
    btnsEnableNotifications[i].addEventListener('click', askForPermission)
  }
}
