const express = require('express')
const router = express.Router()
const request = require('request-promise-native')
const logger = require('../models/logger')
// const uploadImage = require('../models/upload')
const credentials = require('../models/credentials')

// upload image
router.post('/', async function (req, res, next) {
  const username = req.user.username
  const clientIp = req.clientIp
  const method = req.method
  const host = req.get('host')
  const path = req.originalUrl
  const url = req.protocol + '://' + host + path
  const operation = 'upload image or file'

  const node = req.body.node
  const name = req.body.name
  const vertical = req.body.vertical || ''
  const data = req.body.data

  // validate input
  if (vertical.indexOf('../') >= 0) {
    return res.status(400).send('vertical is not valid. received', vertical)
  }

  console.log('uploading file for', username, 'to', vertical)
  // console.log('file data:', data)
  const i1 = data.indexOf('data:') + 'data:'.length
  const i2 = data.indexOf(';', i2)
  const mime = data.substring(i1, i2)
  if (mime === 'application/json') {
    // found JSON data
    // extract data string
    const i3 = data.indexOf('base64,', i2) + 'base64,'.length
    // get base64 string data
    const buff = new Buffer(data.substring(i3), 'base64')
    // convert to ascii
    const jsonString = buff.toString('utf8')
    // parse to actual JSON object
    const json = JSON.parse(jsonString)
    // is this a GCP credentials file?
    if (json.project_id && json.private_key) {
      // probably so
      // upload details database and return
      await credentials.set(json)
      return res.status(201).send()
    }
  }



  const ext = data.substring(data.indexOf('data:image/') + 'data:image/'.length, data.indexOf(';'))
  console.log('uploaded file file extension', ext)
  const image = data.substring(data.indexOf('base64,') + 'base64,'.length)
  console.log('got file data. length =', image.length)

  const newFilePath = username + '/' + vertical + '/' + name + '.' + ext

  // upload to mm
  const options = {
    baseUrl: process.env.MM_API_1,
    url: '/verticals/images',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MM_TOKEN}`
    },
    json: true,
    body: {
      path: newFilePath,
      data: image
    }
  }

  let mmAnswer1
  let mmAnswer2

  let primarySuccess
  let secondarySuccess
  // update primary
  try {
    mmAnswer1 = await request(options)
    // console.log('request with options', options)
    console.log('user', username, 'at IP', req.clientIp, operation, 'successful on primary server')
    primarySuccess = true
  } catch (e) {
    console.log('user', username, 'at IP', req.clientIp, operation, 'failed on primary server', e.message)
    primarySuccess = false
  }

  // and also update secondary
  try {
    // set base URL to secondary
    options.baseUrl = process.env.MM_API_2
    mmAnswer2 = await request(options)
    // console.log('request with options', options)
    console.log('user', username, 'at IP', req.clientIp, operation, 'successful on secondary server')
    secondarySuccess = true
  } catch (e) {
    console.log('user', username, 'at IP', req.clientIp, operation, 'failed on secondary server', e.message)
    secondarySuccess = false
  }

  let resultMessage
  if (primarySuccess && secondarySuccess) {
    resultMessage = 'Successfully uploaded image on the primary and secondary servers.'
    status = 201
  } else if (primarySuccess) {
    // secondary failed
    resultMessage = 'Successfully uploaded image on the primary server, but failed to upload image on the secondary server.'
    status = 201
  } else if (secondarySuccess) {
    // primary failed
    resultMessage = 'Successfully uploaded image on the secondary server, but failed to upload image on the primary server.'
    status = 201
  } else {
    // both failed
    resultMessage = 'Failed to upload image on the primary and secondary servers.'
    status = 500
  }

  // log it to db
  logger.log({
    clientIp, host, path, url, method, operation, username, status,
    details: resultMessage,
    query: req.query,
    parameters: req.params,
    response: mmAnswer1
  })
  // return the URL that we get back from the mmAnswer1 (or mmAnswer2 if that fails)
  return res.status(status).send(mmAnswer1 || mmAnswer2)
})

module.exports = router
