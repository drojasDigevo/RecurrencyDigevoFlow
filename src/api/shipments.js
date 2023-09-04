const InstanceAPI = require("../utils/axios")
const moment = require("moment-timezone")

exports.shipmentAPICreate = async function (idSubscription) {
    try {
        /*
        const response = await InstanceAPI.post('/pending',
            {
                idSubscription
            })
        */
        //FIX: datos estaticos
        const now = moment()
        const delivery_date = now.clone().add(moment.duration(95, 'seconds'))
        return {
            more_data: "more_data",
            delivery_date: delivery_date
        }
    } catch (error) {
        throw error
    }
}

exports.shipmentAPINotify = async function (idSubscription, dispatch) {
    try {
        return false
        //FIX: datos estaticos
        const response = await InstanceAPI.post(
            '/gateway/resend?code=3DPa0ylJaenaHpE7neI8xQETJl7rjzW-YTFf4MGb1OqKAzFuPkQo8g==',
            {
                idSubscription,
                dispatch: {
                    "typeIdentification": "1",
                    "identification": "25852369-2",
                    "firstName": "Cristian",
                    "lastName": "Rojas",
                    "emailAddress": "drojas@digevo.com",
                    "address": "Avenida Francia, La Cisterna",
                    "address2": "",
                    "adReference": "",
                    "city": "Santiago",
                    "country": "CL",
                    "phoneNumber": "975859663",
                    "postalCode": "1",
                    "idCourier": "24",
                    "courierName": "Chilepost",
                    "deliveryDate": "",
                    "approvalDelivey": "",
                    "deliveryStatus": "",
                    "locality": "Huechuraba"
                }
            })

        if (response?.data) {
            const { statusCode, content } = response.data
            if (statusCode === 200) return content
        }
        throw new Error("Error API /gateway/resend");
    } catch (error) {
        throw error
    }
}