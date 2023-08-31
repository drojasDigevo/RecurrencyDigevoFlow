const { updateConfigByCode } = require("../src/service/config")

module.exports = async function (context, req) {
    try {
        
        const body = req.body

        const { code, value } = body

        if (!code || !value) {
            context.res.status = 400
            context.res.body = { error: "Alguno de los siguientes valores no existen: [code, value]" }
            return
        }

        const response = await updateConfigByCode(code, value)

        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            body: response
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: error
        }
    }
}