class MemoryStore {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key);
  }

  async set(key, value) {
    this.store.set(key, value);
  }

  async delete(key) {
    return this.store.delete(key);
  }

  async clear() {
    this.store.clear();
  }
}

class StorageInterface {
  async get(key) {
    throw new Error('get() method must be implemented');
  }

  async set(key, value) {
    throw new Error('set() method must be implemented');
  }

  async delete(key) {
    throw new Error('delete() method must be implemented');
  }

  async clear() {
    throw new Error('clear() method must be implemented');
  }
}

function createFileStore(filePath, options = {}) {
  const fs = require('fs').promises;
  const path = require('path');
  const crypto = require('crypto');

  const { encrypt = false, secret } = options;

  const ensureDir = async () => {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  };

  const readStore = async () => {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      let parsed = JSON.parse(data);

      if (encrypt && secret) {
        const decipher = crypto.createDecipher('aes-256-cbc', secret);
        Object.keys(parsed).forEach(key => {
          if (parsed[key]) {
            parsed[key] = JSON.parse(
              decipher.update(parsed[key], 'hex', 'utf8') + decipher.final('utf8')
            );
          }
        });
      }

      return parsed;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  };

  const writeStore = async (store) => {
    await ensureDir();
    let data = { ...store };

    if (encrypt && secret) {
      const cipher = crypto.createCipher('aes-256-cbc', secret);
      Object.keys(data).forEach(key => {
        if (data[key]) {
          data[key] = cipher.update(JSON.stringify(data[key]), 'utf8', 'hex') + cipher.final('hex');
        }
      });
    }

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  };

  return {
    async get(key) {
      const store = await readStore();
      return store[key];
    },

    async set(key, value) {
      const store = await readStore();
      store[key] = value;
      await writeStore(store);
    },

    async delete(key) {
      const store = await readStore();
      const existed = key in store;
      delete store[key];
      await writeStore(store);
      return existed;
    },

    async clear() {
      await writeStore({});
    }
  };
}

module.exports = {
  MemoryStore,
  StorageInterface,
  createFileStore,
};