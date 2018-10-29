const MongoClient = require('mongodb').MongoClient

const url = process.env.MONGO_URL
const options = { useNewUrlParser: true }

function find (db, collection, query) {
  return new Promise((resolve, reject) => {
    try {
      MongoClient.connect(url, options, function(connectError, client) {
        if (connectError) return reject(connectError)
        client.db(db).collection(collection).find(query).toArray(function (queryError, result) {
          if (queryError) reject(queryError)
          else resolve(result)
          client.close()
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}

function findOne (db, collection, query) {
  return new Promise((resolve, reject) => {
    try {
      MongoClient.connect(url, options, function(connectError, client) {
        if (connectError) return reject(connectError)
        client.db(db).collection(collection).findOne(query, function (queryError, result) {
          if (queryError) reject(queryError)
          else resolve(result)
          client.close()
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}

function upsert (db, collection, query, data) {
  return new Promise((resolve, reject) => {
    try {
      MongoClient.connect(url, options, function(connectError, client) {
        if (connectError) return reject(connectError)
        client.db(db).collection(collection).findOneAndReplace(
          query,
          data,
          { upsert: true },
          function(queryError, doc) {
            if (queryError) reject(queryError)
            else resolve(doc)
            client.close()
          }
        )
      })
    } catch (e) {
      return reject(e)
    }
  })
}

function update (db, collection, query, data, field) {
  return new Promise((resolve, reject) => {
    try {
      MongoClient.connect(url, options, function(connectError, client) {
        if (connectError) return reject(connectError)
        client.db(db).collection(collection).update(
          query,
          { $set: { [field]: data } },
          { upsert: true },
          function(queryError, doc) {
            if (queryError) reject(queryError)
            else resolve(doc)
            client.close()
          }
        )
      })
    } catch (e) {
      reject(e)
    }
  })
}

function addToSet (db, collection, query, data, field) {
  return new Promise((resolve, reject) => {
    try {
      MongoClient.connect(url, options, function(connectError, client) {
        if (connectError) return reject(connectError)
        client.db(db).collection(collection).update(
          query,
          { $addToSet: { [field]: data } },
          { upsert: true },
          function(queryError, doc) {
            if (queryError) reject(queryError)
            else resolve(doc)
            client.close()
          }
        )
      })
    } catch (e) {
      reject(e)
    }
  })
}

function insertOne (db, collection, data) {
  return new Promise((resolve, reject) => {
    try {
      MongoClient.connect(url, options, function(connectError, client) {
        if (connectError) return reject(connectError)
        client.db(db).collection(collection).insertOne(
          data,
          function(queryError, doc) {
            if (queryError) reject(queryError)
            else resolve(doc)
            client.close()
          }
        )
      })
    } catch (e) {
      reject(e)
    }
  })
}

function remove (db, collection, query) {
  return new Promise((resolve, reject) => {
    try {
      MongoClient.connect(url, options, function(connectError, client) {
        if (connectError) return reject(connectError)
        client.db(db).collection(collection).remove(
          query,
          function(queryError, doc) {
            if (queryError) reject(queryError)
            else resolve(doc)
            client.close()
          }
        )
      })
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = {
  find,
  findOne,
  update,
  upsert,
  insertOne,
  remove,
  addToSet
}
