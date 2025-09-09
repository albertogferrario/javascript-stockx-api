const StockxApi = require('../index');
const Client = require('../src/client');
const Limiter = require('../src/limiter');
const { Catalog } = require('../src/api');

jest.mock('../src/client');
jest.mock('../src/limiter');

describe('StockxApi', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Client constructor
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    Client.mockImplementation(() => mockClient);
    
    // Mock Limiter constructor
    Limiter.mockImplementation(() => ({}));
  });

  describe('constructor', () => {
    it('should initialize with required parameters', () => {
      const api = new StockxApi('api-key', 'jwt-token');
      
      expect(api.apiKey).toBe('api-key');
      expect(api.jwt).toBe('jwt-token');
      expect(api.catalog).toBeInstanceOf(Catalog);
      expect(Limiter).toHaveBeenCalledWith(1000, 25000, '0 0 * * *');
      expect(Client).toHaveBeenCalled();
    });

    it('should accept custom config', () => {
      const customConfig = {
        baseUrl: 'https://custom.api.com',
        requestTimeout: 30000,
        requestRateLimitMinTime: 2000,
        requestRateLimitReservoirAmount: 10000,
        requestRateLimitReservoirRefreshCronExpression: '0 */6 * * *'
      };

      const api = new StockxApi('api-key', 'jwt-token', customConfig);
      
      expect(api.config).toEqual(expect.objectContaining(customConfig));
      expect(Limiter).toHaveBeenCalledWith(2000, 10000, '0 */6 * * *');
    });

    it('should merge custom config with defaults', () => {
      const api = new StockxApi('api-key', 'jwt-token', { requestTimeout: 30000 });
      
      expect(api.config.requestTimeout).toBe(30000);
      expect(api.config.baseUrl).toBe('https://api.stockx.com/v2');
      expect(api.config.requestRateLimitMinTime).toBe(1000);
    });
  });

  describe('updateJwt', () => {
    it('should update JWT and reinitialize resources', () => {
      const api = new StockxApi('api-key', 'old-jwt');
      const initialCallCount = Client.mock.calls.length;
      
      api.updateJwt('new-jwt');
      
      expect(api.jwt).toBe('new-jwt');
      expect(Client).toHaveBeenCalledTimes(initialCallCount + 1);
      expect(api.catalog).toBeInstanceOf(Catalog);
    });
  });

  describe('helpers export', () => {
    it('should export helpers', () => {
      expect(StockxApi.helpers).toBeDefined();
      expect(StockxApi.helpers.auth).toBeDefined();
      expect(StockxApi.helpers.token).toBeDefined();
      expect(StockxApi.helpers.refresh).toBeDefined();
      expect(StockxApi.helpers.storage).toBeDefined();
    });
  });
});
