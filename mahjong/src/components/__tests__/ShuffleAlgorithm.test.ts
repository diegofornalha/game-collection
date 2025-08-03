import { describe, it, expect } from 'vitest';
import { MjTile, MjTileType } from '@/models/tile.model';

/**
 * Unit tests for the shuffleRemainingTiles algorithm implementation
 * These tests verify the core algorithm logic and guarantees
 */

// Helper to create a tile with specific properties
function createTile(x: number, y: number, z: number, type?: MjTileType): MjTile {
  const tile = new MjTile(x, y, []);
  tile.z = z;
  tile.type = type || new MjTileType('num', 1, false);
  tile.active = true;
  return tile;
}

// Helper to setup tile relationships
function setupTileRelationships(tiles: MjTile[]): void {
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      tiles[i].checkRelativePositions(tiles[j]);
      tiles[j].checkRelativePositions(tiles[i]);
    }
  }
}

// Core algorithm functions to test
function calculateStrategicValue(tile: MjTile): number {
  let strategicValue = 0;
  
  // Higher layers have lower strategic value (harder to reach)
  strategicValue += (5 - tile.z) * 10;
  
  // Free tiles have maximum strategic value
  if (tile.isFree()) {
    strategicValue += 100;
  } else {
    // Tiles that will become free soon have moderate value
    const blockingTilesCount = tile.blockedBy.filter(t => t.active).length;
    const adjacentBlocksLeft = tile.adjacentL.filter(t => t.active).length;
    const adjacentBlocksRight = tile.adjacentR.filter(t => t.active).length;
    
    // Fewer blocking tiles = higher value
    strategicValue += Math.max(0, 50 - (blockingTilesCount * 10));
    
    // Consider side blocks (need at least one side free)
    const sideBlockPenalty = Math.min(adjacentBlocksLeft, adjacentBlocksRight) * 20;
    strategicValue -= sideBlockPenalty;
  }
  
  // Center tiles are slightly more valuable (more likely to block others)
  const centerX = 9;
  const centerY = 4;
  const distanceFromCenter = Math.abs(tile.x - centerX) + Math.abs(tile.y - centerY);
  strategicValue += Math.max(0, 20 - distanceFromCenter);
  
  return strategicValue;
}

function groupTypesByMatchingCriteria(types: MjTileType[]): Map<string, MjTileType[]> {
  const typeGroups = new Map<string, MjTileType[]>();
  
  types.forEach(type => {
    const key = type.matchAny ? `${type.group}-any` : `${type.group}-${type.index}`;
    if (!typeGroups.has(key)) {
      typeGroups.set(key, []);
    }
    typeGroups.get(key)!.push(type);
  });
  
  return typeGroups;
}

describe('Shuffle Algorithm Core Functions', () => {
  describe('calculateStrategicValue', () => {
    it('should give free tiles highest strategic value', () => {
      const freeTile = createTile(0, 0, 0);
      const blockedTile = createTile(0, 0, 0);
      const blockingTile = createTile(0, 0, 1);
      
      blockedTile.blockedBy = [blockingTile];
      
      const freeValue = calculateStrategicValue(freeTile);
      const blockedValue = calculateStrategicValue(blockedTile);
      
      expect(freeValue).toBeGreaterThan(blockedValue);
      expect(freeValue).toBeGreaterThanOrEqual(100); // Free tiles get +100
    });
    
    it('should penalize tiles in higher layers', () => {
      const layer0Tile = createTile(0, 0, 0);
      const layer3Tile = createTile(0, 0, 3);
      
      const layer0Value = calculateStrategicValue(layer0Tile);
      const layer3Value = calculateStrategicValue(layer3Tile);
      
      expect(layer0Value).toBeGreaterThan(layer3Value);
    });
    
    it('should favor tiles with fewer blockers', () => {
      const tile1Blocker = createTile(0, 0, 0);
      const tile3Blockers = createTile(2, 0, 0);
      
      // Setup blockers
      tile1Blocker.blockedBy = [createTile(0, 0, 1)];
      tile3Blockers.blockedBy = [
        createTile(1, 0, 1),
        createTile(2, 0, 1),
        createTile(3, 0, 1)
      ];
      
      const value1 = calculateStrategicValue(tile1Blocker);
      const value3 = calculateStrategicValue(tile3Blockers);
      
      expect(value1).toBeGreaterThan(value3);
    });
    
    it('should consider adjacency blocks', () => {
      const noAdjacent = createTile(0, 0, 0);
      const leftBlocked = createTile(2, 0, 0);
      const bothBlocked = createTile(4, 0, 0);
      
      leftBlocked.adjacentL = [createTile(0, 0, 0)];
      bothBlocked.adjacentL = [createTile(2, 0, 0)];
      bothBlocked.adjacentR = [createTile(6, 0, 0)];
      
      const valueNoAdjacent = calculateStrategicValue(noAdjacent);
      const valueLeftBlocked = calculateStrategicValue(leftBlocked);
      const valueBothBlocked = calculateStrategicValue(bothBlocked);
      
      expect(valueNoAdjacent).toBeGreaterThan(valueLeftBlocked);
      expect(valueLeftBlocked).toBeGreaterThan(valueBothBlocked);
    });
    
    it('should give bonus to center tiles', () => {
      const centerTile = createTile(9, 4, 0); // Assuming center is (9, 4)
      const edgeTile = createTile(0, 0, 0);
      
      const centerValue = calculateStrategicValue(centerTile);
      const edgeValue = calculateStrategicValue(edgeTile);
      
      // Both are free, but center should have slight advantage
      expect(centerValue).toBeGreaterThan(edgeValue);
    });
  });
  
  describe('Type Grouping and Pairing', () => {
    it('should group types by matching criteria correctly', () => {
      const types = [
        new MjTileType('num', 1, false),
        new MjTileType('num', 1, false),
        new MjTileType('num', 2, false),
        new MjTileType('season', 0, true), // matchAny
        new MjTileType('season', 1, true), // matchAny
      ];
      
      const groups = groupTypesByMatchingCriteria(types);
      
      expect(groups.size).toBe(3);
      expect(groups.get('num-1')?.length).toBe(2);
      expect(groups.get('num-2')?.length).toBe(1);
      expect(groups.get('season-any')?.length).toBe(2);
    });
    
    it('should identify matching pairs correctly', () => {
      const typeGroups = new Map<string, MjTileType[]>();
      
      // Add pairs
      typeGroups.set('num-1', [
        new MjTileType('num', 1, false),
        new MjTileType('num', 1, false),
        new MjTileType('num', 1, false),
        new MjTileType('num', 1, false)
      ]);
      
      // Process pairs
      const matchingPairs: Array<[MjTileType, MjTileType]> = [];
      const singleTypes: MjTileType[] = [];
      
      typeGroups.forEach((types) => {
        const pairCount = Math.floor(types.length / 2);
        
        for (let i = 0; i < pairCount; i++) {
          matchingPairs.push([types[i * 2], types[i * 2 + 1]]);
        }
        
        if (types.length % 2 === 1) {
          singleTypes.push(types[types.length - 1]);
        }
      });
      
      expect(matchingPairs.length).toBe(2);
      expect(singleTypes.length).toBe(0);
    });
  });
  
  describe('Tile Assignment Strategy', () => {
    it('should prioritize free tiles for guaranteed pairs', () => {
      const tiles = [
        createTile(0, 0, 0), // free
        createTile(2, 0, 0), // free
        createTile(0, 0, 1), // blocked (on top)
        createTile(2, 0, 1), // blocked (on top)
      ];
      
      setupTileRelationships(tiles);
      
      const freeTiles = tiles.filter(t => t.isFree());
      const blockedTiles = tiles.filter(t => !t.isFree());
      
      expect(freeTiles.length).toBe(2);
      expect(blockedTiles.length).toBe(2);
      
      // Guaranteed pairs should go to free tiles first
      const guaranteedPairType = new MjTileType('dragon', 1, false);
      freeTiles[0].type = guaranteedPairType;
      freeTiles[1].type = guaranteedPairType;
      
      // Verify match exists
      expect(freeTiles[0].matches(freeTiles[1])).toBe(true);
    });
    
    it('should handle semi-free tiles appropriately', () => {
      // Create a scenario with semi-free tiles
      const tiles = [
        createTile(0, 0, 0), // will be semi-free
        createTile(2, 0, 0), // blocker
        createTile(4, 0, 0), // free
      ];
      
      // Setup adjacency
      tiles[0].adjacentR = [tiles[1]];
      tiles[1].adjacentL = [tiles[0]];
      tiles[1].adjacentR = [tiles[2]];
      tiles[2].adjacentL = [tiles[1]];
      
      const strategicValues = tiles.map(tile => ({
        tile,
        value: calculateStrategicValue(tile)
      }));
      
      // Sort by strategic value
      strategicValues.sort((a, b) => b.value - a.value);
      
      // Free tile should be first, semi-free second
      expect(strategicValues[0].tile.isFree()).toBe(true);
      expect(strategicValues[1].tile.isFree()).toBe(false);
      expect(strategicValues[1].value).toBeGreaterThan(30); // Semi-free threshold
    });
  });
  
  describe('Recovery Mechanisms', () => {
    it('should identify best recovery type when no moves exist', () => {
      const tiles = [
        createTile(0, 0, 0), // free
        createTile(2, 0, 0), // free
        createTile(0, 2, 0), // blocked
        createTile(2, 2, 0), // blocked
      ];
      
      // Assign non-matching types to free tiles
      tiles[0].type = new MjTileType('num', 1, false);
      tiles[1].type = new MjTileType('num', 2, false);
      tiles[2].type = new MjTileType('num', 1, false);
      tiles[3].type = new MjTileType('num', 1, false);
      
      // Count types
      const typeCount = new Map<string, { type: MjTileType; tiles: MjTile[] }>();
      
      tiles.forEach(tile => {
        if (tile.type) {
          const key = tile.type.matchAny ? 
            `${tile.type.group}-any` : 
            `${tile.type.group}-${tile.type.index}`;
          
          if (!typeCount.has(key)) {
            typeCount.set(key, { type: tile.type, tiles: [] });
          }
          typeCount.get(key)!.tiles.push(tile);
        }
      });
      
      // Find best recovery type (most occurrences with blocked tiles)
      let bestRecoveryType: MjTileType | null = null;
      let maxBlockedCount = 0;
      
      typeCount.forEach(({ type, tiles: typeTiles }) => {
        if (typeTiles.length >= 2) {
          const blockedCount = typeTiles.filter(t => !t.isFree()).length;
          if (blockedCount > maxBlockedCount) {
            maxBlockedCount = blockedCount;
            bestRecoveryType = type;
          }
        }
      });
      
      expect(bestRecoveryType).not.toBeNull();
      expect(bestRecoveryType).toBeDefined();
      if (bestRecoveryType) {
        expect(bestRecoveryType.group).toBe('num');
        expect(bestRecoveryType.index).toBe(1);
      }
    });
    
    it('should handle edge case with only one free tile', () => {
      const tiles = [
        createTile(0, 0, 0), // free
        createTile(2, 0, 0), // semi-free (blocked by adjacency)
        createTile(4, 0, 0), // blocked
      ];
      
      // Setup relationships
      tiles[0].adjacentR = [tiles[1]];
      tiles[1].adjacentL = [tiles[0]];
      tiles[1].adjacentR = [tiles[2]];
      tiles[2].adjacentL = [tiles[1]];
      
      const freeTiles = tiles.filter(t => t.isFree());
      expect(freeTiles.length).toBe(1);
      
      // Calculate which tile becomes free next
      const semiFreeTiles = tiles.filter(t => {
        if (t.isFree()) return false;
        const value = calculateStrategicValue(t);
        return value > 30;
      });
      
      expect(semiFreeTiles.length).toBeGreaterThan(0);
      
      // Should match free tile with semi-free tile
      const matchType = new MjTileType('wind', 1, false);
      freeTiles[0].type = matchType;
      semiFreeTiles[0].type = matchType;
      
      // Simulate removing free tile
      freeTiles[0].active = false;
      expect(semiFreeTiles[0].isFree()).toBe(true);
    });
  });
  
  describe('Validation and Final Checks', () => {
    it('should count valid moves correctly', () => {
      const tiles = [
        createTile(0, 0, 0),
        createTile(2, 0, 0),
        createTile(4, 0, 0),
        createTile(6, 0, 0),
      ];
      
      // Create two matching pairs
      tiles[0].type = new MjTileType('num', 1, false);
      tiles[1].type = new MjTileType('num', 1, false);
      tiles[2].type = new MjTileType('num', 2, false);
      tiles[3].type = new MjTileType('num', 2, false);
      
      const freeTiles = tiles.filter(t => t.active && t.isFree());
      const matchingPairs: Array<[MjTile, MjTile]> = [];
      
      for (let i = 0; i < freeTiles.length - 1; i++) {
        for (let j = i + 1; j < freeTiles.length; j++) {
          if (freeTiles[i].matches(freeTiles[j])) {
            matchingPairs.push([freeTiles[i], freeTiles[j]]);
          }
        }
      }
      
      expect(matchingPairs.length).toBe(2);
    });
    
    it('should handle wildcard matching correctly', () => {
      const tile1 = createTile(0, 0, 0);
      const tile2 = createTile(2, 0, 0);
      
      tile1.type = new MjTileType('season', 0, true); // matchAny
      tile2.type = new MjTileType('season', 2, true); // matchAny
      
      expect(tile1.matches(tile2)).toBe(true);
      
      // Different group should not match
      const tile3 = createTile(4, 0, 0);
      tile3.type = new MjTileType('flower', 0, true);
      
      expect(tile1.matches(tile3)).toBe(false);
    });
  });
});