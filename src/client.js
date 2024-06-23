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

  get = (url, config) => this.limiter.schedule(() => super.get(url, config));

  post = (url, data, config) => this.limiter.schedule(() => super.post(url, data, config));

  put = (url, data, config) => this.limiter.schedule(() => super.put(url, data, config));

  delete = (url, config) => this.limiter.schedule(() => super.delete(url, config));
}

module.exports = Client;
