const functions = require('firebase-functions')
var admin = require('firebase-admin')
var cors = require('cors')({ origin: true })
var webpush = require('web-push')

// Set your firebase db url and service account key
var serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: ''
})

// Set your generated vapid public and private keys
var vapidPublicKey = ''
var vapidPrivateKey = ''

exports.storePostData = functions.https.onRequest(function(request, response) {
  cors(request, response, function() {
    admin
      .database()
      .ref('posts')
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image
      })
      .then(function() {
        // The first argument is an email address to identify yourself, set your
        // address, example 'mailto:my-email@address.com'
        webpush.setVapidDetails('mailto:', vapidPublicKey, vapidPrivateKey)
        // Get all subscriptions to push notifications from the database
        return admin
          .database()
          .ref('subs')
          .once('value')
      })
      .then(function(subs) {
        // Each sub will contain the endpoint and keys
        subs.forEach(function(sub) {
          var pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh
            }
          }
          // var pushConfig = sub.val() is also going to work, the longer version
          // is written just to show how to extract the data.
          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: 'New post',
                content: 'New post added',
                openUrl: '/help'
              })
            )
            .catch(function(err) {
              console.log('Push Notification error: ', err)
            })
        })
        response
          .status(201)
          .json({ message: 'Data stored', id: request.body.id })
      })
      .catch(function(err) {
        response.status(500).json({ error: 'Error!' + err })
      })
  })
})
