const AbstractResource = require("./AbstractResource");

class Catalog extends AbstractResource {
  getVariants = async (productId) => (await this.client.get(`/catalog/products/${productId}/variants`)).data;

  getVariantMarketData = async (productId, variantId, currencyCode) => {
    const query = new URLSearchParams({
      currencyCode,
    }).toString();

    return (await this.client.get(`/catalog/products/${productId}/variants/${variantId}/market-data?${query}`)).data;
  };

  getProductBySlug = async (slug) => {
    const searchResults = await this.search(slug, 1, 10);
    if (!searchResults.products || searchResults.products.length === 0) {
      throw new Error(`Product not found with slug: ${slug}`);
    }
    
    // Find product with exact urlKey match
    const exactMatch = searchResults.products.find(product => product.urlKey === slug);
    
    if (!exactMatch) {
      throw new Error(`Product not found with slug: ${slug}`);
    }
    
    return exactMatch;
  };

  search = async (query, pageNumber = 1, pageSize = 10) => {
    if (pageNumber < 1) {
      throw new Error('pageNumber query param must be > 0');
    }

    if (pageSize < 1 || pageSize > 50) {
      throw new Error('pageSize query param must be between 1 and 50');
    }

    const query_ = new URLSearchParams({
      query,
      pageNumber,
      pageSize
    }).toString();

    return (await this.client.get(`/catalog/search?${query_}`)).data;
  };
}

module.exports = Catalog;
