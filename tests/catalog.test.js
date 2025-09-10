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

  describe('getProductBySlug', () => {
    it('should get product by slug successfully', async () => {
      const mockProduct = {
        productId: 'c318bbcc-312a-4396-9252-698c203d1dea',
        urlKey: 'nike-air-max-90',
        title: 'Nike Air Max 90',
        brand: 'Nike',
        productType: 'sneakers',
        styleId: 'CW7590-100'
      };
      
      const mockResponse = {
        data: {
          count: 1,
          pageSize: 1,
          pageNumber: 1,
          hasNextPage: false,
          products: [mockProduct]
        }
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await catalog.getProductBySlug('nike-air-max-90');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/catalog/search?query=nike-air-max-90&pageNumber=1&pageSize=10'
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw error when product not found', async () => {
      const mockResponse = { 
        data: {
          count: 0,
          pageSize: 10,
          pageNumber: 1,
          hasNextPage: false,
          products: []
        }
      };
      mockClient.get.mockResolvedValue(mockResponse);

      await expect(catalog.getProductBySlug('non-existent-product'))
        .rejects.toThrow('Product not found with slug: non-existent-product');
    });

    it('should find exact match when multiple products are returned', async () => {
      const targetProduct = {
        productId: 'target-id',
        urlKey: 'nike-air-max-90',
        title: 'Nike Air Max 90',
        brand: 'Nike'
      };
      
      const similarProduct = {
        productId: 'similar-id',
        urlKey: 'nike-air-max-90-premium',
        title: 'Nike Air Max 90 Premium',
        brand: 'Nike'
      };
      
      const mockResponse = {
        data: {
          count: 2,
          pageSize: 10,
          pageNumber: 1,
          hasNextPage: false,
          products: [similarProduct, targetProduct] // Target is not first
        }
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await catalog.getProductBySlug('nike-air-max-90');

      expect(result).toEqual(targetProduct);
      expect(result.urlKey).toBe('nike-air-max-90');
    });

    it('should throw error when exact match not found in search results', async () => {
      const mockResponse = {
        data: {
          count: 1,
          pageSize: 10,
          pageNumber: 1,
          hasNextPage: false,
          products: [{
            productId: 'similar-id',
            urlKey: 'nike-air-max-90-premium', // Similar but not exact
            title: 'Nike Air Max 90 Premium',
            brand: 'Nike'
          }]
        }
      };
      mockClient.get.mockResolvedValue(mockResponse);

      await expect(catalog.getProductBySlug('nike-air-max-90'))
        .rejects.toThrow('Product not found with slug: nike-air-max-90');
    });
  });

  describe('search', () => {
    it('should search with default parameters', async () => {
      const mockData = {
        count: 2,
        pageSize: 10,
        pageNumber: 1,
        hasNextPage: false,
        products: [
          { productId: 'prod1', title: 'Product 1', urlKey: 'product-1' },
          { productId: 'prod2', title: 'Product 2', urlKey: 'product-2' }
        ]
      };
      const mockResponse = { data: mockData };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await catalog.search('Nike');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/catalog/search?query=Nike&pageNumber=1&pageSize=10'
      );
      expect(result).toEqual(mockData);
    });

    it('should search with custom parameters', async () => {
      const mockData = {
        count: 0,
        pageSize: 20,
        pageNumber: 2,
        hasNextPage: false,
        products: []
      };
      const mockResponse = { data: mockData };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await catalog.search('Jordan', 2, 20);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/catalog/search?query=Jordan&pageNumber=2&pageSize=20'
      );
      expect(result).toEqual(mockData);
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