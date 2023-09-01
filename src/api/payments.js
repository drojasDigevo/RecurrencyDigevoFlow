const InstanceAPI = require("../utils/axios")
const moment = require("moment-timezone")

exports.APIPaymentIsComplete = async function (idSubscription) {
    try {
        const response = await InstanceAPI.get('/partner/20455662932333')
        if (response.status === 200) {
            const now = moment()
            const next_payment_date = now.clone().add(moment.duration(35, 'seconds'))
            return {
                more_data: "more_data",
                next_payment_date: next_payment_date
            }
        }
        return false
    } catch (error) {
        console.error(error)
    }
}
