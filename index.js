const {Catalog} = require("./src/api");
const {
  BASE_URL, REQUEST_RATE_LIMIT_MIN_TIME, REQUEST_RATE_LIMIT_RESERVOIR_AMOUNT,
  REQUEST_RATE_LIMIT_RESERVOIR_REFRESH_CRON_EXPRESSION,
} = require("./config");
const Client = require("./src/client");
const Limiter = require("./src/limiter");

function makeClient(apiKey, jwt, limiter) {
  return new Client(
    BASE_URL,
    {
      Accept: 'application/json',
      'x-api-key': apiKey,
      Authorization: `Bearer ${jwt}`,
    },
    limiter,
  );
}

function makeLimiter() {
  return new Limiter(
    REQUEST_RATE_LIMIT_MIN_TIME,
    REQUEST_RATE_LIMIT_RESERVOIR_AMOUNT,
    REQUEST_RATE_LIMIT_RESERVOIR_REFRESH_CRON_EXPRESSION,
  );
}

class StockxApi {
  constructor(apiKey, jwt) {
    this.apiKey = apiKey;
    this.jwt = jwt;
    this.limiter = makeLimiter();

    this.initResources(makeClient(this.apiKey, this.jwt, this.limiter))
  }

  initResources(client) {
    this.catalog = new Catalog(client);
  }

  updateJwt(jwt) {
    this.jwt = jwt;

    this.initResources(makeClient(this.apiKey, this.jwt, this.limiter));
  }
}

module.exports = StockxApi;
