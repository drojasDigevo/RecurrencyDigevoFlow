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
		return {
			status: 'OK',
		}
        const response = await InstanceAPI.post(
            '/subscription/make_payment?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==',
            {
                idSubscription,
                payment:{
					payStatus: 'approved',
					statusDetail: 'Approved detail',
					idUserExternal: payment.id_user_external,
					authCode: payment.auth_code,
					cardType: payment.card_type,
					expMonth: "",
					expYear: "",
					lastFour: payment.last_four,
					cardCategory: "",
					paymentType: 'Transbank',
					commerceCode: payment.commerce_code,
					gatewayToken: payment.transbank_user,
					payDate: payment.payment_date,
					installments: payment.installments,
					amount: payment.amount,
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