const { storage } = require('../../src/helpers');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('storage helpers', () => {
  describe('MemoryStore', () => {
    let store;

    beforeEach(() => {
      store = new storage.MemoryStore();
    });

    it('should store and retrieve values', async () => {
      await store.set('key1', { value: 'test' });
      const result = await store.get('key1');
      expect(result).toEqual({ value: 'test' });
    });

    it('should return undefined for non-existent keys', async () => {
      const result = await store.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should delete values', async () => {
      await store.set('key1', 'value1');
      const deleted = await store.delete('key1');
      expect(deleted).toBe(true);
      expect(await store.get('key1')).toBeUndefined();
    });

    it('should return false when deleting non-existent key', async () => {
      const deleted = await store.delete('nonexistent');
      expect(deleted).toBe(false);
    });

    it('should clear all values', async () => {
      await store.set('key1', 'value1');
      await store.set('key2', 'value2');
      await store.clear();
      expect(await store.get('key1')).toBeUndefined();
      expect(await store.get('key2')).toBeUndefined();
    });
  });

  describe('StorageInterface', () => {
    it('should throw errors for all methods', async () => {
      const store = new storage.StorageInterface();
      
      await expect(store.get('key')).rejects.toThrow('get() method must be implemented');
      await expect(store.set('key', 'value')).rejects.toThrow('set() method must be implemented');
      await expect(store.delete('key')).rejects.toThrow('delete() method must be implemented');
      await expect(store.clear()).rejects.toThrow('clear() method must be implemented');
    });
  });

  describe('createFileStore', () => {
    const tempDir = os.tmpdir();
    const testFile = path.join(tempDir, `test-store-${Date.now()}.json`);

    afterEach(async () => {
      try {
        await fs.unlink(testFile);
      } catch (e) {
        // File doesn't exist, ignore
      }
    });

    it('should create file store and persist data', async () => {
      const store = storage.createFileStore(testFile);
      
      await store.set('key1', { value: 'test' });
      const result = await store.get('key1');
      expect(result).toEqual({ value: 'test' });

      // Verify file exists
      const fileContent = await fs.readFile(testFile, 'utf8');
      const data = JSON.parse(fileContent);
      expect(data.key1).toEqual({ value: 'test' });
    });

    it('should handle non-existent file', async () => {
      const store = storage.createFileStore(testFile);
      const result = await store.get('key1');
      expect(result).toBeUndefined();
    });

    it('should delete keys from file store', async () => {
      const store = storage.createFileStore(testFile);
      
      await store.set('key1', 'value1');
      await store.set('key2', 'value2');
      const deleted = await store.delete('key1');
      
      expect(deleted).toBe(true);
      expect(await store.get('key1')).toBeUndefined();
      expect(await store.get('key2')).toBe('value2');
    });

    it('should clear file store', async () => {
      const store = storage.createFileStore(testFile);
      
      await store.set('key1', 'value1');
      await store.set('key2', 'value2');
      await store.clear();
      
      const fileContent = await fs.readFile(testFile, 'utf8');
      expect(JSON.parse(fileContent)).toEqual({});
    });

    it('should create directory if it does not exist', async () => {
      const nestedPath = path.join(tempDir, `nested-${Date.now()}`, 'deep', 'store.json');
      const store = storage.createFileStore(nestedPath);
      
      await store.set('key1', 'value1');
      const result = await store.get('key1');
      expect(result).toBe('value1');

      // Cleanup
      await fs.rm(path.dirname(path.dirname(nestedPath)), { recursive: true });
    });
  });
});