const { cancelSubscription } = require("../src/service/subscriptions")

module.exports = async function (context, req) {
    try {
        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            status: 202,
            body: {}
        }

        const body = req.body

        const { idSubscription } = body

        if ( idSubscription == null ) {
            context.res.status = 400
            context.res.body = { error: `Value "idSubscription" don't exist` }
            return
        }

        const response = await cancelSubscription(idSubscription)

        context.res.status = 200
        context.res.body = response

    } catch (error) {
        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            status: 500,
            body: { error }
        }
    }
}