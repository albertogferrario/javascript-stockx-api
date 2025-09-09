const crypto = require('crypto');

function buildAuthUrl(baseUrl, clientId, redirectUri, scopes = ['offline_access'], state = null) {
  const url = new URL(`${baseUrl}/authorize`);
  const params = {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
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

module.exports = {
  buildAuthUrl,
  buildTokenUrl,
  generatePKCE,
  parseAuthCode,
};