const { updateSubscription, findSubscriptionByIdSubscription } = require("../src/service/subscriptions")

module.exports = async function (context, req) {
    try {
        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            status: 202,
            body: { ok: false }
        }

        const body = req.body

        const { idSubscription } = body

        if ( idSubscription == null ) {
            context.res.status = 400
            context.res.body = { ok: false, message: `El valor "idSubscription" no existe` }
            return
        }

        const searchSubscription= await findSubscriptionByIdSubscription(idSubscription)
        if ( searchSubscription == null ) {
            context.res.status = 400
            context.res.body = { ok: false, message: `No existe una suscripción con idSubscription=${idSubscription}` }
            return
        }

        const response = await updateSubscription(idSubscription)
        if (response) {
            context.res.status = 200
            context.res.body = { ok: true, message: "Suscripción actualizada correctamente", data: response }
        } else {
            context.res.status = 500
            context.res.body = { ok: false, message: "Hubo un error inesperado", data: response }
        }

    } catch (error) {
        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            status: 500,
            body: { ok: false, message: "Hubo un error inesperado", data: error }
        }
    }

}