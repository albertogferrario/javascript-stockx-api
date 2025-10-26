#!/usr/bin/env node

const { helpers } = require('../index');
const express = require('express');
const open = require('open');
const fs = require('fs');
const path = require('path');

// StockX OAuth2 Configuration - loaded from .env.test
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });
const CLIENT_ID = process.env.STOCKX_CLIENT_ID || 'your-client-id-here';
const CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET || 'your-client-secret-here';
const REDIRECT_URI = 'https://app.stockx-price-monitor.mistereseller.com/stockx-authorize-callback';
const AUTH_BASE_URL = 'https://accounts.stockx.com/oauth';
const TOKEN_URL = 'https://accounts.stockx.com/oauth/token';
const SCOPES = ['offline_access', 'openid'];

async function startOAuth2Flow() {
  console.log('🚀 Starting StockX OAuth2 Flow...');
  console.log('📋 Make sure you have:');
  console.log('   1. Registered your app at https://developer.stockx.com');
  console.log('   2. Set redirect URI to:', REDIRECT_URI);
  console.log('   3. Updated CLIENT_ID and CLIENT_SECRET in this script');
  console.log('');

  if (CLIENT_ID === 'your-client-id-here' || CLIENT_SECRET === 'your-client-secret-here') {
    console.error('❌ Please update CLIENT_ID and CLIENT_SECRET in this script');
    console.log('📖 Get these from: https://developer.stockx.com');
    process.exit(1);
  }

  const app = express();
  let server;

  console.log('🔐 Setting up OAuth2 authorization');

  // Build authorization URL
  const authUrl = helpers.auth.buildAuthUrl(
    AUTH_BASE_URL,
    CLIENT_ID,
    REDIRECT_URI,
    SCOPES,
    'oauth-flow-state'
  );

  console.log('🌐 Authorization URL:', authUrl);

  // Handle the OAuth callback
  app.get('/callback', async (req, res) => {
    try {
      console.log('🔄 Processing OAuth callback...');
      
      const { code, state, error } = req.query;
      
      if (error) {
        throw new Error(`OAuth error: ${error} - ${req.query.error_description || 'No description'}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      console.log('✅ Authorization code received');

      // Exchange code for tokens
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
      try {
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
      } catch (envError) {
        console.error('⚠️  Could not update .env.test:', envError.message);
        console.log('📋 Please manually update .env.test with:');
        console.log('   STOCKX_JWT_TOKEN=', tokens.accessToken);
        if (tokens.refreshToken) {
          console.log('   STOCKX_REFRESH_TOKEN=', tokens.refreshToken);
        }
      }

      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1 style="color: green;">✅ OAuth2 Flow Complete!</h1>
            <p>Your tokens have been saved. You can close this window and return to the terminal.</p>
            <p><strong>Access Token:</strong> ${tokens.accessToken.substring(0, 50)}...</p>
            ${tokens.refreshToken ? `<p><strong>Refresh Token:</strong> ${tokens.refreshToken.substring(0, 30)}...</p>` : ''}
            <p><strong>Expires:</strong> ${tokens.expiresAt}</p>
          </body>
        </html>
      `);

      // Close server after a delay
      setTimeout(() => {
        server.close();
        console.log('🏁 OAuth2 flow completed successfully!');
        console.log('🧪 Run integration tests with: npm run test:integration');
        process.exit(0);
      }, 2000);

    } catch (error) {
      console.error('❌ OAuth callback failed:', error.message);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1 style="color: red;">❌ OAuth2 Flow Failed</h1>
            <p><strong>Error:</strong> ${error.message}</p>
            <p>Check the terminal for more details.</p>
          </body>
        </html>
      `);
      
      setTimeout(() => {
        server.close();
        process.exit(1);
      }, 2000);
    }
  });

  // Start server
  server = app.listen(3001, () => {
    console.log('🖥️  Callback server started on http://localhost:3001');
    console.log('🌐 Opening browser for authorization...');
    
    // Open browser automatically
    open(authUrl).catch(() => {
      console.log('❌ Could not open browser automatically');
      console.log('🔗 Please manually open:', authUrl);
    });
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n🛑 OAuth2 flow cancelled');
    server.close();
    process.exit(0);
  });
}

// Check if running directly
if (require.main === module) {
  startOAuth2Flow().catch(error => {
    console.error('❌ OAuth2 flow failed:', error.message);
    process.exit(1);
  });
}

module.exports = { startOAuth2Flow };