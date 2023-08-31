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

    switch (type) {
        case EventType.SUBSCRIPTION_CREATED:
            await createShipmentBySubscription(event.data.subscriptionId)
            await attemptPaymentBySubscription(event.data.subscriptionId, 1)
            return
        case EventType.SHIPMENT_DISPATCHED:
            await createShipmentBySubscription(event.data.subscriptionId)
            return
        case EventType.PAYMENT_ATTEMPT:
            await attemptPaymentBySubscription(event.data.subscriptionId, event.data.attempts)
            return
        default:
            return
    }
};