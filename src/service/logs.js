const client = require("../database/mongodb")
const { insertOne, verifyCreateIndex } = require("../utils/mongodb")

const COLLECTION = "logs"
const collection = client.collection(COLLECTION)


const LogType = Object.freeze({
    ERROR: "ERROR",
    INFO: "INFO",
    SUCCESS: "SUCCESS",
})

exports.listLogBySubscription = async function (idSubscription) {
    try {
        await verifyCreateIndex(COLLECTION, 'updatedAt')
        const result = await collection.find({ idSubscription: idSubscription }).sort({ updatedAt: -1 }).toArray()
        return result
    } catch (error) {
        console.log(error)
        throw error
    }
}

exports.createErrorLog = async function (idSubscription, description, data) {
    await insertOne(COLLECTION, { type: LogType.ERROR, idSubscription, description, data: data })
}

exports.createInfoLog = async function (idSubscription, description, data) {
    await insertOne(COLLECTION, { type: LogType.INFO, idSubscription, description, data: data })
}

exports.createSuccessLog = async function (idSubscription, description, data) {
    await insertOne(COLLECTION, { type: LogType.SUCCESS, idSubscription, description, data: data })
}