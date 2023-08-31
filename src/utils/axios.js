const axios = require('axios')

const InstanceAPI = axios.create({
    baseURL: 'https://ruc.conflux.pe/api',
    headers: {
        "Content-Type": "application/json"
    }
});

module.exports = InstanceAPI