#!/usr/bin/env node

const { helpers } = require('../index');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load credentials from .env.test
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const CLIENT_ID = process.env.STOCKX_CLIENT_ID || 'your-client-id-here';
const CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET || 'your-client-secret-here';
const REDIRECT_URI = 'https://app.stockx-price-monitor.mistereseller.com/stockx-authorize-callback';
const AUTH_BASE_URL = 'https://accounts.stockx.com/oauth';
const TOKEN_URL = 'https://accounts.stockx.com/oauth/token';
const SCOPES = ['offline_access', 'openid'];

async function manualOAuth2Flow() {
  console.log('🚀 Manual StockX OAuth2 Flow');
  console.log('========================================');
  
  if (CLIENT_ID === 'your-client-id-here' || CLIENT_SECRET === 'your-client-secret-here') {
    console.error('❌ Please ensure CLIENT_ID and CLIENT_SECRET are set in .env.test');
    process.exit(1);
  }

  console.log('🔐 Setting up OAuth2 authorization');

  // Build authorization URL
  const authUrl = helpers.auth.buildAuthUrl(
    AUTH_BASE_URL,
    CLIENT_ID,
    REDIRECT_URI,
    SCOPES,
    'oauth-flow-state'
  );

  console.log('\n🌐 STEP 1: Open this URL in your browser:');
  console.log('==========================================');
  console.log(authUrl);
  console.log('\n📋 Steps:');
  console.log('1. Copy the URL above and paste it into your browser');
  console.log('2. Log in to your StockX account');
  console.log('3. Authorize the application');
  console.log('4. You will be redirected to the callback URL');
  console.log('5. Copy the ENTIRE callback URL from your browser');
  console.log('6. Paste it below when prompted');

  // Wait for user to complete authorization
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('\n🔗 STEP 2: Paste the full callback URL here: ', async (callbackUrl) => {
      rl.close();
      
      try {
        console.log('\n🔄 Processing callback URL...');
        
        // Parse the callback URL to extract the authorization code
        const { code, state, error } = helpers.auth.parseAuthCode(callbackUrl);
        
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        console.log('✅ Authorization code extracted successfully');

        // Exchange code for tokens
        console.log('🔄 Exchanging code for tokens...');
        
        const axios = require('axios');
        const params = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET
        });

        const tokenResponse = await axios.post(TOKEN_URL, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        const tokens = helpers.token.parse(tokenResponse.data);
        
        console.log('🎉 Tokens received successfully!');
        console.log('📝 Access token:', tokens.accessToken.substring(0, 50) + '...');
        console.log('🔄 Refresh token:', tokens.refreshToken ? tokens.refreshToken.substring(0, 30) + '...' : 'Not provided');
        console.log('📅 Expires at:', tokens.expiresAt);

        // Update .env.test file with both access and refresh tokens
        const envPath = path.join(__dirname, '../.env.test');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Update access token
        envContent = envContent.replace(
          /STOCKX_JWT_TOKEN=.*/,
          `STOCKX_JWT_TOKEN=${tokens.accessToken}`
        );
        
        // Update or add refresh token
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
        console.log('💾 Updated .env.test with new access token');
        if (tokens.refreshToken) {
          console.log('💾 Updated .env.test with refresh token');
        }

        console.log('\n🏁 OAuth2 flow completed successfully!');
        console.log('🧪 Test your API access with: npm run test-api');
        console.log('🚀 Run integration tests with: npm run test:integration');
        
        resolve();

      } catch (error) {
        console.error('❌ OAuth2 flow failed:', error.message);
        if (error.response) {
          console.error('📄 Status:', error.response.status);
          console.error('📋 Data:', error.response.data);
        }
        reject(error);
      }
    });
  });
}

// Check if running directly
if (require.main === module) {
  manualOAuth2Flow().catch(error => {
    console.error('💥 Manual OAuth2 flow failed:', error.message);
    process.exit(1);
  });
}

module.exports = { manualOAuth2Flow };