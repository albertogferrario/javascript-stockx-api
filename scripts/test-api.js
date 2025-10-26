#!/usr/bin/env node

require('dotenv').config({ path: '.env.test' });
const StockxApi = require('../index');
const { helpers } = StockxApi;

async function testApiAccess() {
  const apiKey = process.env.STOCKX_API_KEY;
  const jwt = process.env.STOCKX_JWT_TOKEN;

  if (!apiKey || !jwt) {
    console.error('❌ Missing credentials in .env.test');
    console.log('📖 Please check .env.test file has STOCKX_API_KEY and STOCKX_JWT_TOKEN');
    process.exit(1);
  }

  console.log('🔍 Testing StockX API access...');
  console.log('📋 API Key:', apiKey.substring(0, 10) + '...');
  console.log('🎫 JWT Token:', jwt.substring(0, 30) + '...');

  // Check JWT expiration
  const payload = helpers.token.decode(jwt);
  if (payload) {
    const expiry = helpers.token.getExpiry(jwt);
    const isExpired = helpers.token.isExpired(jwt);
    
    console.log('📅 Token expires:', expiry?.toISOString() || 'Unknown');
    console.log('⏰ Token expired:', isExpired ? '❌ YES' : '✅ NO');
    
    if (isExpired) {
      console.log('🔄 You need to refresh your token. Run: npm run oauth2');
      process.exit(1);
    }
  } else {
    console.log('⚠️  Could not decode JWT token');
  }

  // Test API connection
  try {
    console.log('\n🧪 Testing API connection...');
    const stockxApi = new StockxApi(apiKey, jwt);
    
    // Simple search test
    console.log('🔍 Searching for "Nike"...');
    const searchResult = await stockxApi.catalog.search('Nike', 1, 5);
    
    console.log('✅ API test successful!');
    console.log('📊 Found', searchResult.count, 'products');
    console.log('📦 Returned', searchResult.products.length, 'products in this page');
    
    if (searchResult.products.length > 0) {
      const product = searchResult.products[0];
      console.log('🥇 First product:', product.title);
      console.log('🏷️  Brand:', product.brand);
      console.log('🔗 URL Key:', product.urlKey);
    }

    console.log('\n🎉 Ready for integration tests!');
    console.log('🚀 Run: npm run test:integration');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📋 Data:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n🔄 Token appears to be invalid. Try refreshing with: npm run oauth2');
      }
    }
    
    process.exit(1);
  }
}

testApiAccess().catch(error => {
  console.error('💥 Test failed:', error.message);
  process.exit(1);
});