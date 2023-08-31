const { ObjectId } = require("mongodb")
const database = require("../database/mongodb")
const { momentUTC } = require("./dates")

exports.insertOne = async function (COLLECTION, data) {
    try {
        const collection = database.collection(COLLECTION)
        const response = await collection.insertOne({ ...data, createdAt: momentUTC(), updatedAt: momentUTC() })
        return response
    } catch (error) {
        console.error(error)
    }
}

exports.updateOne = async function (COLLECTION, id, newData) {
    try {
        const collection = database.collection(COLLECTION)
        const response = await collection.updateOne({ _id: new ObjectId(id) }, { $set: { ...newData, updatedAt: momentUTC() } })
        return response
    } catch (error) {
        console.error(error)
    }
}

exports.updateOneFilter = async function (COLLECTION, filter, newData) {
    try {
        const collection = database.collection(COLLECTION)
        const response = await collection.updateOne(filter, { $set: { ...newData, updatedAt: momentUTC() } })
        return response
    } catch (error) {
        console.error(error)
    }
}

exports.updateManyFilter = async function (COLLECTION, filter, newData) {
    try {
        const collection = database.collection(COLLECTION)
        const response = await collection.updateMany(filter, { $set: { ...newData, updatedAt: momentUTC() } })
        return response
    } catch (error) {
        console.error(error)
    }
}

exports.verifyIndexExists = async function (COLLECTION, index) {
    try {
        const collection = database.collection(COLLECTION)
        const indexes = await collection.listIndexes().toArray()
        const exists = indexes.some((eIndex) => {
            return eIndex.key.hasOwnProperty(index);
        });
        return exists
    } catch (error) {
        console.error(error)
    }
}