const moment = require("moment");
const client = require("../database/mongodb");
const { insertOne, verifyCreateIndex, findOneByCode } = require("../utils/mongodb");
const { createEvent, EventType } = require("./events");
const { verifySubscriptionStatus } = require("./subscriptions");
const { shipmentAPICreate, shipmentAPINotify } = require("../api/shipments");
const { createNewPaymentEvent } = require("../api/payments");
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
	try {
		let repeat = false;
		let possibleError = false;
		console.log("INICIAR DESPACHO");
		const subscription = await verifySubscriptionStatus(idSubscription);
		if (subscription) {
			if (!attempts) {
				const { isOk, shipment } = await shipmentAPINotify(idSubscription, {
					typeIdentification: 1,
					identification: subscription.beneficiary.identification,
					firstName: subscription.beneficiary.firstName,
					lastName: subscription.beneficiary.lastName,
					emailAddress: subscription.beneficiary.emailAddress,
					address: subscription.beneficiary.address,
					address2: subscription.beneficiary.address2,
					adReference: subscription.beneficiary.adReference,
					city: subscription.beneficiary.city,
					country: subscription.beneficiary.country,
					phoneNumber: subscription.beneficiary.phoneNumber,
					postalCode: subscription.beneficiary.postalCode,
					idCourier: "1",
					courierName: "Chilepost",
					deliveryDate: "",
					approvalDelivey: "",
					deliveryStatus: "",
					locality: "Huechuraba",
				});
				if (isOk) {
					const { _id: shipmentId } = await createShipment({ ...shipment, idSubscription });
					await createSuccessLog(idSubscription, "Se creó el despacho", { shipmentId, shipment });

					const { isOk, data } = await shipmentAPICreate(idSubscription);
					if (isOk && data.hasError == false) {
						await createSuccessLog(idSubscription, "Se notificó a la API del despacho", { shipmentId });

						const shipments = await listShipmentsBySubscription(idSubscription);
						// FIX: API deberia devolver si existen mas envios? ahora se esta tomando "frequency" de la suscripción
						/*if (subscription.frequency != shipments.length) {
							await createEvent(EventType.SHIPMENT_DISPATCHED, { idSubscription }, shipment.delivery_date)
							await createSuccessLog(idSubscription, "Se reprogramó un nuevo despacho", { delivery_date: convertUTC(shipment.delivery_date) })
						} else {
							await createInfoLog(idSubscription, "No hay mas despachos en esta suscripción", { frequency: subscription.frequency, totalShipments: shipments.length })
						}*/

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
						});

						await createNewPaymentEvent(idSubscription, subscription);

						return;
					} else {
						repeat = true;
						possibleError = data;
						await createErrorLog(idSubscription, "Hubo un error al informar del despacho", { shipmentId });
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
					});

					await createNewPaymentEvent(idSubscription, subscription);

					return;
				} else {
					repeat = true;
					possibleError = data;
					await createErrorLog(idSubscription, "Hubo un error al informar del despacho");
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
				// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
				if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
					newAttempDate = moment().add(5, "minutes").toDate();
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
		console.error(error);
	}
};
