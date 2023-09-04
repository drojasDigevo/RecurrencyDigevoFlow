const InstanceAPI = require("../utils/axios")
const moment = require("moment-timezone")

exports.shipmentAPICreate = async function (idSubscription) {
    try {
        const response = await InstanceAPI.post('/send_information_customer?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==',
		{
			idSubscription
		})
        return {
            data: response?.data || false
        }
    } catch (error) {
        throw error
    }
}

exports.shipmentAPINotify = async function (idSubscription, dispatch) {
    try {
        const response = await InstanceAPI.post(
            '/gateway/resend?code=3DPa0ylJaenaHpE7neI8xQETJl7rjzW-YTFf4MGb1OqKAzFuPkQo8g==',
            {
                idSubscription,
                dispatch
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