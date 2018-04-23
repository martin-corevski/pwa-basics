// navigator === browser
if ('serviceWorker' in navigator) {
  // If service worker is available in the browser, register it
  navigator.serviceWorker.register('/sw.js').then(function() {
    console.log('Service worker registered!')
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
