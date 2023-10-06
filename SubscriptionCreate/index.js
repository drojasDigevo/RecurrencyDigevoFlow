const { createSubscription, findSubscriptionByIdSubscription } = require("../src/service/subscriptions");

module.exports = async function (context, req) {
	try {
		context.res = {
			headers: {
				"Content-Type": "application/json",
			},
			status: 202,
			body: { ok: false },
		};

		const body = req.body;

		const { idSubscription } = body;

		if (!idSubscription) {
			context.res.status = 400;
			context.res.body = { ok: false, message: "Falta el campo 'idSubscription'" };
			return;
		}

		/*const subExists = await findSubscriptionByIdSubscription(idSubscription);
		if (subExists) {
			context.res.status = 400;
			context.res.body = {
				ok: false,
				message: `Ya existe una suscripción con idSubscription: ${idSubscription}`,
			};
			return;
		}*/

		const result = await createSubscription(idSubscription);
		context.res.status = 200;
		context.res.body = { ok: true, message: "Suscripción creada correctamente", data: result };
	} catch (error) {
		context.res = {
			headers: {
				"Content-Type": "application/json",
			},
			status: 500,
			body: { ok: false, message: "Hubo un error inesperado", data: error },
		};
	}
};
