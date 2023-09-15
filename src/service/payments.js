const moment = require("moment-timezone");
const client = require("../database/mongodb");
const { insertOne } = require("../utils/mongodb");
const { createEvent, EventType } = require("./events");
const { verifySubscriptionStatus, cancelSubscription } = require("./subscriptions");
const { paymentAPICollect, paymentAPINotify, sendMailSuccessfull } = require("../api/payments");
const { getConfigByCode } = require("./config");
const { CONFIG_CODES } = require("../utils/constants");
const { createErrorLog, createSuccessLog, createInfoLog } = require("./logs");
const { convertUTC } = require("../utils/dates");

const COLLECTION = "payments";
const collection = client.collection(COLLECTION);

const PaymentStatus = Object.freeze({
	PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
});

async function createPayment(data) {
	const { insertedId } = await insertOne(COLLECTION, data);
	return { _id: insertedId };
}

async function listPaymentsBySubscription(idSubscription) {
	const result = await collection.find({ idSubscription }).toArray();
	return result;
}

exports.attemptPaymentBySubscription = async function (idSubscription, attempts) {
	try {
		const subscription = await verifySubscriptionStatus(idSubscription);
		if (subscription) {
			let nextDate = payment.next_payment_date;
			if (!nextDate) {
				if (subscription.frequencyType.name == "Mensual") {
					nextDate = moment().add(subscription.frequency, "months").format("YYYY-MM-DD HH:mm:ss");
				} else if (subscription.frequencyType.name == "Semestral") {
					nextDate = moment()
						.add(subscription.frequency * 6, "months")
						.format("YYYY-MM-DD HH:mm:ss");
				} else if (subscription.frequencyType.name == "Anual") {
					nextDate = moment().add(subscription.frequency, "years").format("YYYY-MM-DD HH:mm:ss");
				}
				// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
				if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
					nextDate = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
				}
			}

			const { isOk, payment } = await paymentAPICollect(
				subscription.paymentMethod.gatewayToken,
				subscription.unitAmount,
				idSubscription
			);

			if (isOk) {
				const { _id: paymentId } = await createPayment({ ...payment, idSubscription });
				await createSuccessLog(idSubscription, "Se creó el cobro", { paymentId });

				const notified = await paymentAPINotify(idSubscription, payment, {
					status: "approved",
					status_detail: "Approved detail",
				});
				if (notified) {
					await createSuccessLog(idSubscription, "Se notificó a la API de cobros", { paymentId });

					const { _id: eventShipmentId } = await createEvent(EventType.SHIPMENT_DISPATCHED, {
						idSubscription,
					});
					await createSuccessLog(idSubscription, "Se crearon nuevos eventos", { eventShipmentId });
				} else {
					await createErrorLog(idSubscription, "Hubo un error al informar del cobro", { paymentId });
				}

				const payments = subscription.paymentHistory.filter((payment) => payment.status == "approved");
				// FIX: API deberia devolver si existen mas pagos? ahora se esta tomando "frequency" de la suscripción
				let totalIterations = subscription.totalQuantity;
				if (subscription.frequencyType.name == "Mensual") {
					totalIterations = 12 / subscription.frequency;
				} else if (subscription.frequencyType.name == "Semestral") {
					//totalIterations = 6 / subscription.frequency;
				} else if (subscription.frequencyType.name == "Anual") {
					//totalIterations = 1;
				}
				if (totalIterations > payments.length) {
					await createEvent(EventType.PAYMENT_ATTEMPT, { idSubscription, attempts: 1 }, nextDate);
				}

				await sendMailSuccessfull({
					to: subscription.customer.emailAddress,
					type: "html",
					subject: "Buenas noticias",
					customFrom: "drojas@digevo.com",
					fromName: "RyK",
					body: {
						amountCuote: subscription.unitAmount,
						customer: subscription.customer.firstName + " " + subscription.customer.lastName,
						document: subscription.customer.identification,
						fullValuePlan: subscription.totalAmountToPay,
						nextCollectionDate: nextDate,
						dateofpayment: moment().format("DD/MM/YYYY"),
						numberOfInstallments: "1 de 1",
						plan: subscription.description,
						shippingAddress:
							subscription.beneficiary.address +
							", " +
							subscription.beneficiary.address2 +
							", " +
							subscription.beneficiary.city,
					},
					idAccount: subscription.account.idAccount,
					operation: "SUCCESSFULPAYMENT",
				});
			} else {
				await createInfoLog(idSubscription, "Intento de cobro fallido", { attempts });

				const errorStatus = {
					status: payment.status || "rejected",
					status_detail: payment.status_detail || "Failed detail",
				};
				errorStatus.status = errorStatus.status + "";
				errorStatus.status_detail = errorStatus.status_detail + "";
				await paymentAPINotify(
					idSubscription,
					{
						id_user_external: subscription.paymentMethod.idUserExternal,
						auth_code: subscription.paymentMethod.authCode,
						card_type: subscription.paymentMethod.cardType,
						expMonth: "",
						expYear: "",
						last_four: subscription.paymentMethod.lastFour,
						cardCategory: "",
						source: subscription.paymentMethod.paymentType,
						commerce_code: subscription.paymentMethod.commerceCode,
						transbank_user: subscription.paymentMethod.gatewayToken,
						payment_date: moment().format("YYYY-MM-DD HH:mm:ss"),
						installments: 1,
						amount: subscription.unitAmount,
					},
					errorStatus
				);

				await sendMailSuccessfull({
					to: subscription.customer.emailAddress,
					type: "html",
					subject: "Problema con el pago",
					customFrom: "drojas@digevo.com",
					fromName: "RyK",
					idAccount: subscription.account.idAccount,
					operation: "PROBLEMPAYMENT",
				});

				const configTotalAttempts = await getConfigByCode(CONFIG_CODES.PAYMENT_NUMBER_OF_ATTEMPTS);
				const totalAttempts = Number(configTotalAttempts.value);

				if (totalAttempts > attempts) {
					const now = moment();
					const configPlusHours = await getConfigByCode(CONFIG_CODES.PAYMENT_FREQUENCY_OF_ATTEMPTS_HOURS);
					const plusHours = Number(configPlusHours.value);
					let dateRetry = now.clone().add(moment.duration(plusHours, "hours"));
					// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
					if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
						dateRetry = now.clone().add(moment.duration(1, "minutes"));
					}

					await createEvent(EventType.PAYMENT_ATTEMPT, { idSubscription, attempts: attempts + 1 }, dateRetry);
					await createInfoLog(idSubscription, "Intento de cobro reprogramado", {
						attempts: attempts + 1,
						dateRetry: convertUTC(dateRetry),
					});
				} else {
					await createErrorLog(
						idSubscription,
						"Limite de intentos de cobro fallidos, se cancelará la suscripción",
						{ attempts }
					);
					await cancelSubscription(idSubscription, true);
				}
			}
		} else {
			await createErrorLog(idSubscription, "No se pudo ejecutar el intento de cobro");
		}
	} catch (error) {
		await createErrorLog(idSubscription, "Ocurrio un error inesperado al ejecutar el cobro", {
			name: error.name,
			message: error.message,
		});
		console.error(error);
	}
};
