const functions = require('firebase-functions')
var admin = require('firebase-admin')
var cors = require('cors')({ origin: true })
var webpush = require('web-push')
// var formidable = require('formidable')
// node js package, working with files
var fs = require('fs')
var Busboy = require('busboy')
var os = require('os')
var path = require('path')
var UUID = require('uuid-v4')

// Set your firebase db url, project id and storage url
var dbUrl = ''
var projectId = ''
var storageUrl = ''

// Set your generated vapid public and private keys
var vapidPublicKey = ''
var vapidPrivateKey = ''

// Set your firebase db url and service account key
var serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: dbUrl
})

// Google cloud storage config, keyFilename is the same one used for serviceAccount
var gcConfig = {
  projectId: projectId,
  keyFilename: 'serviceAccountKey.json'
}

var gcs = require('@google-cloud/storage')(gcConfig)

exports.storePostData = functions.https.onRequest(function(request, response) {
  cors(request, response, function() {
    // Creating public url for storage files
    var uuid = UUID()

    const busboy = new Busboy({ headers: request.headers })
    // These objects will store the values (file + fields) extracted from busboy
    let upload
    const fields = {}

    // This callback will be invoked for each file uploaded
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log(
        `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      )
      const filepath = path.join(os.tmpdir(), filename)
      upload = { file: filepath, type: mimetype }
      file.pipe(fs.createWriteStream(filepath))
    })

    // This will invoked on every field detected
    busboy.on('field', function(
      fieldname,
      val,
      fieldnameTruncated,
      valTruncated,
      encoding,
      mimetype
    ) {
      fields[fieldname] = val
    })

    // This callback will be invoked after all uploaded files are saved.
    busboy.on('finish', () => {
      // Permanently move the file in a bucket (on storage)
      var bucket = gcs.bucket(storageUrl)
      // As second argument we pass configuration for the file
      bucket.upload(
        upload.file,
        {
          uploadType: 'media',
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        function(err, uploadedFile) {
          if (!err) {
            console.log('File uploaded to the storage')
            admin
              .database()
              .ref('posts')
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                image:
                  'https://firebasestorage.googleapis.com/v0/b/' +
                  bucket.name +
                  '/o/' +
                  encodeURIComponent(uploadedFile.name) +
                  '?alt=media&token=' +
                  uuid
              })
              .then(function() {
                // The first argument is an email address to identify yourself, set your
                // address, example 'mailto:my-email@address.com'
                webpush.setVapidDetails(
                  'mailto:',
                  vapidPublicKey,
                  vapidPrivateKey
                )
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
                  .json({ message: 'Data stored', id: fields.id })
              })
              .catch(function(err) {
                response.status(500).json({ error: 'Error!' + err })
              })
          } else {
            console.log('File upload to the storage failed: ', err)
          }
        }
      )
    })
    // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
    // a callback when it's finished.
    busboy.end(request.rawBody)

    // // In order to extract the POST data we use formidable
    // var formData = new formidable.IncomingForm()
    // formData.parse(request, function(err, fields, files) {
    //   // Setting up the new path of the sent file (defined in sw) to tmp/ which
    //   // is made available by google cloud storage
    //   var filename = '/tmp/' + files.file.name
    //   fs.rename(files.file.path, filename)
    // })
  })
})
