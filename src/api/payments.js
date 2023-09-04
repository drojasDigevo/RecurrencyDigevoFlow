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
        const {data} = await axios.post(`https://api.digevopayments.com/api/jwt/oneclick-mall/pago/${transbankUser}`,
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
        const response = await InstanceAPI.post(
            '/subscription/make_payment?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==',
            {
                idSubscription,
                payment
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