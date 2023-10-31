const db = require('../../models/mongodb')

// save vertical
module.exports = async function (req, res, next) {
  const username = req.user.username
  const operation = 'save vertical'
  // sanitize input
  const id = req.params.id
  console.log('user', username, 'at IP', req.clientIp, operation, id, 'requested')

  // check that this user owns the vertical in question, or that this vertical
  // ID does not exist

  // remove _id from vertical data retrieved from mongo
  const projection = {_id: 0}
  // look for existing vertical
  const vertical = await db.findOne('cumulus', 'vertical', {id}, projection)

  let allow = false
  if (!vertical) {
    // vertical does not exist - any user is allowed to create new
    allow = true
    // set vertical owner in vertical data to requesting user's username
    req.body.owner = req.user.username
    // set ownerEmail field
    req.body.ownerEmail = req.user.email
  } else if (req.user.admin === true) {
    // admins are allowed to update any vertical
    allow = true
    // but don't change the owner
  } else if (vertical.owner.toLowerCase() === req.user.username.toLowerCase()) {
    // vertical exists and requesting user owns this vertical
    allow = true
  } else if (vertical.ownerEmail && vertical.ownerEmail.toLowerCase() === req.user.email.toLowerCase()) {
    // vertical exists and requesting user owns this vertical
    allow = true
  } else {
    // vertical exists, user is not admin, and user does not own this vertical
    allow = false
  }
  
  if (!allow) {
    // user is not allowed to update this vertical
    const message = `You are not authorized to update this vertical. It is owned by "${vertical.owner}"`
    console.log('user', username, 'at IP', req.clientIp, operation, id, `'failed - not authorized. It is owned by "${vertical.owner}"`)
    // logger.log({clientIp, host, path, url, method, operation, username, status: 403, details: message, params: req.params, response: message})
    return res.status(403).send({message})
  }

  // else, user is allowed to save vertical. continue.
  // set vertical.id = request URL parameter for vertical ID
  req.body.id = id

  // make sure a regular user is not able to save a vertical as "system"
  if ((req.body.owner === 'system' || !req.body.owner) && req.user.admin !== true) {
    //
    const message = `You are not authorized to save a vertical without your username as the owner."`
    console.log('user', username, 'at IP', req.clientIp, operation, id, `'failed - user trying to save as owner = system."`)
    // logger.log({clientIp, host, path, url, method, operation, username, status: 403, details: req.body, params: req.params, response: message})
    return res.status(403).send({message})
  }

  try {
    // update or insert the data in the cloud mongo database
    await db.upsert('cumulus', 'vertical', {id}, req.body)
    console.log('user', username, 'at IP', req.clientIp, operation, id, 'successful')
    console.log(req.body)
    const message = 'Successfully saved vertical config.'
    // log it to db
    // logger.log({clientIp, host, path, url, method, operation, username, status: 202, details: resultMessage, params: req.params, response: resultMessage})
    // return HTTP response
    return res.status(202).send({message})
  } catch (e) {
    console.log('user', username, 'at IP', req.clientIp, operation, id, 'failed:', e.message)
    const message = 'Failed to save vertical config.'
    // log it to db
    // logger.log({clientIp, host, path, url, method, operation, username, status: 500, details: resultMessage, params: req.params, response: e.message})
    return res.status(500).send({message})
  }
}
