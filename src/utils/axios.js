const axios = require('axios')

const InstanceAPI = axios.create({
    baseURL: 'https://subscriptionqa.azurewebsites.net/api',
    headers: {
        "Content-Type": "application/json"
    }
});

module.exports = InstanceAPI