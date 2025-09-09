const StockxApi = require('../index');
const { helpers } = StockxApi;
const express = require('express');
const session = require('express-session');

const app = express();

app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: true,
}));

const CLIENT_ID = process.env.STOCKX_CLIENT_ID;
const CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET;
const API_KEY = process.env.STOCKX_API_KEY;
const REDIRECT_URI = 'http://localhost:3000/callback';

const tokenStore = helpers.storage.createFileStore('./tokens.json', {
  encrypt: true,
  secret: 'your-encryption-secret',
});

// Route to initiate OAuth2 flow
app.get('/auth', (req, res) => {
  const pkce = helpers.auth.generatePKCE();
  req.session.verifier = pkce.verifier;
  
  const authUrl = helpers.auth.buildAuthUrl(
    'https://accounts.stockx.com/oauth',
    CLIENT_ID,
    REDIRECT_URI,
    ['offline_access', 'openid'],
    'random-state-string'
  );
  
  console.log('Redirecting to:', authUrl);
  res.redirect(authUrl);
});

// OAuth2 callback route
app.get('/callback', async (req, res) => {
  try {
    const { code, state } = helpers.auth.parseAuthCode(req.originalUrl);
    console.log('Received auth code:', code);
    
    // Exchange authorization code for tokens
    const tokenUrl = helpers.auth.buildTokenUrl('https://accounts.stockx.com/oauth');
    const tokenResponse = await helpers.refresh.refreshToken(
      code,
      CLIENT_ID,
      CLIENT_SECRET,
      tokenUrl
    );
    
    const tokens = helpers.token.parse(tokenResponse);
    console.log('Received tokens:', {
      accessToken: tokens.accessToken.substring(0, 20) + '...',
      tokenType: tokens.tokenType,
      hasRefreshToken: !!tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });
    
    // Store tokens securely
    await tokenStore.set('user-tokens', tokens);
    
    // Create API client instance
    const stockxApi = new StockxApi(API_KEY, tokens.accessToken);
    
    // Test the API
    const searchResults = await stockxApi.catalog.search('Jordan 1', 1, 5);
    
    res.json({
      success: true,
      message: 'Authentication successful!',
      searchResults: searchResults.length + ' products found',
    });
  } catch (error) {
    console.error('OAuth2 callback error:', error);
    res.status(400).json({ 
      error: error.message,
      details: error.response?.data,
    });
  }
});

// Route to test authenticated API calls
app.get('/api/search', async (req, res) => {
  try {
    const tokens = await tokenStore.get('user-tokens');
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Check if token is expired
    if (helpers.token.isExpired(tokens.accessToken, 300)) {
      console.log('Token expired, refreshing...');
      
      // Refresh the token
      const tokenUrl = helpers.auth.buildTokenUrl('https://accounts.stockx.com/oauth');
      const newTokenResponse = await helpers.refresh.refreshToken(
        tokens.refreshToken,
        CLIENT_ID,
        CLIENT_SECRET,
        tokenUrl
      );
      
      const newTokens = helpers.token.parse(newTokenResponse);
      await tokenStore.set('user-tokens', newTokens);
      tokens.accessToken = newTokens.accessToken;
    }
    
    // Create API client
    const stockxApi = new StockxApi(API_KEY, tokens.accessToken);
    
    // Perform search
    const query = req.query.q || 'Nike';
    const results = await stockxApi.catalog.search(query, 1, 10);
    
    res.json({
      query,
      results: results.length,
      products: results,
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data,
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OAuth2 example server running on http://localhost:${PORT}`);
  console.log(`Visit http://localhost:${PORT}/auth to start OAuth2 flow`);
});