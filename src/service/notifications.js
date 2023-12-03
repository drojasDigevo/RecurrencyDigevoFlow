const moment = require("moment");
const { subscriptionAPISendEmail } = require("../api/subscriptions");
const { insertOne, findOneByCode } = require("../utils/mongodb");
const { CONFIG_CODES } = require("../utils/constants");
const { createEvent, EventType } = require("./events");
const { createErrorLog, createSuccessLog } = require("./logs");
const { verifySubscriptionStatus } = require("./subscriptions");

const COLLECTION = "notifications";

const NotificationType = Object.freeze({
	NOTICE_RENEWAL: "NOTICE_RENEWAL",
	PAYMENT_CONFIRMATION: "PAYMENTCONFIRMATION",
});

exports.scheduleNotification = async function (idSubscription, type, scheduledDate) {
	await createEvent(EventType.SEND_NOTIFICATION, { idSubscription, type }, scheduledDate);
};

exports.sendNotification = async function (idSubscription, type, days = 3, renewalDate = null, attemp = 0) {
	const { value: digevoSpeed } = await findOneByCode(CONFIG_CODES.DIGEVO_SPEED);
	let tmpData = {};
	try {
		const subscription = await verifySubscriptionStatus(idSubscription);
		if (!subscription) return false;

		if (subscription.autoRenew !== true) {
			await createSuccessLog(idSubscription, "No se notifica porque estado de autoRenew no es true", {
				autoRenew: subscription.autoRenew,
			});
			return false;
		}
		const { value: renewalNoticeRetries } = await findOneByCode(CONFIG_CODES.RENEWAL_NOTICE_RETRIES);
		if (renewalNoticeRetries <= attemp) {
			await createSuccessLog(idSubscription, "No se notifica porque se alcanzó el máximo de reintentos", {
				renewalNoticeRetries,
				attemp,
			});
			return false;
		}

		const { customer } = subscription;

		const dateRenewal = renewalDate ? moment(renewalDate) : moment();
		const dateRenewalFormat = dateRenewal.format("DD/MM/YYYY");

		const sendData = {
			to: customer.emailAddress,
			type: "html",
			customFrom: "drojas@digevo.com",
			fromName: "RyK",
			idAccount: subscription.account.idAccount,
			idSubscription: idSubscription,
		};

		if (type === NotificationType.NOTICE_RENEWAL) {
			sendData.subject = "Tu suscripción está por renovarse";
			sendData.body = {
				amountCuote: subscription.unitAmount,
				customer: customer.firstName + " " + customer.lastName,
				document: customer.identification,
				fullValuePlan: subscription.totalAmountToPay,
				nextCollectionDate: dateRenewalFormat,
				numberOfInstallments: "",
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
				numberOfInstallments: "",
				plan: subscription.description,
				shippingAddress: customer.address + ", " + customer.address2 + ", " + customer.city,
			};
			sendData.operation = "PAYMENTCONFIRMATION";
		}
		tmpData = sendData;

		const { isOk, content } = await subscriptionAPISendEmail(sendData);
		if (isOk) {
			const { insertedId: notificationId } = await insertOne(COLLECTION, {
				type,
				idSubscription,
				body: sendData,
			});
			await createSuccessLog(idSubscription, "Se notificó correctamente", { notificationId });
			return { _id: notificationId };
		} else {
			let newDate2Notify = moment().add(1, "days").format("YYYY-MM-DD HH:mm:ss");
			if(digevoSpeed == "1"){
				// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
				if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
					newDate2Notify = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
				}
				if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 3) {
					newDate2Notify = moment().add(3, "minutes").format("YYYY-MM-DD HH:mm:ss");
				}
				if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 6) {
					newDate2Notify = moment().add(6, "minutes").format("YYYY-MM-DD HH:mm:ss");
				}
			}

			await createEvent(
				EventType.SEND_NOTIFICATION,
				{ idSubscription, type: "NOTICE_RENEWAL", days: days, attempts: attemp + 1, renewalDate },
				newDate2Notify
			);
			await createErrorLog(idSubscription, "No se logró notificar, se agenda reintento", { type, body: content });
			return false;
		}
	} catch (error) {
		await createErrorLog(idSubscription, "Ocurrio un error inesperado al notificar", {
			name: error.name,
			type,
			message: error.message,
			body: tmpData,
		});
		console.error(error);
	}
};
