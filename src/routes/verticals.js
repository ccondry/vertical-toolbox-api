const express = require('express')
const router = express.Router()
const request = require('request-promise-native')
const logger = require('../models/logger')

const mmApi1 = process.env.MM_API_1
const mmApi2 = process.env.MM_API_2

// get single vertical
router.get('/:id', async function (req, res, next) {
  const username = req.user.username
  const clientIp = req.clientIp
  const method = req.method
  const host = req.get('host')
  const path = req.originalUrl
  const url = req.protocol + '://' + host + path
  const operation = 'get vertical'

  console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'requested')

  const options = {
    baseUrl: process.env.MM_API_1,
    url: '/verticals/' + req.params.id,
    method: 'GET',
    // qs: req.query,
    json: true
  }

  try {
    // try mm
    const response = await request(options)
    console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'successful on primary server')

    // get meta info about the response
    let dataType
    let dataLength
    if (Array.isArray(response)) {
      // array
      dataType = 'array'
      dataLength = response.length
    } else {
      // object
      dataType = 'object'
      dataLength = Object.keys(response).length
    }

    // log it to db
    logger.log({clientIp, host, path, url, method, operation, username, status: 200, details: 'get vertical successful on primary server', parameters: req.params, response: `(JSON ${dataType} with ${dataLength} properties)`})
    // return HTTP response
    return res.status(200).send(response)
  } catch (error) {
    console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'error', error.statusCode, 'on primary server', error.message)
    // check if error was "not found"
    if (error.statusCode === 404) {
      // log it to db
      logger.log({clientIp, host, path, url, method, operation, username, status: 404, details: 'get vertical failed on primary server', parameters: req.params, response: `vertical with ID "${req.params.id}" was not found.`})
      // return the 404 not found
      return res.status(404).send(`vertical with ID "${req.params.id}" was not found.`)
    } else {
      // log the error to db
      logger.log({level: 'warn', clientIp, host, path, url, method, operation, username, status: error.statusCode, details: 'get vertical failed on primary server', parameters: req.params, response: error.message})
      // continue
    }
    try {
      // try mm-dev
      console.log('trying secondary server...')
      options.baseUrl = process.env.MM_API_2
      const response = await request(options)
      console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'successful on secondary server')

      // get meta info about the response
      let dataType
      let dataLength
      if (Array.isArray(response)) {
        // array
        dataType = 'array'
        dataLength = response.length
      } else {
        // object
        dataType = 'object'
        dataLength = Object.keys(response).length
      }

      // log it to db
      logger.log({clientIp, host, path, url, method, operation, username, status: 200, details: 'get vertical successful on primary server', parameters: req.params, response: `(JSON ${dataType} with ${dataLength} properties)`})
      // return HTTP response
      return res.status(200).send(response)
    } catch (e2) {
      // failed on secondary also
      console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'error', e2.statusCode, 'on secondary server', e2.message)
      // check if error was "not found"
      if (e2.statusCode === 404) {
        // log it to db
        logger.log({clientIp, host, path, url, method, operation, username, status: 404, details: 'get vertical failed on secondary server', parameters: req.params, response: `vertical with ID "${req.params.id}" was not found.`})
        // return the 404 not found
        return res.status(404).send(`vertical with ID "${req.params.id}" was not found.`)
      } else {
        // log warn to db
        logger.log({level: 'warn', clientIp, host, path, url, method, operation, username, status: e2.statusCode, details: 'get vertical failed on secondary server', parameters: req.params, response: e2.message})
        // log error to db
        logger.log({level: 'error', clientIp, host, path, url, method, operation, username, status: 500, details: 'get vertical failed on primary and secondary servers', parameters: req.params, response: error.message + ' \r\n ' + e2.message})
        // return HTTP response
        // return res.status(500).send(error.message + '/r/n' + e2.message)
        // return both error messages
        return res.status(500).send(error.message + ' \r\n ' + e2.message)
      }
    }
  }
})

// get verticals list
router.get('/', async function (req, res, next) {
  const username = req.user.username
  // const password = body.password
  const clientIp = req.clientIp
  const method = req.method
  const host = req.get('host')
  const path = req.originalUrl
  const url = req.protocol + '://' + host + path
  const operation = 'get verticals'

  console.log('user', username, 'at IP', req.clientIp, operation, 'requested')

  const options = {
    baseUrl: process.env.MM_API_1,
    url: '/verticals',
    method: 'GET',
    qs: req.query,
    json: true
  }

  try {
    // try mm
    const response = await request(options)
    console.log('user', username, 'at IP', req.clientIp, 'get verticals', 'successful on primary server')

    // get meta info about the response
    let dataType
    let dataLength
    if (Array.isArray(response)) {
      // array
      dataType = 'array'
      dataLength = response.length
    } else {
      // object
      dataType = 'object'
      dataLength = Object.keys(response).length
    }

    // log it to db
    logger.log({clientIp, host, path, url, method, operation, username, status: 200, details: 'get verticals successful on primary server', queryString: req.query, response: `(JSON ${dataType} with ${dataLength} properties)`})
    // return HTTP response
    return res.status(200).send(response)
  } catch (error) {
    console.log('user', username, 'at IP', req.clientIp, 'get verticals', 'error', error.statusCode, 'on primary server', error.message)
    // log the error to db
    logger.log({level: 'warn', clientIp, host, path, url, method, operation, username, status: error.statusCode, details: 'get verticals failed on primary server', queryString: req.query, response: error.message})
    try {
      // try mm-dev
      console.log('trying secondary server...')
      options.baseUrl = process.env.MM_API_2
      const response = await request(options)
      console.log('user', username, 'at IP', req.clientIp, 'get verticals', 'successful on secondary server')

      // get meta info about the response
      let dataType
      let dataLength
      if (Array.isArray(response)) {
        // array
        dataType = 'array'
        dataLength = response.length
      } else {
        // object
        dataType = 'object'
        dataLength = Object.keys(response).length
      }

      // log it to db
      logger.log({clientIp, host, path, url, method, operation, username, status: 200, details: 'get verticals successful on primary server', queryString: req.query, response: `(JSON ${dataType} with ${dataLength} properties)`})
      // return HTTP response
      return res.status(200).send(response)
    } catch (e2) {
      // failed on secondary also
      console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'error', e2.statusCode, 'on secondary server', e2.message)
      // log warn to db
      logger.log({level: 'warn', clientIp, host, path, url, method, operation, username, status: e2.statusCode, details: 'get verticals failed on secondary server', queryString: req.query, response: e2.message})
      // log error to db
      logger.log({level: 'error', clientIp, host, path, url, method, operation, username, status: 500, details: 'get verticals failed on primary and secondary servers', queryString: req.query, response: error.message + ' \r\n ' + e2.message})
      // return HTTP response
      // return res.status(500).send(error.message + '/r/n' + e2.message)
      // return both error messages
      return res.status(500).send(error.message + ' \r\n ' + e2.message)
    }
  }
})

// try primary
// const file = await request({
//   url: process.env.api_base_primary + '/' + path + '/' + req.params.ani,
//   headers: {Authorization: `Bearer ${process.env.jwt_token}`},
//   json: true
// })

// save vertical
router.put('/:id', async function (req, res, next) {
  const username = req.user.username
  const clientIp = req.clientIp
  const method = req.method
  const host = req.get('host')
  const path = req.originalUrl
  const url = req.protocol + '://' + host + path
  const operation = 'save vertical'

  console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'requested')

  // check that this user owns the vertical in question, or that this vertical ID does not exist
  const options = {
    baseUrl: process.env.MM_API_1,
    url: '/verticals/' + req.params.id,
    method: 'GET',
    json: true
  }

  let allow = false
  let owner = 'system'
  try {
    // try to get from primary
    const response = await request(options)
    if (response.owner === req.user.username) {
      // this user owns this vertical
      allow = true
    } else {
      // user does not own this vertical
      // store a copy of the current owner. undefined owner = system
      owner = response.owner || 'system'
    }
  } catch (e) {
    if (e.statusCode === 404) {
      // does not exist yet, so allow user to save database
      allow = true
    } else {
      // try secondary
      options.baseUrl = process.env.MM_API_2
      try {
        const response = await request(options)
        if (response.owner === req.user.username) {
          // this user owns this vertical
          allow = true
        } else {
          // user does not own this vertical
          // store a copy of the current owner. undefined owner = system
          owner = response.owner || 'system'
        }
      } catch (e2) {
        if (e2.statusCode === 404) {
          // does not exist yet, so allow user to save data
          allow = true
        } else {
          // return any other error code to the client
          return res.status(e.statusCode || e2.statusCode).send(e.message + ' \r\n ' + e2.message)
        }
      }
    }
  }

  if (!allow) {
    // user is not allowed to update this vertical
    const message = `You are not authorized to update this vertical. It is owned by "${owner}"`
    console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, `'failed - not authorized. It is owned by "${owner}"`)
    logger.log({clientIp, host, path, url, method, operation, username, status: 403, details: message, parameters: req.params, response: message})
    return res.status(403).send(message)
  }
  // else, user is allowed to save vertical. continue.
  // set id and owner in request body
  req.body.id = req.params.id
  req.owner = req.user.username

  // set up request options for saving data on primary
  options.baseUrl = process.env.MM_API_1
  options.method = 'PUT'
  options.headers = {Authorization: `Bearer ${process.env.MM_TOKEN}`},
  options.body = req.body

  let primarySuccess
  let secondarySuccess
  // update primary
  try {
    await request(options)
    console.log('user', username, 'at IP', req.clientIp, 'save vertical', req.params.id, 'successful on primary server')
    primarySuccess = true
  } catch (e) {
    console.log('user', username, 'at IP', req.clientIp, 'save vertical', req.params.id, 'failed on primary server', e.message)
    primarySuccess = false
  }

  // and also update secondary
  try {
    // set base URL to secondary
    options.baseUrl = process.env.MM_API_2
    await request(options)
    console.log('user', username, 'at IP', req.clientIp, 'save vertical', req.params.id, 'successful on secondary server')
    secondarySuccess = true
  } catch (e) {
    console.log('user', username, 'at IP', req.clientIp, 'save vertical', req.params.id, 'failed on secondary server', e.message)
    secondarySuccess = false
  }

  let resultMessage
  if (primarySuccess && secondarySuccess) {
    resultMessage = 'Successfully saved vertical config on the primary and secondary servers.'
    status = 202
  } else if (primarySuccess) {
    // secondary failed
    resultMessage = 'Successfully saved vertical config on the primary server, but failed to save config on the secondary server.'
    status = 202
  } else if (secondarySuccess) {
    // primary failed
    resultMessage = 'Successfully saved vertical config on the secondary server, but failed to save config on the primary server.'
    status = 202
  } else {
    // both failed
    resultMessage = 'Failed to save vertical config on the primary and secondary servers.'
    status = 500
  }

  // log it to db
  logger.log({clientIp, host, path, url, method, operation, username, status, details: resultMessage, parameters: req.params, response: resultMessage})
  // return HTTP response
  return res.status(status).send(resultMessage)
})

module.exports = router
