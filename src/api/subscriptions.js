const InstanceAPI = require("../utils/axios");

exports.getAPISubscription = async function (idSubscription) {
	try {
		const response = await InstanceAPI.post(
			"/subscription/detail?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==",
			{
				idSubscription: idSubscription,
			}
		);
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
		const response = await InstanceAPI.post(
			"/subscription/send_email?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==",
			body,
			{ headers: { Authorization: "Bearer ADJKDFJKJF52554FKJDKJKIF---**FJHDJHJDHJHDJHDKLF5" } }
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

exports.subscriptionAPIRenewal = async function (idSubscription) {
	try {
		const response = await InstanceAPI.post(
			"/subscription/create_renewal?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==",
			{
				idSubscription: idSubscription,
			}
		);
		if (response?.data) {
			const { statusCode, content } = response.data;
			if (statusCode === 200) return content;
		}
		throw new Error("Error API /subscription/detail");
	} catch (error) {
		throw error;
	}
};

exports.subscriptionAPILayOff = async function (idSubscription) {
	try {
		const response = await InstanceAPI.post(
			"/subscription/lay_off?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==",
			{
				idSubscription: idSubscription,
				idReason: 2,
				subReason: 6,
				description: "Suspendido por razones varias",
			}
		);
		if (response?.data) {
			const { statusCode, content } = response.data;
			if (statusCode === 200) return content;
		}
		throw new Error("Error API /subscription/lay_off");
	} catch (error) {
		throw error;
	}
};
