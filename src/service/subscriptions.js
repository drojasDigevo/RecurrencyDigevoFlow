const client = require("../database/mongodb")
const { insertOne, updateOne } = require("../utils/mongodb")
const { getAPISubscription } = require("../api/subscriptions")
const { createEvent, EventType, cancelManyEventsBySubscription } = require("./events")

const COLLECTION = "subscriptions"
const collection = client.collection(COLLECTION)

const SubscriptionStatus = Object.freeze({
    Active: "Active",
    Expired: "Expired",
    Cancelled: "Cancelled",
    Suspended: "Suspended",
    Paused: "Paused",
    Onhold: "Onhold",
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
        //FIX: cambiar por get subscription
        const data = await getAPISubscription(idSubscription)
        // const plan = await getPlanByName(data.frequencyType.name)
        // data.plan = plan
        // await updateOne(COLLECTION, subscriptionCosmos.id, data)
        return subscriptionCosmos
    } catch (error) {
        console.error(error)
    }
}

exports.verifySubscriptionStatus = async function (idSubscription) {
    try {
        const subscription = await exports.loadSubscriptionFromAPI(idSubscription)
        const { status } = subscription
        if ( status === SubscriptionStatus.Cancelled ) {
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
        await createEvent(EventType.SUBSCRIPTION_CREATED, { subscriptionId: data.idSubscription })
        return { _id: insertedId }
    } catch (error) {
        console.error(error)
    }
}

exports.updateSubscriptionStatus = async function (idSubscription, status) {
    try {
        if (status === SubscriptionStatus.Cancelled) {
            const response = await exports.cancelSubscription(idSubscription)
            return response
        }
        const subscription = await collection.findOne({ idSubscription: idSubscription })
        const response = await updateOne(COLLECTION, subscription._id, { status })
        return response
    } catch (error) {
        console.error(error)
    }
}

exports.cancelSubscription = async function (idSubscription) {
    try {
        const subscription = await collection.findOne({ idSubscription: idSubscription })
        const response = await updateOne(COLLECTION, subscription._id, { status: SubscriptionStatus.Cancelled })
        await cancelManyEventsBySubscription(idSubscription)
        return response
    } catch (error) {
        console.error(error)
    }
}