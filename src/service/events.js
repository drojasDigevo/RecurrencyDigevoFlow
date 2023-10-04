const { scheduleMessage, cancelScheduledMessage } = require("../ServiceBusSender");
const client = require("../database/mongodb");
const { ObjectId, Long } = require("mongodb");
const { convertUTC, momentUTC } = require("../utils/dates");
const { insertOne, updateOne, verifyCreateIndex, updateManyFilter, findWithPagination } = require("../utils/mongodb");
const { createErrorLog } = require("./logs");

const COLLECTION = "events";
const collection = client.collection(COLLECTION);

/**
 * Un evento es un intermediario para crear envios de ServiceBus,
 * envia mensajes con acciones y mantiene registros de todos los envios
 *
 * EventType: Determina las acciones a realizar en el ServiceBus Receiver
 */

exports.EventType = Object.freeze({
	SUBSCRIPTION_CREATED: "SUBSCRIPTION_CREATED", // Define primeros eventos a encolar
	SHIPMENT_DISPATCHED: "SHIPMENT_DISPATCHED",
	PAYMENT_ATTEMPT: "PAYMENT_ATTEMPT",
	SEND_NOTIFICATION: "SEND_NOTIFICATION",
	SUBSCRIPTION_RENEW: "SUBSCRIPTION_RENEW",
});

const EventStatus = Object.freeze({
	CREATED: "CREATED",
	RECEIVED: "RECEIVED",
	CANCELLED: "CANCELLED",
});
exports.EventStatus = EventStatus;

exports.listEvent = async function (conditions, page, perPage) {
	try {
		await verifyCreateIndex(COLLECTION, "updatedAt");
		const sort = { updatedAt: -1 };
		const result = await findWithPagination(COLLECTION, conditions, {}, sort, page, perPage);
		return result;
	} catch (error) {
		console.error(error);
	}
};

exports.getEvent = async function (id) {
	try {
		const result = await collection.findOne({ _id: new ObjectId(id) });
		return result;
	} catch (error) {
		console.error(error);
	}
};

exports.getReceivedEvent = async function (id) {
	try {
		await updateOne(COLLECTION, id, { status: EventStatus.RECEIVED });
		const result = await collection.findOne({ _id: new ObjectId(id) });
		return result;
	} catch (error) {
		console.error(error);
	}
};

function formatMessage(id, type) {
	return {
		messageId: String(id),
		contentType: "application/json",
		body: { type },
	};
}

exports.createEvent = async function (type, data, scheduledTime) {
	try {
		const scheduledDate = scheduledTime ? convertUTC(scheduledTime) : momentUTC();
		const { insertedId } = await insertOne(COLLECTION, {
			type,
			data: data,
			status: EventStatus.CREATED,
			scheduledEnqueueTimeUtc: scheduledDate,
		});
		const message = formatMessage(insertedId, type, scheduledDate);
		const response = await scheduleMessage(message, scheduledDate);
		const sequenceNumber = new Long(response.low, response.high, response.unsigned);
		const { modifiedCount } = await updateOne(COLLECTION, insertedId, { sequenceNumber });
		if (modifiedCount === 1) {
			return { _id: insertedId };
		} else {
			await createErrorLog(data.idSubscription, "No se actualizó el sequenceNumber del evento", {
				insertedId,
				sequenceNumber,
			});
			return false;
		}
	} catch (error) {
		await createErrorLog(data.idSubscription, "Ocurrio un error inesperado al crear un evento", error);
		throw error;
	}
};

exports.cancelEvent = async function (id) {
	try {
		const event = await collection.findOne(
			{
				$and: [{ _id: new ObjectId(id) }, { status: EventStatus.CREATED }],
			},
			{ sequenceNumber: 1 }
		);
		if (event) {
			await cancelScheduledMessage(Long.fromInt(event.sequenceNumber));
			await updateOne(COLLECTION, id, { status: EventStatus.CANCELLED });
		}
	} catch (error) {
		console.error(error);
	}
};

exports.cancelManyEventsBySubscription = async function (idSubscription) {
	try {
		const events = await collection
			.find(
				{
					$and: [{ "data.idSubscription": idSubscription }, { status: EventStatus.CREATED }],
				},
				{ sequenceNumber: 1 }
			)
			.toArray();
		const sequenceNumbers = events
			.map((event) => event.sequenceNumber)
			.filter((sn) => sn != null)
			.map((value) => Long.fromInt(value));
		if (sequenceNumbers?.length > 0) {
			await cancelScheduledMessage(sequenceNumbers);
			await updateManyFilter(
				COLLECTION,
				{
					$and: [{ "data.idSubscription": idSubscription }, { status: EventStatus.CREATED }],
				},
				{ status: EventStatus.CANCELLED }
			);
		}
	} catch (error) {
		console.error(error);
	}
};
