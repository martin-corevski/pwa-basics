// We give version number as a second argument when we open the database, the
// third argument is a function as a callback that gives access to the database.
var dbPromise = idb.open('posts-store', 1, function(db) {
  // Create object store called 'posts' if it's not already created.
  if (!db.objectStoreNames.contains('posts')) {
    // keyPath option by the docs
    // https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/createObjectStore
    // The key path to be used by the new object store. If empty or not specified,
    // the object store is created without a key path and uses out-of-line keys.
    // You can also pass in an array as a keyPath.
    db.createObjectStore('posts', { keyPath: 'id' })
  }
})

function writeData(st, data) {
  return dbPromise.then(function(db) {
    // With transaction we open the store and set the action to readonly, write or
    // readwrite.
    var tx = db.transaction(st, 'readwrite')
    // Open the store
    var store = tx.objectStore(st)
    // In firebase for each post we have a json like structure:
    // "some-post": {"id": "some-id", "title": "some title"...}
    // By setting the keyPath option on the store to 'id', we know
    // each data object (that we add to idb) to which post (from
    // our firebase) it's connected.
    store.put(data)
    // Close the transaction
    return tx.complete
  })
}

function readAllData(st) {
  return dbPromise.then(function(db) {
    var tx = db.transaction(st, 'readonly')
    var store = tx.objectStore(st)
    return store.getAll()
  })
}

function clearAllData(st) {
  return dbPromise.then(function(db) {
    var tx = db.transaction(st, 'readwrite')
    var store = tx.objectStore(st)
    // In order to delete everything we use clear.
    store.clear()
    // For single item we need to delete by id, this would be a separate function ofc.
    // store.delete(id)
    return tx.complete
  })
}