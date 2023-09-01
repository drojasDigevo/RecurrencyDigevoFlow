const client = require("../database/mongodb")
const COLLECTION = "plans"

exports.listPlan = async function () {
    try {
        const collection = client.collection(COLLECTION)
        const result = await collection.find().toArray()
        return result
    } catch (error) {
        console.error(error)
    }
}

exports.getPlanByName = async function (name) {
    try {
        const collection = client.collection(COLLECTION)
        const result = await collection.findOne({ name })
        return result
    } catch (error) {
        console.error(error)
    }
}