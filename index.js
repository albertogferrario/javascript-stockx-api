const {Catalog} = require("./src/api");
const {
  BASE_URL, REQUEST_RATE_LIMIT_MIN_TIME, REQUEST_RATE_LIMIT_RESERVOIR_AMOUNT,
  REQUEST_RATE_LIMIT_RESERVOIR_REFRESH_CRON_EXPRESSION,
} = require("./config");
const Client = require("./src/client");
const Limiter = require("./src/limiter");

class StockxApi {
  constructor(apiKey, jwt) {
    const limiter = new Limiter(
      REQUEST_RATE_LIMIT_MIN_TIME,
      REQUEST_RATE_LIMIT_RESERVOIR_AMOUNT,
      REQUEST_RATE_LIMIT_RESERVOIR_REFRESH_CRON_EXPRESSION,
    );

    const client = new Client(
      BASE_URL,
      {
        Accept: 'application/json',
        'x-api-key': apiKey,
        Authorization: `Bearer ${jwt}`,
      },
      limiter,
    );

    this.catalog = new Catalog(client);
  }
}

module.exports = StockxApi;
