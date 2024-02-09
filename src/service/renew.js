const { verifySubscriptionStatus, renewalSubscription } = require("./subscriptions");
const { subscriptionAPISendEmail, subscriptionAPIRenewal } = require("../api/subscriptions");
const { subscriptionAPIMailError } = require("../api/subscriptions");
const { createErrorLog, createSuccessLog } = require("./logs");
const { createEvent, EventType } = require("../service/events");
const { findOneByCode } = require("../utils/mongodb");
const { CONFIG_CODES } = require("../utils/constants");
const moment = require("moment");

exports.renewSubscription = async (idSubscription, stage = "", attempt = 0) => {
	let idAccount = 0;
	let bodyEmail = {};
	try {
		const { value: digevoSpeed } = await findOneByCode(CONFIG_CODES.DIGEVO_SPEED);
		const subscription = await verifySubscriptionStatus(idSubscription);
		if (subscription) {
			idAccount = subscription.account.idAccount;
			if (subscription.autoRenew !== true) {
				await createSuccessLog(idSubscription, "No se notifica porque estado de autoRenew no es true", {
					autoRenew: subscription.autoRenew,
				});
				return false;
			}
			const { customer } = subscription;
			//await renewalSubscription(idSubscription);
			if (stage === "") {
				const { isOk, content } = await subscriptionAPIRenewal(idSubscription);
				if (isOk !== true) {
					const { value: renewalRetries } = await findOneByCode(CONFIG_CODES.RENEWAL_RETRIES);
					if (renewalRetries <= attempt) {
						await createErrorLog(
							idSubscription,
							"No se pudo generar la renovación, no se programa reintento",
							{
								renewalRetries,
								attempt,
							}
						);
						return false;
					}
					await createErrorLog(
						idSubscription,
						"No se pudo generar la renovación, se programa nuevo reintento",
						{
							renewalRetries,
							attempt,
						}
					);
					let scheduledDate = moment().add(1, "days").format("YYYY-MM-DD HH:mm:ss");
					if (digevoSpeed == "1") {
						// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
						if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
							scheduledDate = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
						}
						if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 3) {
							scheduledDate = moment().add(3, "minutes").format("YYYY-MM-DD HH:mm:ss");
						}
						if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 6) {
							scheduledDate = moment().add(6, "minutes").format("YYYY-MM-DD HH:mm:ss");
						}
					}

					await createEvent(
						EventType.SUBSCRIPTION_RENEW,
						{ idSubscription, attempt: attempt + 1, stage: "" },
						scheduledDate
					);
					return false;
				}
			}
			bodyEmail = {
				to: customer.emailAddress,
				type: "html",
				subject: "Renovación de Suscripción exitosa",
				customFrom: "drojas@digevo.com",
				fromName: "RyK",
				body: {
					amountCuote: subscription.unitAmount,
					customer: customer.firstName + " " + customer.lastName,
					document: customer.identification,
					fullValuePlan: subscription.totalAmountToPay,
					dateofrenovation: moment().format("DD/MM/YYYY"),
					dateofpayment: moment().format("DD/MM/YYYY"),
					numberOfInstallments: "",
					plan: subscription.description,
					shippingAddress: customer.address + ", " + customer.address2 + ", " + customer.city,
				},
				idAccount: subscription.account.idAccount,
				operation: "RENEWALSUBSCRIPTION",
				idSubscription: idSubscription,
			};
			const { isOk: isOkEmail, content: contentEmail } = await subscriptionAPISendEmail(bodyEmail);
			if (isOkEmail !== true) {
				const { value: renewalRetries } = await findOneByCode(CONFIG_CODES.RENEWAL_SUCCESS_RETRIES);
				if (renewalRetries <= attempt) {
					await createErrorLog(
						idSubscription,
						"No se pudo generar la notificación de renovación, no se programa reintento de correo",
						{
							renewalRetries,
							attempt,
						}
					);
					return false;
				}
				await createErrorLog(
					idSubscription,
					"No se pudo generar la notificación de renovación, se programa nuevo reintento de correo",
					{
						renewalRetries,
						attempt,
					}
				);
				let scheduledDate = moment().add(1, "days").format("YYYY-MM-DD HH:mm:ss");
				if (digevoSpeed == "1") {
					// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
					if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
						scheduledDate = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
					}
					if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 3) {
						scheduledDate = moment().add(3, "minutes").format("YYYY-MM-DD HH:mm:ss");
					}
					if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 6) {
						scheduledDate = moment().add(6, "minutes").format("YYYY-MM-DD HH:mm:ss");
					}
				}

				if (stage === "") attempt = 0;
				await createEvent(
					EventType.SUBSCRIPTION_RENEW,
					{ idSubscription, attempt: attempt + 1, stage: "NOTICE" },
					scheduledDate
				);
				return false;
			}
			await createSuccessLog(idSubscription, "Se renovó correctamente siguiendo todo el proceso", {
				idSubscription,
			});
		} else {
			let errorText = `Suscripción:
			${idSubscription}
			
			fecha-hora:
			${moment().format("YYYY-MM-DD HH:mm:ss")}
			
			Evento:
			RENEW_SUBSCRIPTION
						
			Punto:
			${"/subscription/detail"}
			
			Error capturado:
			${"/subscription/detail not found"}`;

			await subscriptionAPIMailError(idSubscription, idAccount, errorText);

			await createErrorLog(idSubscription, "No se pudo crear el despacho");
		}
	} catch (err) {
		console.error(err);
		await createErrorLog(idSubscription, "No se pudo generar la renovación", {
			bodyEmail,
			error: JSON.stringify(err),
		});

		let errorText = `Suscripción:
		${idSubscription}
		
		fecha-hora:
		${moment().format("YYYY-MM-DD HH:mm:ss")}
		
		Evento:
		RENEW_SUBSCRIPTION
		
		Error capturado:
		${error.toString()}`;

		await subscriptionAPIMailError(idSubscription, idAccount, errorText);
	}
};
