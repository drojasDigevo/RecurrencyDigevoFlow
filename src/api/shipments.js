const moment = require("moment-timezone")
const InstanceAPI = require("../utils/axios")

exports.APICreateShipment = async function (subscriptionId) {
    try {
        const response = await InstanceAPI.get('/partner/20455662932')
        if (response.status === 200) {
            const now = moment()
            const delivery_date = now.clone().add(moment.duration(35, 'seconds'))
            return {
                more_data: "more_data",
                delivery_date: delivery_date
            }
        }
        return false
    } catch (error) {
        console.error(error)
    }
}
