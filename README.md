# StockX API

Offical StockX API Node package (
see [official docs](https://developer.stockx.com/openapi/reference/overview) & [example](https://github.com/albertogferrario/javascript-stockx-api-example))

## Install

```bash
npm i @albertogferrario/stockx-api
```

## Authentication

For accessing StockX public API you need to provide the JWT token provided after the OAuth2 Authentication Code flow,
see [official docs](https://developer.stockx.com/portal/authentication/).

## Usage

### Init

```javascript
const StockxApi = require("@albertogferrario/stockx-api");

const stockxApi = new StockxApi(<API_KEY>, <JWT>);
```

### Catalog

TO DO
