const Client = require('../src/client');
const axios = require('axios');

jest.mock('../src/utilities', () => ({
  timeoutPromise: jest.fn((promise) => promise)
}));

describe('Client', () => {
  let client;
  let mockLimiter;

  beforeEach(() => {
    mockLimiter = {
      schedule: jest.fn((fn) => fn())
    };

    client = new Client(
      'https://api.example.com',
      { 'x-api-key': 'test-key' },
      mockLimiter,
      60000
    );

    // Mock the parent class methods
    jest.spyOn(axios.Axios.prototype, 'get').mockResolvedValue({ data: 'get-data' });
    jest.spyOn(axios.Axios.prototype, 'post').mockResolvedValue({ data: 'post-data' });
    jest.spyOn(axios.Axios.prototype, 'put').mockResolvedValue({ data: 'put-data' });
    jest.spyOn(axios.Axios.prototype, 'delete').mockResolvedValue({ data: 'delete-data' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with correct configuration', () => {
    expect(client.defaults.baseURL).toBe('https://api.example.com');
    expect(client.defaults.headers['x-api-key']).toBe('test-key');
    expect(client.limiter).toBe(mockLimiter);
    expect(client.requestTimeout).toBe(60000);
  });

  describe('HTTP methods with rate limiting', () => {
    it('should make GET request with rate limiting', async () => {
      const result = await client.get('/test');

      expect(mockLimiter.schedule).toHaveBeenCalled();
      expect(axios.Axios.prototype.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({ data: 'get-data' });
    });

    it('should make POST request with rate limiting', async () => {
      const data = { key: 'value' };
      const result = await client.post('/test', data);

      expect(mockLimiter.schedule).toHaveBeenCalled();
      expect(axios.Axios.prototype.post).toHaveBeenCalledWith('/test', data, undefined);
      expect(result).toEqual({ data: 'post-data' });
    });

    it('should make PUT request with rate limiting', async () => {
      const data = { key: 'value' };
      const result = await client.put('/test', data);

      expect(mockLimiter.schedule).toHaveBeenCalled();
      expect(axios.Axios.prototype.put).toHaveBeenCalledWith('/test', data, undefined);
      expect(result).toEqual({ data: 'put-data' });
    });

    it('should make DELETE request with rate limiting', async () => {
      const result = await client.delete('/test');

      expect(mockLimiter.schedule).toHaveBeenCalled();
      expect(axios.Axios.prototype.delete).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({ data: 'delete-data' });
    });

    it('should pass config to requests', async () => {
      const config = { headers: { 'Custom-Header': 'value' } };
      
      await client.get('/test', config);
      expect(axios.Axios.prototype.get).toHaveBeenCalledWith('/test', config);

      await client.post('/test', { data: 'test' }, config);
      expect(axios.Axios.prototype.post).toHaveBeenCalledWith('/test', { data: 'test' }, config);
    });
  });
});