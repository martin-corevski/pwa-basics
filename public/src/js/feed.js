var shareImageButton = document.querySelector('#share-image-button')
var createPostArea = document.querySelector('#create-post')
var closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
)

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
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none'
}

shareImageButton.addEventListener('click', openCreatePostModal)

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal)
