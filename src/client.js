const axios = require("axios").default;
const { Axios } = require("axios");

module.exports = class Client extends Axios {
  constructor(baseUrl, apiKey, jwt) {
    super({
      ...axios.defaults,
      baseURL: baseUrl,
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
        Authorization: `Bearer ${jwt}`,
      },
    });
  }
}
