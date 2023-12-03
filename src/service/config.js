const client = require("../database/mongodb")
const { updateOneFilter } = require("../utils/mongodb")

const COLLECTION = "config"
const collection = client.collection(COLLECTION)

/**
 * Configuracion general
 * 
 * code <CONFIG_CODES>
 * label: Texto que se mostrará en frontend
 * value
 */

exports.listConfig = async function () {
    const result = await collection.find().toArray()
    return result
}

exports.getConfigByCode = async function (code) {
    const found = await collection.findOne({ code })
    return found
}

exports.updateConfigByCode = async function (code, newValue) {
    if(code == "DIGEVO_SPEED"){
        if(newValue != 1 && newValue != 0){
            newValue = 1;
        }
    }
    const { modifiedCount } = await updateOneFilter(COLLECTION, { code }, { value: newValue })
    return modifiedCount === 1
}