const axios = require("axios");
const moment = require("moment-timezone");
const InstanceAPI = require("../utils/axios");

exports.paymentAPICollect = async function (transbankUser, amount, idSubscription) {
	try {
		const {
			data: { token },
		} = await axios.post(`https://api.digevopayments.com/api/login`, {
			email: "admin@ryk.cl",
			password: "[KqT7J]LH!q_]U)T",
		});
		const { data } = await axios.post(
			`https://api.digevopayments.com/api/jwt/oneclick-mall/pago/${transbankUser}`,
			{
				codExternal: idSubscription,
				amount: amount,
				installments: "1",
				urlOK: "",
				urlError: "",
				urlNotify: "",
			},
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		);
		console.log("data paymentAPICollect", data);
		return { isOk: true, payment: data };
	} catch (error) {
		console.error("error paymentAPICollect", error);
		return { isOk: false, payment: error.response.data };
	}
};

exports.paymentAPINotify = async function (idSubscription, payment, statusResponse) {
	try {
		const response = await InstanceAPI.post(
			"/subscription/make_payment?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==",
			{
				idSubscription,
				payment: {
					payStatus: statusResponse.status,
					statusDetail: statusResponse.status_detail,
					idUserExternal: payment.id_user_external,
					authCode: payment.auth_code,
					cardType: payment.card_type,
					expMonth: "",
					expYear: "",
					lastFour: payment.last_four,
					cardCategory: "",
					paymentType: payment.source,
					commerceCode: payment.commerce_code,
					gatewayToken: payment.transbank_user,
					payDate: payment.payment_date,
					installments: payment.installments,
					amount: payment.amount,
				},
			},
			{ headers: { Authorization: "Bearer ADJKDFJKJF52554FKJDKJKIF---**FJHDJHJDHJHDJHDKLF5" } }
		);

		if (response?.data) {
			const { statusCode, content } = response.data;
			console.log({ content });
			if (statusCode === 200) return content;
		}
		console.log("content paymentAPINotify", response);
		//throw new Error("Error API /subscription/make_payment");
		return false;
	} catch (error) {
		console.error("error paymentAPINotify", error);
		//throw error;
		return false;
	}
};

exports.sendMailSuccessfull = async function (bodyEmail) {
	try {
		//bodyEmail.to = 'favio@resit.cl'
		console.log({ bodyEmail });

		const response = await InstanceAPI.post(
			"/subscription/send_email?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==",
			bodyEmail,
			{ headers: { Authorization: "Bearer ADJKDFJKJF52554FKJDKJKIF---**FJHDJHJDHJHDJHDKLF5" } }
		);

		console.log(response);
		if (response?.data) {
			const { statusCode, content } = response.data;
			if (statusCode === 200) return content;
		}
		//throw new Error("Error API /subscription/send_email");
		return false;
	} catch (error) {
		//throw error;
		console.error(error);
		return false;
	}
};
