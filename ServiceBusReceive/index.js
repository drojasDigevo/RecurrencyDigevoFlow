const { getReceivedEvent, EventType } = require("../src/service/events");
const { sendNotification } = require("../src/service/notifications");
const { renewSubscription } = require("../src/service/renew");
const { attemptPaymentBySubscription } = require("../src/service/payments");
const { createShipmentBySubscription } = require("../src/service/shipments");
const { createInitialEvents } = require("../src/service/subscriptions");

module.exports = async function (context, message) {
	const { messageId } = context.bindingData;
	const { type } = message;

	console.log("[BUS RECEIVE]", type);
	context.log(messageId);
	context.log(type);

	const event = await getReceivedEvent(messageId);
	console.log("[BUS RECEIVE] event >", event);

	switch (type) {
		case EventType.SUBSCRIPTION_CREATED:
			await createInitialEvents(event.data.idSubscription);
			return;
		case EventType.SHIPMENT_DISPATCHED:
			await createShipmentBySubscription(event.data.idSubscription, event.data.attempts);
			return;
		case EventType.PAYMENT_ATTEMPT:
			await attemptPaymentBySubscription(event.data.idSubscription, event.data.attempts);
			return;
		case EventType.SEND_NOTIFICATION:
			await sendNotification(event.data.idSubscription, event.data.type, event.data.days);
			return;
		case EventType.SUBSCRIPTION_RENEW:
			await renewSubscription(event.data.idSubscription);
			return;
		default:
			return;
	}
};
