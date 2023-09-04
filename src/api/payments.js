const axios = require('axios')
const moment = require("moment-timezone")
const InstanceAPI = require("../utils/axios")

exports.paymentAPICollect = async function (transbankUser,amount,idSubscription) {
    try {
        //return false // TEST: para probar limite de intentos de cobro
        const {data:{token}} = await axios.post(`https://api.digevopayments.com/api/login`,
		{
			"email": "admin@ryk.cl",
			"password": "[KqT7J]LH!q_]U)T"
		})
        const {data} = await axios.post(`/api/jwt/oneclick-mall/pago/${transbankUser}`,
			{
				"codExternal": idSubscription,
				"amount": amount,
				"installments": "1",
				"urlOK": "",
				"urlError": "",
				"urlNotify": ""
			},
			{
				headers: {Authorization:`Bearer ${token}`}
			}
		)
        return data
    } catch (error) {
        throw error
    }
}

exports.paymentAPINotify = async function (idSubscription, payment) {
    try {
        return true
        //FIX: datos estaticos
        const response = await InstanceAPI.post(
            '/subscription/make_payment?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==',
            {
                idSubscription,
                payment: {
                    "payStatus": "approved",
                    "statusDetail": "Approved detail",
                    "idUserExternal": "12587",
                    "authCode": "00-8722525",
                    "cardType": "Visa",
                    "expMonth": "02",
                    "expYear": "25",
                    "lastFour": "1910",
                    "cardCategory": "CreditCard",
                    "paymentType": "TransBank",
                    "commerceCode": "0028871",
                    "gatewayToken": "AAQ5545787DF54DF",
                    "payDate": "2023-07-30T10:40",
                    "installments": 1,
                    "amount":25500
                }
            })

        if (response?.data) {
            const { statusCode, content } = response.data
            if (statusCode === 200) return content
        }
        throw new Error("Error API /subscription/make_payment");
    } catch (error) {
        throw error
    }
}