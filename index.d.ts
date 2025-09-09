export = StockxApi;

declare class StockxApi {
  constructor(apiKey: string, jwt: string, config?: StockxApi.Config);
  
  apiKey: string;
  jwt: string;
  config: StockxApi.Config;
  catalog: StockxApi.Catalog;
  limiter: any;
  
  updateJwt(jwt: string): void;
  
  static helpers: {
    auth: typeof import('./src/helpers/auth');
    token: typeof import('./src/helpers/token');
    refresh: typeof import('./src/helpers/refresh');
    storage: typeof import('./src/helpers/storage');
  };
}

declare namespace StockxApi {
  interface Config {
    baseUrl?: string;
    requestTimeout?: number;
    requestRateLimitMinTime?: number;
    requestRateLimitReservoirAmount?: number;
    requestRateLimitReservoirRefreshCronExpression?: string;
  }

  interface SearchResult {
    id: string;
    title: string;
    brand: string;
    category: string;
    imageUrl: string;
    [key: string]: any;
  }

  interface Variant {
    id: string;
    size: string;
    sizeType: string;
    [key: string]: any;
  }

  interface MarketData {
    lowestAsk: number;
    highestBid: number;
    lastSale: number;
    salesThisMonth: number;
    salesLastMonth: number;
    [key: string]: any;
  }

  class Catalog {
    constructor(client: any);
    
    search(query: string, pageNumber?: number, pageSize?: number): Promise<SearchResult[]>;
    getProductBySlug(slug: string): Promise<SearchResult>;
    getVariants(productId: string): Promise<Variant[]>;
    getVariantMarketData(productId: string, variantId: string, currencyCode: string): Promise<MarketData>;
  }
}