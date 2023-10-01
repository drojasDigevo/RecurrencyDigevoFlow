const { subscriptionAPISendEmail } = require("../api/subscriptions");
const { insertOne } = require("../utils/mongodb");
const { createEvent, EventType } = require("./events");
const { createErrorLog, createSuccessLog } = require("./logs");
const { loadSubscriptionFromAPI } = require("./subscriptions");

const COLLECTION = "notifications";

const NotificationType = Object.freeze({
	NOTICE_RENEWAL: "NOTICERENEWAL",
	PAYMENT_CONFIRMATION: "PAYMENTCONFIRMATION",
});

exports.scheduleNotification = async function (idSubscription, type, scheduledDate) {
	await createEvent(EventType.SEND_NOTIFICATION, { idSubscription, type }, scheduledDate);
};

exports.sendNotification = async function (idSubscription, type, attemps = 1) {
	try {
		const subscription = loadSubscriptionFromAPI(idSubscription);
		if (!subscription) return false;

		const { customer } = subscription;

		const sendData = {
			to: customer.emailAddress,
			type: "html",
			customFrom: "drojas@digevo.com",
			fromName: "RyK",
			idAccount: 1,
		};

		if (type === NotificationType.NOTICE_RENEWAL) {
			sendData.subject = "Tu suscripción está por renovarse";
			sendData.body = {
				amountCuote: subscription.unitAmount,
				customer: customer.firstName + " " + customer.lastName,
				document: customer.identification,
				fullValuePlan: subscription.totalAmountToPay,
				nextCollectionDate: "01/02/2024", //FIX: calcular fecha
				numberOfInstallments: " 2 de 2",
				plan: subscription.description,
				shippingAddress: customer.address + ", " + customer.address2 + ", " + customer.city,
			};
			sendData.operation = "NOTICERENEWAL";
		} else if (type === NotificationType.PAYMENT_CONFIRMATION) {
			sendData.subject = "Confirmación de cobro";
			sendData.body = {
				amountCuote: subscription.unitAmount,
				customer: customer.firstName + " " + customer.lastName,
				document: customer.identification,
				fullValuePlan: subscription.totalAmountToPay,
				dateofrenovation: "09/04/2024",
				numberOfInstallments: " 2 de 2",
				plan: subscription.description,
				shippingAddress: customer.address + ", " + customer.address2 + ", " + customer.city,
			};
			sendData.operation = "PAYMENTCONFIRMATION";
		}

		const sended = await subscriptionAPISendEmail(sendData);
		if (sended) {
			const { insertedId: notificationId } = await insertOne(COLLECTION, {
				type,
				idSubscription,
				body: sendData,
			});
			await createSuccessLog(idSubscription, "Se notificó correctamente", { notificationId });
			// TODO: si hay otra notificacion crear evento
			// TODO: si NO hay otra notificacion renovar la suscripción
			return { _id: notificationId };
		}
		await createErrorLog(idSubscription, "No se logró notificar", { type, body: sendData });
		return false;
	} catch (error) {
		await createErrorLog(idSubscription, "Ocurrio un error inesperado al notificar", {
			name: error.name,
			message: error.message,
		});
		console.error(error);
	}
};
