const axios = require("axios").default;
const {Axios} = require("axios");

class Client extends Axios {
  constructor(baseUrl, headers, limiter) {
    super({
      ...axios.defaults,
      baseURL: baseUrl,
      headers,
    });

    this.limiter = limiter;
  }

  get = async (url, config) => await this.limiter.schedule(() => super.get(url, config));

  post = async (url, data, config) => await this.limiter.schedule(() => super.post(url, data, config));

  put = async (url, data, config) => await this.limiter.schedule(() => super.put(url, data, config));

  delete = async (url, config) => await this.limiter.schedule(() => super.delete(url, config));
}

module.exports = Client;
