const client = require("../database/mongodb");
const { insertOne, verifyCreateIndex, findOneByCode } = require("../utils/mongodb");
const { createEvent, EventType } = require("./events");
const { verifySubscriptionStatus } = require("./subscriptions");
const { shipmentAPICreate, shipmentAPINotify } = require("../api/shipments");
const { createErrorLog, createSuccessLog, createInfoLog } = require("./logs");
const { convertUTC } = require("../utils/dates");
const { CONFIG_CODES } = require("../utils/constants");

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

exports.createShipmentBySubscription = async function (idSubscription, attempts = 1) {
	try {
		console.log("INICIAR DESPACHO");
		const subscription = await verifySubscriptionStatus(idSubscription);
		if (subscription) {
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

				const notified = await shipmentAPICreate(idSubscription);
				if (notified) {
					await createSuccessLog(idSubscription, "Se notificó a la API del despacho", { shipmentId });
				} else {
					await createErrorLog(idSubscription, "Hubo un error al informar del despacho", { shipmentId });
				}

				const shipments = await listShipmentsBySubscription(idSubscription);
				// FIX: API deberia devolver si existen mas envios? ahora se esta tomando "frequency" de la suscripción
				/*if (subscription.frequency != shipments.length) {
                    await createEvent(EventType.SHIPMENT_DISPATCHED, { idSubscription }, shipment.delivery_date)
                    await createSuccessLog(idSubscription, "Se reprogramó un nuevo despacho", { delivery_date: convertUTC(shipment.delivery_date) })
                } else {
                    await createInfoLog(idSubscription, "No hay mas despachos en esta suscripción", { frequency: subscription.frequency, totalShipments: shipments.length })
                }*/

				return;
			} else {
				const shipmentFailMax = await findOneByCode(CONFIG_CODES.SHIPMENT_FAIL_MAX);
				const shipmentFailFrequency = await findOneByCode(CONFIG_CODES.SHIPMENT_FAIL_FREQUENCY);
				const shipmentFailUom = await findOneByCode(CONFIG_CODES.SHIPMENT_FAIL_UOM);
				if (isNaN(attempts)) attempts = 1;
				else attempts++;
				if (attempts > shipmentFailMax) {
					return await createErrorLog(idSubscription, "Se hizo el máximo de reintentos en despacho");
				}
				const newAttempDate = moment().add(shipmentFailFrequency, shipmentFailUom).toDate();
				await createEvent(EventType.SHIPMENT_DISPATCHED, { idSubscription, attempts }, newAttempDate);
				await createErrorLog(idSubscription, "Ocurrio un error inesperado al crear el despacho", {
					shipment: err instanceof Error ? shipment.toString() : JSON.stringify(shipment),
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
