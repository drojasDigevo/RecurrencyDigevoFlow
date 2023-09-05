const { listSubscription } = require("../src/service/subscriptions")

module.exports = async function (context, req) {
    try {
        const { page, perPage } = req.query

        const subscriptions = await listSubscription(Number(page), Number(perPage))

        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            body: { ok: true, data: subscriptions }
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: { ok: false, message: 'Hubo un error inesperado', data: error }
        }
    }
}