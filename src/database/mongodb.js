const { MongoClient } = require('mongodb')
const DATABASE = process.env.COSMOS_DB_NAME

const client = new MongoClient(process.env.COSMOS_CONNECTION_STRING)
client.connect()
const database = client.db(DATABASE)

module.exports = database