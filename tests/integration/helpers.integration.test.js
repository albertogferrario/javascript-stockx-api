require('dotenv').config({ path: '.env.test' });
const { helpers } = require('../../index');
const axios = require('axios');

// Check if test environment is set up for helper integration tests
const skipTests = !process.env.STOCKX_JWT_TOKEN;

const testSuite = skipTests ? describe.skip : describe;

if (skipTests) {
  console.log('⚠️  Skipping helpers integration tests: STOCKX_JWT_TOKEN not found in .env.test');
}

testSuite('Helpers Integration Tests', () => {
  const TEST_TIMEOUT = 30000;

  describe('token helpers with real JWT', () => {
    it('should decode real JWT token successfully', () => {
      const jwt = process.env.STOCKX_JWT_TOKEN;
      const payload = helpers.token.decode(jwt);
      
      expect(payload).toBeDefined();
      expect(payload).toHaveProperty('exp');
      expect(payload).toHaveProperty('iat');
      expect(typeof payload.exp).toBe('number');
      expect(typeof payload.iat).toBe('number');
    });

    it('should check expiry of real JWT token', () => {
      const jwt = process.env.STOCKX_JWT_TOKEN;
      
      // Check without buffer - should be valid if token is fresh
      const isExpiredNow = helpers.token.isExpired(jwt);
      
      // Check with large buffer - may be expired if token expires soon
      const isExpiredWithBuffer = helpers.token.isExpired(jwt, 86400); // 24 hours buffer
      
      expect(typeof isExpiredNow).toBe('boolean');
      expect(typeof isExpiredWithBuffer).toBe('boolean');
      
      // If expired without buffer, it should also be expired with buffer
      if (isExpiredNow) {
        expect(isExpiredWithBuffer).toBe(true);
      }
    });

    it('should get expiry date of real JWT token', () => {
      const jwt = process.env.STOCKX_JWT_TOKEN;
      const expiry = helpers.token.getExpiry(jwt);
      
      expect(expiry).toBeInstanceOf(Date);
      expect(expiry.getTime()).toBeGreaterThan(0);
    });
  });

  describe('auth helpers URL building', () => {
    it('should build valid StockX authorization URL', () => {
      const authUrl = helpers.auth.buildAuthUrl(
        'https://accounts.stockx.com/oauth',
        'test-client-id',
        'https://example.com/callback',
        ['offline_access', 'openid'],
        'test-state'
      );

      const url = new URL(authUrl);
      expect(url.hostname).toBe('accounts.stockx.com');
      expect(url.pathname).toBe('/oauth/authorize');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('client_id')).toBe('test-client-id');
      expect(url.searchParams.get('redirect_uri')).toBe('https://example.com/callback');
      expect(url.searchParams.get('scope')).toBe('offline_access openid');
      expect(url.searchParams.get('state')).toBe('test-state');
    });

    it('should build valid StockX token URL', () => {
      const tokenUrl = helpers.auth.buildTokenUrl('https://accounts.stockx.com/oauth');
      expect(tokenUrl).toBe('https://accounts.stockx.com/oauth/token');
    });

    it('should generate valid PKCE values', () => {
      const pkce = helpers.auth.generatePKCE();
      
      expect(pkce.verifier).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(pkce.challenge).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(pkce.method).toBe('S256');
      expect(pkce.verifier.length).toBeGreaterThanOrEqual(43);
      expect(pkce.challenge.length).toBeGreaterThanOrEqual(43);
    });

    it('should parse authorization callback URLs correctly', () => {
      const callbackUrl = 'https://example.com/callback?code=test-auth-code&state=test-state';
      const result = helpers.auth.parseAuthCode(callbackUrl);
      
      expect(result.code).toBe('test-auth-code');
      expect(result.state).toBe('test-state');
    });

    it('should handle OAuth2 error responses', () => {
      const errorUrl = 'https://example.com/callback?error=access_denied&error_description=User%20denied%20access';
      
      expect(() => {
        helpers.auth.parseAuthCode(errorUrl);
      }).toThrow('OAuth2 error: access_denied - User denied access');
    });
  });

  describe('storage helpers', () => {
    it('should create and use memory store', async () => {
      const store = new helpers.storage.MemoryStore();
      
      await store.set('test-key', { token: 'test-value', timestamp: Date.now() });
      const retrieved = await store.get('test-key');
      
      expect(retrieved).toEqual(
        expect.objectContaining({
          token: 'test-value',
          timestamp: expect.any(Number)
        })
      );
      
      const deleted = await store.delete('test-key');
      expect(deleted).toBe(true);
      
      const afterDelete = await store.get('test-key');
      expect(afterDelete).toBeUndefined();
    });

    it('should create file store and persist data', async () => {
      const os = require('os');
      const path = require('path');
      const fs = require('fs').promises;
      
      const tempFile = path.join(os.tmpdir(), `test-tokens-${Date.now()}.json`);
      const store = helpers.storage.createFileStore(tempFile);
      
      try {
        await store.set('access_token', 'test-access-token');
        await store.set('refresh_token', 'test-refresh-token');
        
        // Verify data persisted to file
        const fileContent = await fs.readFile(tempFile, 'utf8');
        const data = JSON.parse(fileContent);
        expect(data.access_token).toBe('test-access-token');
        expect(data.refresh_token).toBe('test-refresh-token');
        
        // Test retrieval
        const accessToken = await store.get('access_token');
        expect(accessToken).toBe('test-access-token');
        
        // Test clear
        await store.clear();
        const afterClear = await store.get('access_token');
        expect(afterClear).toBeUndefined();
        
      } finally {
        // Cleanup
        try {
          await fs.unlink(tempFile);
        } catch (e) {
          // File might not exist
        }
      }
    });
  });

  describe('token parsing', () => {
    it('should parse OAuth2 token response correctly', () => {
      const tokenResponse = {
        access_token: 'access-123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-123',
        scope: 'offline_access openid'
      };

      const parsed = helpers.token.parse(tokenResponse);
      
      expect(parsed.accessToken).toBe('access-123');
      expect(parsed.tokenType).toBe('Bearer');
      expect(parsed.refreshToken).toBe('refresh-123');
      expect(parsed.scope).toEqual(['offline_access', 'openid']);
      expect(parsed.expiresAt).toBeInstanceOf(Date);
      expect(parsed.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle minimal token response', () => {
      const minimalResponse = {
        access_token: 'access-only'
      };

      const parsed = helpers.token.parse(minimalResponse);
      
      expect(parsed.accessToken).toBe('access-only');
      expect(parsed.tokenType).toBe('Bearer');
      expect(parsed.refreshToken).toBeUndefined();
      expect(parsed.scope).toEqual([]);
      expect(parsed.expiresAt).toBeUndefined();
    });
  });

  describe('refresh interceptor with mock client', () => {
    it('should create interceptor without throwing', () => {
      const mockClient = {
        interceptors: {
          response: {
            use: jest.fn()
          }
        }
      };

      const onRefresh = jest.fn().mockResolvedValue('new-token');
      
      expect(() => {
        helpers.refresh.createInterceptor(mockClient, { onRefresh });
      }).not.toThrow();
      
      expect(mockClient.interceptors.response.use).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should require onRefresh callback', () => {
      const mockClient = {
        interceptors: {
          response: {
            use: jest.fn()
          }
        }
      };

      expect(() => {
        helpers.refresh.createInterceptor(mockClient);
      }).toThrow('onRefresh callback is required');
    });
  });
});