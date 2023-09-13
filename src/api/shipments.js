const InstanceAPI = require("../utils/axios")
const axios = require("axios")
const moment = require("moment-timezone")

exports.shipmentAPICreate = async function (idSubscription) {
    try {
		console.log('shipmentAPICreate',{idSubscription})
        const response = await InstanceAPI.post('/send_information_customer?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==',
		{
			idSubscription
		})
		console.log('rendir',response)
        return {
            data: response?.data || false
        }
    } catch (error) {
        throw error
    }
}

exports.shipmentAPINotify = async function (idSubscription, dispatch) {
    try {
		console.log('shipmentAPINotify',{idSubscription,dispatch})
        const response = await axios.post(
            'https://gatewayrykqa.azurewebsites.net/api/gateway/resend?code=3DPa0ylJaenaHpE7neI8xQETJl7rjzW-YTFf4MGb1OqKAzFuPkQo8g==',
            {
                idSubscription,
                dispatch
            },
			{headers:{'Authorization': 'Bearer ADJKDFJKJF52554FKJDKJKIF---**FJHDJHJDHJHDJHDKLF5'}})
        if (response?.data) {
            const { statusCode, content } = response.data
            if (statusCode === 200) return content
        }
        throw new Error("Error API /gateway/resend");
    } catch (error) {
        throw error
    }
}