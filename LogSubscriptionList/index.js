const { listLogBySubscription } = require("../src/service/logs")
const { findSubscriptionByIdSubscription } = require("../src/service/subscriptions")

module.exports = async function (context, req) {
    try {
        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            status: 202,
            body: { ok: false }
        }
    
        const { idSubscription } = req.body

        if (!idSubscription) {
            context.res.status = 400
            context.res.body = { ok: false, message: "Falta el campo 'idSubscription'" }
            return
        }

        const found = await findSubscriptionByIdSubscription(idSubscription)
        if (!found) {
            context.res.status = 400
            context.res.body = { ok: false, message: `No existe una suscripción con idSubscription: ${idSubscription}` }
            return
        }

        const logs = await listLogBySubscription(idSubscription)

        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            body: { ok: true, data: logs }
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: { ok: false, message: 'Hubo un error inesperado', data: error }
        }
    }
}