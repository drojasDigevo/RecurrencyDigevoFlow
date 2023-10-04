const { verifySubscriptionStatus, renewalSubscription } = require("./subscriptions");
const { subscriptionAPISendEmail } = require("../api/subscriptions");

exports.renewSubscription = async (idSubscription) => {
	try {
		const subscription = await verifySubscriptionStatus(idSubscription);
		if (subscription) {
			const { customer } = subscription;
			await renewalSubscription(idSubscription);
			await subscriptionAPISendEmail({
				to: customer.emailAddress,
				type: "html",
				subject: "Renovación de Suscripción exitosa",
				customFrom: "drojas@digevo.com",
				fromName: "RyK",
				body: {
					amountCuote: subscription.unitAmount,
					customer: customer.firstName + " " + customer.lastName,
					document: customer.identification,
					fullValuePlan: subscription.totalAmountToPay,
					dateofrenovation: moment().format("DD/MM/YYYY"),
					dateofpayment: "11/09/2024",
					numberOfInstallments: " 2 de 2",
					plan: subscription.description,
					shippingAddress: customer.address + ", " + customer.address2 + ", " + customer.city,
				},
				idAccount: idSubscription,
				operation: "RENEWALSUBSCRIPTION",
			});
		}
		await createErrorLog(idSubscription, "No se pudo generar la renovación");
	} catch (err) {
		console.error(err);
	}
};
