const functions = require('firebase-functions')
var admin = require('firebase-admin')
var cors = require('cors')({ origin: true })
var serviceAccount = require('./serviceAccountKey.json')

// Set your firebase db url and service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: ''
})

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
        response
          .status(201)
          .json({ message: 'Data stored', id: request.body.id })
      })
      .catch(function(err) {
        response.status(500).json({ error: 'Error!' + err })
      })
  })
})
