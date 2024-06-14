const { Catalog } = require("./src/api");
const { BASE_URL } = require("./config");
const Client = require("./src/client");

module.exports = class StockxApi {
  constructor(apiToken, jwt, baseUrl = undefined) {
    const client = new Client(baseUrl || BASE_URL, apiToken, jwt);

    this.catalog = new Catalog(client);
  }
}
