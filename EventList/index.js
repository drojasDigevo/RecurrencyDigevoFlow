const { listEvent, EventStatus, EventType } = require("../src/service/events");

module.exports = async function (context, req) {
	try {
		const { type, status, "data.idSubscription": idSubscription, search, page, perPage } = req.query;

		const rules = [];
		if (type) rules.push({ type: EventType[type] });
		if (status) rules.push({ status: EventStatus[status] });
		if (idSubscription) rules.push({ "data.idSubscription": idSubscription });
		if (search) rules.push({ "data.idSubscription": idSubscription });

		let condition = {};
		if (rules.length > 0) condition = { $and: rules };

		const events = await listEvent(condition, Number(page), Number(perPage));

		context.res = {
			headers: {
				"Content-Type": "application/json",
			},
			body: { ok: true, data: events },
		};
	} catch (error) {
		context.res = {
			status: 500,
			body: { ok: false, message: "Hubo un error inesperado", data: error },
		};
	}
};
