const moment = require('moment');

module.exports = (originalValue, subscription, type='regular', extraDate=false) => {
	let newValue = originalValue;
	if(type == 'payments'){
		const payments = subscription.paymentHistory.filter((payment) => payment.payStatus == "approved");
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
			newValue = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			if (payments.length === 0) {
				newValue = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
		}
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 3) {
			newValue = moment().add(3, "minutes").format("YYYY-MM-DD HH:mm:ss");
			if (payments.length === 0) {
				newValue = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
		}
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 6) {
			newValue = moment().add(6, "minutes").format("YYYY-MM-DD HH:mm:ss");
			if (payments.length === 0) {
				newValue = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			}
		}
	}else if(type == 'renew'){
		let renewalDate = extraDate	
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
			newValue = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
			renewalDate = moment(newValue).add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
		}
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 3) {
			newValue = moment().add(3, "minutes").format("YYYY-MM-DD HH:mm:ss");
			renewalDate = moment(newValue).add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
		}
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 6) {
			newValue = moment().add(6, "minutes").format("YYYY-MM-DD HH:mm:ss");
			renewalDate = moment(newValue).add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
		}
		return [newValue, renewalDate]
	}else if(type == 'notifications'){
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 1) {
			newValue = moment().add(1, "minutes").format("YYYY-MM-DD HH:mm:ss");
		}
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 3) {
			newValue = moment().add(3, "minutes").format("YYYY-MM-DD HH:mm:ss");
		}
		if (subscription.frequencyType.name == "Mensual" && subscription.frequency == 6) {
			newValue = moment().add(6, "minutes").format("YYYY-MM-DD HH:mm:ss");
		}
	}
	return newValue;
}