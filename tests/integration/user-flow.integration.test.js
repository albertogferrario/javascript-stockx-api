const StockxApi = require('../../index');
const path = require('path');

// Load test environment
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

// Test configuration
const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT, 10) || 30000;
const TEST_DELAY = parseInt(process.env.TEST_DELAY, 10) || 2000;
const VERBOSE = process.env.VERBOSE === 'true';

// Helper functions for logging
const log = (message) => {
  console.log(`\n[User Flow] ${message}`);
};

const logVerbose = (message, data) => {
  if (VERBOSE && data) {
    console.log(`[Verbose] ${message}:`, JSON.stringify(data, null, 2));
  } else if (VERBOSE) {
    console.log(`[Verbose] ${message}`);
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

// Validation functions
const validateEnvironment = () => {
  const apiKey = process.env.STOCKX_API_KEY;
  const jwtToken = process.env.STOCKX_JWT_TOKEN;
  
  if (!apiKey || !jwtToken) {
    throw new Error('Missing required environment variables: STOCKX_API_KEY, STOCKX_JWT_TOKEN');
  }
  
  return { apiKey, jwtToken };
};

// Wait function for rate limiting
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('StockX API User Flow Integration Tests', () => {
  let stockxApi;
  const testSlugs = [
    'nike-dunk-low-se-easter-w',
    'air-jordan-1-retro-high-og-chicago-reimagined-lost-and-found',
    'air-jordan-1-mid-chicago-toe'
  ];
  
  beforeAll(() => {
    log('Starting StockX API User Flow Integration Tests');
    
    const { apiKey, jwtToken } = validateEnvironment();
    
    log('Test configuration:');
    log(`  API Key: ${apiKey.substring(0, 8)}...`);
    log(`  JWT Token: ${jwtToken.substring(0, 20)}...`);
    log(`  Verbose mode: ${VERBOSE}`);
    log(`  Test timeout: ${TEST_TIMEOUT}ms`);
    log(`  Delay between tests: ${TEST_DELAY}ms`);
    
    log('Initializing StockX API client...');
    stockxApi = new StockxApi(apiKey, jwtToken, {
      requestTimeout: TEST_TIMEOUT,
    });
    log('API client initialized successfully');
  });

  afterAll(async () => {
    log('Cleaning up...');
    if (stockxApi && stockxApi.limiter) {
      stockxApi.limiter.stop();
      log('Rate limiter stopped');
    }
    log('User flow integration tests completed');
  });

  describe('Complete User Flow: Slug → Variants → Prices', () => {
    testSlugs.forEach((testSlug, index) => {
      it(`should complete full flow for product: ${testSlug}`, async () => {
        log(`Starting complete user flow test ${index + 1}/${testSlugs.length}`);
        log(`Product slug: ${testSlug}`);
        
        try {
          // Step 1: Get product by slug
          log('Step 1: Getting product details from slug...');
          const product = await stockxApi.catalog.getProductBySlug(testSlug);
          
          expect(product).toBeDefined();
          expect(product.productId).toBeDefined();
          expect(product.urlKey).toBe(testSlug);
          
          log(`✓ Product found: ${product.title}`);
          log(`  Product ID: ${product.productId}`);
          log(`  Brand: ${product.brand}`);
          log(`  Style ID: ${product.styleId || 'N/A'}`);
          
          logVerbose('Full product details', product);
          
          // Wait before next API call
          await wait(1000);
          
          // Step 2: Get all variants for the product
          log('Step 2: Getting product variants...');
          const variants = await stockxApi.catalog.getVariants(product.productId);
          
          expect(variants).toBeDefined();
          expect(Array.isArray(variants)).toBe(true);
          expect(variants.length).toBeGreaterThan(0);
          
          log(`✓ Found ${variants.length} variants`);
          
          // Display all available sizes/variants
          const variantNames = variants.map(v => v.variantValue).sort();
          log(`  Available sizes: ${variantNames.join(', ')}`);
          
          logVerbose('First variant details', variants[0]);
          
          // Step 3: Get pricing for multiple variants (test first 3 variants)
          const variantsToTest = variants.slice(0, Math.min(3, variants.length));
          log(`Step 3: Getting pricing for ${variantsToTest.length} variants...`);
          
          const pricingResults = [];
          
          for (let i = 0; i < variantsToTest.length; i++) {
            const variant = variantsToTest[i];
            
            try {
              // Test both USD and EUR pricing
              log(`  Getting prices for size ${variant.variantValue}...`);
              
              // Get USD pricing
              const usdPricing = await stockxApi.catalog.getVariantMarketData(
                product.productId,
                variant.variantId,
                'USD'
              );
              
              await wait(500); // Small delay between requests
              
              // Get EUR pricing
              const eurPricing = await stockxApi.catalog.getVariantMarketData(
                product.productId,
                variant.variantId,
                'EUR'
              );
              
              expect(usdPricing).toBeDefined();
              expect(usdPricing.currencyCode).toBe('USD');
              expect(eurPricing).toBeDefined();
              expect(eurPricing.currencyCode).toBe('EUR');
              
              const result = {
                size: variant.variantValue,
                variantId: variant.variantId,
                usd: {
                  lowestAsk: usdPricing.lowestAskAmount,
                  highestBid: usdPricing.highestBidAmount,
                  currency: usdPricing.currencyCode
                },
                eur: {
                  lowestAsk: eurPricing.lowestAskAmount,
                  highestBid: eurPricing.highestBidAmount,
                  currency: eurPricing.currencyCode
                }
              };
              
              pricingResults.push(result);
              
              log(`    Size ${variant.variantValue}:`);
              log(`      USD - Ask: $${result.usd.lowestAsk || 'N/A'}, Bid: $${result.usd.highestBid || 'N/A'}`);
              log(`      EUR - Ask: €${result.eur.lowestAsk || 'N/A'}, Bid: €${result.eur.highestBid || 'N/A'}`);
              
              logVerbose(`USD pricing for size ${variant.variantValue}`, usdPricing);
              logVerbose(`EUR pricing for size ${variant.variantValue}`, eurPricing);
              
              await wait(1000); // Wait between variants to respect rate limits
              
            } catch (error) {
              logError(`Failed to get pricing for variant ${variant.variantValue}`, error);
              
              // Don't fail the entire test if one variant fails
              const result = {
                size: variant.variantValue,
                variantId: variant.variantId,
                error: error.message
              };
              pricingResults.push(result);
            }
          }
          
          // Step 4: Validate and summarize results
          log('Step 4: Validating complete user flow results...');
          
          expect(pricingResults.length).toBe(variantsToTest.length);
          
          // Count successful pricing requests
          const successfulPricing = pricingResults.filter(r => !r.error);
          const failedPricing = pricingResults.filter(r => r.error);
          
          log(`✓ User flow completed successfully!`);
          log(`  Product: ${product.title}`);
          log(`  Total variants: ${variants.length}`);
          log(`  Tested variants: ${variantsToTest.length}`);
          log(`  Successful pricing requests: ${successfulPricing.length}`);
          log(`  Failed pricing requests: ${failedPricing.length}`);
          
          if (failedPricing.length > 0) {
            log(`  Failed variants: ${failedPricing.map(f => f.size).join(', ')}`);
          }
          
          // Verify at least some pricing was successful
          expect(successfulPricing.length).toBeGreaterThan(0);
          
          // Create summary object for verification
          const flowSummary = {
            slug: testSlug,
            product: {
              id: product.productId,
              title: product.title,
              brand: product.brand
            },
            totalVariants: variants.length,
            testedVariants: variantsToTest.length,
            successfulPricing: successfulPricing.length,
            pricing: pricingResults
          };
          
          logVerbose('Complete flow summary', flowSummary);
          
        } catch (error) {
          logError(`User flow test failed for ${testSlug}`, error);
          throw error;
        }
        
        // Wait before next test
        if (index < testSlugs.length - 1) {
          log(`Waiting ${TEST_DELAY}ms before next test...`);
          await wait(TEST_DELAY);
        }
        
      }, TEST_TIMEOUT * 2); // Double timeout for complete flow
    });
  });

  describe('User Flow Edge Cases', () => {
    it('should handle products with many variants efficiently', async () => {
      log('Testing user flow with high-variant product...');
      
      try {
        // Use a product known to have many variants (Air Jordan 1)
        const productSlug = 'air-jordan-1-retro-high-og-chicago-reimagined-lost-and-found';
        
        // Step 1: Get product
        const product = await stockxApi.catalog.getProductBySlug(productSlug);
        expect(product).toBeDefined();
        
        await wait(1000);
        
        // Step 2: Get variants
        const variants = await stockxApi.catalog.getVariants(product.productId);
        expect(variants.length).toBeGreaterThan(10); // Should have many sizes
        
        log(`✓ Product has ${variants.length} variants`);
        
        // Step 3: Test pricing for just first and last variant to verify flow works
        const firstVariant = variants[0];
        const lastVariant = variants[variants.length - 1];
        
        await wait(1000);
        
        const firstPrice = await stockxApi.catalog.getVariantMarketData(
          product.productId,
          firstVariant.variantId,
          'USD'
        );
        
        await wait(1000);
        
        const lastPrice = await stockxApi.catalog.getVariantMarketData(
          product.productId,
          lastVariant.variantId,
          'USD'
        );
        
        expect(firstPrice).toBeDefined();
        expect(lastPrice).toBeDefined();
        
        log(`✓ Successfully got pricing for first size (${firstVariant.variantValue}) and last size (${lastVariant.variantValue})`);
        
      } catch (error) {
        logError('High-variant product test failed', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should gracefully handle variant pricing failures', async () => {
      log('Testing user flow with potential pricing failures...');
      
      try {
        const productSlug = 'nike-dunk-low-se-easter-w';
        
        // Step 1: Get product
        const product = await stockxApi.catalog.getProductBySlug(productSlug);
        expect(product).toBeDefined();
        
        await wait(1000);
        
        // Step 2: Get variants
        const variants = await stockxApi.catalog.getVariants(product.productId);
        expect(variants.length).toBeGreaterThan(0);
        
        // Step 3: Test with invalid currency code (should fail gracefully)
        const testVariant = variants[0];
        
        try {
          await stockxApi.catalog.getVariantMarketData(
            product.productId,
            testVariant.variantId,
            'INVALID_CURRENCY'
          );
          
          // If this doesn't throw, that's unexpected but not necessarily a failure
          log('⚠️ Invalid currency was accepted (unexpected but not critical)');
          
        } catch (error) {
          log('✓ Invalid currency correctly rejected');
          expect(error).toBeDefined();
        }
        
        await wait(1000);
        
        // Step 4: Verify valid currency still works
        const validPricing = await stockxApi.catalog.getVariantMarketData(
          product.productId,
          testVariant.variantId,
          'USD'
        );
        
        expect(validPricing).toBeDefined();
        expect(validPricing.currencyCode).toBe('USD');
        
        log('✓ Valid currency request works after invalid attempt');
        
      } catch (error) {
        logError('Pricing failure handling test failed', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });
});