const client = require("../database/mongodb")
const { insertOne, verifyCreateIndex } = require("../utils/mongodb")
const { createEvent, EventType } = require("./events")
const { verifySubscriptionStatus } = require("./subscriptions")
const { APICreateShipment } = require("../api/shipments")
const { postAPISubscriptionChange } = require("../api/subscriptions")

const COLLECTION = "shipments"
const collection = client.collection(COLLECTION)

const ShipmentStatus = Object.freeze({
    SHIPMENT_CREATED: "SHIPMENT_CREATED",
})

async function createShipment (data) {
    const { insertedId } = await insertOne(COLLECTION, data)
    return { _id: insertedId}
}

async function listShipmentsBySubscription (idSubscription) {
    await verifyCreateIndex(COLLECTION, 'delivery_date')
    const result = await collection.find({ idSubscription }).sort({ delivery_date: 1 }).toArray()
    return result
}

exports.createShipmentBySubscription = async function (idSubscription) {
    try {
        const subscription = await verifySubscriptionStatus(idSubscription)
        if (subscription) {
            const shipment = await APICreateShipment(idSubscription)
            if (shipment) {
                await postAPISubscriptionChange(idSubscription, ShipmentStatus.SHIPMENT_CREATED)

                await createShipment({...shipment, idSubscription})
                const shipments = await listShipmentsBySubscription(idSubscription)
                // FIX: API deberia devolver si existen mas envios? ahora se esta tomando "frequency" de la subscripcion
                if (subscription.frequency != shipments.length) {
                    await createEvent(EventType.SHIPMENT_DISPATCHED, { idSubscription }, shipment.delivery_date)
                }
            } else {
                //TODO notificar error
            }
        }
    } catch (error) {
        console.error(error)
    }
}