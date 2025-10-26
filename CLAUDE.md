# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Node.js API wrapper for the StockX Public API. It provides a rate-limited HTTP client with automatic JWT token management for accessing StockX catalog data.

## Development Commands

- `npm test` - Run unit tests only (excludes integration tests)
- `npm run test:integration` - Run integration tests (requires API credentials in `.env.test`)
- `npm run test:all` - Run all tests (unit + integration)
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:coverage` - Run unit tests with coverage report
- `npm run lint` - Run ESLint with Airbnb config
- `npm run lint:fix` - Run ESLint and auto-fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted
- `jest <test-file>` - Run a specific test file

## Architecture

The codebase follows a layered architecture:

1. **Entry Point** (`index.js`):
   - `StockxApi` class that initializes resources with API key and JWT
   - Manages rate limiter configuration and client instantiation
   - Provides `updateJwt()` method for token refresh

2. **HTTP Client Layer** (`src/client.js`):
   - Extends Axios with rate limiting via Bottleneck
   - All HTTP methods (GET, POST, PUT, DELETE) are wrapped with rate limiter scheduling
   - Implements request timeout handling

3. **Rate Limiting** (`src/limiter.js`):
   - Uses Bottleneck with daily reservoir refresh (25,000 requests/day by default)
   - Cron-based reservoir refresh at midnight UTC
   - Single concurrent request to respect API limits

4. **API Resources** (`src/api/`):
   - Abstract base class pattern (`AbstractResource.js`)
   - `Catalog` class implements StockX catalog endpoints:
     - `search(query, pageNumber, pageSize)`
     - `getProductBySlug(slug)` - Get product by slug/urlKey, returns product with UUID
     - `getVariants(productId)` - Requires UUID format, not slug
     - `getVariantMarketData(productId, variantId, currencyCode)` - Requires UUID format

## Configuration

Default configuration in `config.js`:
- Base URL: `https://api.stockx.com/v2`
- Request timeout: 60 seconds
- Rate limit: 25,000 requests/day with 1 second minimum time between requests
- Reservoir refresh: Daily at midnight (cron: `0 0 * * *`)

Custom configuration can be passed as third parameter to constructor:
```javascript
new StockxApi(apiKey, jwt, { requestTimeout: 30000 })
```

## Testing

- **Unit tests**: Use `jest-mock-axios` for mocking HTTP requests, located in `tests/` directory with `*.test.js` pattern
- **Integration tests**: Test against real StockX API, require credentials in `.env.test` file
- **Environment**: Node.js 16+ required, uses Jest testing framework with Airbnb ESLint configuration
- **Test structure**: Integration tests are in `tests/integration/` and excluded from default `npm test` command

### Integration Test Files:
- `catalog.integration.test.js` - Individual API endpoint testing
- `helpers.integration.test.js` - OAuth and helper function testing  
- `user-flow.integration.test.js` - **Complete user workflow testing** (slug → variants → pricing)

## OAuth2 Authentication

The API uses OAuth2 with the following official flow:

### OAuth Scripts Available:
- `node scripts/oauth2-flow.js` - **Automated OAuth** with callback server
- `node scripts/manual-oauth2.js` - **Manual OAuth** with copy/paste flow
- `node scripts/refresh-token.js` - **Token refresh** using saved credentials
- `node scripts/auto-refresh.js` - **Smart refresh** with validity testing

### OAuth Configuration:
- **Authorization URL**: `https://accounts.stockx.com/oauth/authorize`
- **Token URL**: `https://accounts.stockx.com/oauth/token`  
- **Required Audience**: `gateway.stockx.com`
- **Required Scopes**: `['offline_access', 'openid']`
- **Token Storage**: Credentials saved to `.env.test` file

### OAuth Token Exchange and Refresh:
```javascript
const { helpers } = require('./index');

// Exchange authorization code for tokens
const tokenResponse = await helpers.auth.exchangeAuthCode(
  authCode,
  clientId,
  clientSecret,
  redirectUri,
  'https://accounts.stockx.com/oauth/token'
);

// Refresh existing tokens
const newTokens = await helpers.refresh.refreshToken(
  refreshToken,
  clientId, 
  clientSecret,
  'https://accounts.stockx.com/oauth/token',
  'gateway.stockx.com'  // Required audience parameter
);
```

## Complete User Workflows

### Primary User Flow: Product Discovery to Pricing

**Scenario**: User has a product slug and wants to get pricing for available sizes.

**Flow**: `Product Slug` → `Product Details` → `Available Variants` → `Market Pricing`

```javascript
const stockxApi = new StockxApi(apiKey, jwt);

// Step 1: Get product from slug
const product = await stockxApi.catalog.getProductBySlug('nike-dunk-low-se-easter-w');

// Step 2: Get all available variants (sizes)
const variants = await stockxApi.catalog.getVariants(product.productId);

// Step 3: Get pricing for specific size
const pricing = await stockxApi.catalog.getVariantMarketData(
  product.productId,
  variants[0].variantId,  // First available size
  'USD'  // or 'EUR', 'GBP', etc.
);

console.log(`${product.title} - Size ${variants[0].variantValue}`);
console.log(`Lowest Ask: $${pricing.lowestAskAmount}`);
console.log(`Highest Bid: $${pricing.highestBidAmount || 'N/A'}`);
```

### Market Data Structure:
```javascript
{
  "productId": "uuid",
  "variantId": "uuid", 
  "currencyCode": "USD",
  "lowestAskAmount": "178",
  "highestBidAmount": "30",
  "standardMarketData": {
    "lowestAsk": "178",
    "highestBidAmount": "30", 
    "sellFaster": "116",
    "earnMore": "128"
  },
  "flexMarketData": { /* alternative pricing */ },
  "directMarketData": { /* direct sale pricing */ }
}
```

### Integration Test Examples:

**Run complete user flow test:**
```bash
jest tests/integration/user-flow.integration.test.js
```

**Test specific workflow:**
```bash
# Test individual endpoints
jest tests/integration/catalog.integration.test.js

# Test OAuth flows  
jest tests/integration/helpers.integration.test.js
```

### Common Integration Patterns:

**Multi-size pricing comparison:**
```javascript
const variants = await stockxApi.catalog.getVariants(productId);
const pricing = await Promise.all(
  variants.slice(0, 5).map(variant => 
    stockxApi.catalog.getVariantMarketData(productId, variant.variantId, 'USD')
  )
);
```

**Currency conversion:**
```javascript
const [usdPrice, eurPrice] = await Promise.all([
  stockxApi.catalog.getVariantMarketData(productId, variantId, 'USD'),
  stockxApi.catalog.getVariantMarketData(productId, variantId, 'EUR')
]);
```

### Error Handling Best Practices:

**Product not found:**
```javascript
try {
  const product = await stockxApi.catalog.getProductBySlug('invalid-slug');
} catch (error) {
  if (error.message.includes('Product not found')) {
    // Handle gracefully - suggest similar products or search
  }
}
```

**Rate limiting:**
```javascript
// The client automatically handles rate limiting with Bottleneck
// No additional handling needed - requests are queued and executed safely
```

**Token expiry:**
```javascript
// Use auto-refresh script for production applications
const { autoRefreshTokens } = require('./scripts/auto-refresh');

if (!(await autoRefreshTokens())) {
  // Re-run OAuth flow if refresh fails
}
```