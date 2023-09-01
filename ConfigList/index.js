const { listConfig } = require("../src/service/config")

module.exports = async function (context, req) {
    try {
        const list = await listConfig()
        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            body: list
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: { ok: false, message: 'Hubo un error inesperado', data: error }
        }
    }
}