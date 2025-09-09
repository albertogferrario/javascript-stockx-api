const StockxApi = require('../index');
const { helpers } = StockxApi;

// Configuration
const CLIENT_ID = process.env.STOCKX_CLIENT_ID;
const CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET;
const API_KEY = process.env.STOCKX_API_KEY;

// Create persistent token storage
const tokenStore = helpers.storage.createFileStore('./tokens.json');

async function createApiClientWithAutoRefresh() {
  // Get stored tokens
  let tokens = await tokenStore.get('tokens');
  
  if (!tokens) {
    throw new Error('No tokens found. Please authenticate first.');
  }
  
  // Create API instance
  const stockxApi = new StockxApi(API_KEY, tokens.accessToken);
  
  // Add automatic refresh interceptor
  helpers.refresh.createInterceptor(stockxApi.client, {
    onRefresh: async () => {
      console.log('Token expired, refreshing...');
      
      try {
        // Refresh the token
        const tokenUrl = helpers.auth.buildTokenUrl('https://accounts.stockx.com/oauth');
        const newTokenResponse = await helpers.refresh.refreshToken(
          tokens.refreshToken,
          CLIENT_ID,
          CLIENT_SECRET,
          tokenUrl
        );
        
        // Parse and store new tokens
        const newTokens = helpers.token.parse(newTokenResponse);
        await tokenStore.set('tokens', newTokens);
        
        // Update the API instance with new token
        stockxApi.updateJwt(newTokens.accessToken);
        
        // Update local reference
        tokens = newTokens;
        
        console.log('Token refreshed successfully');
        return newTokens.accessToken;
      } catch (error) {
        console.error('Token refresh failed:', error.message);
        throw error;
      }
    },
    shouldRefresh: (error) => {
      // Refresh on 401 Unauthorized
      return error.response && error.response.status === 401;
    },
    maxRetries: 2,
  });
  
  return stockxApi;
}

// Example usage
async function performApiOperations() {
  try {
    // Create client with auto-refresh
    const api = await createApiClientWithAutoRefresh();
    
    console.log('Searching for Jordan 1...');
    const searchResults = await api.catalog.search('Jordan 1', 1, 5);
    console.log(`Found ${searchResults.length} products`);
    
    // If we have results, get details for the first product
    if (searchResults.length > 0) {
      const product = searchResults[0];
      console.log(`\nGetting variants for: ${product.title}`);
      
      const variants = await api.catalog.getVariants(product.id);
      console.log(`Found ${variants.length} variants`);
      
      // Get market data for first variant
      if (variants.length > 0) {
        const variant = variants[0];
        console.log(`\nGetting market data for size: ${variant.size}`);
        
        const marketData = await api.catalog.getVariantMarketData(
          product.id,
          variant.id,
          'USD'
        );
        console.log('Market data:', marketData);
      }
    }
  } catch (error) {
    console.error('Operation failed:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.status, error.response.data);
    }
  }
}

// Token monitoring example
async function monitorTokenExpiry() {
  const tokens = await tokenStore.get('tokens');
  
  if (!tokens) {
    console.log('No tokens found');
    return;
  }
  
  const payload = helpers.token.decode(tokens.accessToken);
  const expiryDate = helpers.token.getExpiry(tokens.accessToken);
  
  console.log('Token information:');
  console.log('- Issued at:', new Date(payload.iat * 1000).toISOString());
  console.log('- Expires at:', expiryDate ? expiryDate.toISOString() : 'Unknown');
  console.log('- Subject:', payload.sub);
  console.log('- Scopes:', tokens.scope);
  
  // Check if token expires within 5 minutes
  if (helpers.token.isExpired(tokens.accessToken, 300)) {
    console.log('\nToken expires soon or is already expired!');
  } else {
    console.log('\nToken is still valid');
  }
}

// Run examples
(async () => {
  console.log('=== Token Monitoring ===');
  await monitorTokenExpiry();
  
  console.log('\n=== API Operations with Auto-Refresh ===');
  await performApiOperations();
})();