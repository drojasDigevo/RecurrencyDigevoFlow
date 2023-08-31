const moment = require("moment-timezone");

exports.convertUTC = function (date) {
    const nDate = moment(date)
    const nDateUTC = nDate.clone().utc().toDate()
    return nDateUTC
}
exports.momentUTC = function () {
    const nDate = moment()
    const nDateUTC = nDate.clone().utc().toDate()
    return nDateUTC
}