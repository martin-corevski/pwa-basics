var shareImageButton = document.querySelector('#share-image-button')
var createPostArea = document.querySelector('#create-post')
var closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
)
var sharedMomentsArea = document.querySelector('#shared-moments')

function openCreatePostModal() {
  createPostArea.style.display = 'block'
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

// Set your firebase url, add .json at the end
var getUrl = ''
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

if ('caches' in window) {
  caches
    .match(getUrl)
    .then(function(res) {
      if (res) {
        return res.json()
      }
    })
    .then(function(data) {
      console.log('From cache', data)
      // Don't override the data received from network with the one from cache
      if (!netDataReceived) {
        updateUI(data)
      }
    })
}
