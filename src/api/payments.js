const InstanceAPI = require("../utils/axios")
const moment = require("moment-timezone")

exports.paymentAPICollect = async function (idSubscription) {
    try {
        return false // TEST: para probar limite de intentos de cobro
        /*
        const response = await InstanceAPI.post('/pending',
            {
                idSubscription
            })
        */
        //FIX: datos estaticos
        const now = moment()
        const next_payment_date = now.clone().add(moment.duration(90, 'seconds'))
        return {
            more_data: "more_data",
            next_payment_date: next_payment_date
        }
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

        if (response) {
            const { statusCode, content } = response
            if (statusCode === 200) return content
        }
        throw new Error("Error API /subscription/make_payment");
    } catch (error) {
        throw error
    }
}