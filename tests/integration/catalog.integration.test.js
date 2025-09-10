require('dotenv').config({ path: '.env.test' });
const StockxApi = require('../../index');

// Check if credentials are provided
const skipTests = !process.env.STOCKX_API_KEY || !process.env.STOCKX_JWT_TOKEN;
const VERBOSE = process.env.VERBOSE === 'true';

// Logging helpers
const log = (message) => console.log(`\n[Integration] ${message}`);
const logVerbose = (message, data) => {
  if (VERBOSE) {
    console.log(`[Verbose] ${message}`, JSON.stringify(data, null, 2));
  }
};
const logError = (message, error) => {
  console.error(`[Error] ${message}`);
  if (error.response) {
    console.error(`  Status: ${error.response.status}`);
    console.error(`  Data:`, error.response.data);
  } else {
    console.error(`  Message: ${error.message}`);
  }
};

if (skipTests) {
  console.log('⚠️  Skipping integration tests: STOCKX_API_KEY or STOCKX_JWT_TOKEN not found in .env.test');
  console.log('   Copy .env.test.example to .env.test and add your credentials to run integration tests.\n');
} else {
  log('Starting StockX API Integration Tests');
  log(`Test configuration:`);
  log(`  - API Key: ${process.env.STOCKX_API_KEY.substring(0, 8)}...`);
  log(`  - JWT Token: ${process.env.STOCKX_JWT_TOKEN.substring(0, 20)}...`);
  log(`  - Verbose mode: ${VERBOSE}`);
}

// Helper function to delay between API calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TEST_DELAY = parseInt(process.env.TEST_DELAY || '2000', 10);
const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '30000', 10);

const testSuite = skipTests ? describe.skip : describe;

testSuite('StockX API Integration Tests', () => {
  let stockxApi;
  let testProduct;
  let currentTest = '';
  let testStartTime;
  const testSlug = process.env.TEST_PRODUCT_SLUG || 'nike-dunk-high-next-nature-summit-white-w';

  beforeAll(() => {
    log('Initializing StockX API client...');
    stockxApi = new StockxApi(
      process.env.STOCKX_API_KEY,
      process.env.STOCKX_JWT_TOKEN
    );
    log('API client initialized successfully');
  });

  beforeEach(() => {
    currentTest = expect.getState().currentTestName;
    testStartTime = Date.now();
    log(`Starting test: ${currentTest}`);
  });

  afterEach(async () => {
    const duration = Date.now() - testStartTime;
    log(`✓ Completed test: ${currentTest} (${duration}ms)`);
    
    // Add delay between tests to respect rate limits
    log(`Waiting ${TEST_DELAY}ms before next test...`);
    await delay(TEST_DELAY);
  });

  afterAll(async () => {
    log('Cleaning up...');
    // Stop the rate limiter to prevent Jest from hanging
    if (stockxApi && stockxApi.limiter) {
      await stockxApi.limiter.stop();
      log('Rate limiter stopped');
    }
    log('Integration tests completed');
  });

  describe('catalog.search()', () => {
    it('should search for products successfully', async () => {
      const searchQuery = 'Jordan 1 Chicago';
      log(`Searching for: "${searchQuery}"`);
      
      try {
        const searchResponse = await stockxApi.catalog.search(searchQuery, 1, 5);
        
        log(`Search completed - Found ${searchResponse.count} total results`);
        log(`  Page: ${searchResponse.pageNumber}/${Math.ceil(searchResponse.count / searchResponse.pageSize)}`);
        log(`  Products returned: ${searchResponse.products.length}`);
        
        logVerbose('Search response:', searchResponse);

        expect(searchResponse).toHaveProperty('count');
        expect(searchResponse).toHaveProperty('pageSize', 5);
        expect(searchResponse).toHaveProperty('pageNumber', 1);
        expect(searchResponse).toHaveProperty('hasNextPage');
        expect(searchResponse).toHaveProperty('products');
        expect(Array.isArray(searchResponse.products)).toBe(true);
        
        if (searchResponse.products.length > 0) {
          const product = searchResponse.products[0];
          log(`  First product: ${product.title} (${product.urlKey})`);
          
          expect(product).toHaveProperty('productId');
          expect(product).toHaveProperty('urlKey');
          expect(product).toHaveProperty('title');
          expect(product).toHaveProperty('brand');
          expect(product).toHaveProperty('productType');
        }
      } catch (error) {
        logError('Search failed', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should handle pagination correctly', async () => {
      const page1 = await stockxApi.catalog.search('Nike', 1, 10);
      await delay(TEST_DELAY);
      const page2 = await stockxApi.catalog.search('Nike', 2, 10);

      expect(page1.pageNumber).toBe(1);
      expect(page2.pageNumber).toBe(2);
      expect(page1.products).not.toEqual(page2.products);
    }, TEST_TIMEOUT);

    it('should return empty results for non-existent products', async () => {
      const searchResponse = await stockxApi.catalog.search('xyznonexistentproduct123456', 1, 10);
      
      expect(searchResponse.count).toBe(0);
      expect(searchResponse.products).toEqual([]);
    }, TEST_TIMEOUT);
  });

  describe('catalog.getProductBySlug()', () => {
    it('should get product by slug successfully', async () => {
      log(`Getting product by slug: ${testSlug}`);
      
      try {
        testProduct = await stockxApi.catalog.getProductBySlug(testSlug);
        
        log(`Product found with exact urlKey match:`);
        log(`  Title: ${testProduct.title}`);
        log(`  Product ID: ${testProduct.productId}`);
        log(`  URL Key: ${testProduct.urlKey}`);
        log(`  Brand: ${testProduct.brand}`);
        log(`  Style ID: ${testProduct.styleId}`);
        
        // Verify exact match
        expect(testProduct.urlKey).toBe(testSlug);
        log(`✓ URL key matches requested slug exactly`);
        
        logVerbose('Product details:', testProduct);

        expect(testProduct).toBeDefined();
        expect(testProduct).toHaveProperty('productId');
        expect(typeof testProduct.productId).toBe('string');
        expect(testProduct.productId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
        expect(testProduct).toHaveProperty('urlKey');
        expect(testProduct).toHaveProperty('title');
        expect(testProduct).toHaveProperty('brand');
        expect(testProduct).toHaveProperty('productType');
        expect(testProduct).toHaveProperty('styleId');
      } catch (error) {
        logError('Failed to get product by slug', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should throw error for non-existent slug', async () => {
      const nonExistentSlug = 'xyznonexistentproductslug9999999999';
      log(`Testing non-existent slug: ${nonExistentSlug}`);
      
      try {
        await stockxApi.catalog.getProductBySlug(nonExistentSlug);
        throw new Error('Expected error was not thrown');
      } catch (error) {
        if (error.message.includes('Product not found')) {
          log('✓ Correctly threw "Product not found" error');
        } else {
          logError('Unexpected error', error);
          throw error;
        }
      }
    }, TEST_TIMEOUT);
  });

  describe('catalog.getVariants()', () => {
    it('should get variants for a product', async () => {
      try {
        if (!testProduct) {
          log('No test product found, fetching one...');
          testProduct = await stockxApi.catalog.getProductBySlug(testSlug);
          await delay(TEST_DELAY);
        }

        log(`Getting variants for product: ${testProduct.productId}`);
        const variants = await stockxApi.catalog.getVariants(testProduct.productId);

        log(`Found ${variants.length} variants`);
        expect(Array.isArray(variants)).toBe(true);
        expect(variants.length).toBeGreaterThan(0);
        
        const variant = variants[0];
        log(`  First variant: Size ${variant.variantValue} (ID: ${variant.variantId})`);
        
        // Log size distribution
        const sizes = variants.map(v => v.variantValue);
        log(`  Available sizes: ${sizes.join(', ')}`);
        
        logVerbose('First variant details:', variant);

        expect(variant).toHaveProperty('variantId');
        expect(variant).toHaveProperty('variantValue'); // This is the size
        
        // Store first variant for market data test
        testProduct.testVariant = variant;
      } catch (error) {
        logError('Failed to get variants', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should handle invalid product ID gracefully', async () => {
      const invalidId = 'invalid-product-id';
      log(`Testing invalid product ID: ${invalidId}`);
      
      try {
        await stockxApi.catalog.getVariants(invalidId);
        throw new Error('Expected error was not thrown');
      } catch (error) {
        log('✓ Correctly threw error for invalid product ID');
        logVerbose('Error details:', error.message);
      }
    }, TEST_TIMEOUT);

    it('should fail with 400 when using slug instead of UUID', async () => {
      if (!testProduct) {
        log('No test product found, fetching one...');
        testProduct = await stockxApi.catalog.getProductBySlug(testSlug);
        await delay(TEST_DELAY);
      }
      
      log('Testing getVariants with slug instead of UUID...');
      log(`  Product slug (urlKey): ${testProduct.urlKey}`);
      log(`  Product UUID: ${testProduct.productId}`);
      
      try {
        log('Attempting to get variants using slug...');
        await stockxApi.catalog.getVariants(testProduct.urlKey);
        throw new Error('Expected 400 error but request succeeded');
      } catch (error) {
        log('Error received (as expected):');
        logError('getVariants with slug', error);
        
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
        log('✓ Correctly failed with 400 error when using slug');
        
        // Now show it works with UUID
        log('\nRetrying with correct UUID...');
        const variants = await stockxApi.catalog.getVariants(testProduct.productId);
        log(`✓ Successfully retrieved ${variants.length} variants using UUID`);
      }
    }, TEST_TIMEOUT);
  });

  describe('catalog.getVariantMarketData()', () => {
    it('should get market data for a variant', async () => {
      try {
        if (!testProduct || !testProduct.testVariant) {
          log('Preparing test data for market data test...');
          testProduct = await stockxApi.catalog.getProductBySlug(testSlug);
          await delay(TEST_DELAY);
          const variants = await stockxApi.catalog.getVariants(testProduct.productId);
          testProduct.testVariant = variants[0];
          await delay(TEST_DELAY);
        }

        log(`Getting market data for variant:`);
        log(`  Product: ${testProduct.title}`);
        log(`  Size: ${testProduct.testVariant.variantValue}`);
        log(`  Variant ID: ${testProduct.testVariant.variantId}`);

        const marketData = await stockxApi.catalog.getVariantMarketData(
          testProduct.productId,
          testProduct.testVariant.variantId,
          'USD'
        );

        log('Market data received:');
        log(`  Lowest Ask: $${marketData.lowestAsk || 'N/A'}`);
        log(`  Highest Bid: $${marketData.highestBid || 'N/A'}`);
        log(`  Last Sale: $${marketData.lastSale || 'N/A'}`);
        
        logVerbose('Full market data:', marketData);

        expect(marketData).toBeDefined();
        expect(marketData).toHaveProperty('lowestAsk');
        expect(marketData).toHaveProperty('highestBid');
        expect(marketData).toHaveProperty('lastSale');
      } catch (error) {
        logError('Failed to get market data', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should support different currency codes', async () => {
      if (!testProduct || !testProduct.testVariant) {
        testProduct = await stockxApi.catalog.getProductBySlug(testSlug);
        await delay(TEST_DELAY);
        const variants = await stockxApi.catalog.getVariants(testProduct.productId);
        testProduct.testVariant = variants[0];
        await delay(TEST_DELAY);
      }

      const marketDataEUR = await stockxApi.catalog.getVariantMarketData(
        testProduct.productId,
        testProduct.testVariant.variantId,
        'EUR'
      );

      expect(marketDataEUR).toBeDefined();
      expect(marketDataEUR).toHaveProperty('lowestAsk');
    }, TEST_TIMEOUT);
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting gracefully', async () => {
      log('Testing rate limiting with rapid concurrent requests...');
      
      try {
        // Make multiple rapid requests to test rate limiting
        const promises = [];
        const startTime = Date.now();
        
        for (let i = 0; i < 3; i++) {
          log(`  Queuing request ${i + 1}/3`);
          promises.push(stockxApi.catalog.search(`Test${i}`, 1, 1));
        }

        log('Waiting for all requests to complete...');
        // All requests should complete successfully due to built-in rate limiting
        const results = await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        
        log(`All ${results.length} requests completed in ${totalTime}ms`);
        log(`Average time per request: ${Math.round(totalTime / results.length)}ms`);
        
        results.forEach((result, index) => {
          expect(result).toHaveProperty('products');
          log(`  Request ${index + 1}: ${result.count} results`);
        });
        
        log('✓ Rate limiter successfully handled concurrent requests');
      } catch (error) {
        logError('Rate limiting test failed', error);
        throw error;
      }
    }, TEST_TIMEOUT * 2);
  });

  describe('JWT Token Update', () => {
    it('should allow updating JWT token', async () => {
      const originalJwt = stockxApi.jwt;
      const newJwt = process.env.STOCKX_JWT_TOKEN; // Same token for testing
      
      stockxApi.updateJwt(newJwt);
      
      expect(stockxApi.jwt).toBe(newJwt);
      
      // Verify API still works after token update
      const searchResponse = await stockxApi.catalog.search('Nike', 1, 1);
      expect(searchResponse).toHaveProperty('products');
      
      // Restore original JWT
      stockxApi.updateJwt(originalJwt);
    }, TEST_TIMEOUT);
  });
});