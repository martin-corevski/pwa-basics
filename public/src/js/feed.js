var shareImageButton = document.querySelector('#share-image-button')
var createPostArea = document.querySelector('#create-post')
var closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
)
var sharedMomentsArea = document.querySelector('#shared-moments')
var form = document.querySelector('form')
var inputTitle = document.querySelector('#title')
var inputLocation = document.querySelector('#location')
var manLocation = document.querySelector('#manual-location')

var videoPlayer = document.querySelector('#player')
var canvasElement = document.querySelector('#canvas')
var btnCapture = document.querySelector('#capture-btn')
var imagePicker = document.querySelector('#image-picker')
var imagePickerArea = document.querySelector('#pick-image')
var picture
var btnLocation = document.querySelector('#location-btn')
var loaderLocation = document.querySelector('#location-loader')
var fetchedLocation = { lat: 0, lng: 0 }
var sawAlert

// Set your firebase url, add .json at the end
var getUrl = ''
// Set your firebase functions url
var postUrl = ''

///////////////////////
// Camera management //
///////////////////////

function initializeMedia() {
  // under mediaDevices are camera, mic...
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {}
  }

  // fallback/polyfill code
  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      // Get the native safari or mozilla user media
      var getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia

      if (!getUserMedia) {
        // return promise because of the new getUserMedia returns Promise and
        // we are trying to recreate th getUserMedia property even for browsers
        // that don't support it yet but have some way of using the devices
        // media.
        return Promise.reject(new Error('getUserMedia is not supported!'))
      }

      return new Promise(function(resolve, reject) {
        // This way we are making use of the safari and mozilla media usage
        // implementation.
        getUserMedia.call(navigator, constraints, resolve, reject)
      })
    }
  }

  // Now that we always have mediaDevices and getUserMedia available, even in
  // older browsers we can access video and audio of the device. Permission is
  // granted by the user when this function is executed. The user can either
  // accept or reject sharing the camera or microphone or both. Once permission
  // is granted the user won't get the notification again.
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function(stream) {
      // User accepted.
      videoPlayer.srcObject = stream
      videoPlayer.style.display = 'block'
    })
    .catch(function(err) {
      // The user rejected, browser doesn't support or the device doesn't have
      // camera. Now we fallback to the image picker.
      imagePickerArea.style.display = 'block'
    })
}

btnCapture.addEventListener('click', function(event) {
  // Reveal the canvas and hide the video player with the button.
  canvasElement.style.display = 'block'
  videoPlayer.style.display = 'none'
  btnCapture.style.display = 'none'
  // Set the captured video on the canvas.
  var context = canvasElement.getContext('2d')
  context.drawImage(
    videoPlayer,
    0,
    0,
    canvasElement.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width)
  )
  // Stop the camera.
  videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
    track.stop()
  })
  // Prepare the picture for upload.
  picture = dataURItoBlob(canvasElement.toDataURL())
})

imagePicker.addEventListener('change', function(event) {
  picture = event.target.files[0]
})

///////////////////////////
// Camera management end //
///////////////////////////

/////////////////
// Geolocation //
/////////////////

function initializeLocation() {
  if (!('geolocation' in navigator)) {
    btnLocation.style.display = 'none'
  }
}

btnLocation.addEventListener('click', function(event) {
  if (!('geolocation' in navigator)) {
    return
  }

  btnLocation.style.display = 'none'
  loaderLocation.style.display = 'block'

  // The user gets automatic prompt to allow or deny location feature
  navigator.geolocation.getCurrentPosition(
    function(position) {
      console.log('getCurrentPosition obtained the position ', position)
      btnLocation.style.display = 'inline'
      loaderLocation.style.display = 'none'
      fetchedLocation = { lat: position.coords.latitude, lng: 0 }
      inputLocation.value = 'On the moon'
      manLocation.classList.add('is-focused')
    },
    function(err) {
      console.log('Error on getCurrentPosition ', err)
      btnLocation.style.display = 'inline'
      loaderLocation.style.display = 'none'
      if (!sawAlert) {
        alert(`Can't fetch location, please use manual input.`)
        sawAlert = true
      }
      fetchedLocation = { lat: 0, lng: 0 }
    },
    {
      // How long we should be trying to obtain the device location
      timeout: 7000
    }
  )
})

/////////////////////
// Geolocation end //
/////////////////////

function openCreatePostModal() {
  createPostArea.style.display = 'block'
  initializeMedia()
  initializeLocation()
  // Handle when the app install banner appears
  if (defferedPrompt) {
    defferedPrompt.prompt()
    defferedPrompt.userChoice.then(function(res) {
      console.log(res.outcome)

      if (res.outcome === 'dismissed') {
        console.log('User cancelled installation')
      } else {
        console.log('App added to home screen')
      }
    })

    defferedPrompt = null
  }

  // Unregistering service worker
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations().then(function(regs) {
  //     for (var i = 0; i < regs.length; i++) {
  //       regs[i].unregister()
  //     }
  //   })
  // }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none'
  btnCapture.style.display = 'inline'
  videoPlayer.style.display = 'none'
  imagePickerArea.style.display = 'none'
  canvasElement.style.display = 'none'
  btnLocation.style.display = 'inline'
  loaderLocation.style.display = 'none'

  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
      track.stop()
    })
  }
}

shareImageButton.addEventListener('click', openCreatePostModal)

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal)

// Not in use, in order to use it comment out the dynamic caching
function onButtonSaveClick(event) {
  console.log('btn save clicked')
  // Cache user created card if it failed to save because of loss of internet
  // connection
  if ('caches' in window) {
    // Open or create user specific cache
    caches.open('user-created').then(function(cache) {
      cache.add('https://httpbin.org/get')
      cache.add('/src/images/sf-boat.jpg')
    })
  }
}

// since createCard appends dom elements we need to clear the sharedMomentsArea
function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div')
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp'
  cardWrapper.style.margin = 'auto'
  var cardTitle = document.createElement('div')
  cardTitle.className = 'mdl-card__title'
  cardTitle.style.backgroundImage = 'url(' + data.image + ')'
  cardTitle.style.backgroundSize = 'cover'
  cardTitle.style.height = '180px'
  cardWrapper.appendChild(cardTitle)
  var cardTitleTextElement = document.createElement('h2')
  cardTitleTextElement.style.color = 'white'
  cardTitleTextElement.className = 'mdl-card__title-text'
  cardTitleTextElement.textContent = data.title
  cardTitle.appendChild(cardTitleTextElement)
  var cardSupportingText = document.createElement('div')
  cardSupportingText.className = 'mdl-card__supporting-text'
  cardSupportingText.textContent = data.location
  cardSupportingText.style.textAlign = 'center'
  // Not in use uncomment if dynamic cache is disabled
  // var cardButtonSave = document.createElement('button')
  // cardButtonSave.textContent = 'Save'
  // cardButtonSave.addEventListener('click', onButtonSaveClick)
  // cardSupportingText.appendChild(cardButtonSave)
  cardWrapper.appendChild(cardSupportingText)
  componentHandler.upgradeElement(cardWrapper)
  sharedMomentsArea.appendChild(cardWrapper)
}

// POST data fallback function if SyncManager is not available
function sendData() {
  var postData = new FormData()
  var today = new Date().toISOString()
  postData.append('id', today)
  postData.append('title', inputTitle.value)
  postData.append('location', inputLocation.value)
  postData.append('rawLocationLat', fetchedLocation.lat)
  postData.append('rawLocationLng', fetchedLocation.lng)
  postData.append('file', picture, today + '.png')

  fetch(postUrl, {
    method: 'POST',
    body: postData
  }).then(function(res) {
    console.log('Data sent: ', res)
    // updateUI()
  })
}

form.addEventListener('submit', function(event) {
  event.preventDefault()
  if (inputTitle.value.trim() === '' || inputLocation.value.trim() === '') {
    window.alert('Please enter valid data.')
    return
  }

  closeCreatePostModal()

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(function(sw) {
      // Set the POST data to be synced
      var post = {
        id: new Date().toISOString(),
        title: inputTitle.value,
        location: inputLocation.value,
        picture: picture,
        rawLocation: fetchedLocation
      }
      // Keep the POST data in indexedDB in specific Object store
      writeData('sync-posts', post)
        .then(function() {
          // Register a sync task with the service worker, the only argument is
          // id (event.tag) by which we will do the synchronization in the
          // service worker once we get online again.
          return sw.sync.register('sync-new-post')
        })
        .then(function() {
          var snackbarContainer = document.querySelector('#confirmation-toast')
          var data = { message: 'Post saved for sync!' }
          snackbarContainer.MaterialSnackbar.showSnackbar(data)
        })
        .catch(function(err) {
          console.log('Sync error', err)
        })
    })
  } else {
    // Fallback for browsers that don't support Background Sync i.e. SyncManager
    sendData()
  }
})

function createCards(data) {
  clearCards()
  for (var i = 0; i < data.length; i++) {
    createCard(data[i])
  }
}

function updateUI(data) {
  var cards = []
  for (var card in data) {
    cards.push(data[card])
  }
  createCards(cards)
}

//////////////////////////////////////////
// STRATEGY: CACHE THEN NETWORK updates //
//////////////////////////////////////////

var netDataReceived = false

fetch(getUrl)
  .then(function(res) {
    return res.json()
  })
  .then(function(data) {
    netDataReceived = true
    console.log('From network', data)
    updateUI(data)
  })

if ('indexedDB' in window) {
  readAllData('posts').then(function(data) {
    if (!netDataReceived) {
      console.log('From cache idb: ', data)
      updateUI(data)
    }
  })
}
// if ('caches' in window) {
//   caches
//     .match(getUrl)
//     .then(function(res) {
//       if (res) {
//         return res.json()
//       }
//     })
//     .then(function(data) {
//       console.log('From cache', data)
//       // Don't override the data received from network with the one from cache
//       if (!netDataReceived) {
//         updateUI(data)
//       }
//     })
// }
