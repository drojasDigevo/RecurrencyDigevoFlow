const InstanceAPI = require("../utils/axios")

exports.APIPaymentIsComplete = async function (subscriptionId) {
    try {
        const response = await InstanceAPI.get('/partner/20455662229320')
        if (response.status === 200) {
            const now = moment()
            const next_payment_date = now.clone().add(moment.duration(35, 'seconds'))
            return {
                next_payment_date: next_payment_date
            }
        }
        return false
    } catch (error) {
        console.error(error)
    }
}
