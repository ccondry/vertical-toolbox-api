const db = require('../../models/mongodb')

// delete vertical
module.exports = async function (req, res, next) {
  const username = req.user.username
  // const clientIp = req.clientIp
  // const method = req.method
  // const host = req.get('host')
  // const path = req.originalUrl
  // const url = req.protocol + '://' + host + path
  const action = 'delete vertical'
  const params = req.params
  // sanitize input
  let id = req.params.id

  console.log('user', username, 'at IP', req.clientIp, action, params, 'requested')
  // check that this user owns the vertical in question, or that this vertical ID does not exist

  try {
    const projection = {id: 1, owner: 1}
    const vertical = await db.findOne('cumulus', 'vertical', {id}, {projection})
    // check if found
    if (!vertical) {
      // return 404
      const response = 'vertical with id = "' + id + '" not found.'
      // vertical not found
      console.log('user', username, 'at IP', req.clientIp, action, req.params.id, 'failed', response)
      // log it to db
      // logger.log({clientIp, host, path, url, method, operation, username, status: 404, params: req.params, response})
      // return HTTP response
      return res.status(404).send(response)
    }
    // store a copy of the current owner. undefined owner = system
    let owner = vertical.owner || 'system'

    let allow = false
    if (
      vertical.owner.toLowerCase() === req.user.username.toLowerCase() ||
      (vertical.ownerEmail && vertical.ownerEmail.toLowerCase() === req.user.email.toLowerCase())
    ) {
      // this user owns this vertical
      allow = true
    } else if (req.user.admin && owner !== 'system') {
      // admins are allowed to delete user-owned verticals but not system-owned ones
      allow = true
    } else {
      //
      allow = false
    }

    if (!allow) {
      // user is not allowed to delete this vertical
      const message = `You are not authorized to delete this vertical. It is owned by "${owner}"`
      console.log('user', username, 'at IP', req.clientIp, action, req.params.id, `'failed - not authorized. It is owned by "${owner}"`)
      // logger.log({clientIp, host, path, url, method, operation, username, status: 403, details: message, params: req.params, response: message})
      return res.status(403).send(message)
    }
    // else, user is allowed to delete vertical. continue.
    // remove from cloud mongo db
    await db.removeOne('cumulus', 'vertical', {id})
    console.log('user', username, 'at IP', req.clientIp, action, req.params.id, 'successful')
    // log it to db
    // logger.log({clientIp, host, path, url, method, operation, username, status: 202, params: req.params})
    // return HTTP response
    return res.status(202).send()
  } catch (e) {
    console.log('user', username, 'at IP', req.clientIp, action, req.params.id, 'failed:', e.message)
    // log it to db
    // logger.log({clientIp, host, path, url, method, operation, username, status: 500, params: req.params, response: e.message})
    // return HTTP response
    return res.status(500).send(e.message)
  }
}
