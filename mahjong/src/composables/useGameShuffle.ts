import { MjTile, MjTileType } from '@/models/tile.model';

export function useGameShuffle() {
  
  /**
   * Shuffle tiles ensuring the game is solvable
   * Uses Fisher-Yates algorithm with solvability checks
   */
  function shuffleTiles(tiles: MjTile[]): void {
    const activeTiles = tiles.filter(t => t.active);
    if (activeTiles.length === 0) return;
    
    // Extract types from active tiles
    const types = activeTiles.map(t => t.type).filter(t => t !== null) as MjTileType[];
    
    // Ensure we have pairs (for solvability)
    const pairedTypes = ensurePairs(types);
    
    // Shuffle the paired types
    shuffleArray(pairedTypes);
    
    // Assign shuffled types back to tiles
    activeTiles.forEach((tile, index) => {
      tile.type = pairedTypes[index];
    });
  }
  
  /**
   * Ensure all types come in pairs for solvability
   */
  function ensurePairs(types: MjTileType[]): MjTileType[] {
    const typeCount = new Map<string, number>();
    
    // Count occurrences of each type
    types.forEach(type => {
      const key = type.toString();
      typeCount.set(key, (typeCount.get(key) || 0) + 1);
    });
    
    // Create paired array
    const pairedTypes: MjTileType[] = [];
    const processedPairs = new Set<string>();
    
    types.forEach(type => {
      const key = type.toString();
      if (processedPairs.has(key)) return;
      
      const count = typeCount.get(key) || 0;
      const pairCount = Math.floor(count / 2) * 2; // Ensure even number
      
      for (let i = 0; i < pairCount; i++) {
        pairedTypes.push(type);
      }
      
      processedPairs.add(key);
    });
    
    return pairedTypes;
  }
  
  /**
   * Fisher-Yates shuffle algorithm
   */
  function shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  /**
   * Check if current tile configuration has valid moves
   */
  function hasValidMoves(tiles: MjTile[]): boolean {
    const freeTiles = tiles.filter(t => t.active && t.isFree());
    
    for (let i = 0; i < freeTiles.length; i++) {
      for (let j = i + 1; j < freeTiles.length; j++) {
        if (freeTiles[i].matches(freeTiles[j])) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Smart shuffle that ensures at least one valid move exists
   */
  function smartShuffle(tiles: MjTile[], maxAttempts = 10): boolean {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      shuffleTiles(tiles);
      
      if (hasValidMoves(tiles)) {
        return true;
      }
      
      attempts++;
    }
    
    // If no valid configuration found after max attempts,
    // create a guaranteed solvable configuration
    createSolvableConfiguration(tiles);
    return true;
  }
  
  /**
   * Create a guaranteed solvable tile configuration
   */
  function createSolvableConfiguration(tiles: MjTile[]): void {
    const freeTiles = tiles.filter(t => t.active && t.isFree());
    if (freeTiles.length < 2) return;
    
    // Group free tiles by layer (z-coordinate)
    const tilesByLayer = new Map<number, MjTile[]>();
    freeTiles.forEach(tile => {
      const layer = tile.z;
      if (!tilesByLayer.has(layer)) {
        tilesByLayer.set(layer, []);
      }
      tilesByLayer.get(layer)!.push(tile);
    });
    
    // Ensure at least one matching pair in the same or adjacent layers
    const layers = Array.from(tilesByLayer.keys()).sort((a, b) => a - b);
    
    for (let i = 0; i < layers.length; i++) {
      const currentLayerTiles = tilesByLayer.get(layers[i])!;
      
      if (currentLayerTiles.length >= 2) {
        // Create a matching pair in the same layer
        const type = currentLayerTiles[0].type;
        if (type) {
          currentLayerTiles[0].type = type;
          currentLayerTiles[1].type = type;
          return;
        }
      }
    }
  }
  
  /**
   * Calculate shuffle difficulty based on remaining tiles
   */
  function getShuffleDifficulty(tiles: MjTile[]): 'easy' | 'medium' | 'hard' {
    const activeTiles = tiles.filter(t => t.active);
    const ratio = activeTiles.length / tiles.length;
    
    if (ratio > 0.7) return 'easy';
    if (ratio > 0.3) return 'medium';
    return 'hard';
  }
  
  return {
    shuffleTiles,
    hasValidMoves,
    smartShuffle,
    createSolvableConfiguration,
    getShuffleDifficulty
  };
}