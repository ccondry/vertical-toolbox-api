const mongo = require('@ccondry/mongo-wrapper')
const db = new mongo(process.env.CLOUD_MONGO_URL)

module.exports = db
