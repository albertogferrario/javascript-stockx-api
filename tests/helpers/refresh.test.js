const { refresh } = require('../../src/helpers');
const axios = require('axios');

jest.mock('axios');

describe('refresh helpers', () => {
  describe('refreshToken', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should make token refresh request with correct parameters', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'new-refresh-token',
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await refresh.refreshToken(
        'old-refresh-token',
        'client-id',
        'client-secret',
        'https://auth.example.com/token'
      );

      expect(axios.post).toHaveBeenCalledWith(
        'https://auth.example.com/token',
        'grant_type=refresh_token&refresh_token=old-refresh-token&client_id=client-id&client_secret=client-secret&audience=gateway.stockx.com',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle axios errors', async () => {
      const axiosError = new Error('Network error');
      axios.post.mockRejectedValue(axiosError);

      await expect(
        refresh.refreshToken('token', 'client', 'secret', 'url')
      ).rejects.toThrow('Network error');
    });
  });

  describe('createInterceptor', () => {
    let mockClient;

    beforeEach(() => {
      jest.clearAllMocks();
      mockClient = {
        interceptors: {
          response: {
            use: jest.fn(),
          },
        },
        request: jest.fn(),
      };
    });

    it('should throw error if onRefresh is not provided', () => {
      expect(() => {
        refresh.createInterceptor(mockClient);
      }).toThrow('onRefresh callback is required');
    });

    it('should throw error if onRefresh is not a function', () => {
      expect(() => {
        refresh.createInterceptor(mockClient, { onRefresh: 'not-a-function' });
      }).toThrow('onRefresh callback is required');
    });

    it('should add response interceptor with correct parameters', () => {
      const onRefresh = jest.fn();
      
      refresh.createInterceptor(mockClient, { onRefresh });

      expect(mockClient.interceptors.response.use).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should return client instance', () => {
      const onRefresh = jest.fn();
      
      const result = refresh.createInterceptor(mockClient, { onRefresh });

      expect(result).toBe(mockClient);
    });

    describe('response interceptor', () => {
      let successHandler;
      let errorHandler;
      let onRefresh;

      beforeEach(() => {
        onRefresh = jest.fn();
        refresh.createInterceptor(mockClient, { onRefresh });
        
        const [success, error] = mockClient.interceptors.response.use.mock.calls[0];
        successHandler = success;
        errorHandler = error;
      });

      it('should pass through successful responses', () => {
        const response = { status: 200, data: 'success' };
        const result = successHandler(response);
        expect(result).toBe(response);
      });

      it('should reject non-401 errors without retry', async () => {
        const error = {
          response: { status: 500 },
          config: {},
        };

        await expect(errorHandler(error)).rejects.toBe(error);
        expect(onRefresh).not.toHaveBeenCalled();
      });

      it('should reject after max retries', async () => {
        const error = {
          response: { status: 401 },
          config: { 
            retryCount: 1,
            headers: {}
          },
        };

        await expect(errorHandler(error)).rejects.toBe(error);
        expect(onRefresh).not.toHaveBeenCalled();
      });

      it('should refresh token and retry request on 401', async () => {
        const error = {
          response: { status: 401 },
          config: { 
            headers: { Authorization: 'Bearer old-token' },
          },
        };
        const newToken = 'new-token';
        const retryResponse = { status: 200, data: 'success' };

        onRefresh.mockResolvedValue(newToken);
        mockClient.request.mockResolvedValue(retryResponse);

        const result = await errorHandler(error);

        expect(onRefresh).toHaveBeenCalled();
        expect(error.config.headers.Authorization).toBe('Bearer new-token');
        expect(mockClient.request).toHaveBeenCalledWith(error.config);
        expect(result).toBe(retryResponse);
      });

      it('should handle refresh failure', async () => {
        const error = {
          response: { status: 401 },
          config: { headers: {} },
        };
        const refreshError = new Error('Refresh failed');

        onRefresh.mockRejectedValue(refreshError);

        await expect(errorHandler(error)).rejects.toBe(refreshError);
      });

      it('should queue requests while refresh is in progress', async () => {
        const error1 = {
          response: { status: 401 },
          config: { headers: { Authorization: 'Bearer old-token' } },
        };
        const error2 = {
          response: { status: 401 },
          config: { headers: { Authorization: 'Bearer old-token' } },
        };

        let resolveRefresh;
        const refreshPromise = new Promise((resolve) => {
          resolveRefresh = resolve;
        });
        onRefresh.mockReturnValue(refreshPromise);
        mockClient.request.mockResolvedValue({ status: 200, data: 'success' });

        // Start two requests simultaneously
        const promise1 = errorHandler(error1);
        const promise2 = errorHandler(error2);

        // Resolve refresh
        resolveRefresh('new-token');

        const [result1, result2] = await Promise.all([promise1, promise2]);

        expect(onRefresh).toHaveBeenCalledTimes(1); // Only called once
        expect(mockClient.request).toHaveBeenCalledTimes(2); // Both requests retried
        expect(error1.config.headers.Authorization).toBe('Bearer new-token');
        expect(error2.config.headers.Authorization).toBe('Bearer new-token');
      });

      it('should use custom shouldRefresh function', async () => {
        const customShouldRefresh = jest.fn().mockReturnValue(false);
        refresh.createInterceptor(mockClient, { 
          onRefresh,
          shouldRefresh: customShouldRefresh,
        });

        const [, customErrorHandler] = mockClient.interceptors.response.use.mock.calls[1];
        const error = { response: { status: 401 }, config: {} };

        await expect(customErrorHandler(error)).rejects.toBe(error);
        expect(customShouldRefresh).toHaveBeenCalledWith(error);
        expect(onRefresh).not.toHaveBeenCalled();
      });

      it('should respect custom maxRetries', async () => {
        refresh.createInterceptor(mockClient, { 
          onRefresh,
          maxRetries: 2,
        });

        const [, customErrorHandler] = mockClient.interceptors.response.use.mock.calls[1];
        const error = {
          response: { status: 401 },
          config: { 
            retryCount: 2,
            headers: {}
          },
        };

        await expect(customErrorHandler(error)).rejects.toBe(error);
        expect(onRefresh).not.toHaveBeenCalled();
      });
    });
  });
});