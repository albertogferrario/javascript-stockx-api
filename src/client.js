const axios = require("axios").default;
const {Axios} = require("axios");
const {timeoutPromise} = require("./utilities");

class Client extends Axios {
  constructor(baseUrl, headers, limiter, requestTimeout) {
    super({
      ...axios.defaults,
      baseURL: baseUrl,
      headers,
    });

    this.limiter = limiter;
    this.requestTimeout = requestTimeout;
  }

  get = async (url, config) => {
    return await this.limiter.schedule(() => timeoutPromise(super.get(url, config), this.requestTimeout));
  };

  post = async (url, data, config) => {
    return await this.limiter.schedule(() => timeoutPromise(super.post(url, data, config), this.requestTimeout));
  };

  put = async (url, data, config) => {
    return await this.limiter.schedule(() => timeoutPromise(super.put(url, data, config), this.requestTimeout));
  };

  delete = async (url, config) => {
    return await this.limiter.schedule(() => timeoutPromise(super.delete(url, config), this.requestTimeout));
  };
}

module.exports = Client;
