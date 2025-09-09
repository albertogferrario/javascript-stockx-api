const {Catalog} = require("./src/api");
const defaultConfig = require("./config");
const Client = require("./src/client");
const Limiter = require("./src/limiter");

function makeClient(baseUrl, apiKey, jwt, limiter, requestTimeout) {
  return new Client(
    baseUrl,
    {
      Accept: 'application/json',
      'x-api-key': apiKey,
      Authorization: `Bearer ${jwt}`,
    },
    limiter,
    requestTimeout,
  );
}

class StockxApi {
  constructor(apiKey, jwt, config = undefined) {
    this.apiKey = apiKey;
    this.jwt = jwt;
    this.config = config ? {...defaultConfig, ...config} : defaultConfig;
    this.limiter = new Limiter(
      this.config.requestRateLimitMinTime,
      this.config.requestRateLimitReservoirAmount,
      this.config.requestRateLimitReservoirRefreshCronExpression,
    );

    this.initResources(makeClient(this.config.baseUrl, this.apiKey, this.jwt, this.limiter, this.config.requestTimeout));
  }

  initResources(client) {
    this.catalog = new Catalog(client);
  }

  updateJwt(jwt) {
    this.jwt = jwt;

    this.initResources(makeClient(this.config.baseUrl, this.apiKey, this.jwt, this.limiter, this.config.requestTimeout));
  }
}

module.exports = StockxApi;
module.exports.helpers = require('./src/helpers');
