const db = require('../../models/mongodb')

// get single vertical
module.exports = async function (req, res, next) {
  const username = req.user ? req.user.username : 'anonymous'
  // const clientIp = req.clientIp
  // const method = req.method
  // const host = req.get('host')
  // const path = req.originalUrl
  // const url = req.protocol + '://' + host + path
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
      // const dataType = 'object'
      // const dataLength = Object.keys(vertical).length
      console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'successful')
      // log it to db
      // logger.log({clientIp, host, path, url, method, operation, username, status: 200, details: 'get vertical successful', params: req.params, response: `(JSON ${dataType} with ${dataLength} properties)`})
      // return HTTP response
      return res.status(200).send(vertical)
    } else {
      const response = 'vertical with id = "' + id + '" not found.'
      // vertical not found
      console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'failed', response)
      // log it to db
      // logger.log({clientIp, host, path, url, method, operation, username, status: 404, details: 'get vertical failed', params: req.params, response})
      // return HTTP response
      return res.status(404).send(response)
    }
  } catch (e) {
    // failed on secondary also
    console.log('user', username, 'at IP', req.clientIp, 'get vertical', req.params.id, 'error', e.message)
    // log error to db
    // logger.log({level: 'error', clientIp, host, path, url, method, operation, username, status: 500, details: 'get vertical failed', params: req.params, response: e.message})
    return res.status(500).send(e.message)
  }
}
