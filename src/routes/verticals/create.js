const db = require('../../models/mongodb')

// create new vertical
module.exports = async function (req, res, next) {
  const username = req.user.username
  const operation = 'create vertical'
  const name = req.body.name
  console.log('user', username, 'at IP', req.clientIp, operation, name, 'requested')

  req.body.owner = req.user.username
  req.body.ownerEmail = req.user.email
  // remove any IDs that the UI might provide - they will be generated
  delete req.body._id
  delete req.body.id

  try {
    // create data in the cloud mongo database
    const response = await db.insertOne('cumulus', 'vertical', req.body)
    console.log('user', username, 'at IP', req.clientIp, operation, 'successful', response.insertedId)
    // update id to = _id
    const filter = {
      _id: db.ObjectID(response.insertedId)
    }
    const updates = {
      $set: {
        id: response.insertedId.toString()
      }
    }
    await db.updateOne('cumulus', 'vertical', filter, updates)
    // return HTTP response with new ID
    return res.status(200).send({id: response.insertedId})
  } catch (e) {
    console.log('user', username, 'at IP', req.clientIp, operation, 'failed:', e.message)
    // return HTTP response
    return res.status(500).send(e.message)
  }
}
