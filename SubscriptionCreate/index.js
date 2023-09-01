const { createSubscription, findSubscriptionByIdSubscription } = require("../src/service/subscriptions")
const { getPlanByName } = require("../src/service/plans")

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

        const { idSubscription, startDate, planName, frequency, quantity, totalQuantity } = body

        if (!startDate || !planName || !frequency || !quantity || !totalQuantity || !idSubscription) {
            context.res.status = 400
            context.res.body = { ok: false, message: "Alguno de los siguientes valores no existen: [idSubscription, startDate, planName, frequency, quantity, totalQuantity]" }
            return
        }

        const subExists = await findSubscriptionByIdSubscription(idSubscription)
        if (subExists) {
            context.res.status = 400
            context.res.body = { ok: false, message: `Ya existe una subscripción con idSubscription: ${idSubscription}` }
            return
        }

        const plan = await getPlanByName(planName)
        if (!plan) {
            context.res.status = 400
            context.res.body = { ok: false, message: `El plan con el nombre "${planName}" no existe` }
            return
        }

        // si existe el plan lo adjunta al registro
        body.plan = plan

        if (!(
            plan.totalQuantityDispatched === totalQuantity //revisa coincidan cajas de despacho total
            && plan.deliveryFrequencyOptions.includes(frequency) //revisa que exista frecuencia de despacho
            && quantity === (totalQuantity/frequency) //revisa que coincida cantidad a despachar
        )) {
            context.res.status = 400
            context.res.body = { ok: false, message: `"totalQuantity" has to be ${plan.totalQuantityDispatched} and "frequency" has to be one of the values: [${plan.deliveryFrequencyOptions.join(', ')}]` }
            return
        }

        const result = await createSubscription(body)
        context.res.status = 200
        context.res.body = { ok: true, message: 'Subscripción creada correctamente', data: result }

    } catch (error) {
        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            status: 500,
            body: { ok: false, message: 'Hubo un error inesperado', data: error }
        }
    }
}