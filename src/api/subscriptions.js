const InstanceAPI = require("../utils/axios");

const CODE_SUBSCRIPTION = process.env.CODE_SUBSCRIPTION || "FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==";
const BEARER_SUBSCRIPTION =
	process.env.BEARER_SUBSCRIPTION || "Bearer ADJKDFJKJF52554FKJDKJKIF---**FJHDJHJDHJHDJHDKLF5";

exports.getAPISubscription = async function (idSubscription) {
	try {
		const response = await InstanceAPI.post(`/subscription/detail?code=${CODE_SUBSCRIPTION}`, {
			idSubscription: idSubscription,
		});
		if (response?.data) {
			const { statusCode, content } = response.data;
			if (statusCode === 200) return content;
		}
		throw new Error("Error API /subscription/detail");
	} catch (error) {
		throw error;
	}
};

exports.subscriptionAPISendEmail = async function (body) {
	try {
		const response = await InstanceAPI.post(`/subscription/send_email?code=${CODE_SUBSCRIPTION}`, body, {
			headers: { Authorization: BEARER_SUBSCRIPTION },
		});
		if (response?.data) {
			const { statusCode, content } = response.data;
			if (statusCode === 200) return { isOk: true, content };
		}
		//throw new Error("Error API /subscription/send_email");
		return { isOk: false, content: response.data };
	} catch (error) {
		//throw error.response.data;
		return { isOk: false, content: error.response.data };
	}
};

exports.subscriptionAPIRenewal = async function (idSubscription) {
	try {
		const response = await InstanceAPI.post(`/subscription/create_renewal?code=${CODE_SUBSCRIPTION}`, {
			idSubscription: idSubscription,
		});
		if (response?.data) {
			const { statusCode, content } = response.data;
			if (statusCode === 200) return { isOk: true, content };
		}
		//throw new Error("Error API /subscription/detail");
		return { isOk: false, content: response.data };
	} catch (error) {
		//throw error;
		return { isOk: false, content: error.response.data };
	}
};

exports.subscriptionAPILayOff = async function (idSubscription) {
	try {
		const response = await InstanceAPI.post(`/subscription/lay_off?code=${CODE_SUBSCRIPTION}`, {
			idSubscription: idSubscription,
			idReason: 2,
			subReason: 6,
			description: "Suspendido por razones varias",
		});
		if (response?.data) {
			const { statusCode, content } = response.data;
			if (statusCode === 200) return content;
		}
		throw new Error("Error API /subscription/lay_off");
	} catch (error) {
		throw error;
	}
};

exports.subscriptionAPIMailError = async function (idSubscription, idAccount, observation) {
	try {
		const response = await InstanceAPI.post(
			`/subscription/send_email?code=${CODE_SUBSCRIPTION}`,
			{
				idSubscription: idSubscription,
				to: "drojas@digevo.com",
				type: "html",
				customFrom: "drojas@digevo.com",
				fromName: "RyK",
				idAccount: idAccount,
				subject: "Error Sistema recurrencia",
				body: {
					observation: observation,
				},
				operation: "ERRORADMIN",
			},
			{
				headers: { Authorization: BEARER_SUBSCRIPTION },
			}
		);
		if (response?.data) {
			const { statusCode, content } = response.data;
			if (statusCode === 200) return content;
		}
		throw new Error("Error API /subscription/send_email");
	} catch (error) {
		throw error;
	}
};
