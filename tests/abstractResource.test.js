const AbstractResource = require('../src/api/AbstractResource');

describe('AbstractResource', () => {
  let mockClient;
  let resource;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    resource = new AbstractResource(mockClient);
  });

  describe('constructor', () => {
    it('should store client reference', () => {
      expect(resource.client).toBe(mockClient);
    });

    it('should accept any client object', () => {
      const customClient = { customMethod: jest.fn() };
      const resourceWithCustomClient = new AbstractResource(customClient);
      
      expect(resourceWithCustomClient.client).toBe(customClient);
    });
  });

  describe('inheritance', () => {
    it('should be extendable by concrete resource classes', () => {
      class ConcreteResource extends AbstractResource {
        async getData() {
          return this.client.get('/data');
        }
      }

      const concreteResource = new ConcreteResource(mockClient);
      expect(concreteResource).toBeInstanceOf(AbstractResource);
      expect(concreteResource.client).toBe(mockClient);
      expect(typeof concreteResource.getData).toBe('function');
    });

    it('should allow concrete classes to access client methods', async () => {
      class TestResource extends AbstractResource {
        async testGet() {
          return this.client.get('/test');
        }

        async testPost(data) {
          return this.client.post('/test', data);
        }
      }

      const testResource = new TestResource(mockClient);
      mockClient.get.mockResolvedValue({ data: 'get-result' });
      mockClient.post.mockResolvedValue({ data: 'post-result' });

      const getResult = await testResource.testGet();
      const postResult = await testResource.testPost({ test: 'data' });

      expect(mockClient.get).toHaveBeenCalledWith('/test');
      expect(mockClient.post).toHaveBeenCalledWith('/test', { test: 'data' });
      expect(getResult).toEqual({ data: 'get-result' });
      expect(postResult).toEqual({ data: 'post-result' });
    });
  });
});