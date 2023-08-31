const moment = require("moment-timezone")
const client = require("../database/mongodb")
const { insertOne } = require("../utils/mongodb")
const { createEvent, EventType } = require("./events")
const { verifySubscriptionStatus, cancelSubscription } = require("./subscriptions")
const { APIPaymentIsComplete } = require("../api/payments")
const { postAPISubscriptionChange } = require("../api/subscriptions")
const { getConfigByCode } = require("./config")
const { CONFIG_CODES } = require("../utils/constants")

const COLLECTION = "payments"
const collection = client.collection(COLLECTION)

const PaymentStatus = Object.freeze({
    PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
})

async function createPayment (data) {
    const { insertedId } = await insertOne(COLLECTION, data)
    return { _id: insertedId}
}

async function listPaymentsBySubscription (subscriptionId) {
    const result = await collection.find({ subscriptionId }).toArray()
    return result
}

exports.attemptPaymentBySubscription = async function (subscriptionId, attempts) {
    try {
        const subscription = await verifySubscriptionStatus(subscriptionId)
        if (subscription) {
            const payment = await APIPaymentIsComplete(subscriptionId)
            if (payment) {
                await postAPISubscriptionChange(subscriptionId, PaymentStatus.PAYMENT_COMPLETED)

                await createPayment({...payment, subscriptionId})
                const payments = await listPaymentsBySubscription(subscriptionId)
                // FIX: API deberia devolver si existen mas pagos? ahora se esta tomando "frequency" de la subscripcion
                if (subscription.frequency != payments.length) {
                    await createEvent(EventType.PAYMENT_ATTEMPT, { subscriptionId, attempts: 1 }, payment.next_payment_date)
                }
            } else {
                //TODO: notificar error
                const totalAttempts = await getConfigByCode(CONFIG_CODES.PAYMENT_NUMBER_OF_ATTEMPTS)

                if (totalAttempts > attempts) {
                    const now = moment()
                    const plusHours = await getConfigByCode(CONFIG_CODES.PAYMENT_FREQUENCY_OF_ATTEMPTS_HOURS)
                    const dateRetry = now.clone().add(moment.duration(plusHours, 'hours'))
                    await createEvent(EventType.PAYMENT_ATTEMPT, { subscriptionId, attempts: attempts+1 }, dateRetry)
                } else {
                    await cancelSubscription(subscriptionId)
                }
            }
        }
    } catch (error) {
        console.error(error)
    }
}