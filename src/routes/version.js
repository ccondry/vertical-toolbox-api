const express = require('express')
const router = express.Router()
const {version} = require('../../package.json')

// get REST endpoint URLs
router.get('/', async function (req, res, next) {
  return res.status(200).send({version})
})

module.exports = router
