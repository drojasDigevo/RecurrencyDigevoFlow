const InstanceAPI = require("../utils/axios")

exports.getAPISubscription = async function (idSubscription) {
    try {
        const response = await InstanceAPI.post('/subscription/detail', { idSubscription: idSubscription })
        if (response) {
            const { statusCode, content } = response
            if (statusCode != 200) return false
            return content
        }
        return false
    } catch (error) {
        console.error("[API] getAPISubscription")
        console.error(error)
        throw error
    }
}

exports.postAPISubscriptionChange = async function (idSubscription, change) {
    try {
        const response = await InstanceAPI.get('/partner/20455662932')
        if (response.status === 200) return true
        return false
    } catch (error) {
        console.error("[API] postAPISubscriptionChange")
        console.error(error)
        throw error
    }
}