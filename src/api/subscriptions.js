const InstanceAPI = require("../utils/axios")

exports.getAPISubscription = async function (idSubscription) {
    try {
        const response = await InstanceAPI.post(
            '/subscription/detail?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==',
            {
                idSubscription: idSubscription
            })
        if (response) {
            const { statusCode, content } = response
            //FIX: datos estaticos
            return {
                "id": 11,
                "idSubscription": idSubscription,
                "description": "PureVision 2 Multifocal",
                "startDate": "2023-07-25T23:50:00",
                "expirationDate": "2024-07-25T16:43:00",
                "resumeDate": "",
                "contractDate": "2023-07-25T23:50:00",
                "deferDate": "",
                "autoRenew": true,
                "acknowledge": true,
                "frequencyType": {
                    "id": 1,
                    "name": "Diario"
                },
                "status": {
                    "id": 1,
                    "name": "Active"
                },
                "frequency": 8,
                "quantity": 4,
                "totalQuantity": 8,
                "unitAmount": 190000.0000,
                "idCurrency": {
                    "id": "CLP",
                    "name": "Pesos Chilenos"
                },
                "codePlan": 1,
                "paymentStatus": "approved",
                "paymentDate": "07/23/2023 21:01:00",
                "deliveryStatus": "",
                "deliveryDate": "",
                "dispatchUnits": 0,
                "paymentUnits": 1,
                "totalAmountToPay": 1520000.0000,
                "customer": {
                    "typeIdentification": "RUT",
                    "identification": "26627439-4",
                    "firstName": "Esteban",
                    "lastName": "Cardenas",
                    "emailAddress": "estebancardenas@testuser.com",
                    "address": "Test Address Josibel",
                    "address2": "Test Address 2",
                    "adReference": "Reference",
                    "city": "Huechuraba",
                    "country": "CL",
                    "locality": "",
                    "phoneNumber": "956857412",
                    "postalCode": "011100"
                },
                "beneficiary": {
                    "typeIdentification": "RUT",
                    "identification": "26627439-4",
                    "firstName": "Esteban",
                    "lastName": "Cardenas",
                    "emailAddress": "estebancardenas@testuser.com",
                    "address": "Test Address",
                    "address2": "Test Address 2",
                    "adReference": "Reference",
                    "city": "Huechuraba",
                    "country": "CL",
                    "locality": "",
                    "phoneNumber": "956857412",
                    "postalCode": "011100"
                },
                "account": {
                    "idAccount": "98d3183f-4861-4ca7-9adf-c727ab8ddc0b",
                    "orderNumber": "098942",
                    "orderedDate": "2023-04-19T09:43:00",
                    "assignedTo": "1",
                    "group": "0003",
                    "channel": "Ecommerce"
                },
                "cancel": {
                    "date": "",
                    "reason": "",
                    "subReason": "",
                    "description": ""
                },
                "paymentMethod": {
                    "payStatus": "approved",
                    "statusDetail": "",
                    "idUserExternal": "120",
                    "authCode": "301299",
                    "cardType": "Visa",
                    "expMonth": "",
                    "expYear": "",
                    "lastFour": "1452",
                    "cardCategory": "CreditCard",
                    "paymentType": "mercadopago",
                    "commerceCode": "57054814925",
                    "gatewayToken": "9f7c30330d48fb3da4a44c5d44"
                },
                "paymentHistory": [
                    {
                        "payStatus": "approved",
                        "statusDetail": "Approved detail",
                        "idUserExternal": "120",
                        "authCode": "401200",
                        "cardType": "Mastercard",
                        "expMonth": "10",
                        "expYear": "15",
                        "lastFour": "1112",
                        "cardCategory": "CreditCard",
                        "paymentType": "TransBank",
                        "commerceCode": "59875454545",
                        "gatewayToken": "58784DFD4D5D4DEF",
                        "payDate": "2023-07-23T21:01:00",
                        "installments": 1,
                        "amount": 190000.0000
                    }
                ],
                "shippingSummaryHistory": [
                    {
                        "typeIdentification": "1",
                        "identification": "26627439-4",
                        "firstName": "Esteban",
                        "lastName": "Cardenas",
                        "emailAddress": "estebancardenas@testuser.com",
                        "address": "Manson Huechuraba Address",
                        "address2": "Test Address 2",
                        "adReference": "Reference",
                        "city": "Huechuraba",
                        "country": "CL",
                        "locality": "",
                        "phoneNumber": "984747737",
                        "postalCode": "011100",
                        "idCourier": "24",
                        "courierName": "Chilepost",
                        "deliveryDate": "",
                        "approvalDelivey": "",
                        "deliveryStatus": ""
                    }
                ],
                "traceability": [],
                "customFields": [],
                "products": []
            }
            if (statusCode === 200) return content
            else throw new Error("Error API /subscription/detail");
        }
        throw new Error("Error API /subscription/detail");
    } catch (error) {
        throw error
    }
}

exports.subscriptionAPISendEmail = async function (body) {
    try {
        const response = await InstanceAPI.post(
            '/subscription/send_email?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==',
            body
            )
        if (response) {
            const { statusCode, content } = response
            if (statusCode === 200) return content
        }
        throw new Error("Error API /subscription/send_email")
    } catch (error) {
        throw error
    }
}

exports.subscriptionAPIRenewal = async function (idSubscription) {
    try {
        return true
    } catch (error) {
        throw error
    }
}

exports.subscriptionAPILayOff = async function (idSubscription) {
    return true
    try {
        const response = await InstanceAPI.post(
            '/subscription/lay_off?code=FtlIXQZ64Dbl7rcuGrvI8DHemNlkZcjd0c9TpdmsVHgBAzFuFR2hHw==',
            {
                idSubscription: idSubscription,
                idReason: 2,
                subReason: 6,
                description: "Suspendido por razones varias"
            }
            )
        if (response) {
            const { statusCode, content } = response
            if (statusCode === 200) return content
        }
        throw new Error("Error API /subscription/lay_off")
    } catch (error) {
        throw error
    }
}