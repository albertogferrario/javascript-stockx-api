# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Node.js API wrapper for the StockX Public API. It provides a rate-limited HTTP client with automatic JWT token management for accessing StockX catalog data.

## Development Commands

- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint with Airbnb config (use `.eslintrc.js` for configuration)
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

Tests use `jest-mock-axios` for mocking HTTP requests. Test files are located in `tests/` directory and follow the pattern `*.test.js`.