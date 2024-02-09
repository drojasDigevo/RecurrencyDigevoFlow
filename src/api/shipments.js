const InstanceAPI = require("../utils/axios");
const axios = require("axios");

const URL_API = process.env.GATEWAY_URL_API || "https://gatewayrykqa.azurewebsites.net/api";
const CODE_GATEWAY = process.env.CODE_GATEWAY || "3DPa0ylJaenaHpE7neI8xQETJl7rjzW-YTFf4MGb1OqKAzFuPkQo8g==";
const CODE_SUBSCRIPTION = process.env.CODE_SUBSCRIPTION || "FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==";
const BEARER_SUBSCRIPTION =
	process.env.BEARER_SUBSCRIPTION || "Bearer ADJKDFJKJF52554FKJDKJKIF---**FJHDJHJDHJHDJHDKLF5";

exports.shipmentAPICreate = async function (idSubscription) {
	try {
		const response = await InstanceAPI.post(`/send_information_customer?code=${CODE_SUBSCRIPTION}`, {
			idSubscription,
		});
		return { isOk: true, data: response?.data };
	} catch (error) {
		return { isOk: false, shipment: error.response.data };
	}
};

exports.shipmentAPINotify = async function (idSubscription, dispatch) {
	try {
		console.log("shipmentAPINotify", { idSubscription, dispatch });
		const response = await axios.post(
			`${URL_API}/gateway/resend?code=${CODE_GATEWAY}`,
			{
				idSubscription,
				dispatch,
			},
			{ headers: { Authorization: BEARER_SUBSCRIPTION } }
		);
		if (response?.data) {
			const { statusCode, content } = response.data;
			if (statusCode === 200) return { isOk: true, shipment: content };
		}
		console.log("content shipmentAPINotify", response);
		//throw new Error("Error API /gateway/resend");
		return { isOk: false, shipment: response };
	} catch (error) {
		console.error("error shipmentAPINotify", error);
		//throw error
		return { isOk: false, shipment: error.response.data };
	}
};
