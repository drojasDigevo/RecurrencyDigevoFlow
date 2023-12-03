const axios = require('axios')
const URL_API = process.env.DIGEVO_URL_API || 'https://subscriptionqa.azurewebsites.net/api';

const InstanceAPI = axios.create({
    baseURL: URL_API,
    headers: {
        "Content-Type": "application/json"
    }
});

module.exports = InstanceAPI