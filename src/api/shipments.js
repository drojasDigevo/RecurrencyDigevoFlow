const InstanceAPI = require("../utils/axios");
const axios = require("axios");
const moment = require("moment-timezone");

exports.shipmentAPICreate = async function (idSubscription) {
	try {
		console.log("shipmentAPICreate", { idSubscription });
		const response = await InstanceAPI.post(
			"/send_information_customer?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==",
			{
				idSubscription,
			}
		);
		console.log("rendir", response);
		return { isOk: true, data: response?.data };
	} catch (error) {
		return { isOk: false, shipment: error.response.data };
	}
};

exports.shipmentAPINotify = async function (idSubscription, dispatch) {
	try {
		console.log("shipmentAPINotify", { idSubscription, dispatch });
		const response = await axios.post(
			"https://gatewayrykqa.azurewebsites.net/api/gateway/resend?code=3DPa0ylJaenaHpE7neI8xQETJl7rjzW-YTFf4MGb1OqKAzFuPkQo8g==",
			{
				idSubscription,
				dispatch,
			},
			{ headers: { Authorization: "Bearer ADJKDFJKJF52554FKJDKJKIF---**FJHDJHJDHJHDJHDKLF5" } }
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
