const fs = require("fs")
const { MongoClient } = require("mongodb")
const { momentUTC } = require("../utils/dates")
const { CONFIG_CODES } = require("../utils/constants")

function init() {
    fs.readFile("local.settings.json", "utf8", (err, data) => {
        if (err) return
        try {
            const jsonData = JSON.parse(data)
            const { COSMOS_CONNECTION_STRING, COSMOS_DB_NAME} = jsonData.Values
            if (COSMOS_CONNECTION_STRING && COSMOS_DB_NAME) {
                insertSeedData(COSMOS_CONNECTION_STRING, COSMOS_DB_NAME).catch(console.error)
            } else {
                console.error("Values don't exist: [COSMOS_CONNECTION_STRING, COSMOS_DB_NAME]")
            }
        } catch (error) {
            console.error(error)
        }
    })
}

async function insertSeedData(COSMOS_CONNECTION_STRING, COSMOS_DB_NAME) {
    const client = new MongoClient(COSMOS_CONNECTION_STRING)

    try {
        await client.connect()
        const database = client.db(COSMOS_DB_NAME)

        /*
        const Plans = database.collection("plans")
        const resultPlans = await Plans.insertMany([
            {
                name: 'Diario',
                duration: 'annual',
                totalQuantityDispatched: 24,
                deliveryFrequencyOptions: [ 1, 2, 4, 12 ]
            },
            {
                name: 'Quincenal',
                duration: 'annual',
                totalQuantityDispatched: 8,
                deliveryFrequencyOptions: [ 1, 2, 4 ]
            },
            {
                name: 'Mensual',
                duration: 'annual',
                totalQuantityDispatched: 4,
                deliveryFrequencyOptions: [ 1, 2 ]
            }
        ])
        console.log(`${resultPlans.insertedCount} plans inserted`)
        */

        const now = momentUTC()
        const Config = database.collection("config")
        const resultConfig = await Config.insertMany([
            { code: CONFIG_CODES.PAYMENT_NUMBER_OF_ATTEMPTS, label: "Cantidad de intentos para pagos", value: 6, createdAt: now, updatedAt: now },
            { code: CONFIG_CODES.PAYMENT_FREQUENCY_OF_ATTEMPTS_HOURS, label: "Frecuencia entre intentos para pagos (horas)", value: 48, createdAt: now, updatedAt: now },
        ])
        console.log(`${resultConfig.insertedCount} configurations inserted`)

    } finally {
        await client.close()
    }
}

init()