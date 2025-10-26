#!/usr/bin/env node

const { helpers } = require('../index');
const fs = require('fs');
const path = require('path');

async function refreshTokens() {
  // Load from .env.test file
  require('dotenv').config({ path: path.join(__dirname, '../.env.test') });
  
  const REFRESH_TOKEN = process.env.STOCKX_REFRESH_TOKEN;
  const CLIENT_ID = process.env.STOCKX_CLIENT_ID;
  const CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET;
  const TOKEN_URL = 'https://accounts.stockx.com/oauth/token';
  
  if (!REFRESH_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Missing required credentials in .env.test:');
    console.error('   - STOCKX_REFRESH_TOKEN:', REFRESH_TOKEN ? '✅' : '❌');
    console.error('   - STOCKX_CLIENT_ID:', CLIENT_ID ? '✅' : '❌');
    console.error('   - STOCKX_CLIENT_SECRET:', CLIENT_SECRET ? '✅' : '❌');
    console.error('');
    console.error('💡 Run the OAuth flow first: node scripts/oauth2-flow.js');
    process.exit(1);
  }

  try {
    console.log('🔄 Refreshing tokens...');
    
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
    
    envContent = envContent.replace(
      /STOCKX_JWT_TOKEN=.*/,
      `STOCKX_JWT_TOKEN=${tokens.accessToken}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('💾 Updated .env.test with new token');
    
  } catch (error) {
    console.error('❌ Failed to refresh tokens:', error.message);
    if (error.response) {
      console.error('📄 Response:', error.response.data);
    }
  }
}

refreshTokens();