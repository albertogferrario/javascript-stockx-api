const config = require('../config');

describe('config', () => {
  it('should export correct default values', () => {
    expect(config).toEqual({
      baseUrl: 'https://api.stockx.com/v2',
      requestTimeout: 60000, // 1000 * 60
      requestRateLimitMinTime: 1000,
      requestRateLimitReservoirAmount: 25000,
      requestRateLimitReservoirRefreshCronExpression: '0 0 * * *'
    });
  });

  it('should have correct types for all values', () => {
    expect(typeof config.baseUrl).toBe('string');
    expect(typeof config.requestTimeout).toBe('number');
    expect(typeof config.requestRateLimitMinTime).toBe('number');
    expect(typeof config.requestRateLimitReservoirAmount).toBe('number');
    expect(typeof config.requestRateLimitReservoirRefreshCronExpression).toBe('string');
  });

  it('should export individual properties', () => {
    expect(config.baseUrl).toBeDefined();
    expect(config.requestTimeout).toBeDefined();
    expect(config.requestRateLimitMinTime).toBeDefined();
    expect(config.requestRateLimitReservoirAmount).toBeDefined();
    expect(config.requestRateLimitReservoirRefreshCronExpression).toBeDefined();
  });

  it('should have valid StockX API base URL', () => {
    expect(config.baseUrl).toBe('https://api.stockx.com/v2');
    expect(() => new URL(config.baseUrl)).not.toThrow();
  });

  it('should have reasonable timeout value', () => {
    expect(config.requestTimeout).toBeGreaterThan(0);
    expect(config.requestTimeout).toBe(60000); // 1 minute
  });

  it('should have valid rate limiting values', () => {
    expect(config.requestRateLimitMinTime).toBeGreaterThan(0);
    expect(config.requestRateLimitReservoirAmount).toBeGreaterThan(0);
    expect(config.requestRateLimitReservoirRefreshCronExpression).toMatch(/^[0-9*\s]+$/);
  });

  it('should warn about mutable values (config allows mutation)', () => {
    const originalBaseUrl = config.baseUrl;
    const originalTimeout = config.requestTimeout;
    
    // Attempting to modify config properties
    config.baseUrl = 'https://malicious.com';
    config.requestTimeout = 1;
    
    // Config currently allows mutation - this documents the current behavior
    // In production, ensure config is not modified after initialization
    expect(config.baseUrl).toBe('https://malicious.com');
    expect(config.requestTimeout).toBe(1);
    
    // Restore original values for other tests
    config.baseUrl = originalBaseUrl;
    config.requestTimeout = originalTimeout;
  });
});