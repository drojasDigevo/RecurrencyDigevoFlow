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

/**
 * Busqueda con paginacion
 * @param {string} COLLECTION - Nombre de la coleccion donde buscar
 * @param {object} filter - Objeto para filtrar registros
 * @param {object} project -Condicion visualizacion de campos
 * @param {object} sort - Orden que se presentará
 * @param {number} page - Pagina actual
 * @param {number} perPage - Cantidad de registros por pagina
 * @returns Listado paginado
 */
exports.findWithPagination = async function (COLLECTION, filter, project, sort, page, perPage) {
    try {
        const usePage = page ? page : 1
        const usePerPage = perPage ? perPage : 10
        const useProject = project ? project : {}
        const useSort = sort ? sort : {}

        const collection = database.collection(COLLECTION)

        const totalDocuments = await collection.countDocuments(filter)
        const totalPages = Math.ceil(totalDocuments / usePerPage)

        const items = await collection
            .find(filter)
            .project(useProject)
            .sort(useSort)
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