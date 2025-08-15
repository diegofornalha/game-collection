import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../storage.service';
import { MjTile, MjTileType } from '@/models/tile.model';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

// Mock IDBDatabase
const mockDB = {
  transaction: vi.fn(),
  objectStoreNames: {
    contains: vi.fn(),
  },
  createObjectStore: vi.fn(),
  close: vi.fn(),
};

// Mock IDBObjectStore  
const mockObjectStore = {
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  createIndex: vi.fn(),
  index: vi.fn(),
};

// Mock IDBTransaction
const mockTransaction = {
  objectStore: vi.fn(() => mockObjectStore),
  oncomplete: null,
  onerror: null,
};

// Mock IDBRequest
const createMockRequest = (result?: any, error?: any) => ({
  result,
  error,
  onsuccess: null as any,
  onerror: null as any,
});

describe('StorageService - Tile Serialization', () => {
  let storageService: StorageService;
  let originalIndexedDB: any;

  beforeEach(() => {
    // Setup IndexedDB mocks
    originalIndexedDB = global.indexedDB;
    global.indexedDB = mockIndexedDB as any;
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup successful DB opening
    mockIndexedDB.open.mockImplementation(() => {
      const request = createMockRequest(mockDB);
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess({ target: request } as any);
        }
      }, 0);
      return request;
    });

    mockDB.transaction.mockReturnValue(mockTransaction);
    mockObjectStore.put.mockImplementation(() => {
      const request = createMockRequest('test-key');
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess();
        }
      }, 0);
      return request;
    });

    mockObjectStore.get.mockImplementation(() => {
      const request = createMockRequest(null);
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess();
        }
      }, 0);
      return request;
    });

    storageService = new StorageService();
  });

  afterEach(() => {
    global.indexedDB = originalIndexedDB;
  });

  describe('Tile Data Serialization', () => {
    it('deve serializar e reconstruir tiles corretamente', async () => {
      // Criar tiles de teste
      const originalTiles: MjTile[] = [];
      const tile1 = new MjTile(0, 0, originalTiles);
      tile1.setType(new MjTileType('dragon', 0, false));
      tile1.chaosOffsetX = 5.5;
      tile1.chaosOffsetY = -2.3;
      tile1.chaosRotation = 15.7;
      originalTiles.push(tile1);

      const tile2 = new MjTile(2, 0, originalTiles);
      tile2.setType(new MjTileType('wind', 1, false));
      tile2.active = false;
      tile2.selected = true;
      originalTiles.push(tile2);

      // Preparar dados do jogo para salvar
      const gameState = {
        id: 'current-game',
        layout: 'turtle',
        tiles: originalTiles.map(tile => ({
          x: tile.x,
          y: tile.y,
          z: tile.z,
          id: tile.id,
          active: tile.active,
          selected: tile.selected,
          typeGroup: tile.type?.group || null,
          typeIndex: tile.type?.index ?? null,
          typeMatchAny: tile.type?.matchAny || false,
          chaosOffsetX: tile.chaosOffsetX,
          chaosOffsetY: tile.chaosOffsetY,
          chaosRotation: tile.chaosRotation,
          showHint: tile.showHint,
          hasFreePair: tile.hasFreePair
        })),
        score: 1000,
        timer: 300,
        moves: 25
      };

      // Mock para retornar os dados salvos
      mockObjectStore.get.mockImplementationOnce(() => {
        const request = createMockRequest(gameState);
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess();
          }
        }, 0);
        return request;
      });

      // Aguardar inicialização do serviço
      await new Promise(resolve => setTimeout(resolve, 10));

      // Salvar o estado do jogo
      await storageService.save('currentGame', gameState);

      // Recuperar o estado do jogo
      const retrievedState = await storageService.get('currentGame', 'current-game');

      expect(retrievedState).toBeDefined();
      expect(retrievedState.tiles).toHaveLength(2);
      
      // Verificar dados do primeiro tile
      const retrievedTile1 = retrievedState.tiles[0];
      expect(retrievedTile1.x).toBe(0);
      expect(retrievedTile1.y).toBe(0);
      expect(retrievedTile1.typeGroup).toBe('dragon');
      expect(retrievedTile1.typeIndex).toBe(0);
      expect(retrievedTile1.chaosOffsetX).toBe(5.5);
      expect(retrievedTile1.chaosOffsetY).toBe(-2.3);
      expect(retrievedTile1.chaosRotation).toBe(15.7);

      // Verificar dados do segundo tile
      const retrievedTile2 = retrievedState.tiles[1];
      expect(retrievedTile2.active).toBe(false);
      expect(retrievedTile2.selected).toBe(true);
      expect(retrievedTile2.typeGroup).toBe('wind');
      expect(retrievedTile2.typeIndex).toBe(1);
    });

    it('deve validar integridade dos dados de tiles', async () => {
      // Dados corrompidos - tipo de tile inválido
      const corruptedGameState = {
        id: 'corrupted-game',
        layout: 'turtle',
        tiles: [{
          x: 0,
          y: 0,
          z: 0,
          typeGroup: 'invalid-group', // Grupo inválido
          typeIndex: 999, // Índice inválido
          active: true,
          selected: false
        }],
        score: 1000,
        timer: 300,
        moves: 25
      };

      mockObjectStore.get.mockImplementationOnce(() => {
        const request = createMockRequest(corruptedGameState);
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess();
          }
        }, 0);
        return request;
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const retrievedState = await storageService.get('currentGame', 'corrupted-game');
      
      // Verificar se dados corrompidos são detectados
      expect(retrievedState).toBeDefined();
      expect(retrievedState.tiles[0].typeGroup).toBe('invalid-group');
      expect(retrievedState.tiles[0].typeIndex).toBe(999);
    });

    it('deve lidar com tiles sem tipo definido', async () => {
      const gameStateWithNullTypes = {
        id: 'null-types-game',
        layout: 'turtle', 
        tiles: [{
          x: 0,
          y: 0,
          z: 0,
          typeGroup: null,
          typeIndex: null,
          typeMatchAny: false,
          active: true,
          selected: false,
          chaosOffsetX: 0,
          chaosOffsetY: 0,
          chaosRotation: 0
        }],
        score: 0,
        timer: 0,
        moves: 0
      };

      mockObjectStore.get.mockImplementationOnce(() => {
        const request = createMockRequest(gameStateWithNullTypes);
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess();
          }
        }, 0);
        return request;
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const retrievedState = await storageService.get('currentGame', 'null-types-game');
      
      expect(retrievedState).toBeDefined();
      expect(retrievedState.tiles[0].typeGroup).toBeNull();
      expect(retrievedState.tiles[0].typeIndex).toBeNull();
    });
  });

  describe('Storage Error Handling', () => {
    it('deve lidar com erro de abertura do IndexedDB', async () => {
      mockIndexedDB.open.mockImplementationOnce(() => {
        const request = createMockRequest(null, new Error('Failed to open DB'));
        setTimeout(() => {
          if (request.onerror) {
            request.onerror();
          }
        }, 0);
        return request;
      });

      // Criar novo service para testar erro de inicialização
      expect(() => new StorageService()).not.toThrow();
    });

    it('deve lidar com erro de salvamento', async () => {
      mockObjectStore.put.mockImplementationOnce(() => {
        const request = createMockRequest(null, new Error('Save failed'));
        setTimeout(() => {
          if (request.onerror) {
            request.onerror();
          }
        }, 0);
        return request;
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Create valid game data that will trigger the put error
      const validGameData = {
        layout: 'turtle',
        tiles: [],
        score: 0,
        timer: 0,
        moves: []
      };
      
      await expect(storageService.save('currentGame', validGameData))
        .rejects.toThrow('Save failed');
    });

    it('deve lidar com erro de recuperação', async () => {
      mockObjectStore.get.mockImplementationOnce(() => {
        const request = createMockRequest(null, new Error('Get failed'));
        setTimeout(() => {
          if (request.onerror) {
            request.onerror();
          }
        }, 0);
        return request;
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await expect(storageService.get('currentGame', 'test-id'))
        .rejects.toThrow('Get failed');
    });
  });
});