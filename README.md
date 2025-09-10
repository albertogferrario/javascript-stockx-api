# StockX API

Node.js wrapper for the StockX Public API with built-in OAuth2 helpers and rate limiting.

[![npm version](https://badge.fury.io/js/%40albertogferrario%2Fstockx-api.svg)](https://www.npmjs.com/package/@albertogferrario/stockx-api)

## Features

- OAuth2 helper utilities for authentication flows
- Automatic token refresh with request interceptors
- Built-in rate limiting (25,000 requests/day)
- Full TypeScript support
- Secure token storage options
- Promise-based async/await API
- Comprehensive error handling

## Installation

```bash
npm install @albertogferrario/stockx-api
```

## Quick Start

```javascript
const StockxApi = require('@albertogferrario/stockx-api');

// Initialize with your API key and JWT token
const stockxApi = new StockxApi('your-api-key', 'your-jwt-token');

// Search for products
const results = await stockxApi.catalog.search('Jordan 1', 1, 20);

// Get product by slug
const product = await stockxApi.catalog.getProductBySlug('air-jordan-1-retro-high-og-chicago');

// Get product variants using UUID
const variants = await stockxApi.catalog.getVariants(product.productId);

// Get market data
const marketData = await stockxApi.catalog.getVariantMarketData(
  product.productId,
  variants[0].variantId,
  'USD'
);
```

## Authentication

StockX uses OAuth2 Authorization Code Flow. You need to:

1. Register your application at [StockX Developer Portal](https://developer.stockx.com)
2. Implement OAuth2 flow to obtain JWT tokens
3. Use the `offline_access` scope to get refresh tokens

### Using OAuth2 Helpers

```javascript
const { helpers } = require('@albertogferrario/stockx-api');

// Generate authorization URL
const authUrl = helpers.auth.buildAuthUrl(
  'https://accounts.stockx.com/oauth',
  'your-client-id',
  'https://your-app.com/callback',
  ['offline_access', 'openid']
);

// Generate PKCE challenge (recommended)
const pkce = helpers.auth.generatePKCE();
// Store pkce.verifier securely for token exchange

// Parse callback URL
const { code } = helpers.auth.parseAuthCode(callbackUrl);

// Exchange code for tokens
const tokenResponse = await helpers.refresh.refreshToken(
  code,
  'your-client-id',
  'your-client-secret',
  'https://accounts.stockx.com/oauth/token'
);
```

## API Reference

### Constructor

```javascript
new StockxApi(apiKey, jwt, config)
```

- `apiKey` (string, required): Your StockX API key
- `jwt` (string, required): JWT access token
- `config` (object, optional): Configuration overrides
  - `baseUrl`: API base URL (default: `https://api.stockx.com/v2`)
  - `requestTimeout`: Request timeout in ms (default: 60000)
  - `requestRateLimitMinTime`: Min time between requests in ms (default: 1000)
  - `requestRateLimitReservoirAmount`: Daily request limit (default: 25000)
  - `requestRateLimitReservoirRefreshCronExpression`: Reset schedule (default: `0 0 * * *`)

### Methods

#### catalog.search(query, pageNumber, pageSize)

Search for products in the StockX catalog.

- `query` (string): Search query
- `pageNumber` (number): Page number (default: 1, min: 1)
- `pageSize` (number): Results per page (default: 10, max: 50)

```javascript
const searchResponse = await stockxApi.catalog.search('Nike Air Max', 1, 20);
// searchResponse contains: { count, pageSize, pageNumber, hasNextPage, products }
console.log(`Found ${searchResponse.count} products`);
const products = searchResponse.products;
```

#### catalog.getProductBySlug(slug)

Get product details by slug/urlKey. This method searches for products and returns the one with an exact `urlKey` match. This ensures you get the correct product even if the search returns similar products.

- `slug` (string): Product slug/urlKey (e.g., 'nike-dunk-low-se-easter-w')

```javascript
const product = await stockxApi.catalog.getProductBySlug('nike-dunk-low-se-easter-w');
console.log(product.productId); // UUID: c318bbcc-312a-4396-9252-698c203d1dea
console.log(product.urlKey); // Slug: nike-dunk-low-se-easter-w (exact match guaranteed)
```

**Note**: This method performs an exact match on the `urlKey` field to ensure accuracy. If the search returns similar products but none with the exact slug, it will throw an error rather than return a potentially incorrect product.

#### catalog.getVariants(productId)

Get all variants for a specific product.

- `productId` (string): StockX product UUID (not slug)

```javascript
// First get the product UUID
const product = await stockxApi.catalog.getProductBySlug('nike-dunk-low-se-easter-w');
// Then get variants using the UUID
const variants = await stockxApi.catalog.getVariants(product.productId);
```

#### catalog.getVariantMarketData(productId, variantId, currencyCode)

Get market data for a specific variant.

- `productId` (string): StockX product UUID (not slug)
- `variantId` (string): Variant ID
- `currencyCode` (string): Currency code (e.g., 'USD', 'EUR')

```javascript
const product = await stockxApi.catalog.getProductBySlug('nike-dunk-low-se-easter-w');
const variants = await stockxApi.catalog.getVariants(product.productId);
const marketData = await stockxApi.catalog.getVariantMarketData(
  product.productId,
  variants[0].variantId,
  'USD'
);
```

#### updateJwt(jwt)

Update the JWT token without creating a new client instance.

- `jwt` (string): New JWT token

```javascript
stockxApi.updateJwt('new-jwt-token');
```

## OAuth2 Helpers

### auth

OAuth2 URL builders and PKCE utilities.

```javascript
const { auth } = require('@albertogferrario/stockx-api').helpers;

// Build authorization URL
const authUrl = auth.buildAuthUrl(baseUrl, clientId, redirectUri, scopes, state);

// Generate PKCE challenge
const { verifier, challenge, method } = auth.generatePKCE();

// Parse authorization code from callback
const { code, state } = auth.parseAuthCode(callbackUrl);

// Build token exchange URL
const tokenUrl = auth.buildTokenUrl(baseUrl);
```

### token

JWT token parsing and validation utilities.

```javascript
const { token } = require('@albertogferrario/stockx-api').helpers;

// Decode JWT payload (without verification)
const payload = token.decode(jwt);

// Check if token is expired
const expired = token.isExpired(jwt, bufferSeconds);

// Get expiration date
const expiryDate = token.getExpiry(jwt);

// Parse OAuth2 token response
const parsed = token.parse(tokenResponse);
// Returns: { accessToken, tokenType, refreshToken, scope, expiresAt }
```

### refresh

Axios interceptor for automatic token refresh.

```javascript
const { refresh } = require('@albertogferrario/stockx-api').helpers;

// Create interceptor for automatic token refresh
refresh.createInterceptor(axiosClient, {
  onRefresh: async () => {
    // Refresh token and return new access token
    const response = await refresh.refreshToken(
      refreshToken,
      clientId,
      clientSecret,
      tokenUrl
    );
    const { accessToken } = token.parse(response);
    return accessToken;
  },
  shouldRefresh: (error) => error.response?.status === 401,
  maxRetries: 1
});

// Helper for token refresh
const newTokens = await refresh.refreshToken(
  refreshToken,
  clientId,
  clientSecret,
  tokenUrl
);
```

### storage

Token storage interface with multiple implementations.

```javascript
const { storage } = require('@albertogferrario/stockx-api').helpers;

// In-memory storage (default)
const memoryStore = new storage.MemoryStore();

// File-based storage
const fileStore = storage.createFileStore('./tokens.json', {
  encrypt: true,
  secret: 'your-encryption-secret'
});

// Custom storage implementation
class CustomStore extends storage.StorageInterface {
  async get(key) { /* implementation */ }
  async set(key, value) { /* implementation */ }
  async delete(key) { /* implementation */ }
  async clear() { /* implementation */ }
}

// Usage
await store.set('tokens', { accessToken: '...', refreshToken: '...' });
const tokens = await store.get('tokens');
```

## Examples

### Complete OAuth2 Flow

```javascript
const StockxApi = require('@albertogferrario/stockx-api');
const { helpers } = StockxApi;
const express = require('express');

const app = express();
const CLIENT_ID = 'your-client-id';
const CLIENT_SECRET = 'your-client-secret';
const REDIRECT_URI = 'http://localhost:3000/callback';

// Step 1: Redirect to authorization
app.get('/auth', (req, res) => {
  const pkce = helpers.auth.generatePKCE();
  req.session.verifier = pkce.verifier;

  const authUrl = helpers.auth.buildAuthUrl(
    'https://accounts.stockx.com/oauth',
    CLIENT_ID,
    REDIRECT_URI,
    ['offline_access', 'openid']
  );

  res.redirect(authUrl);
});

// Step 2: Handle callback
app.get('/callback', async (req, res) => {
  try {
    const { code } = helpers.auth.parseAuthCode(req.url);

    // Exchange code for tokens
    const tokenResponse = await helpers.refresh.refreshToken(
      code,
      CLIENT_ID,
      CLIENT_SECRET,
      'https://accounts.stockx.com/oauth/token'
    );

    const tokens = helpers.token.parse(tokenResponse);

    // Create API instance
    const stockxApi = new StockxApi('your-api-key', tokens.accessToken);

    // Store tokens securely
    await tokenStore.set('user-123', tokens);

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Automatic Token Refresh

```javascript
const StockxApi = require('@albertogferrario/stockx-api');
const { helpers } = StockxApi;

// Create token manager
const tokenStore = helpers.storage.createFileStore('./tokens.json');

async function createApiClient() {
  const tokens = await tokenStore.get('tokens');
  const api = new StockxApi('your-api-key', tokens.accessToken);

  // Add automatic refresh
  helpers.refresh.createInterceptor(api.client, {
    onRefresh: async () => {
      const newTokens = await helpers.refresh.refreshToken(
        tokens.refreshToken,
        CLIENT_ID,
        CLIENT_SECRET,
        'https://accounts.stockx.com/oauth/token'
      );

      const parsed = helpers.token.parse(newTokens);
      await tokenStore.set('tokens', parsed);

      // Update the API instance
      api.updateJwt(parsed.accessToken);

      return parsed.accessToken;
    }
  });

  return api;
}

// Use the client
const api = await createApiClient();
const products = await api.catalog.search('Jordan 1');
```

### Token Expiry Monitoring

```javascript
const { helpers } = StockxApi;

// Check token expiry before requests
async function makeApiCall() {
  const tokens = await tokenStore.get('tokens');

  // Check if token expires in next 5 minutes
  if (helpers.token.isExpired(tokens.accessToken, 300)) {
    // Refresh token
    const newTokens = await refreshTokens();
    await tokenStore.set('tokens', newTokens);
  }

  const api = new StockxApi('your-api-key', tokens.accessToken);
  return await api.catalog.search('Nike');
}
```

## Error Handling

The API wrapper provides detailed error messages:

```javascript
try {
  const results = await stockxApi.catalog.search('Nike');
} catch (error) {
  if (error.response) {
    // API error response
    console.error('API Error:', error.response.status, error.response.data);

    if (error.response.status === 401) {
      // Token expired - refresh and retry
    } else if (error.response.status === 429) {
      // Rate limited - wait and retry
    }
  } else if (error.request) {
    // Request made but no response
    console.error('Network error:', error.message);
  } else {
    // Request setup error
    console.error('Error:', error.message);
  }
}
```

## Rate Limiting

The package includes built-in rate limiting to comply with StockX API limits:

- **Daily limit**: 25,000 requests (resets at midnight UTC)
- **Minimum delay**: 1 second between requests
- **Sequential processing**: Requests are queued to prevent overwhelming the API

You can monitor rate limit usage:

```javascript
// Get current reservoir count
const remaining = stockxApi.limiter.reservoir;
console.log(`Requests remaining today: ${remaining}`);

// Listen for rate limit events
stockxApi.limiter.on('depleted', () => {
  console.log('Rate limit reached - requests will be queued');
});
```

## Configuration

### Custom Rate Limits

```javascript
const stockxApi = new StockxApi('api-key', 'jwt', {
  requestRateLimitMinTime: 2000, // 2 seconds between requests
  requestRateLimitReservoirAmount: 10000, // 10k requests per day
  requestRateLimitReservoirRefreshCronExpression: '0 */6 * * *' // Reset every 6 hours
});
```

### Custom Timeout

```javascript
const stockxApi = new StockxApi('api-key', 'jwt', {
  requestTimeout: 30000 // 30 second timeout
});
```

## Development

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run integration tests (requires API credentials)
npm run test:integration

# Run all tests
npm run test:all

# Run linter
npm run lint
```

### Integration Testing

This package includes integration tests that test against the real StockX API. To run these tests, you need valid API credentials.

#### Setup

1. Copy the example environment file:
   ```bash
   cp .env.test.example .env.test
   ```

2. Edit `.env.test` and add your StockX API credentials:
   ```env
   STOCKX_API_KEY=your-api-key-here
   STOCKX_JWT_TOKEN=your-jwt-token-here
   ```

3. Run integration tests:
   ```bash
   npm run test:integration
   ```

#### Test Configuration

The integration tests support the following environment variables in `.env.test`:

- `STOCKX_API_KEY` (required): Your StockX API key
- `STOCKX_JWT_TOKEN` (required): Your StockX JWT token
- `TEST_PRODUCT_SLUG` (optional): Product slug to use for testing (default: `air-jordan-1-retro-high-og-chicago-reimagined`)
- `TEST_TIMEOUT` (optional): Test timeout in milliseconds (default: 30000)
- `TEST_DELAY` (optional): Delay between API calls in milliseconds (default: 2000)

#### Important Notes

- Integration tests are automatically skipped if credentials are not provided
- Tests include delays between API calls to respect rate limits
- The `.env.test` file is gitignored to protect your credentials
- Integration tests make real API calls and count against your daily rate limit

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

ISC © Alberto Giancarlo Ferrario

## Links

- [NPM Package](https://www.npmjs.com/package/@albertogferrario/stockx-api)
- [GitHub Repository](https://github.com/albertogferrario/javascript-stockx-api)
- [StockX Developer Portal](https://developer.stockx.com)
- [Example Project](https://github.com/albertogferrario/javascript-stockx-api-example)
