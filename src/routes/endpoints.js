const express = require('express')
const router = express.Router()
const logger = require('../models/logger')

// get REST endpoint URLs
router.get('/', async function (req, res, next) {
  // const username = req.user.username
  const clientIp = req.clientIp
  const method = req.method
  const host = req.get('host')
  const path = req.originalUrl
  const url = req.protocol + '://' + host + path
  const operation = 'get endpoints'

  console.log('user', 'at IP', req.clientIp, operation, method, path, 'requested')
  let endpoints
  if (process.env.NODE_ENV === 'production') {
    endpoints = {
      login: '/api/v1/auth/login',
      logout: '/api/v1/auth/logout',
      verticals: '/api/v1/verticals/verticals',
      endpoints: '/api/v1/verticals/endpoints'
    }
  } else {
    endpoints = {
      login: 'http://localhost:3032/api/v1/auth/login',
      logout: 'http://localhost:3032/api/v1/auth/logout',
      verticals: 'http://localhost:3033/api/v1/verticals/verticals',
      endpoints: 'http://localhost:3033/api/v1/verticals/endpoints'
    }
  }

  try {
    // get meta info about the response
    let dataType
    let dataLength
    if (Array.isArray(endpoints)) {
      // array
      dataType = 'array'
      dataLength = endpoints.length
    } else {
      // object
      dataType = 'object'
      dataLength = Object.keys(endpoints).length
    }

    // return HTTP response
    res.status(200).send(endpoints)
    // log it to db
    logger.log({clientIp, host, path, url, method, operation, status: 200, details: 'get endpoints successful', response: `(JSON ${dataType} with ${dataLength} properties)`})
  } catch (error) {
    console.log('user', 'at IP', req.clientIp, 'get endpoints', 'error', error.message)
    // return both error messages
    res.status(500).send(error.message)
    // log error to db
    logger.log({level: 'error', clientIp, host, path, url, method, operation, status: 500, details: 'get endpoints failed', response: error.message})
  }
})

module.exports = router
