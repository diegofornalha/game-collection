import { describe, it, expect, beforeEach } from 'vitest';
import { MjTile, MjTileType } from '../tile.model';

describe('MjTile - Reconstruction and Validation', () => {
  let testTiles: MjTile[];

  beforeEach(() => {
    testTiles = [];
  });

  describe('MjTileType Validation', () => {
    it('deve criar tipos válidos de tiles', () => {
      const dragonType = new MjTileType('dragon', 0, false);
      expect(dragonType.group).toBe('dragon');
      expect(dragonType.index).toBe(0);
      expect(dragonType.matchAny).toBe(false);
      expect(dragonType.getPrimaryCharacter()).toBe('&#x1F004');
      expect(dragonType.getColor()).toBe('red');
    });

    it('deve validar grupos de tiles suportados', () => {
      const validGroups = ['ball', 'bam', 'num', 'season', 'wind', 'flower', 'dragon'];
      
      validGroups.forEach(group => {
        expect(() => new MjTileType(group, 0, false)).not.toThrow();
      });
    });

    it('deve lidar com tipos de tiles inválidos graciosamente', () => {
      // Teste com grupo inválido - não deve falhar, mas não deve ter caracteres válidos
      const invalidType = new MjTileType('invalid-group', 0, false);
      expect(invalidType.group).toBe('invalid-group');
      expect(invalidType.index).toBe(0);
      
      // getPrimaryCharacter pode retornar undefined ou lançar erro para grupos inválidos
      expect(() => invalidType.getPrimaryCharacter()).toThrow();
    });

    it('deve validar correspondência de tipos', () => {
      const dragon1 = new MjTileType('dragon', 0, false);
      const dragon2 = new MjTileType('dragon', 0, false);
      const dragon3 = new MjTileType('dragon', 1, false);
      const season1 = new MjTileType('season', 0, true);
      const season2 = new MjTileType('season', 1, true);

      expect(dragon1.matches(dragon2)).toBe(true);
      expect(dragon1.matches(dragon3)).toBe(false);
      expect(season1.matches(season2)).toBe(true); // matchAny = true
    });
  });

  describe('MjTile Construction and Validation', () => {
    it('deve criar tiles com propriedades corretas', () => {
      const tile = new MjTile(2, 4, testTiles);
      
      expect(tile.x).toBe(2);
      expect(tile.y).toBe(4);
      expect(tile.z).toBe(0); // Primeira tile na coleção
      expect(tile.active).toBe(true);
      expect(tile.selected).toBe(false);
      expect(tile.type).toBeNull();
      expect(tile.chaosOffsetX).toBe(0);
      expect(tile.chaosOffsetY).toBe(0);
      expect(tile.chaosRotation).toBe(0);
    });

    it('deve calcular coordenada Z corretamente', () => {
      const tile1 = new MjTile(0, 0, testTiles);
      testTiles.push(tile1);
      
      const tile2 = new MjTile(0, 0, testTiles); // Sobrepõe tile1
      testTiles.push(tile2);
      
      expect(tile1.z).toBe(0);
      expect(tile2.z).toBe(1); // Uma camada acima
    });

    it('deve detectar sobreposição 2D corretamente', () => {
      const tile1 = new MjTile(0, 0, testTiles);
      const tile2 = new MjTile(1, 1, testTiles);
      const tile3 = new MjTile(3, 3, testTiles);

      expect(tile1.overlaps2d(tile2)).toBe(true); // Sobreposição parcial
      expect(tile1.overlaps2d(tile3)).toBe(false); // Sem sobreposição
    });

    it('deve calcular adjacência corretamente', () => {
      const tile1 = new MjTile(0, 0, testTiles);
      const tile2 = new MjTile(2, 0, testTiles); // Adjacente à direita
      const tile3 = new MjTile(0, 2, testTiles); // Não adjacente

      const adjacency = tile1.isXAdjacentTo(tile2);
      expect(adjacency[0]).toBe(true); // tile2 está à direita de tile1
      expect(adjacency[1]).toBe(false);

      const noAdjacency = tile1.isXAdjacentTo(tile3);
      expect(noAdjacency[0]).toBe(false);
      expect(noAdjacency[1]).toBe(false);
    });
  });

  describe('Tile State Management', () => {
    it('deve gerenciar estado de seleção corretamente', () => {
      const tile = new MjTile(0, 0, testTiles);
      
      expect(tile.selected).toBe(false);
      expect(tile.isSelected).toBe(false);

      tile.select();
      expect(tile.selected).toBe(true);
      expect(tile.isSelected).toBe(true);

      tile.unselect();
      expect(tile.selected).toBe(false);
      expect(tile.isSelected).toBe(false);
    });

    it('deve gerenciar estado de hint corretamente', () => {
      const tile = new MjTile(0, 0, testTiles);
      
      expect(tile.showHint).toBe(false);
      expect(tile.isHinted).toBe(false);

      tile.startHint();
      expect(tile.showHint).toBe(true);
      expect(tile.isHinted).toBe(true);

      tile.stopHint();
      expect(tile.showHint).toBe(false);
      expect(tile.isHinted).toBe(false);
    });

    it('deve gerenciar estado ativo corretamente', () => {
      const tile = new MjTile(0, 0, testTiles);
      
      expect(tile.active).toBe(true);

      tile.remove();
      expect(tile.active).toBe(false);
      expect(tile.selected).toBe(false);

      tile.returnToField();
      expect(tile.active).toBe(true);
    });

    it('deve resetar tile para estado inicial', () => {
      const tile = new MjTile(0, 0, testTiles);
      tile.select();
      tile.remove();
      
      tile.reset();
      expect(tile.selected).toBe(false);
      expect(tile.active).toBe(true);
    });
  });

  describe('Tile Matching Logic', () => {
    it('deve verificar correspondência entre tiles', () => {
      const tile1 = new MjTile(0, 0, testTiles);
      const tile2 = new MjTile(2, 0, testTiles);
      
      const dragonType = new MjTileType('dragon', 0, false);
      tile1.setType(dragonType);
      tile2.setType(dragonType);

      expect(tile1.matches(tile2)).toBe(true);
    });

    it('deve retornar false para tiles sem tipo', () => {
      const tile1 = new MjTile(0, 0, testTiles);
      const tile2 = new MjTile(2, 0, testTiles);

      expect(tile1.matches(tile2)).toBe(false);
    });

    it('deve verificar se tile está livre', () => {
      const baseTile = new MjTile(0, 0, testTiles);
      testTiles.push(baseTile);
      
      const blockingTile = new MjTile(0, 0, testTiles);
      testTiles.push(blockingTile);

      // Configurar relações
      baseTile.checkRelativePositions(blockingTile);
      blockingTile.checkRelativePositions(baseTile);

      expect(baseTile.isFree()).toBe(false); // Bloqueada por blockingTile
      expect(blockingTile.isFree()).toBe(true); // Não bloqueada
    });
  });

  describe('Data Reconstruction', () => {
    it('deve reconstruir tile a partir de dados serializados', () => {
      // Dados que poderiam vir do storage
      const tileData = {
        x: 4,
        y: 6,
        z: 2,
        id: 12345,
        active: false,
        selected: true,
        typeGroup: 'wind',
        typeIndex: 2,
        typeMatchAny: false,
        chaosOffsetX: 3.7,
        chaosOffsetY: -1.2,
        chaosRotation: 45.0,
        showHint: true,
        hasFreePair: true
      };

      // Função para reconstruir tile (que será implementada)
      function reconstructTile(data: typeof tileData, collection: MjTile[]): MjTile {
        const tile = new MjTile(data.x, data.y, collection, data.id);
        
        if (data.typeGroup && data.typeIndex !== null) {
          tile.setType(new MjTileType(data.typeGroup, data.typeIndex, data.typeMatchAny));
        }
        
        tile.active = data.active;
        tile.selected = data.selected;
        tile.chaosOffsetX = data.chaosOffsetX;
        tile.chaosOffsetY = data.chaosOffsetY;
        tile.chaosRotation = data.chaosRotation;
        tile.showHint = data.showHint;
        tile.hasFreePair = data.hasFreePair;
        
        // Sincronizar propriedades alias
        tile.isSelected = tile.selected;
        tile.isHinted = tile.showHint;
        
        return tile;
      }

      const reconstructedTile = reconstructTile(tileData, testTiles);

      expect(reconstructedTile.x).toBe(4);
      expect(reconstructedTile.y).toBe(6);
      expect(reconstructedTile.id).toBe(12345);
      expect(reconstructedTile.active).toBe(false);
      expect(reconstructedTile.selected).toBe(true);
      expect(reconstructedTile.type?.group).toBe('wind');
      expect(reconstructedTile.type?.index).toBe(2);
      expect(reconstructedTile.chaosOffsetX).toBe(3.7);
      expect(reconstructedTile.chaosOffsetY).toBe(-1.2);
      expect(reconstructedTile.chaosRotation).toBe(45.0);
      expect(reconstructedTile.showHint).toBe(true);
      expect(reconstructedTile.hasFreePair).toBe(true);
    });

    it('deve validar dados antes da reconstrução', () => {
      const invalidData = {
        x: 'invalid', // Deveria ser número
        y: 2,
        typeGroup: 'invalid-group',
        typeIndex: -1,
        active: 'not-boolean'
      };

      function validateTileData(data: any): boolean {
        if (typeof data.x !== 'number' || typeof data.y !== 'number') {
          return false;
        }
        
        if (data.typeGroup && !['ball', 'bam', 'num', 'season', 'wind', 'flower', 'dragon'].includes(data.typeGroup)) {
          return false;
        }
        
        if (data.typeIndex !== null && (typeof data.typeIndex !== 'number' || data.typeIndex < 0)) {
          return false;
        }
        
        return true;
      }

      expect(validateTileData(invalidData)).toBe(false);
      
      const validData = {
        x: 0,
        y: 0,
        typeGroup: 'dragon',
        typeIndex: 0,
        active: true
      };
      
      expect(validateTileData(validData)).toBe(true);
    });
  });
});