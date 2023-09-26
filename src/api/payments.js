const axios = require("axios");
const moment = require("moment-timezone");
const { createEvent, EventType } = require("../service/events");
const InstanceAPI = require("../utils/axios");
const { findOneByCode } = require("../utils/mongodb");
const { CONFIG_CODES } = require("../utils/constants");

exports.createNewPaymentEvent = async function (idSubscription, subscription) {
	let nextDate = false;
	if (!nextDate) {
		if (subscription.frequencyType.name == "Mensual") {
			nextDate = moment(subscription.startDate).add(subscription.frequency, "months");
			if (nextDate.date() < 25) {
				nextDate = moment(subscription.startDate).add(subscription.frequency - 1, "months");
			}
			nextDate.date(25);
		} else if (subscription.frequencyType.name == "Semestral") {
			nextDate = moment(subscription.startDate).add(subscription.frequency * 6, "months");
			if (nextDate.date() < 25) {
				nextDate = moment(subscription.startDate).add(subscription.frequency * 6 - 1, "months");
			}
			nextDate.date(25);
		} else if (subscription.frequencyType.name == "Anual") {
			nextDate = moment(subscription.startDate).add(subscription.frequency, "years");
			nextDate.date(25);
		}
		nextDate = nextDate.format("YYYY-MM-DD HH:mm:ss");
		// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
			nextDate = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
		}
	}

	const payments = subscription.paymentHistory.filter((payment) => payment.payStatus == "approved");
	let totalIterations = subscription.totalQuantity;
	if (subscription.frequencyType.name == "Mensual") {
		totalIterations = 12 / subscription.frequency;
	} else if (subscription.frequencyType.name == "Semestral") {
		totalIterations = 6 / subscription.frequency;
	} else if (subscription.frequencyType.name == "Anual") {
		totalIterations = 1;
	}
	if (totalIterations > payments.length) {
		await createEvent(EventType.PAYMENT_ATTEMPT, { idSubscription, attempts: 1 }, nextDate);
	}
};

exports.paymentAPICollect = async function (transbankUser, amount, idSubscription) {
	try {
		const { value: apiPagoUser } = await findOneByCode(CONFIG_CODES.API_PAGO_USER);
		const { value: apiPagoPass } = await findOneByCode(CONFIG_CODES.API_PAGO_PASS);
		const {
			data: { token },
		} = await axios.post(`https://api.digevopayments.com/api/login`, {
			email: apiPagoUser,
			password: apiPagoPass,
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
