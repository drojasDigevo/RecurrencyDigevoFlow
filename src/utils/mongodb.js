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

exports.findWithPagination = async function (COLLECTION, filter, sort, page, perPage) {
    try {
        const usePage = page ? page : 1
        const usePerPage = perPage ? perPage : 10

        const collection = database.collection(COLLECTION)

        const totalDocuments = await collection.countDocuments(filter)
        const totalPages = Math.ceil(totalDocuments / usePerPage)

        const items = await collection
            .find(filter)
            .sort(sort)
            .skip((usePage - 1) * usePerPage)
            .limit(usePerPage)
            .toArray()

        return { totalDocuments, totalPages, page: usePage, perPage: usePerPage, documents: items }
    } catch (error) {
        console.error(error)
    }
}

exports.verifyCreateIndex = async function (COLLECTION, indexName) {
    try {
        const collection = database.collection(COLLECTION)
        const indexes = await collection.listIndexes().toArray()
        const exists = indexes.some((eIndex) => {
            return eIndex.key.hasOwnProperty(indexName);
        });
        const indexData = {}
        indexData[indexName] = 1
        if (!exists) {
            collection.createIndex({...indexData})
        }
        return exists
    } catch (error) {
        console.error(error)
    }
}