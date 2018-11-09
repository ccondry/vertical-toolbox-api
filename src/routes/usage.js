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

  // did user request mm-dev stats?
  if (req.query.server === 'mm-dev') {
    options.baseUrl = process.env.MM_API_2
  }
  // othewise use mm stats

  function makeCsvData (array) {
    let str = ''
    // add column titles row
    let line1 = ''
    for (let key of Object.keys(array[0])) {
      line1 += key + ','
    }
    // add everything except the last character (the dangling comma) to the csv
    str += line.slice(0, -1)

    // count the rows
    let rows = 0
    for (let row of array) {
      let line = ''
      // add each value of this row
      for (let i in row) {
        line += row[i] + ','
      }
      // add everything except the last character (the dangling comma) to the csv
      str += line.slice(0, -1)
      // add newline for the end of this row
      str += '\r\n'
      // increment rows
      rows++
    }

    return {data: str, rows: rows}
  }

  try {
    const response = await request(options)
    console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'successful on ', options.baseUrl)

    const loggerParams = {clientIp, host, path, url, method, operation, username, status: 200, details: 'get usage stats successful on ' + options.baseUrl, parameters: req.params, query: req.query}
    // any data type conversions?
    if (req.query.dataType && req.query.dataType.toLowerCase() === 'csv') {
      // CSV data
      const csv = makeCsvData(response)
      // get meta info about the response
      // log it to db
      loggerParams.response = `(CSV data with ${csv.rows} rows)`
      logger.log(loggerParams)
      // return HTTP response
      return res.status(200).send(csv.data)
    } else {
      // default JSON
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
      loggerParams.response = `(JSON ${dataType} with ${dataLength} properties)`
      logger.log(loggerParams)
      // return HTTP response
      return res.status(200).send(response)
    }
  } catch (error) {
    console.log('user', username, 'at IP', req.clientIp, operation, req.params.id, 'error', error.statusCode, 'on', options.baseUrl, error.message)
    // log error to db
    logger.log({level: 'error', clientIp, host, path, url, method, operation, username, status: 500, details: 'get usage stats failed on ' + options.baseUrl, parameters: req.params, response: error.message})
    // return error message
    return res.status(500).send(error.message)
  }
})

module.exports = router
