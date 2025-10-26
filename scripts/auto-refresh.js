#!/usr/bin/env node

const { helpers } = require('../index');
const fs = require('fs');
const path = require('path');

/**
 * Automatically refresh tokens if they're expired or about to expire
 * @param {number} bufferMinutes - Refresh if token expires within this many minutes (default: 30)
 */
async function autoRefreshTokens(bufferMinutes = 30) {
  // Load from .env.test file
  require('dotenv').config({ path: path.join(__dirname, '../.env.test') });
  
  const CURRENT_TOKEN = process.env.STOCKX_JWT_TOKEN;
  const REFRESH_TOKEN = process.env.STOCKX_REFRESH_TOKEN;
  const CLIENT_ID = process.env.STOCKX_CLIENT_ID;
  const CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET;
  const TOKEN_URL = 'https://accounts.stockx.com/oauth/token';
  
  if (!CURRENT_TOKEN) {
    console.error('❌ No current token found in .env.test');
    console.error('💡 Run the OAuth flow first: node scripts/oauth2-flow.js');
    return false;
  }
  
  if (!REFRESH_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Missing refresh credentials in .env.test:');
    console.error('   - STOCKX_REFRESH_TOKEN:', REFRESH_TOKEN ? '✅' : '❌');
    console.error('   - STOCKX_CLIENT_ID:', CLIENT_ID ? '✅' : '❌');
    console.error('   - STOCKX_CLIENT_SECRET:', CLIENT_SECRET ? '✅' : '❌');
    console.error('💡 Run the OAuth flow first: node scripts/oauth2-flow.js');
    return false;
  }

  try {
    // For encrypted tokens, we need to check against a stored expiration time
    // Let's try to find if we have expiration info stored somewhere
    let needsRefresh = false;
    
    // Check if token looks expired (basic heuristic for encrypted tokens)
    // StockX encrypted tokens are typically quite long
    if (CURRENT_TOKEN.length < 100) {
      console.log('🔍 Token appears to be expired or invalid (too short)');
      needsRefresh = true;
    } else {
      // Since we can't decode encrypted tokens, we'll be conservative
      // and check if we can make a simple API call
      console.log('🔍 Testing current token validity...');
      try {
        const StockxApi = require('../index');
        const api = new StockxApi(process.env.STOCKX_API_KEY, CURRENT_TOKEN, {
          requestTimeout: 10000
        });
        
        // Try a simple catalog search to test the token
        await api.catalog.search('nike', 1, 1);
        console.log('✅ Current token is still valid');
        return true;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('🔍 Current token is expired (401 Unauthorized)');
          needsRefresh = true;
        } else {
          console.log('⚠️ API test failed, but may not be token-related:', error.message);
          return false;
        }
      }
    }
    
    if (!needsRefresh) {
      return true;
    }
    
    console.log('🔄 Refreshing expired token...');
    
    const tokenResponse = await helpers.refresh.refreshToken(
      REFRESH_TOKEN,
      CLIENT_ID,
      CLIENT_SECRET,
      TOKEN_URL,
      'gateway.stockx.com'
    );

    const tokens = helpers.token.parse(tokenResponse);
    
    console.log('✅ Tokens refreshed successfully!');
    console.log('📝 New access token:', tokens.accessToken.substring(0, 50) + '...');
    console.log('📅 Expires at:', tokens.expiresAt);
    
    // Update .env.test file
    const envPath = path.join(__dirname, '../.env.test');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update access token
    envContent = envContent.replace(
      /STOCKX_JWT_TOKEN=.*/,
      `STOCKX_JWT_TOKEN=${tokens.accessToken}`
    );
    
    // Update refresh token if provided
    if (tokens.refreshToken) {
      if (envContent.includes('STOCKX_REFRESH_TOKEN=')) {
        envContent = envContent.replace(
          /STOCKX_REFRESH_TOKEN=.*/,
          `STOCKX_REFRESH_TOKEN=${tokens.refreshToken}`
        );
      } else {
        envContent += `\nSTOCKX_REFRESH_TOKEN=${tokens.refreshToken}`;
      }
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('💾 Updated .env.test with new tokens');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to refresh tokens:', error.message);
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📋 Data:', error.response.data);
    }
    return false;
  }
}

// Check if running directly
if (require.main === module) {
  const bufferMinutes = process.argv[2] ? parseInt(process.argv[2]) : 30;
  
  autoRefreshTokens(bufferMinutes).then(success => {
    if (success) {
      console.log('🏁 Token refresh check completed successfully');
      process.exit(0);
    } else {
      console.error('💥 Token refresh check failed');
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 Token refresh check failed:', error.message);
    process.exit(1);
  });
}

module.exports = { autoRefreshTokens };