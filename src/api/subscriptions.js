const InstanceAPI = require("../utils/axios")

exports.getAPISubscription = async function (subscriptionId) {
    try {
        const response = await InstanceAPI.get('/partner/20455662932')
        if (response.status === 200) return true
        return false
    } catch (error) {
        console.error(error)
    }
}

exports.postAPISubscriptionChange = async function (subscriptionId, change) {
    try {
        const response = await InstanceAPI.get('/partner/20455662932')
        if (response.status === 200) return true
        return false
    } catch (error) {
        console.error(error)
    }
}