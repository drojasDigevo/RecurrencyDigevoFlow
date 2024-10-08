const client = require("../database/mongodb");
const { insertOne, updateOne, findWithPagination, verifyCreateIndex } = require("../utils/mongodb");
const {
	getAPISubscription,
	subscriptionAPILayOff,
	subscriptionAPIRenewal,
	subscriptionAPISendEmail,
} = require("../api/subscriptions");
const { createEvent, EventType, cancelManyEventsBySubscription } = require("./events");
const { createNewPaymentEvent } = require("../api/payments");
const { createErrorLog, createSuccessLog, createInfoLog } = require("./logs");

const COLLECTION = "subscriptions";
const collection = client.collection(COLLECTION);

const SubscriptionStatus = Object.freeze({
	Active: { id: 1, name: "Active" },
	Expired: { id: 2, name: "Expired" },
	Cancelled: { id: 3, name: "Cancelled" },
	Suspended: { id: 4, name: "Suspended" },
	Paused: { id: 5, name: "Paused" },
	Onhold: { id: 6, name: "Onhold" },
});

exports.SubscriptionStatus = SubscriptionStatus;

/**
 * Listado de suscripciones con paginacion
 * @param {number} page - Pagina actual
 * @param {number} perPage - Cantidad de registros por pagina
 * @returns Listado paginado
 */
exports.listSubscription = async function (page, perPage, search = false) {
	try {
		await verifyCreateIndex(COLLECTION, "updatedAt");
		const sort = { updatedAt: -1 };
		const project = {
			idSubscription: 1,
			createdAt: 1,
			updatedAt: 1,
			description: 1,
			"status.name": 1,
			"customer.emailAddress": 1,
		};
		const filter = {};
		if (search) filter.idSubscription = search;
		const result = await findWithPagination(COLLECTION, filter, project, sort, page, perPage);
		return result;
	} catch (error) {
		console.error(error);
	}
};

exports.findSubscriptionByIdSubscription = async function (idSubscription) {
	try {
		const result = await collection.findOne({ idSubscription: idSubscription });
		return result;
	} catch (error) {
		return false;
	}
};

exports.loadSubscriptionFromAPI = async function (idSubscription) {
	try {
		const subscriptionCosmos = await exports.findSubscriptionByIdSubscription(idSubscription);
		const newData = await getAPISubscription(idSubscription);
		await updateOne(COLLECTION, subscriptionCosmos._id, newData);
		return newData;
	} catch (error) {
		throw error;
	}
};

exports.createInitialEvents = async function (idSubscription) {
	try {
		console.log("INICIA CREACION DE EVENTOS SUSCRIPCION", { idSubscription });
		const subscription = await exports.loadSubscriptionFromAPI(idSubscription);
		if (subscription) {
			await createNewPaymentEvent(idSubscription, subscription);
			// TODO: Se comenta temporalmente para invocar desde un pago exitoso			
			await createSuccessLog(idSubscription, "Se crearon eventos iniciales");
		} else {
			await createErrorLog(idSubscription, "No se pudo crear eventos iniciales");
		}
	} catch (error) {
		await createErrorLog(idSubscription, "Ocurrio un error inesperado al crear eventos iniciales", {
			name: error.name,
			message: error.message,
		});
		return false;
	}
};

exports.verifySubscriptionStatus = async function (idSubscription) {
	try {
		const subscription = await exports.loadSubscriptionFromAPI(idSubscription);
		const { status } = subscription;
		if (status.id === SubscriptionStatus.Cancelled.id) {
			await createInfoLog(idSubscription, "Se intentó realizar una accion con una suscripción cancelada");
			return false;
		} else {
			return subscription;
		}
	} catch (error) {
		await createErrorLog(idSubscription, "Ocurrio un error inesperado al verificar el estado de la suscripción", {
			name: error.name,
			message: error.message,
		});
		return false;
	}
};

/**
 * Crear suscripcion
 */
exports.createSubscription = async function (idSubscription) {
	try {
		const { insertedId } = await insertOne(COLLECTION, { idSubscription });
		await createEvent(EventType.SUBSCRIPTION_CREATED, { idSubscription });
		return { _id: insertedId };
	} catch (error) {
		throw error;
	}
};

/**
 * Actualizar suscripcion
 */
exports.updateSubscription = async function (idSubscription) {
	try {
		const isCancel = await exports.cancelSubscription(idSubscription);
		const subscription = await exports.loadSubscriptionFromAPI(idSubscription);
		if (isCancel && subscription) {
			await createEvent(EventType.SUBSCRIPTION_CREATED, { idSubscription: idSubscription });
			return true;
		}
		return false;
	} catch (error) {
		console.error(error);
		return error;
	}
};

/**
 * Renovacion de suscripcion
 */
exports.renewalSubscription = async function (idSubscription) {
	try {
		const response = await subscriptionAPIRenewal(idSubscription);
		if (response) {
			await createSuccessLog(idSubscription, "Se renovó la suscripción");
			return true;
		}
		await createErrorLog(idSubscription, "Hubo un error en el renovó de la suscripción");
		return false;
	} catch (error) {
		console.error(error);
		const errorStr = error.response ? error.response.data : error;
		await createErrorLog(idSubscription, "Hubo un error en el renovó de la suscripción", {
			error: JSON.stringify(errorStr),
		});
		return error;
	}
};

/**
 * Cancelacion de suscripcion
 */
exports.cancelSubscription = async function (idSubscription, shouldCancel = false) {
	try {
		const subscriptionCosmos = await exports.findSubscriptionByIdSubscription(idSubscription);
		let isModified = false;
		if (subscriptionCosmos) {
			if (shouldCancel) await subscriptionAPILayOff(idSubscription);
			/*const cancelled = await subscriptionAPILayOff(idSubscription)
            if (cancelled) {*/
			const { modifiedCount } = await updateOne(COLLECTION, subscriptionCosmos._id, {
				status: SubscriptionStatus.Cancelled,
			});
			isModified = modifiedCount === 1;
			/*} else {
                await createErrorLog(idSubscription, "Hubo un error al cancelar la suscripción")
            }*/
		}
		await cancelManyEventsBySubscription(idSubscription);
		await createSuccessLog(idSubscription, "Se canceló correctamente la suscripción");
		return isModified;
	} catch (error) {
		await createErrorLog(idSubscription, "Ocurrio un error inesperado al cancelar la suscripción", {
			name: error.name,
			message: error.message,
		});
		console.error(error);
	}
};
