export class MemoryStore {
  constructor();
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export abstract class StorageInterface {
  abstract get(key: string): Promise<any>;
  abstract set(key: string, value: any): Promise<void>;
  abstract delete(key: string): Promise<boolean>;
  abstract clear(): Promise<void>;
}

export interface FileStoreOptions {
  encrypt?: boolean;
  secret?: string;
}

export interface FileStore {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export function createFileStore(filePath: string, options?: FileStoreOptions): FileStore;