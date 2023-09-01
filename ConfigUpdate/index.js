const { updateConfigByCode } = require("../src/service/config")

module.exports = async function (context, req) {
    try {
        const body = req.body

        const { code, value } = body

        if (!code || !value) {
            context.res.status = 400
            context.res.body = { ok: false, message: "Alguno de los siguientes valores no existen: [code, value]" }
            return
        }

        const response = await updateConfigByCode(code, value)

        if (response) {
            context.res = {
                headers: {
                  "Content-Type": "application/json"
                },
                body: { ok: true, message: "Configuración actualizada correctamente" }
            }
        } else {
            context.res = {
                headers: {
                  "Content-Type": "application/json"
                },
                status: 500,
                body: { ok: false, message: "Hubo un error intentando actualizar la configuración" }
            }
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: { ok: false, message: 'Hubo un error inesperado', data: error }
        }
    }
}