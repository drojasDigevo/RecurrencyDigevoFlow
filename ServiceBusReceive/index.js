const { getReceivedEvent, EventType } = require("../src/service/events");
const { attemptPaymentBySubscription } = require("../src/service/payments");
const { createShipmentBySubscription } = require("../src/service/shipments");

module.exports = async function(context, message) {
    const { messageId } = context.bindingData
    const { type } = message

    console.log("[BUS RECEIVE]", type)
    context.log(messageId)
    context.log(type)

    const event = await getReceivedEvent(messageId)
    console.log("[BUS RECEIVE] event >", event)

    switch (type) {
        case EventType.SUBSCRIPTION_CREATED:
            await createShipmentBySubscription(event.data.idSubscription)
            await attemptPaymentBySubscription(event.data.idSubscription, 1)
            return
        case EventType.SHIPMENT_DISPATCHED:
            await createShipmentBySubscription(event.data.idSubscription)
            return
        case EventType.PAYMENT_ATTEMPT:
            await attemptPaymentBySubscription(event.data.idSubscription, event.data.attempts)
            return
        default:
            return
    }
};