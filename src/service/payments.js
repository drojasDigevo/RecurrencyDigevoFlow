const moment = require("moment-timezone")
const client = require("../database/mongodb")
const { insertOne } = require("../utils/mongodb")
const { createEvent, EventType } = require("./events")
const { verifySubscriptionStatus, cancelSubscription } = require("./subscriptions")
const { paymentAPICollect, paymentAPINotify } = require("../api/payments")
const { getConfigByCode } = require("./config")
const { CONFIG_CODES } = require("../utils/constants")
const { createErrorLog, createSuccessLog, createInfoLog } = require("./logs")
const { convertUTC } = require("../utils/dates")

const COLLECTION = "payments"
const collection = client.collection(COLLECTION)

const PaymentStatus = Object.freeze({
    PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
})

async function createPayment (data) {
    const { insertedId } = await insertOne(COLLECTION, data)
    return { _id: insertedId}
}

async function listPaymentsBySubscription (idSubscription) {
    const result = await collection.find({ idSubscription }).toArray()
    return result
}

exports.attemptPaymentBySubscription = async function (idSubscription, attempts) {
    try {
        const subscription = await verifySubscriptionStatus(idSubscription)
        if (subscription) {
            const payment = await paymentAPICollect(subscription.paymentMethod.gatewayToken,subscription.totalAmountToPay,idSubscription)

            if (payment) {
                const { _id: paymentId } = await createPayment({...payment, idSubscription})
                await createSuccessLog(idSubscription, "Se creó el cobro", { paymentId })

                const notified = await paymentAPINotify(idSubscription, payment)
                if (notified) {
                    await createSuccessLog(idSubscription, "Se notificó a la API de cobros", { paymentId })
					
					const { _id: eventShipmentId } = await createEvent(EventType.SHIPMENT_DISPATCHED, { idSubscription })
					await createSuccessLog(idSubscription, "Se crearon nuevos eventos", { eventShipmentId } )
                } else {
                    await createErrorLog(idSubscription, "Hubo un error al informar del cobro", { paymentId })
                }

                const payments = await listPaymentsBySubscription(idSubscription)
                // FIX: API deberia devolver si existen mas pagos? ahora se esta tomando "frequency" de la suscripción
                if (subscription.frequency != payments.length) {
                    await createEvent(EventType.PAYMENT_ATTEMPT, { idSubscription, attempts: 1 }, payment.next_payment_date)
                }

            } else {
                await createInfoLog(idSubscription, "Intento de cobro fallido", { attempts })

                const configTotalAttempts = await getConfigByCode(CONFIG_CODES.PAYMENT_NUMBER_OF_ATTEMPTS)
                const totalAttempts = Number(configTotalAttempts.value)

                if (totalAttempts > attempts) {
                    const now = moment()
                    const configPlusHours = await getConfigByCode(CONFIG_CODES.PAYMENT_FREQUENCY_OF_ATTEMPTS_HOURS)
                    const plusHours = Number(configPlusHours.value)
                    const dateRetry = now.clone().add(moment.duration(plusHours, 'hours'))

                    await createEvent(EventType.PAYMENT_ATTEMPT, { idSubscription, attempts: attempts+1 }, dateRetry)
                    await createInfoLog(idSubscription, "Intento de cobro reprogramado", { attempts: attempts+1, dateRetry: convertUTC(dateRetry) })

                } else {
                    await createErrorLog(idSubscription, "Limite de intentos de cobro fallidos, se cancelará la suscripción", { attempts })
                    await cancelSubscription(idSubscription)
                }
            }
        } else {
            await createErrorLog(idSubscription, "No se pudo ejecutar el intento de cobro")
        }

    } catch (error) {
        await createErrorLog(idSubscription, "Ocurrio un error inesperado al ejecutar el cobro", { name: error.name, message: error.message })
        console.error(error)
    }
}