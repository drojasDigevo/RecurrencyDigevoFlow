const client = require("../database/mongodb")
const { insertOne, updateOne } = require("../utils/mongodb")
const { getAPISubscription, subscriptionAPILayOff, subscriptionAPIRenewal } = require("../api/subscriptions")
const { createEvent, EventType, cancelManyEventsBySubscription } = require("./events")
const { createErrorLog, createSuccessLog, createInfoLog } = require("./logs")

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
        throw error
    }
}

exports.findSubscriptionByIdSubscription = async function (idSubscription) {
    try {
        const result = await collection.findOne({ idSubscription: idSubscription })
        return result
    } catch (error) {
        return false
    }
}

exports.loadSubscriptionFromAPI = async function (idSubscription) {
    try {
        const subscriptionCosmos = await exports.findSubscriptionByIdSubscription(idSubscription)
        const newData = await getAPISubscription(idSubscription)
        await updateOne(COLLECTION, subscriptionCosmos._id, newData)
        return newData
    } catch (error) {
        throw error
    }
}

exports.createInitialEvents = async function (idSubscription) {
    try {
        const subscription = await exports.loadSubscriptionFromAPI(idSubscription)
        if (subscription) {
			var now = new Date(subscription.startDate);
			var nextDate = new Date();
			if(subscription.frequencyType.name == 'Mensual'){
				nextDate.setMonth(now.getMonth() + (1 * subscription.frequency));
			}else if(subscription.frequencyType.name == 'Semanal'){
				nextDate.setDate(now.getDate() + (7 * subscription.frequency));
			}
			console.log(nextDate);
            const { _id: eventShipmentId } = await createEvent(EventType.SHIPMENT_DISPATCHED, { idSubscription }, nextDate)
            const { _id: eventPaymentId } = await createEvent(EventType.PAYMENT_ATTEMPT, { idSubscription, attempts: 1 }, nextDate)
            await createSuccessLog(idSubscription, "Se crearon eventos iniciales", { eventShipmentId, eventPaymentId } )
        } else {
            await createErrorLog(idSubscription, "No se pudo crear eventos iniciales")
        }
    } catch (error) {
        await createErrorLog(idSubscription, "Ocurrio un error inesperado al crear eventos iniciales", { name: error.name, message: error.message })
        return false
    }
}

exports.verifySubscriptionStatus = async function (idSubscription) {
    try {
        const subscription = await exports.loadSubscriptionFromAPI(idSubscription)
        const { status } = subscription
        if ( status.id === SubscriptionStatus.Cancelled.id ) {
            await createInfoLog(idSubscription, "Se intentó realizar una accion con una suscripción cancelada")
            return false
        } else {
            return subscription
        }
    } catch (error) {
        await createErrorLog(idSubscription, "Ocurrio un error inesperado al verificar el estado de la suscripción", { name: error.name, message: error.message })
        return false
    }
}

/**
 * Crear suscripcion
 */
exports.createSubscription = async function (idSubscription) {
    try {
        const { insertedId } = await insertOne(COLLECTION, { idSubscription })
        await createEvent(EventType.SUBSCRIPTION_CREATED, { idSubscription })
        return { _id: insertedId }
    } catch (error) {
        throw error
    }
}

/**
 * Actualizar suscripcion
 */
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

/**
 * Renovacion de suscripcion
 */
exports.renewalSubscription = async function (idSubscription) {
    try {
        const response = await subscriptionAPIRenewal(idSubscription)
        if (response) {
            //TODO: actualizar suscripcion
            await createSuccessLog(idSubscription, "Se renovó la suscripción")
            return true
        }
        await createErrorLog(idSubscription, "Hubo un error en el renovó de la suscripción")
        return false
    } catch (error) {
        console.error(error)
        return error
    }
}

/**
 * Cancelacion de suscripcion
 */
exports.cancelSubscription = async function (idSubscription) {
    try {
        const subscriptionCosmos = await exports.findSubscriptionByIdSubscription(idSubscription)
        if (subscriptionCosmos) {
            const cancelled = await subscriptionAPILayOff(idSubscription)
            if (cancelled) {
                const { modifiedCount } = await updateOne(COLLECTION, subscriptionCosmos._id, { status: SubscriptionStatus.Cancelled })
                await cancelManyEventsBySubscription(idSubscription)
                await createSuccessLog(idSubscription, "Se canceló correctamente la suscripción")
                return modifiedCount === 1
            } else {
                await createErrorLog(idSubscription, "Hubo un error al cancelar la suscripción")
            }
        }
        return false
    } catch (error) {
        await createErrorLog(idSubscription, "Ocurrio un error inesperado al cancelar la suscripción", { name: error.name, message: error.message })
        console.error(error)
    }
}