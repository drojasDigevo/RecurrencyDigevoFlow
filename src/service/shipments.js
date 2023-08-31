const client = require("../database/mongodb")
const { insertOne, verifyIndexExists } = require("../utils/mongodb")
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

async function listShipmentsBySubscription (subscriptionId) {
    const indexExists = await verifyIndexExists('delivery_date')
    if (!indexExists) collection.createIndex({ 'delivery_date': 1 })
    const result = await collection.find({ subscriptionId }).sort({ delivery_date: 1 }).toArray()
    return result
}

exports.createShipmentBySubscription = async function (subscriptionId) {
    try {
        const subscription = await verifySubscriptionStatus(subscriptionId)
        if (subscription) {
            const shipment = await APICreateShipment(subscriptionId)
            if (shipment) {
                await postAPISubscriptionChange(subscriptionId, ShipmentStatus.SHIPMENT_CREATED)

                await createShipment({...shipment, subscriptionId})
                const shipments = await listShipmentsBySubscription(subscriptionId)
                // FIX: API deberia devolver si existen mas envios? ahora se esta tomando "frequency" de la subscripcion
                if (subscription.frequency != shipments.length) {
                    await createEvent(EventType.SHIPMENT_DISPATCHED, { subscriptionId }, shipment.delivery_date)
                }
            } else {
                //TODO notificar error
            }
        }
    } catch (error) {
        console.error(error)
    }
}