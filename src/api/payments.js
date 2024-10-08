const axios = require("axios");
const moment = require("moment-timezone");
const { createEvent, EventType } = require("../service/events");
const { createInfoLog } = require("../service/logs");
const { verifySubscriptionStatus } = require("../service/subscriptions");
const InstanceAPI = require("../utils/axios");
const { findOneByCode } = require("../utils/mongodb");
const {getFirstMondayWithAddedMonths} = require("../utils/firstdaymounth");
const {getFirstMondayWithAddedDays} = require("../utils/firstdaymounth");
const { CONFIG_CODES } = require("../utils/constants");

const URL_API = process.env.PAYMENTS_URL_API || "https://api.digevopayments.com/api";
const CODE_SUBSCRIPTION = process.env.CODE_SUBSCRIPTION || "FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==";
const BEARER_SUBSCRIPTION =
	process.env.BEARER_SUBSCRIPTION || "Bearer ADJKDFJKJF52554FKJDKJKIF---**FJHDJHJDHJHDJHDKLF5";

exports.createNewPaymentEvent = async function (idSubscription, subscriptionOld) {
	const { value: digevoSpeed } = await findOneByCode(CONFIG_CODES.DIGEVO_SPEED);
	let subscription = subscriptionOld;
	if (typeof verifySubscriptionStatus === "function") {
		try {
			const subscriptionNew = await verifySubscriptionStatus(idSubscription);
			subscription = subscriptionNew;
		} catch (e) {
			console.error(e);
		}
	}
	const payments = subscription.paymentHistory
		.filter((payment) => payment.payStatus == "approved")
		.sort((a, b) => new Date(b.payDate) - new Date(a.payDate));
	const lastPayment = payments.length > 0 ? payments[0] : false;

	let nextDate = false;
	if (payments.length === 0) {
		nextDate = moment(subscription.startDate).add(1, "minutes");
	} else if (subscription.frequencyType.name == "Mensual") {
		nextDate = getFirstMondayWithAddedMonths(lastPayment.payDate, subscription.frequency);
		
		if (payments.length === 1 && subscription.frequency != 1) {
			nextDate = getFirstMondayWithAddedMonths(subscription.startDate, subscription.frequency);
		}
	} else if (subscription.frequencyType.name == "Semestral") {
		nextDate = getFirstMondayWithAddedMonths(lastPayment.payDate, subscription.frequency * 6);
	} else if (subscription.frequencyType.name == "Anual") {
		nextDate = getFirstMondayWithAddedMonths(lastPayment.payDate, subscription.frequency * 12);
	}
	if (digevoSpeed == "1") {
		// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
			nextDate = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			if (payments.length === 0) {
				nextDate = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
		}
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 3) {
			nextDate = moment().add(3, "minutes").format("YYYY-MM-DD HH:mm:ss");
			if (payments.length === 0) {
				nextDate = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
		}
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 6) {
			nextDate = moment().add(6, "minutes").format("YYYY-MM-DD HH:mm:ss");
			if (payments.length === 0) {
				nextDate = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
		}
	}

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
		await createInfoLog(idSubscription, "Se creó evento de pago", { nextDate, totalIterations, payments });
	} else {
		const { value: renewalDays } = await findOneByCode(CONFIG_CODES.RENEWAL_DAYS);
		//let renewalDate = moment(nextDate).add(-parseInt(renewalDays), "days").format("YYYY-MM-DD HH:mm:ss");
		let renewalDate = getFirstMondayWithAddedDays(nextDate, -parseInt(renewalDays));
		if (digevoSpeed == "1") {
			// TO FIX: Esto es temporal, para acelerar el proceso de pruebas
			if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
				renewalDate = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
				nextDate = moment(renewalDate).add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
			if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 3) {
				renewalDate = moment().add(3, "minutes").format("YYYY-MM-DD HH:mm:ss");
				nextDate = moment(renewalDate).add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
			if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 6) {
				renewalDate = moment().add(6, "minutes").format("YYYY-MM-DD HH:mm:ss");
				nextDate = moment(renewalDate).add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
		}

		await createEvent(
			EventType.SEND_NOTIFICATION,
			{ idSubscription, type: "NOTICE_RENEWAL", days: renewalDays, renewalDate: nextDate },
			renewalDate
		);
		await createInfoLog(idSubscription, "Se creó evento de renovación", { renewalDate, totalIterations, payments });
		await createEvent(EventType.SUBSCRIPTION_RENEW, { idSubscription, stage: "", attempt: 0 }, nextDate);
	}
};

exports.paymentAPICollect = async function (transbankUser, amount, idSubscription) {
	try {
		const { value: apiPagoUser } = await findOneByCode(CONFIG_CODES.API_PAGO_USER);
		const { value: apiPagoPass } = await findOneByCode(CONFIG_CODES.API_PAGO_PASS);
		const {
			data: { token },
		} = await axios.post(`${URL_API}/login`, {
			email: apiPagoUser,
			password: apiPagoPass,
		});
		const { data } = await axios.post(
			`${URL_API}/jwt/oneclick-mall/pago/${transbankUser}`,
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
			`/subscription/make_payment?code=${CODE_SUBSCRIPTION}`,
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
					digevoId: payment.digevo_id,
					email: payment.email,
					transactionType: payment.transaction_type,
					idTrx: payment.id_trx,
					codExternal: payment.cod_external,
					buyOrder: payment.buy_order,
				},
			},
			{ headers: { Authorization: BEARER_SUBSCRIPTION } }
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

		const response = await InstanceAPI.post(`/subscription/send_email?code=${CODE_SUBSCRIPTION}`, bodyEmail, {
			headers: { Authorization: BEARER_SUBSCRIPTION },
		});

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
