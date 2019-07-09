const express = require('express')
const router = express.Router()
const logger = require('../models/logger')
const db = require('../models/mongodb')

// get single vertical
router.get('/:id', async function (req, res, next) {
  const username = req.user ? req.user.username : 'anonymous'
  const clientIp = req.clientIp
  const method = req.method
  const host = req.get('host')
  const path = req.originalUrl
  const url = req.protocol + '://' + host + path
  const operation = 'get vertical'
  const query = req.query

  console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'requested with query', query)

  try {
    // get vertical ID from URL
    const id = req.params.id
    // remove _id from results
    const projection = {_id: 0}
    // get vertical from cloud mongo db
    const vertical = await db.findOne('cumulus', 'vertical', {id}, {projection})
    if (vertical) {
      // get meta info about the response
      const dataType = 'object'
      const dataLength = Object.keys(vertical).length
      console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'successful')
      // log it to db
      logger.log({clientIp, host, path, url, method, operation, username, status: 200, details: 'get vertical successful', params: req.params, response: `(JSON ${dataType} with ${dataLength} properties)`})
      // return HTTP response
      return res.status(200).send(vertical)
    } else {
      const response = 'vertical with id = "' + id + '" not found.'
      // vertical not found
      console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'failed', response)
      // log it to db
      logger.log({clientIp, host, path, url, method, operation, username, status: 404, details: 'get vertical failed', params: req.params, response})
      // return HTTP response
      return res.status(404).send(response)
    }
  } catch (e) {
    // failed on secondary also
    console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'error', e.message)
    // log error to db
    logger.log({level: 'error', clientIp, host, path, url, method, operation, username, status: 500, details: 'get vertical failed', params: req.params, response: e.message})
    return res.status(500).send(e.message)
  }
})

// get verticals list
router.get('/', async function (req, res, next) {
  const username = req.user ? req.user.username : 'anonymous'
  // const password = body.password
  const clientIp = req.clientIp
  const method = req.method
  const host = req.get('host')
  const path = req.originalUrl
  const url = req.protocol + '://' + host + path
  const operation = 'get verticals'
  const query = req.query

  console.log('user', username, 'at IP', req.clientIp, operation, 'requested with query', query)

  try {
    // get only id, name, owner fields
    const projection = {id: 1, name: 1, owner: 1}
    // get vertical from cloud mongo db
    const verticals = await db.find('cumulus', 'vertical', {}, projection)
    // get meta info about the response
    const dataType = 'array'
    const dataLength = verticals.length
    console.log('user', username, 'at IP', req.clientIp, 'get verticals', 'successful')
    // log it to db
    logger.log({clientIp, host, path, url, method, operation, username, status: 200, details: 'get verticals successful', params: req.params, query, response: `(JSON ${dataType} with ${dataLength} properties)`})
    // return HTTP response
    return res.status(200).send(verticals)
  } catch (error) {
    console.log('user', username, 'at IP', req.clientIp, 'get verticals', 'error:', error.message)
    // log error to db
    logger.log({level: 'error', clientIp, host, path, url, method, operation, username, status: 500, details: 'get verticals failed', query, response: error.message})
    // return HTTP response
    return res.status(500).send(error.message)
  }
})

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function cleanId (id) {
  let ret
  // force ID to be lower-case
  ret = id.toLowerCase()
  // replace spaces with hyphens, and remove all other non-alphanumerics
  ret = id.replace(/ /g, '-').replace(/[^a-zA-Z0-9_-]+/g, '')
  return ret
}

// save vertical
router.put('/:id', async function (req, res, next) {
  const username = req.user.username
  const clientIp = req.clientIp
  const method = req.method
  const host = req.get('host')
  const path = req.originalUrl
  const url = req.protocol + '://' + host + path
  const operation = 'save vertical'
  // sanitize input
  let id = cleanId(req.params.id)
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
  } else if (req.user.admin === true) {
    // admins are allowed to update any vertical
    allow = true
    // but don't change the owner
  } else if (vertical.owner === req.user.username) {
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
    logger.log({clientIp, host, path, url, method, operation, username, status: 403, details: message, params: req.params, response: message})
    return res.status(403).send(message)
  }

  // else, user is allowed to save vertical. continue.
  // set vertical.id = request URL parameter for vertical ID
  req.body.id = id

  // make sure a regular user is not able to save a vertical as "system"
  if ((req.body.owner === 'system' || !req.body.owner) && req.user.admin !== true) {
    //
    const message = `You are not authorized to save a vertical without your username as the owner."`
    console.log('user', username, 'at IP', req.clientIp, operation, id, `'failed - user trying to save as owner = system."`)
    logger.log({clientIp, host, path, url, method, operation, username, status: 403, details: req.body, params: req.params, response: message})
    return res.status(403).send(message)
  }

  try {
    // update or insert the data in the cloud mongo database
    await db.upsert('cumulus', 'vertical', {id}, req.body)
    console.log('user', username, 'at IP', req.clientIp, operation, id, 'successful')
    resultMessage = 'Successfully saved vertical config.'
    // log it to db
    logger.log({clientIp, host, path, url, method, operation, username, status: 202, details: resultMessage, params: req.params, response: resultMessage})
    // return HTTP response
    return res.status(202).send(resultMessage)
  } catch (e) {
    console.log('user', username, 'at IP', req.clientIp, operation, id, 'failed:', e.message)
    resultMessage = 'Failed to save vertical config.'
    // log it to db
    logger.log({clientIp, host, path, url, method, operation, username, status: 500, details: resultMessage, params: req.params, response: e.message})
    // return HTTP response
    return res.status(500).send(e.message)
  }
})

// delete vertical
router.delete('/:id', async function (req, res, next) {
  const username = req.user.username
  const clientIp = req.clientIp
  const method = req.method
  const host = req.get('host')
  const path = req.originalUrl
  const url = req.protocol + '://' + host + path
  const operation = 'delete vertical'
  const params = req.params
  // sanitize input
  let id = cleanId(params.id)

  console.log('user', username, 'at IP', req.clientIp, operation, params, 'requested')
  // check that this user owns the vertical in question, or that this vertical ID does not exist

  try {
    const projection = {id: 1, owner: 1}
    const vertical = await db.findOne('cumulus', 'vertical', {id}, {projection})
    // check if found
    if (!vertical) {
      // return 404
      const response = 'vertical with id = "' + id + '" not found.'
      // vertical not found
      console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'failed', response)
      // log it to db
      logger.log({clientIp, host, path, url, method, operation, username, status: 404, params: req.params, response})
      // return HTTP response
      return res.status(404).send(response)
    }
    // store a copy of the current owner. undefined owner = system
    let owner = vertical.owner || 'system'

    let allow = false
    if (vertical.owner === req.user.username) {
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
      console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, `'failed - not authorized. It is owned by "${owner}"`)
      logger.log({clientIp, host, path, url, method, operation, username, status: 403, details: message, params: req.params, response: message})
      return res.status(403).send(message)
    }
    // else, user is allowed to delete vertical. continue.
    // remove from cloud mongo db
    await db.removeOne('cumulus', 'vertical', {id})
    console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'successful')
    // log it to db
    logger.log({clientIp, host, path, url, method, operation, username, status: 202, params: req.params})
    // return HTTP response
    return res.status(202).send()
  } catch (e) {
    console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'failed:', e.message)
    // log it to db
    logger.log({clientIp, host, path, url, method, operation, username, status: 500, params: req.params, response: e.message})
    // return HTTP response
    return res.status(500).send(e.message)
  }
})

module.exports = router
