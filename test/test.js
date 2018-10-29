require('dotenv').load()
const mongodb = require('../src/models/mongodb')

// mongodb.insertOne('toolbox', 'users', {username: 'ccondry@cisco.com', password: 'test1234'})
// .then(r => {
//   console.log('success', r.insertedId)
// })
// .catch(e => {
//   console.log('failed', e)
// })

mongodb.find('toolbox', 'users', {})
.then(r => {
  console.log('success', r)
})
.catch(e => {
  console.log('failed', e)
})
