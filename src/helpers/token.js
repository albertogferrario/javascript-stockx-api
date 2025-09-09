function decode(jwt) {
  if (!jwt || typeof jwt !== 'string') {
    return null;
  }

  const parts = jwt.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload;
  } catch (error) {
    return null;
  }
}

function isExpired(jwt, bufferSeconds = 0) {
  const payload = decode(jwt);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - bufferSeconds <= now;
}

function getExpiry(jwt) {
  const payload = decode(jwt);
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

function parse(tokenResponse) {
  if (!tokenResponse || typeof tokenResponse !== 'object') {
    throw new Error('Invalid token response');
  }

  const {
    access_token,
    token_type = 'Bearer',
    expires_in,
    refresh_token,
    scope,
  } = tokenResponse;

  if (!access_token) {
    throw new Error('No access token in response');
  }

  const result = {
    accessToken: access_token,
    tokenType: token_type,
    refreshToken: refresh_token,
    scope: scope ? scope.split(' ') : [],
  };

  if (expires_in) {
    result.expiresAt = new Date(Date.now() + expires_in * 1000);
  }

  return result;
}

module.exports = {
  decode,
  isExpired,
  getExpiry,
  parse,
};