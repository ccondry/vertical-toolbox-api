const express = require('express')
const router = express.Router()
const request = require('request-promise-native')
const logger = require('../models/logger')

// get usage stats
router.get('/', async function (req, res, next) {
  const username = req.user.username
  const clientIp = req.clientIp
  const method = req.method
  const host = req.get('host')
  const path = req.originalUrl
  const url = req.protocol + '://' + host + path
  const operation = 'get usage stats'

  console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'requested')

  if (!req.user.admin) {
    // log it to db
    logger.log({clientIp, host, path, url, method, operation, username, status: 403, details: 'only admins can view usage stats.', parameters: req.params, query: req.query})
    return res.status(403).send()
  }

  const options = {
    baseUrl: process.env.MM_API_1,
    headers: {
      Authorization: `Bearer ${process.env.MM_TOKEN}`
    },
    url: '/usage',
    method: 'GET',
    qs: req.query,
    json: true
  }

  try {
    // try mm
    const response = await request(options)
    console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'successful on primary server')

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
    logger.log({clientIp, host, path, url, method, operation, username, status: 200, details: 'get usage stats successful on primary server', parameters: req.params, response: `(JSON ${dataType} with ${dataLength} properties)`})
    // return HTTP response
    return res.status(200).send(response)
  } catch (error) {
    console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'error', error.statusCode, 'on primary server', error.message)
    // log the error to db
    logger.log({level: 'warn', clientIp, host, path, url, method, operation, username, status: error.statusCode, details: 'get usage stats failed on primary server', parameters: req.params, response: error.message})
    // continue
    try {
      // try mm-dev
      console.log('trying secondary server...')
      options.baseUrl = process.env.MM_API_2
      const response = await request(options)
      console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'successful on secondary server')

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
      logger.log({clientIp, host, path, url, method, operation, username, status: 200, details: 'get usage stats successful on secondary server', parameters: req.params, response: `(JSON ${dataType} with ${dataLength} properties)`})
      // return HTTP response
      return res.status(200).send(response)
    } catch (e2) {
      // failed on secondary also
      console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'error', e2.statusCode, 'on secondary server', e2.message)
      // check if error was "not found"
      // log warn to db
      logger.log({level: 'warn', clientIp, host, path, url, method, operation, username, status: e2.statusCode, details: 'get usage stats failed on secondary server', parameters: req.params, response: e2.message})
      // log error to db
      logger.log({level: 'error', clientIp, host, path, url, method, operation, username, status: 500, details: 'get usage stats failed on primary and secondary servers', parameters: req.params, response: error.message + ' \r\n ' + e2.message})
      // return HTTP response
      // return res.status(500).send(error.message + '/r/n' + e2.message)
      // return both error messages
      return res.status(500).send(error.message + ' \r\n ' + e2.message)
    }
  }
})

module.exports = router
