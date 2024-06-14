import {Catalog} from "./src/api";
import { BASE_URL } from "./config";
import Client from "./src/client";

export default class StockxApi {
  constructor(apiToken, jwt, baseUrl = undefined) {
    const client = new Client(baseUrl || BASE_URL, apiToken, jwt);

    this.catalog = new Catalog(client);
  }
}
