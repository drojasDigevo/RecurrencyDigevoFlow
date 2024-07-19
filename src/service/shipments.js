const moment = require("moment");
const client = require("../database/mongodb");
const { insertOne, verifyCreateIndex, findOneByCode } = require("../utils/mongodb");
const { createEvent, EventType } = require("./events");
const { verifySubscriptionStatus } = require("./subscriptions");
//const { subscriptionAPIMailError } = require("../api/subscriptions");
const { shipmentAPICreate, shipmentAPINotify } = require("../api/shipments");
const { createErrorLog, createSuccessLog, createInfoLog } = require("./logs");
const { convertUTC } = require("../utils/dates");
const { CONFIG_CODES } = require("../utils/constants");
const { sendMailSuccessfull } = require("../api/payments");

const COLLECTION = "shipments";
const collection = client.collection(COLLECTION);

const ShipmentStatus = Object.freeze({
	SHIPMENT_CREATED: "SHIPMENT_CREATED",
});

async function createShipment(data) {
	const { insertedId } = await insertOne(COLLECTION, data);
	return { _id: insertedId };
}

async function listShipmentsBySubscription(idSubscription) {
	await verifyCreateIndex(COLLECTION, "delivery_date");
	const result = await collection.find({ idSubscription: idSubscription }).sort({ delivery_date: 1 }).toArray();
	return result;
}

exports.createShipmentBySubscription = async function (idSubscription, attempts = false) {
	let idAccount = 0;
	try {
		const { value: digevoSpeed } = await findOneByCode(CONFIG_CODES.DIGEVO_SPEED);
		let repeat = false;
		let possibleError = false;
		console.log("INICIAR DESPACHO");
		const subscription = await verifySubscriptionStatus(idSubscription);
		if (subscription) {
			idAccount = subscription.account.idAccount;
			if (!attempts) {
				const { isOk, shipment } = await shipmentAPINotify(idSubscription, {
					typeIdentification: 1,
					identification: subscription.shippingSummaryHistory[0].identification,
					firstName: subscription.shippingSummaryHistory[0].firstName,
					lastName: subscription.shippingSummaryHistory[0].lastName,
					emailAddress: subscription.shippingSummaryHistory[0].emailAddress,
					address: subscription.shippingSummaryHistory[0].address,
					address2: subscription.shippingSummaryHistory[0].address2,
					adReference: subscription.shippingSummaryHistory[0].adReference,
					city: subscription.shippingSummaryHistory[0].city,
					country: subscription.shippingSummaryHistory[0].country,
					phoneNumber: subscription.shippingSummaryHistory[0].phoneNumber,
					postalCode: subscription.shippingSummaryHistory[0].postalCode,
					idCourier: subscription.shippingSummaryHistory[0].idCourier,
					courierName: subscription.shippingSummaryHistory[0].courierName,
					deliveryDate: subscription.shippingSummaryHistory[0].deliveryDate,
					approvalDelivey: subscription.shippingSummaryHistory[0].approvalDelivey,
					deliveryStatus: subscription.shippingSummaryHistory[0].deliveryStatus,
					locality: subscription.shippingSummaryHistory[0].locality,
				});
				if (isOk) {
					const { _id: shipmentId } = await createShipment({ ...shipment, idSubscription });
					await createSuccessLog(idSubscription, "Se creó el despacho", {
						shipmentId,
						shipment,
						subscription,
					});

					const { isOk, data } = await shipmentAPICreate(idSubscription);
					if (isOk && data.hasError == false) {
						await createSuccessLog(idSubscription, "Se notificó a la API del despacho", { shipmentId });

						const shipments = await listShipmentsBySubscription(idSubscription);
						// FIX: API deberia devolver si existen mas envios? ahora se esta tomando "frequency" de la suscripción
				
						await sendMailSuccessfull({
							to: subscription.customer.emailAddress,
							type: "html",
							subject: "Despacho programado",
							customFrom: "drojas@digevo.com",
							fromName: "RyK",
							body: {
								customer: subscription.customer.firstName + " " + subscription.customer.lastName,
								document: subscription.customer.identification,
								plan: subscription.description,
								shippingAddress:
									subscription.beneficiary.address +
									", " +
									subscription.beneficiary.address2 +
									", " +
									subscription.beneficiary.city,
							},
							idAccount: subscription.account.idAccount,
							operation: "DISPATCH",
							idSubscription: idSubscription,
						});

						return;
					} else {
						repeat = true;
						possibleError = data;
						await createErrorLog(idSubscription, "Hubo un error al informar del despacho", { shipmentId });
						//await subscriptionAPIMailError(idSubscription, idAccount, "Hubo un error al informar del despacho");
					}
				} else {
					repeat = true;
					possibleError = shipment;
				}
			} else {
				const { isOk, data } = await shipmentAPICreate(idSubscription);
				if (isOk && data.hasError == false) {
					await sendMailSuccessfull({
						to: subscription.customer.emailAddress,
						type: "html",
						subject: "Despacho programado",
						customFrom: "drojas@digevo.com",
						fromName: "RyK",
						body: {
							customer: subscription.customer.firstName + " " + subscription.customer.lastName,
							document: subscription.customer.identification,
							plan: subscription.description,
							shippingAddress:
								subscription.beneficiary.address +
								", " +
								subscription.beneficiary.address2 +
								", " +
								subscription.beneficiary.city,
						},
						idAccount: subscription.account.idAccount,
						operation: "DISPATCH",
						idSubscription: idSubscription,
					});

					return;
				} else {
					repeat = true;
					possibleError = data;
					await createErrorLog(idSubscription, "Hubo un error al informar del despacho");
					//await subscriptionAPIMailError(idSubscription, idAccount, "Hubo un error al informar del despacho");
				}
			}
			if (repeat) {
				const { value: shipmentFailMax } = await findOneByCode(CONFIG_CODES.SHIPMENT_FAIL_MAX);
				const { value: shipmentFailFrequency } = await findOneByCode(CONFIG_CODES.SHIPMENT_FAIL_FREQUENCY);
				const { value: shipmentFailUom } = await findOneByCode(CONFIG_CODES.SHIPMENT_FAIL_UOM);
				if (isNaN(attempts)) attempts = 1;
				else attempts++;
				if (attempts > shipmentFailMax) {
					return await createErrorLog(idSubscription, "Se hizo el máximo de reintentos en despacho");
				}
				let newAttempDate = moment().add(shipmentFailFrequency, shipmentFailUom).toDate();
				
				if(digevoSpeed == "1"){
					// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
					if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
						newAttempDate = moment().add(5, "minutes").toDate();
					}
					if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 3) {
						newAttempDate = moment().add(5, "minutes").toDate();
					}
					if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 6) {
						newAttempDate = moment().add(5, "minutes").toDate();
					}
				}

				await createEvent(EventType.SHIPMENT_DISPATCHED, { idSubscription, attempts }, newAttempDate);
				await createErrorLog(idSubscription, "Ocurrio un error inesperado al crear el despacho", {
					shipment: possibleError instanceof Error ? possibleError.toString() : JSON.stringify(possibleError),
				});
				return await createSuccessLog(idSubscription, "Se reprogramó un nuevo despacho", {
					delivery_date: convertUTC(newAttempDate),
				});
			}
		}
		await createErrorLog(idSubscription, "No se pudo crear el despacho");
	} catch (error) {
		await createErrorLog(idSubscription, "Ocurrio un error inesperado al crear el despacho", {
			name: error.name,
			message: error.message,
		});
		//await subscriptionAPIMailError(idSubscription, idAccount, "Ocurrio un error inesperado al crear el despacho");
		console.error(error);
	}
};
