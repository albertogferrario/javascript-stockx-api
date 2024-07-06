const axios = require("axios").default;
const {Axios} = require("axios");
const {timeoutPromise} = require("./utilities");
const {REQUEST_TIMEOUT} = require("../config");

class Client extends Axios {
  constructor(baseUrl, headers, limiter) {
    super({
      ...axios.defaults,
      baseURL: baseUrl,
      headers,
    });

    this.limiter = limiter;
  }

  get = async (url, config) => {
    return await this.limiter.schedule(() => timeoutPromise(super.get(url, config), REQUEST_TIMEOUT));
  };

  post = async (url, data, config) => {
    return await this.limiter.schedule(() => timeoutPromise(super.post(url, data, config), REQUEST_TIMEOUT));
  };

  put = async (url, data, config) => {
    return await this.limiter.schedule(() => timeoutPromise(super.put(url, data, config), REQUEST_TIMEOUT));
  };

  delete = async (url, config) => {
    return await this.limiter.schedule(() => timeoutPromise(super.delete(url, config), REQUEST_TIMEOUT));
  };
}

module.exports = Client;
