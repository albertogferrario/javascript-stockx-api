const { token } = require('../../src/helpers');

describe('token helpers', () => {
  const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Vg30C57s3l90JNap_VgMhKZjfc-p7SoBXaSAy8c6BS8';
  const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ';

  describe('decode', () => {
    it('should decode valid JWT', () => {
      const payload = token.decode(validJwt);
      
      expect(payload).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022,
        exp: 9999999999
      });
    });

    it('should return null for invalid JWT', () => {
      expect(token.decode('invalid')).toBeNull();
      expect(token.decode('part1.part2')).toBeNull();
      expect(token.decode('')).toBeNull();
      expect(token.decode(null)).toBeNull();
      expect(token.decode(undefined)).toBeNull();
    });

    it('should return null for malformed payload', () => {
      const malformedJwt = 'header.notbase64.signature';
      expect(token.decode(malformedJwt)).toBeNull();
    });
  });

  describe('isExpired', () => {
    it('should return false for valid token', () => {
      expect(token.isExpired(validJwt)).toBe(false);
    });

    it('should return true for expired token', () => {
      expect(token.isExpired(expiredJwt)).toBe(true);
    });

    it('should respect buffer seconds', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 300;
      const soonToExpireJwt = `header.${Buffer.from(JSON.stringify({ exp: futureTime })).toString('base64')}.signature`;
      
      expect(token.isExpired(soonToExpireJwt, 0)).toBe(false);
      expect(token.isExpired(soonToExpireJwt, 400)).toBe(true);
    });

    it('should return true for invalid tokens', () => {
      expect(token.isExpired('invalid')).toBe(true);
      expect(token.isExpired(null)).toBe(true);
      expect(token.isExpired('')).toBe(true);
    });

    it('should return true for token without exp', () => {
      const noExpJwt = 'header.' + Buffer.from(JSON.stringify({ sub: '123' })).toString('base64') + '.signature';
      expect(token.isExpired(noExpJwt)).toBe(true);
    });
  });

  describe('getExpiry', () => {
    it('should return expiry date for valid token', () => {
      const expiry = token.getExpiry(validJwt);
      expect(expiry).toBeInstanceOf(Date);
      expect(expiry.getTime()).toBe(9999999999000);
    });

    it('should return null for token without exp', () => {
      const noExpJwt = 'header.' + Buffer.from(JSON.stringify({ sub: '123' })).toString('base64') + '.signature';
      expect(token.getExpiry(noExpJwt)).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(token.getExpiry('invalid')).toBeNull();
      expect(token.getExpiry(null)).toBeNull();
    });
  });

  describe('parse', () => {
    it('should parse valid token response', () => {
      const response = {
        access_token: 'access123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh123',
        scope: 'read write'
      };

      const parsed = token.parse(response);
      
      expect(parsed.accessToken).toBe('access123');
      expect(parsed.tokenType).toBe('Bearer');
      expect(parsed.refreshToken).toBe('refresh123');
      expect(parsed.scope).toEqual(['read', 'write']);
      expect(parsed.expiresAt).toBeInstanceOf(Date);
      expect(parsed.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle response without optional fields', () => {
      const response = {
        access_token: 'access123'
      };

      const parsed = token.parse(response);
      
      expect(parsed.accessToken).toBe('access123');
      expect(parsed.tokenType).toBe('Bearer');
      expect(parsed.refreshToken).toBeUndefined();
      expect(parsed.scope).toEqual([]);
      expect(parsed.expiresAt).toBeUndefined();
    });

    it('should throw error for invalid response', () => {
      expect(() => token.parse(null)).toThrow('Invalid token response');
      expect(() => token.parse('string')).toThrow('Invalid token response');
      expect(() => token.parse({})).toThrow('No access token in response');
    });
  });
});