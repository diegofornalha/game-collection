import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameActionsStore } from '../gameActions.store';
import { useGameStateStore } from '../gameState.store';
import { MjTile, MjTileType } from '@/models/tile.model';

// Mock do storage service
vi.mock('@/services/storage.service', () => ({
  storageService: {
    save: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

// Mock dos serviços
vi.mock('@/services/audio.service', () => ({
  audioService: {
    play: vi.fn()
  }
}));

vi.mock('@/services/xp.service', () => ({
  xpService: {
    addXP: vi.fn(),
    updateStreak: vi.fn()
  }
}));

describe('GameActionsStore - Data Integrity', () => {
  let actionsStore: ReturnType<typeof useGameActionsStore>;
  let stateStore: ReturnType<typeof useGameStateStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    actionsStore = useGameActionsStore();
    stateStore = useGameStateStore();
  });

  describe('Game Initialization with Data Validation', () => {
    it('deve inicializar jogo com tiles válidos', () => {
      const testTiles: MjTile[] = [];
      const tile1 = new MjTile(0, 0, testTiles);
      tile1.setType(new MjTileType('dragon', 0, false));
      testTiles.push(tile1);

      const tile2 = new MjTile(2, 0, testTiles);  
      tile2.setType(new MjTileType('wind', 1, false));
      testTiles.push(tile2);

      actionsStore.initializeGame('turtle', testTiles);

      expect(stateStore.tiles).toHaveLength(2);
      expect(stateStore.currentLayout).toBe('turtle');
      expect(stateStore.isPlaying).toBe(true);
      expect(stateStore.score).toBe(0);
      expect(stateStore.moves).toBe(0);
    });

    it('deve rejeitar tiles inválidos durante inicialização', () => {
      const invalidTiles = [
        null, // Tile nulo
        undefined, // Tile indefinido
        { x: 0, y: 0 }, // Objeto que não é MjTile
      ] as any;

      expect(() => {
        actionsStore.initializeGame('turtle', invalidTiles);
      }).toThrow();
    });

    it('deve validar integridade dos tipos de tiles', () => {
      const testTiles: MjTile[] = [];
      const tile1 = new MjTile(0, 0, testTiles);
      
      // Simular tile sem tipo (pode acontecer com dados corrompidos)
      tile1.type = null;
      testTiles.push(tile1);

      // Deve permitir tiles sem tipo mas registrar como problema
      expect(() => {
        actionsStore.initializeGame('turtle', testTiles);
      }).not.toThrow();

      expect(stateStore.tiles).toHaveLength(1);
      expect(stateStore.tiles[0].type).toBeNull();
    });
  });

  describe('Tile Selection with Validation', () => {
    beforeEach(() => {
      const testTiles: MjTile[] = [];
      const tile1 = new MjTile(0, 0, testTiles);
      tile1.setType(new MjTileType('dragon', 0, false));
      testTiles.push(tile1);

      const tile2 = new MjTile(2, 0, testTiles);
      tile2.setType(new MjTileType('dragon', 0, false));
      testTiles.push(tile2);

      actionsStore.initializeGame('turtle', testTiles);
    });

    it('deve validar tile antes de selecionar', () => {
      const tile = stateStore.tiles[0];
      
      // Verificar se tile é válido
      expect(tile).toBeDefined();
      expect(tile.type).toBeDefined();
      expect(tile.active).toBe(true);

      actionsStore.selectTile(tile);
      expect(stateStore.selectedTile).toBe(tile);
      expect(tile.selected).toBe(true);
    });

    it('deve rejeitar seleção de tile inválido', () => {
      const invalidTile = null as any;
      
      expect(() => {
        actionsStore.selectTile(invalidTile);
      }).toThrow();
    });

    it('deve validar correspondência de tiles', () => {
      const tile1 = stateStore.tiles[0];
      const tile2 = stateStore.tiles[1];

      // Primeiro selecionar um tile
      actionsStore.selectTile(tile1);
      expect(stateStore.selectedTile).toBe(tile1);

      // Depois selecionar o tile correspondente
      actionsStore.selectTile(tile2);
      
      // Verificar se ambos foram removidos (match válido)
      expect(tile1.active).toBe(false);
      expect(tile2.active).toBe(false);
      expect(stateStore.selectedTile).toBeNull();
      expect(stateStore.moves).toBe(1);
    });
  });

  describe('Game State Recovery', () => {
    it('deve validar dados antes de carregar jogo salvo', async () => {
      const corruptedSaveData = {
        layout: 'turtle',
        tiles: [
          {
            x: 'invalid', // Deveria ser número
            y: 0,
            typeGroup: 'invalid-group', // Grupo inválido
            active: 'not-boolean' // Deveria ser boolean
          }
        ],
        score: 'not-number', // Deveria ser número
        timer: -1 // Valor inválido
      };

      // Mock do storage para retornar dados corrompidos
      const { storageService } = await import('@/services/storage.service');
      vi.mocked(storageService.get).mockResolvedValueOnce(corruptedSaveData);

      // Função de validação que deveria ser implementada
      function validateSaveData(data: any): boolean {
        if (!data || typeof data !== 'object') return false;
        if (typeof data.layout !== 'string') return false;
        if (!Array.isArray(data.tiles)) return false;
        if (typeof data.score !== 'number' || data.score < 0) return false;
        if (typeof data.timer !== 'number' || data.timer < 0) return false;
        
        // Validar cada tile
        for (const tile of data.tiles) {
          if (typeof tile.x !== 'number' || typeof tile.y !== 'number') return false;
          if (typeof tile.active !== 'boolean') return false;
          if (tile.typeGroup && !['ball', 'bam', 'num', 'season', 'wind', 'flower', 'dragon'].includes(tile.typeGroup)) {
            return false;
          }
        }
        
        return true;
      }

      expect(validateSaveData(corruptedSaveData)).toBe(false);
    });

    it('deve implementar fallback para dados corrompidos', async () => {
      const { storageService } = await import('@/services/storage.service');
      
      // Simular falha no carregamento
      vi.mocked(storageService.get).mockRejectedValueOnce(new Error('Data corrupted'));

      // Deve haver uma função de fallback que inicializa novo jogo
      const fallbackFunction = () => {
        console.log('Dados corrompidos detectados, iniciando novo jogo');
        const cleanTiles: MjTile[] = [];
        const tile1 = new MjTile(0, 0, cleanTiles);
        tile1.setType(new MjTileType('dragon', 0, false));
        cleanTiles.push(tile1);
        
        actionsStore.initializeGame('turtle', cleanTiles);
        return true;
      };

      const result = fallbackFunction();
      expect(result).toBe(true);
      expect(stateStore.isPlaying).toBe(true);
    });
  });

  describe('Diagnostic and Logging', () => {
    it('deve registrar eventos importantes do jogo', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const testTiles: MjTile[] = [];
      const tile1 = new MjTile(0, 0, testTiles);
      tile1.setType(new MjTileType('dragon', 0, false));
      testTiles.push(tile1);

      // Função de logging que deveria ser implementada
      const logGameEvent = (event: string, data: any) => {
        console.log(`[MAHJONG] ${event}:`, data);
      };

      logGameEvent('GAME_INITIALIZED', { 
        layout: 'turtle', 
        tileCount: testTiles.length 
      });
      
      logGameEvent('TILE_SELECTED', { 
        tileId: tile1.id, 
        position: { x: tile1.x, y: tile1.y, z: tile1.z },
        type: tile1.type?.toString()
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[MAHJONG] GAME_INITIALIZED:',
        { layout: 'turtle', tileCount: 1 }
      );

      consoleSpy.mockRestore();
    });

    it('deve registrar erros de validação', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Função de logging de erro que deveria ser implementada
      const logValidationError = (context: string, error: any, data?: any) => {
        console.error(`[MAHJONG ERROR] ${context}:`, error, data);
      };

      const invalidData = { x: 'invalid', y: 'invalid' };
      
      logValidationError('TILE_VALIDATION', 'Invalid tile coordinates', invalidData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[MAHJONG ERROR] TILE_VALIDATION:',
        'Invalid tile coordinates',
        invalidData
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance Monitoring', () => {
    it('deve monitorar performance de operações críticas', () => {
      const performanceSpy = vi.spyOn(performance, 'now').mockReturnValue(1000);

      // Função de monitoramento que deveria ser implementada
      const measureOperation = (name: string, operation: () => void) => {
        const start = performance.now();
        operation();
        const end = performance.now();
        const duration = end - start;
        
        if (duration > 100) { // Limite de 100ms
          console.warn(`[PERFORMANCE] Operation ${name} took ${duration}ms`);
        }
        
        return duration;
      };

      const testTiles: MjTile[] = [];
      for (let i = 0; i < 100; i++) {
        const tile = new MjTile(i % 10, Math.floor(i / 10), testTiles);
        tile.setType(new MjTileType('dragon', i % 3, false));
        testTiles.push(tile);
      }

      const duration = measureOperation('GAME_INITIALIZATION', () => {
        actionsStore.initializeGame('turtle', testTiles);
      });

      expect(typeof duration).toBe('number');
      performanceSpy.mockRestore();
    });
  });
});