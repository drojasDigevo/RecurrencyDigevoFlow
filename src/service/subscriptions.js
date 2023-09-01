const client = require("../database/mongodb")
const { insertOne, updateOne } = require("../utils/mongodb")
const { getAPISubscription } = require("../api/subscriptions")
const { createEvent, EventType, cancelManyEventsBySubscription } = require("./events")

const COLLECTION = "subscriptions"
const collection = client.collection(COLLECTION)

const SubscriptionStatus = Object.freeze({
    Active: { id: 1, name: "Active" },
    Expired: { id: 2, name: "Expired" },
    Cancelled: { id: 3, name: "Cancelled" },
    Suspended: { id: 4, name: "Suspended" },
    Paused: { id: 5, name: "Paused" },
    Onhold: { id: 6, name: "Onhold" },
})

exports.SubscriptionStatus = SubscriptionStatus

exports.listSubscription = async function () {
    try {
        const result = await collection.find().toArray()
        return result
    } catch (error) {
        console.error(error)
    }
}

exports.findSubscriptionByIdSubscription = async function (idSubscription) {
    try {
        const result = await collection.findOne({ idSubscription: idSubscription })
        return result
    } catch (error) {
        console.error(error)
    }
}

exports.loadSubscriptionFromAPI = async function (idSubscription) {
    try {
        const subscriptionCosmos = await collection.findOne({ idSubscription: idSubscription })
        const data = await getAPISubscription(idSubscription)
        await updateOne(COLLECTION, subscriptionCosmos._id, data)
        return data
    } catch (error) {
        console.error(error.message)
        return false
    }
}

exports.verifySubscriptionStatus = async function (idSubscription) {
    try {
        const subscription = await exports.loadSubscriptionFromAPI(idSubscription)
        const { status } = subscription
        if ( status.id === SubscriptionStatus.Cancelled.id ) {
            // TODO: correo notificacion admin
            return false
        } else {
            return subscription
        }
    } catch (error) {
        console.error(error)
        //TODO notificar error
    }
}

exports.createSubscription = async function (data) {
    try {
        const { insertedId } = await insertOne(COLLECTION, data)
        await createEvent(EventType.SUBSCRIPTION_CREATED, { idSubscription: data.idSubscription })
        return { _id: insertedId }
    } catch (error) {
        console.error(error)
    }
}

exports.updateSubscription = async function (idSubscription) {
    try {
        const isCancel = await exports.cancelSubscription(idSubscription)
        const subscription = await exports.loadSubscriptionFromAPI(idSubscription)
        if (isCancel && subscription) {
            await createEvent(EventType.SUBSCRIPTION_CREATED, { idSubscription: idSubscription })
            return true
        }
        return false
    } catch (error) {
        console.error(error)
        return error
    }
}

exports.cancelSubscription = async function (idSubscription) {
    try {
        const subscription = await collection.findOne({ idSubscription: idSubscription })
        const { modifiedCount } = await updateOne(COLLECTION, subscription._id, { status: SubscriptionStatus.Cancelled })
        await cancelManyEventsBySubscription(idSubscription)
        return modifiedCount === 1
    } catch (error) {
        console.error(error)
    }
}