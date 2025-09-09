const Catalog = require('../src/api/Catalog');

describe('Catalog', () => {
  let catalog;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      get: jest.fn()
    };
    catalog = new Catalog(mockClient);
  });

  describe('getVariants', () => {
    it('should get product variants', async () => {
      const mockResponse = {
        data: [
          { id: 'var1', size: '10' },
          { id: 'var2', size: '10.5' }
        ]
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await catalog.getVariants('product123');

      expect(mockClient.get).toHaveBeenCalledWith('/catalog/products/product123/variants');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getVariantMarketData', () => {
    it('should get variant market data', async () => {
      const mockResponse = {
        data: {
          lowestAsk: 200,
          highestBid: 180,
          lastSale: 190
        }
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await catalog.getVariantMarketData('product123', 'variant456', 'USD');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/catalog/products/product123/variants/variant456/market-data?currencyCode=USD'
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('search', () => {
    it('should search with default parameters', async () => {
      const mockResponse = {
        data: [
          { id: 'prod1', title: 'Product 1' },
          { id: 'prod2', title: 'Product 2' }
        ]
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await catalog.search('Nike');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/catalog/search?query=Nike&pageNumber=1&pageSize=10'
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should search with custom parameters', async () => {
      const mockResponse = { data: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await catalog.search('Jordan', 2, 20);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/catalog/search?query=Jordan&pageNumber=2&pageSize=20'
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error for invalid pageNumber', async () => {
      await expect(catalog.search('Nike', 0)).rejects.toThrow('pageNumber query param must be > 0');
      await expect(catalog.search('Nike', -1)).rejects.toThrow('pageNumber query param must be > 0');
    });

    it('should throw error for invalid pageSize', async () => {
      await expect(catalog.search('Nike', 1, 0)).rejects.toThrow(
        'pageSize query param must be between 1 and 50'
      );
      await expect(catalog.search('Nike', 1, 51)).rejects.toThrow(
        'pageSize query param must be between 1 and 50'
      );
    });
  });
});