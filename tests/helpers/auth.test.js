const { auth } = require('../../src/helpers');

describe('auth helpers', () => {
  describe('buildAuthUrl', () => {
    it('should build auth URL with default parameters', () => {
      const url = auth.buildAuthUrl(
        'https://auth.example.com',
        'client123',
        'https://app.com/callback'
      );

      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://auth.example.com');
      expect(parsed.pathname).toBe('/authorize');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('client_id')).toBe('client123');
      expect(parsed.searchParams.get('redirect_uri')).toBe('https://app.com/callback');
      expect(parsed.searchParams.get('scope')).toBe('offline_access');
      expect(parsed.searchParams.get('state')).toBeNull();
    });

    it('should build auth URL with custom scopes and state', () => {
      const url = auth.buildAuthUrl(
        'https://auth.example.com',
        'client123',
        'https://app.com/callback',
        ['read', 'write'],
        'random-state'
      );

      const parsed = new URL(url);
      expect(parsed.searchParams.get('scope')).toBe('read write');
      expect(parsed.searchParams.get('state')).toBe('random-state');
    });
  });

  describe('buildTokenUrl', () => {
    it('should build token URL', () => {
      const url = auth.buildTokenUrl('https://auth.example.com');
      expect(url).toBe('https://auth.example.com/token');
    });
  });

  describe('generatePKCE', () => {
    it('should generate PKCE challenge and verifier', () => {
      const pkce = auth.generatePKCE();
      
      expect(pkce).toHaveProperty('verifier');
      expect(pkce).toHaveProperty('challenge');
      expect(pkce).toHaveProperty('method');
      expect(pkce.method).toBe('S256');
      expect(pkce.verifier).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(pkce.challenge).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(pkce.verifier.length).toBeGreaterThanOrEqual(43);
    });

    it('should generate different values each time', () => {
      const pkce1 = auth.generatePKCE();
      const pkce2 = auth.generatePKCE();
      
      expect(pkce1.verifier).not.toBe(pkce2.verifier);
      expect(pkce1.challenge).not.toBe(pkce2.challenge);
    });
  });

  describe('parseAuthCode', () => {
    it('should parse auth code from callback URL', () => {
      const result = auth.parseAuthCode('https://app.com/callback?code=abc123&state=xyz');
      
      expect(result.code).toBe('abc123');
      expect(result.state).toBe('xyz');
    });

    it('should throw error if error is present', () => {
      expect(() => {
        auth.parseAuthCode('https://app.com/callback?error=access_denied&error_description=User%20denied');
      }).toThrow('OAuth2 error: access_denied - User denied');
    });

    it('should throw error if no code is present', () => {
      expect(() => {
        auth.parseAuthCode('https://app.com/callback?state=xyz');
      }).toThrow('No authorization code found in callback URL');
    });

    it('should handle missing error description', () => {
      expect(() => {
        auth.parseAuthCode('https://app.com/callback?error=invalid_request');
      }).toThrow('OAuth2 error: invalid_request - No description');
    });
  });
});