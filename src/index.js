// load environment file
require('dotenv').load()

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs')
const expressJwt = require('express-jwt')
const requestIp = require('request-ip')
const logger = require('./models/logger')

// load the public cert for validating JWT
const cert_pub = fs.readFileSync('./certs/rsa-public.pem')
// set up Node.js HTTP port
const port = process.env.NODE_PORT || 3032

// JWT path exceptions - these paths can be used without a JWT required
const exceptions = {
  path: [{
    url: /\/api\/v1\/cumulus\/endpoints/i,
    methods: ['GET']
  }]
}
// init express app, and configure it
const app = express()
// parse JSON body into req.body, up to 24mb
app.use(bodyParser.json({limit: '24mb'}))
// parse URL-encoded body into req.body, up to 100mb
app.use(bodyParser.urlencoded({limit: '100mb', extended: true }))
// enable CORS
app.use(cors())
// get remote IP address of request client as req.clientIp
app.use(requestIp.mw())
// require valid JWT for all paths unless in the exceptins list, and parse JWT payload into req.user
app.use(expressJwt({ secret: cert_pub }).unless(exceptions))

// parse JWT to JSON
function parseJwt (token) {
  var base64Url = token.split('.')[1]
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(window.atob(base64))
}

// extract real user info if user object has suJwt
app.use(function(req, res, next) {
  // console.log('app.use sujwt middleware - req.user = ', req.user)
  req.realUser = req.user
  req.realUsername = req.realUser.username
  try {
    // is this a substitute-user?
    if (req.user.suJwt) {
      // set the real user and username
      req.realUser = parseJwt(req.user.suJwt)
      req.realUsername = req.realUser.username
    }
  } catch (e) {
    console.log(e)
  }
  // continue processing
  next()
})

// error handling when JWT validation fails
app.use(function(err, req, res, next) {
  if (err) {
    // return status to user
    res.status(err.status).send(err.message)
    // set up data for logging
    const clientIp = req.clientIp
    const method = req.method
    const host = req.get('host')
    const path = req.originalUrl
    const url = req.protocol + '://' + host + path
    // there was an error
    console.log('user at IP', clientIp, 'error', err.status, err.name, err.message)
    // log to db
    logger.log({clientIp, host, path, url, method, status: err.status, details: err.name, parameters: req.params, queryString: req.qs, response: err.message})
    // stop processing
    return
  } else {
    // no errors
    // continue processing
    next()
  }
})

/*****
Routes
*****/

// REST endpoint URLs
app.use('/api/v1/cumulus/endpoints', require('./routes/endpoints'))
// vertical configs
app.use('/api/v1/cumulus/verticals', require('./routes/verticals'))

/*
Go
*/
app.listen(port, () => console.log(`Express.js app listening on port ${port}`))
