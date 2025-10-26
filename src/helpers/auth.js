const crypto = require('crypto');

function buildAuthUrl(baseUrl, clientId, redirectUri, scopes = ['offline_access', 'openid'], state = null, audience = 'gateway.stockx.com') {
  const url = new URL(`${baseUrl}/authorize`);
  const params = {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    audience,
  };

  if (state) {
    params.state = state;
  }

  url.search = new URLSearchParams(params).toString();
  return url.toString();
}

function buildTokenUrl(baseUrl) {
  return `${baseUrl}/token`;
}

function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return {
    verifier,
    challenge,
    method: 'S256',
  };
}

function parseAuthCode(callbackUrl) {
  const url = new URL(callbackUrl);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    throw new Error(`OAuth2 error: ${error} - ${errorDescription || 'No description'}`);
  }

  if (!code) {
    throw new Error('No authorization code found in callback URL');
  }

  return { code, state };
}

async function exchangeAuthCode(code, clientId, clientSecret, redirectUri, tokenUrl, audience = 'gateway.stockx.com') {
  const axios = require('axios');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    audience,
  });

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
}

module.exports = {
  buildAuthUrl,
  buildTokenUrl,
  generatePKCE,
  parseAuthCode,
  exchangeAuthCode,
};
