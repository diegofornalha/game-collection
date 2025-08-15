export class StorageService {
  private dbName = 'MahjongDB';
  private dbVersion = 3; // Increment version for robustness improvements
  private db: IDBDatabase | null = null;
  private dbReadyPromise: Promise<boolean>;
  private static instance: StorageService | null = null;

  constructor() {
    this.dbReadyPromise = this.initializeDB();
  }

  // Singleton pattern for better resource management
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // LocalStorage compatibility methods
  setItem(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  getItem<T = unknown>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  private async initializeDB(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(true);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.db = db;

        // Create object stores
        if (!db.objectStoreNames.contains('gameStates')) {
          const gameStore = db.createObjectStore('gameStates', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          gameStore.createIndex('layout', 'layout', { unique: false });
          gameStore.createIndex('completed', 'completed', { unique: false });
          gameStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('statistics')) {
          db.createObjectStore('statistics', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('currentGame')) {
          db.createObjectStore('currentGame', { keyPath: 'id' });
        }
      };
    });
  }

  public async save<T = unknown>(storeName: string, data: T): Promise<IDBValidKey> {
    try {
      await this.dbReadyPromise;
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Validate data before saving
      this.validateData(data, storeName);

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Serialize data to ensure it's clean
        const serializedData = this.serializeData(data);
        const request = store.put(serializedData);

        request.onsuccess = () => {
          this.logOperation('SAVE_SUCCESS', storeName, { key: request.result });
          resolve(request.result);
        };

        request.onerror = () => {
          this.logOperation('SAVE_ERROR', storeName, { error: request.error });
          reject(request.error);
        };

        transaction.onerror = () => {
          this.logOperation('TRANSACTION_ERROR', storeName, { error: transaction.error });
          reject(transaction.error);
        };
      });
    } catch (error) {
      this.logOperation('SAVE_VALIDATION_ERROR', storeName, { error });
      throw error;
    }
  }

  public async get<T = unknown>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    try {
      await this.dbReadyPromise;
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          
          if (result) {
            try {
              // Validate and deserialize data
              const validatedData = this.validateAndDeserialize<T>(result, storeName);
              this.logOperation('GET_SUCCESS', storeName, { key, hasData: true });
              resolve(validatedData);
            } catch (error) {
              this.logOperation('GET_VALIDATION_ERROR', storeName, { key, error });
              // Return undefined for corrupted data instead of throwing
              resolve(undefined);
            }
          } else {
            this.logOperation('GET_SUCCESS', storeName, { key, hasData: false });
            resolve(undefined);
          }
        };

        request.onerror = () => {
          this.logOperation('GET_ERROR', storeName, { key, error: request.error });
          reject(request.error);
        };

        transaction.onerror = () => {
          this.logOperation('TRANSACTION_ERROR', storeName, { error: transaction.error });
          reject(transaction.error);
        };
      });
    } catch (error) {
      this.logOperation('GET_CRITICAL_ERROR', storeName, { key, error });
      throw error;
    }
  }

  public async getAll<T = unknown>(storeName: string): Promise<T[]> {
    await this.dbReadyPromise;
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async delete(storeName: string, key: IDBValidKey): Promise<void> {
    await this.dbReadyPromise;
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async query<T = unknown>(storeName: string, indexName: string, query: IDBKeyRange): Promise<T[]> {
    await this.dbReadyPromise;
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(query);

      request.onsuccess = () => {
        const results = request.result;
        const validatedResults: T[] = [];
        
        // Validate each result
        for (const result of results) {
          try {
            const validatedData = this.validateAndDeserialize<T>(result, storeName);
            validatedResults.push(validatedData);
          } catch (error) {
            this.logOperation('QUERY_ITEM_VALIDATION_ERROR', storeName, { error, item: result });
            // Skip corrupted items instead of failing entire query
          }
        }
        
        this.logOperation('QUERY_SUCCESS', storeName, { 
          indexName, 
          totalItems: results.length,
          validItems: validatedResults.length
        });
        resolve(validatedResults);
      };

      request.onerror = () => {
        this.logOperation('QUERY_ERROR', storeName, { indexName, error: request.error });
        reject(request.error);
      };
    });
  }

  // Data validation and serialization methods
  private validateData(data: any, storeName: string): void {
    if (data === null || data === undefined) {
      throw new Error(`Cannot save null/undefined data to ${storeName}`);
    }

    // Special validation for game data
    if (storeName === 'currentGame' || storeName === 'gameStates') {
      this.validateGameData(data);
    }
  }

  private validateGameData(data: any): void {
    if (!data.layout || typeof data.layout !== 'string') {
      throw new Error('Game data must have a valid layout');
    }

    if (!Array.isArray(data.tiles)) {
      throw new Error('Game data must have a tiles array');
    }

    if (typeof data.score !== 'number' || data.score < 0) {
      throw new Error('Game data must have a valid score');
    }

    // Validate each tile in the array
    for (let i = 0; i < data.tiles.length; i++) {
      const tile = data.tiles[i];
      if (!this.isValidTileData(tile)) {
        throw new Error(`Invalid tile data at index ${i}: ${JSON.stringify(tile)}`);
      }
    }
  }

  private isValidTileData(tile: any): boolean {
    return (
      tile &&
      typeof tile.x === 'number' &&
      typeof tile.y === 'number' &&
      typeof tile.active === 'boolean' &&
      typeof tile.selected === 'boolean'
    );
  }

  private serializeData(data: any): any {
    try {
      // Deep clone to avoid circular references and ensure serializability
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      throw new Error(`Failed to serialize data: ${error}`);
    }
  }

  private validateAndDeserialize<T>(data: any, storeName: string): T {
    if (!data) {
      throw new Error('No data to deserialize');
    }

    // Special handling for game data
    if (storeName === 'currentGame' || storeName === 'gameStates') {
      return this.deserializeGameData(data) as T;
    }

    return data as T;
  }

  private deserializeGameData(data: any): any {
    // Validate basic structure
    if (!data.layout || !Array.isArray(data.tiles)) {
      throw new Error('Invalid game data structure');
    }

    // Sanitize tile data
    const sanitizedTiles = data.tiles.map((tile: any, index: number) => {
      if (!this.isValidTileData(tile)) {
        throw new Error(`Invalid tile data at index ${index}`);
      }

      return {
        x: Number(tile.x),
        y: Number(tile.y),
        z: Number(tile.z) || 0,
        id: tile.id ? Number(tile.id) : undefined,
        active: Boolean(tile.active),
        selected: Boolean(tile.selected),
        typeGroup: tile.typeGroup || null,
        typeIndex: tile.typeIndex !== null ? Number(tile.typeIndex) : null,
        typeMatchAny: Boolean(tile.typeMatchAny),
        chaosOffsetX: Number(tile.chaosOffsetX) || 0,
        chaosOffsetY: Number(tile.chaosOffsetY) || 0,
        chaosRotation: Number(tile.chaosRotation) || 0,
        showHint: Boolean(tile.showHint),
        hasFreePair: Boolean(tile.hasFreePair)
      };
    });

    return {
      ...data,
      tiles: sanitizedTiles,
      score: Number(data.score) || 0,
      timer: Number(data.timer) || 0,
      moves: Array.isArray(data.moves) ? data.moves : []
    };
  }

  private logOperation(operation: string, storeName: string, details: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STORAGE] ${operation}:`, { storeName, ...details });
    }
  }

  // Health check method
  public async checkHealth(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      await this.dbReadyPromise;
      if (!this.db) {
        issues.push('Database not initialized');
      }
    } catch (error) {
      issues.push(`Database initialization failed: ${error}`);
    }

    // Test basic operations
    try {
      const testData = { key: 'test-health-check', value: 'test-value', timestamp: Date.now() };
      await this.save('preferences', testData);
      const retrieved = await this.get('preferences', testData);
      if (!retrieved) {
        issues.push('Basic save/retrieve test failed');
      }
    } catch (error) {
      issues.push(`Basic operations test failed: ${error}`);
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  // Cleanup corrupted data
  public async cleanupCorruptedData(): Promise<{ cleaned: number; errors: string[] }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      // Check and clean current game data
      const currentGame = await this.get('currentGame', 1);
      if (currentGame) {
        try {
          this.validateGameData(currentGame);
        } catch (error) {
          await this.delete('currentGame', 1);
          cleaned++;
          errors.push(`Removed corrupted current game: ${error}`);
        }
      }

      // Additional cleanup logic can be added here
    } catch (error) {
      errors.push(`Cleanup failed: ${error}`);
    }

    return { cleaned, errors };
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();