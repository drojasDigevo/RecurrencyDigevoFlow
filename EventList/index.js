const { listEvent } = require("../src/service/events")

module.exports = async function (context, req) {
    try {
        const events = await listEvent()
        context.res = {
            headers: {
              "Content-Type": "application/json"
            },
            body: events
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: error
        }
    }
}