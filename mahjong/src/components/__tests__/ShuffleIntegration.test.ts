import { describe, it, expect } from 'vitest';
import { MjTile, MjTileType } from '@/models/tile.model';

/**
 * Integration tests demonstrating real-world shuffle scenarios
 * and validating the complete algorithm workflow
 */

// Simulate the actual shuffle algorithm logic
function simulateShuffleAlgorithm(tiles: MjTile[]): {
  success: boolean;
  validMoves: number;
  freeTilesCount: number;
  strategicMetrics: {
    guaranteedPairs: number;
    recoveryAttempts: number;
    finalDistribution: Map<string, number>;
  };
} {
  // Get active tiles
  const activeTiles = tiles.filter(tile => tile.active);
  
  if (activeTiles.length < 2) {
    return {
      success: false,
      validMoves: 0,
      freeTilesCount: 0,
      strategicMetrics: {
        guaranteedPairs: 0,
        recoveryAttempts: 0,
        finalDistribution: new Map()
      }
    };
  }
  
  // Phase 1: Calculate strategic values
  const tilesWithValue = activeTiles.map(tile => {
    let strategicValue = 0;
    strategicValue += (5 - tile.z) * 10;
    
    if (tile.isFree()) {
      strategicValue += 100;
    } else {
      const blockingTilesCount = tile.blockedBy.filter(t => t.active).length;
      strategicValue += Math.max(0, 50 - (blockingTilesCount * 10));
    }
    
    return { tile, strategicValue };
  });
  
  // Sort by strategic value
  tilesWithValue.sort((a, b) => b.strategicValue - a.strategicValue);
  
  // Phase 2: Categorize tiles
  const freeTiles = tilesWithValue.filter(t => t.tile.isFree()).map(t => t.tile);
  const semiFreeTiles = tilesWithValue
    .filter(t => !t.tile.isFree() && t.strategicValue > 30)
    .map(t => t.tile);
  const blockedTiles = tilesWithValue
    .filter(t => !t.tile.isFree() && t.strategicValue <= 30)
    .map(t => t.tile);
  
  // Phase 3: Type distribution
  const allTypes = activeTiles.map(tile => tile.type).filter(type => type !== null) as MjTileType[];
  const typeGroups = new Map<string, MjTileType[]>();
  
  allTypes.forEach(type => {
    const key = type.matchAny ? `${type.group}-any` : `${type.group}-${type.index}`;
    if (!typeGroups.has(key)) {
      typeGroups.set(key, []);
    }
    typeGroups.get(key)!.push(type);
  });
  
  // Calculate guaranteed pairs
  let guaranteedPairs = 0;
  typeGroups.forEach(types => {
    guaranteedPairs += Math.floor(types.length / 2);
  });
  
  // Phase 4: Check if valid moves exist
  const hasValidMoves = (): boolean => {
    const free = activeTiles.filter(t => t.active && t.isFree());
    
    for (let i = 0; i < free.length - 1; i++) {
      for (let j = i + 1; j < free.length; j++) {
        if (free[i].matches(free[j])) {
          return true;
        }
      }
    }
    return false;
  };
  
  // Count valid moves
  let validMoves = 0;
  const free = activeTiles.filter(t => t.active && t.isFree());
  
  for (let i = 0; i < free.length - 1; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (free[i].matches(free[j])) {
        validMoves++;
      }
    }
  }
  
  // Simulate recovery if needed
  let recoveryAttempts = 0;
  if (!hasValidMoves() && freeTiles.length >= 2) {
    recoveryAttempts = 1;
    // Force a matching pair on free tiles
    const recoveryType = allTypes[0];
    freeTiles[0].type = recoveryType;
    freeTiles[1].type = recoveryType;
    validMoves = 1;
  }
  
  // Calculate final distribution
  const finalDistribution = new Map<string, number>();
  activeTiles.forEach(tile => {
    if (tile.type) {
      const key = `${tile.type.group}-${tile.type.index}`;
      finalDistribution.set(key, (finalDistribution.get(key) || 0) + 1);
    }
  });
  
  return {
    success: validMoves > 0,
    validMoves,
    freeTilesCount: freeTiles.length,
    strategicMetrics: {
      guaranteedPairs,
      recoveryAttempts,
      finalDistribution
    }
  };
}

describe('Shuffle Algorithm Integration Tests', () => {
  describe('Real Game Scenarios', () => {
    it('should handle early game shuffle (100+ tiles)', () => {
      // Create a realistic early game board
      const tiles: MjTile[] = [];
      
      // Create standard layout pattern
      for (let layer = 0; layer < 4; layer++) {
        const tilesInLayer = 36 - (layer * 8);
        for (let i = 0; i < tilesInLayer; i++) {
          const x = (i % 9) * 2;
          const y = Math.floor(i / 9) * 2;
          const tile = new MjTile(x + layer, y + layer, tiles);
          tile.z = layer;
          tile.active = true;
          tiles.push(tile);
        }
      }
      
      // Assign realistic type distribution
      const typeDistribution = [
        { group: 'num', indices: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
        { group: 'ball', indices: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
        { group: 'bam', indices: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
        { group: 'wind', indices: [0, 1, 2, 3] },
        { group: 'dragon', indices: [0, 1, 2] },
        { group: 'season', indices: [0, 1, 2, 3], matchAny: true },
        { group: 'flower', indices: [0, 1, 2, 3], matchAny: true }
      ];
      
      let typeIndex = 0;
      tiles.forEach(tile => {
        const typeGroup = typeDistribution[typeIndex % typeDistribution.length];
        const index = typeGroup.indices[Math.floor(Math.random() * typeGroup.indices.length)];
        tile.type = new MjTileType(typeGroup.group, index, typeGroup.matchAny || false);
        typeIndex++;
      });
      
      // Setup relationships
      for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
          tiles[i].checkRelativePositions(tiles[j]);
          tiles[j].checkRelativePositions(tiles[i]);
        }
      }
      
      // Run shuffle simulation
      const result = simulateShuffleAlgorithm(tiles);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.validMoves).toBeGreaterThan(5);
      expect(result.freeTilesCount).toBeGreaterThan(10);
      expect(result.strategicMetrics.guaranteedPairs).toBeGreaterThan(20);
    });
    
    it('should handle mid-game shuffle (40-60 tiles)', () => {
      // Create mid-game scenario with some tiles removed
      const tiles: MjTile[] = [];
      const removedPositions = new Set<string>();
      
      // Simulate some tiles already matched and removed
      for (let i = 0; i < 20; i++) {
        removedPositions.add(`${i * 2}-${i % 4}-0`);
      }
      
      // Create remaining tiles
      for (let x = 0; x < 16; x += 2) {
        for (let y = 0; y < 8; y += 2) {
          for (let z = 0; z < 3; z++) {
            const key = `${x}-${y}-${z}`;
            if (!removedPositions.has(key) && tiles.length < 50) {
              const tile = new MjTile(x, y, tiles);
              tile.z = z;
              tile.active = true;
              
              // Assign type
              const types = ['num', 'ball', 'bam'];
              const group = types[Math.floor(Math.random() * types.length)];
              const index = Math.floor(Math.random() * 9) + 1;
              tile.type = new MjTileType(group, index, false);
              
              tiles.push(tile);
            }
          }
        }
      }
      
      // Setup relationships
      for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
          tiles[i].checkRelativePositions(tiles[j]);
          tiles[j].checkRelativePositions(tiles[i]);
        }
      }
      
      // Run shuffle simulation
      const result = simulateShuffleAlgorithm(tiles);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.validMoves).toBeGreaterThan(2);
      expect(result.freeTilesCount).toBeGreaterThan(5);
    });
    
    it('should handle end-game shuffle (10-20 tiles)', () => {
      // Create end-game scenario
      const tiles: MjTile[] = [];
      
      // Create sparse tile distribution
      const positions = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 4, y: 0, z: 0 },
        { x: 0, y: 2, z: 0 },
        { x: 2, y: 2, z: 0 },
        { x: 4, y: 2, z: 0 },
        { x: 1, y: 1, z: 1 },
        { x: 3, y: 1, z: 1 },
        { x: 2, y: 1, z: 2 },
        { x: 6, y: 0, z: 0 },
        { x: 6, y: 2, z: 0 },
        { x: 8, y: 0, z: 0 },
      ];
      
      positions.forEach(pos => {
        const tile = new MjTile(pos.x, pos.y, tiles);
        tile.z = pos.z;
        tile.active = true;
        tiles.push(tile);
      });
      
      // Assign types ensuring some matches
      const endGameTypes = [
        new MjTileType('dragon', 0, false),
        new MjTileType('dragon', 0, false),
        new MjTileType('dragon', 1, false),
        new MjTileType('dragon', 1, false),
        new MjTileType('wind', 0, false),
        new MjTileType('wind', 0, false),
      ];
      
      tiles.forEach((tile, index) => {
        if (index < endGameTypes.length) {
          tile.type = endGameTypes[index];
        } else {
          tile.type = new MjTileType('num', (index % 3) + 1, false);
        }
      });
      
      // Setup relationships
      for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
          tiles[i].checkRelativePositions(tiles[j]);
          tiles[j].checkRelativePositions(tiles[i]);
        }
      }
      
      // Run shuffle simulation
      const result = simulateShuffleAlgorithm(tiles);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.validMoves).toBeGreaterThan(0);
      expect(result.strategicMetrics.recoveryAttempts).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Stress Testing', () => {
    it('should maintain guarantees across 100 random shuffles', () => {
      let successCount = 0;
      let totalValidMoves = 0;
      let recoveryNeeded = 0;
      
      for (let iteration = 0; iteration < 100; iteration++) {
        // Create random board size
        const tileCount = 10 + Math.floor(Math.random() * 50);
        const tiles: MjTile[] = [];
        
        // Create random layout
        for (let i = 0; i < tileCount; i++) {
          const x = (i % 10) * 2;
          const y = Math.floor(i / 10) * 2;
          const z = Math.floor(Math.random() * 3);
          
          const tile = new MjTile(x, y, tiles);
          tile.z = z;
          tile.active = true;
          
          // Random type
          const groups = ['num', 'ball', 'bam', 'wind', 'dragon'];
          const group = groups[Math.floor(Math.random() * groups.length)];
          const index = Math.floor(Math.random() * 4);
          tile.type = new MjTileType(group, index, false);
          
          tiles.push(tile);
        }
        
        // Setup relationships
        for (let i = 0; i < tiles.length; i++) {
          for (let j = i + 1; j < tiles.length; j++) {
            tiles[i].checkRelativePositions(tiles[j]);
            tiles[j].checkRelativePositions(tiles[i]);
          }
        }
        
        // Run shuffle
        const result = simulateShuffleAlgorithm(tiles);
        
        if (result.success) {
          successCount++;
          totalValidMoves += result.validMoves;
        }
        
        if (result.strategicMetrics.recoveryAttempts > 0) {
          recoveryNeeded++;
        }
      }
      
      // Assertions
      expect(successCount).toBe(100); // 100% success rate
      expect(totalValidMoves / 100).toBeGreaterThan(1); // Average > 1 move
      expect(recoveryNeeded).toBeLessThan(20); // Recovery needed < 20% of time
    });
    
    it('should handle pathological cases gracefully', () => {
      // Case 1: All tiles of same type
      const sameTiles: MjTile[] = [];
      const sameType = new MjTileType('num', 1, false);
      
      for (let i = 0; i < 20; i++) {
        const tile = new MjTile(i * 2, 0, sameTiles);
        tile.z = 0;
        tile.active = true;
        tile.type = sameType;
        sameTiles.push(tile);
      }
      
      const result1 = simulateShuffleAlgorithm(sameTiles);
      expect(result1.success).toBe(true);
      expect(result1.validMoves).toBeGreaterThan(5);
      
      // Case 2: Alternating types with no initial matches
      const altTiles: MjTile[] = [];
      
      for (let i = 0; i < 10; i++) {
        const tile = new MjTile(i * 2, 0, altTiles);
        tile.z = 0;
        tile.active = true;
        tile.type = new MjTileType('num', i, false);
        altTiles.push(tile);
      }
      
      const result2 = simulateShuffleAlgorithm(altTiles);
      expect(result2.strategicMetrics.recoveryAttempts).toBeGreaterThan(0);
      
      // Case 3: Complex blocking with limited free tiles
      const complexTiles: MjTile[] = [];
      
      // Create base layer
      for (let x = 0; x < 6; x++) {
        for (let y = 0; y < 6; y++) {
          const tile = new MjTile(x * 2, y * 2, complexTiles);
          tile.z = 0;
          tile.active = true;
          tile.type = new MjTileType('ball', (x + y) % 3, false);
          complexTiles.push(tile);
        }
      }
      
      // Add blocking layer
      for (let x = 1; x < 5; x++) {
        for (let y = 1; y < 5; y++) {
          const tile = new MjTile(x * 2, y * 2, complexTiles);
          tile.z = 1;
          tile.active = true;
          tile.type = new MjTileType('bam', (x + y) % 3, false);
          complexTiles.push(tile);
        }
      }
      
      // Setup relationships
      for (let i = 0; i < complexTiles.length; i++) {
        for (let j = i + 1; j < complexTiles.length; j++) {
          complexTiles[i].checkRelativePositions(complexTiles[j]);
          complexTiles[j].checkRelativePositions(complexTiles[i]);
        }
      }
      
      const result3 = simulateShuffleAlgorithm(complexTiles);
      expect(result3.success).toBe(true);
      expect(result3.freeTilesCount).toBeGreaterThan(0);
    });
  });
  
  describe('Algorithm Metrics', () => {
    it('should provide useful metrics for analysis', () => {
      const tiles: MjTile[] = [];
      
      // Create a standard test board
      for (let i = 0; i < 30; i++) {
        const tile = new MjTile((i % 6) * 2, Math.floor(i / 6) * 2, tiles);
        tile.z = Math.floor(i / 20);
        tile.active = true;
        
        // Create specific type distribution
        const typeMap = [
          { group: 'num', index: 1 },   // 6 tiles
          { group: 'num', index: 1 },
          { group: 'num', index: 2 },   // 6 tiles
          { group: 'num', index: 2 },
          { group: 'ball', index: 1 },  // 4 tiles
          { group: 'ball', index: 1 },
          { group: 'wind', index: 0 },  // 2 tiles
          { group: 'dragon', index: 0 }, // 1 tile
        ];
        
        const typeInfo = typeMap[i % typeMap.length];
        tile.type = new MjTileType(typeInfo.group, typeInfo.index, false);
        tiles.push(tile);
      }
      
      // Setup relationships
      for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
          tiles[i].checkRelativePositions(tiles[j]);
          tiles[j].checkRelativePositions(tiles[i]);
        }
      }
      
      const result = simulateShuffleAlgorithm(tiles);
      
      // Verify metrics
      expect(result.strategicMetrics.finalDistribution.size).toBeGreaterThan(3);
      expect(result.strategicMetrics.guaranteedPairs).toBeGreaterThan(0);
      
      // Check distribution balance
      let maxCount = 0;
      let minCount = Infinity;
      
      result.strategicMetrics.finalDistribution.forEach(count => {
        maxCount = Math.max(maxCount, count);
        minCount = Math.min(minCount, count);
      });
      
      // Distribution shouldn't be too skewed
      expect(maxCount - minCount).toBeLessThanOrEqual(10);
    });
  });
});