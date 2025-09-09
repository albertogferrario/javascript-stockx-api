const StockxApi = require('../index');
const { helpers } = StockxApi;
const Redis = require('redis'); // Example with Redis

// Example 1: Custom Redis Storage Adapter
class RedisStorage extends helpers.storage.StorageInterface {
  constructor(redisClient) {
    super();
    this.client = redisClient;
  }
  
  async get(key) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key, value) {
    await this.client.set(key, JSON.stringify(value));
  }
  
  async delete(key) {
    const result = await this.client.del(key);
    return result === 1;
  }
  
  async clear() {
    await this.client.flushdb();
  }
}

// Example 2: Environment Variable Storage (for simple cases)
class EnvStorage extends helpers.storage.StorageInterface {
  constructor(prefix = 'STOCKX_') {
    super();
    this.prefix = prefix;
  }
  
  async get(key) {
    const envKey = this.prefix + key.toUpperCase();
    const value = process.env[envKey];
    return value ? JSON.parse(value) : null;
  }
  
  async set(key, value) {
    const envKey = this.prefix + key.toUpperCase();
    process.env[envKey] = JSON.stringify(value);
  }
  
  async delete(key) {
    const envKey = this.prefix + key.toUpperCase();
    const existed = envKey in process.env;
    delete process.env[envKey];
    return existed;
  }
  
  async clear() {
    Object.keys(process.env)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => delete process.env[key]);
  }
}

// Example 3: Encrypted File Storage (using built-in helper)
async function setupEncryptedStorage() {
  const encryptedStore = helpers.storage.createFileStore('./secure-tokens.json', {
    encrypt: true,
    secret: process.env.ENCRYPTION_SECRET || 'your-strong-encryption-key',
  });
  
  // Store tokens securely
  await encryptedStore.set('user-123', {
    accessToken: 'eyJhbGc...',
    refreshToken: 'refresh...',
    expiresAt: new Date(Date.now() + 3600000),
  });
  
  // Retrieve tokens
  const tokens = await encryptedStore.get('user-123');
  console.log('Retrieved tokens:', tokens);
  
  return encryptedStore;
}

// Example 4: Multi-user token management
class MultiUserTokenStore {
  constructor(storage) {
    this.storage = storage;
  }
  
  async getUserTokens(userId) {
    return await this.storage.get(`tokens:${userId}`);
  }
  
  async setUserTokens(userId, tokens) {
    await this.storage.set(`tokens:${userId}`, tokens);
  }
  
  async refreshUserToken(userId, clientId, clientSecret) {
    const tokens = await this.getUserTokens(userId);
    
    if (!tokens || !tokens.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Check if token needs refresh
    if (!helpers.token.isExpired(tokens.accessToken, 300)) {
      return tokens;
    }
    
    // Refresh the token
    const tokenUrl = helpers.auth.buildTokenUrl('https://accounts.stockx.com/oauth');
    const newTokenResponse = await helpers.refresh.refreshToken(
      tokens.refreshToken,
      clientId,
      clientSecret,
      tokenUrl
    );
    
    const newTokens = helpers.token.parse(newTokenResponse);
    await this.setUserTokens(userId, newTokens);
    
    return newTokens;
  }
  
  async createApiClient(userId, apiKey, clientId, clientSecret) {
    const tokens = await this.refreshUserToken(userId, clientId, clientSecret);
    return new StockxApi(apiKey, tokens.accessToken);
  }
}

// Example usage
async function demonstrateStorageOptions() {
  console.log('=== Storage Options Demo ===\n');
  
  // 1. Memory Storage (default)
  console.log('1. Memory Storage:');
  const memoryStore = new helpers.storage.MemoryStore();
  await memoryStore.set('test', { value: 'in-memory' });
  console.log('Retrieved:', await memoryStore.get('test'));
  
  // 2. File Storage
  console.log('\n2. File Storage:');
  const fileStore = helpers.storage.createFileStore('./tokens.json');
  await fileStore.set('test', { value: 'in-file' });
  console.log('Retrieved:', await fileStore.get('test'));
  
  // 3. Encrypted File Storage
  console.log('\n3. Encrypted File Storage:');
  const encryptedStore = await setupEncryptedStorage();
  
  // 4. Environment Variable Storage
  console.log('\n4. Environment Storage:');
  const envStore = new EnvStorage();
  await envStore.set('test', { value: 'in-env' });
  console.log('Retrieved:', await envStore.get('test'));
  
  // 5. Multi-user example
  console.log('\n5. Multi-user Token Management:');
  const multiUserStore = new MultiUserTokenStore(fileStore);
  
  // Simulate storing tokens for multiple users
  await multiUserStore.setUserTokens('user-123', {
    accessToken: 'token-for-user-123',
    refreshToken: 'refresh-123',
    expiresAt: new Date(Date.now() + 3600000),
  });
  
  await multiUserStore.setUserTokens('user-456', {
    accessToken: 'token-for-user-456',
    refreshToken: 'refresh-456',
    expiresAt: new Date(Date.now() + 3600000),
  });
  
  console.log('User 123 tokens:', await multiUserStore.getUserTokens('user-123'));
  console.log('User 456 tokens:', await multiUserStore.getUserTokens('user-456'));
}

// Run the demo
if (require.main === module) {
  demonstrateStorageOptions().catch(console.error);
}

module.exports = {
  RedisStorage,
  EnvStorage,
  MultiUserTokenStore,
};