const db = require('../../models/mongodb')

// get verticals list
module.exports = async function (req, res, next) {
  const operation = 'get verticals'
  console.log('user', req.user.email, 'at IP', req.clientIp, operation, 'requested with query', req.query)

  try {
    // get only id, name, owner fields
    const projection = {id: 1, name: 1, owner: 1}
    let query
    // owner query provided?
    if (req.query.owner) {
      // find only verticals owned by system or by the specified username
      query = {
        owner: {
          $in: [null, 'system', req.query.owner]
        }
      }
    } else {
      // find only verticals owned by system or the requesting user
      query = {
        owner: {
          $in: [null, 'system', req.user.username]
        }
      }
    }
  
    // get vertical from cloud mongo db
    const verticals = await db.find('cumulus', 'vertical', query, projection)
    return res.status(200).send(verticals)
  } catch (error) {
    console.log('user', req.user.email, 'at IP', req.clientIp, 'get verticals', 'error:', error.message)
    // return HTTP response
    return res.status(500).send({message: error.message})
  }
}
