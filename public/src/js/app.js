var defferedPrompt

// navigator === browser
if ('serviceWorker' in navigator) {
  // If service worker is available in the browser, register it
  navigator.serviceWorker
    .register('/sw.js')
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
