const AbstractResource = require("./AbstractResource");

module.exports = class Catalog extends AbstractResource {
  getProductVariants = async (productId) => this.client.get(`/catalog/products/${productId}/variants`);

  getVariantMarketData = async (productId, variantId, currencyCode) => {
    const query = new URLSearchParams({
      currencyCode,
    }).toString();

    return this.client.get(`/catalog/products/${productId}/variants/${variantId}/market-data?${query}`);
  };


  search = async (query, pageNumber = 1, pageSize = 10) => {
    if (pageNumber < 1) {
      throw new Error('pageNumber query param must be > 0');
    }

    if (pageSize < 1 || pageSize > 50) {
      throw new Error('pageSize query param must be between 1 and 50');
    }

    const _query = new URLSearchParams({
      query,
      pageNumber,
      pageSize
    }).toString();

    return this.client.get(`/catalog/search?${_query}`);
  };
}
