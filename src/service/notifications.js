const moment = require("moment");
const { subscriptionAPISendEmail } = require("../api/subscriptions");
const { insertOne } = require("../utils/mongodb");
const { createEvent, EventType } = require("./events");
const { findOneByCode } = require("../utils/mongodb");
const { createErrorLog, createSuccessLog } = require("./logs");
const { verifySubscriptionStatus } = require("./subscriptions");

const COLLECTION = "notifications";

const NotificationType = Object.freeze({
	NOTICE_RENEWAL: "NOTICERENEWAL",
	PAYMENT_CONFIRMATION: "PAYMENTCONFIRMATION",
});

exports.scheduleNotification = async function (idSubscription, type, scheduledDate) {
	await createEvent(EventType.SEND_NOTIFICATION, { idSubscription, type }, scheduledDate);
};

exports.sendNotification = async function (idSubscription, type, days = 3) {
	try {
		const subscription = await verifySubscriptionStatus(idSubscription);
		if (!subscription) return false;

		const { customer } = subscription;

		days = days - 1;
		const dateRenewal = moment().add(days, "days");
		const dateRenewalFormat = dateRenewal.format("DD/MM/YYYY");

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
				nextCollectionDate: dateRenewalFormat,
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
				dateofrenovation: dateRenewalFormat,
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
			let renewalDate = moment().add(1, "days").format("YYYY-MM-DD HH:mm:ss");
			// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
			if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
				renewalDate = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
			if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 3) {
				renewalDate = moment().add(3, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
			if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 6) {
				renewalDate = moment().add(6, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
			if (days > 0) {
				await createEvent(
					EventType.SEND_NOTIFICATION,
					{ idSubscription, type: "NOTICE_RENEWAL", days: days },
					renewalDate
				);
			} else {
				await createEvent(EventType.SUBSCRIPTION_RENEW, { idSubscription }, renewalDate);
			}
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
