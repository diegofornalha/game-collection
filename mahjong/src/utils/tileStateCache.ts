import { MjTile, MjTileType } from '@/models/tile.model';

interface CachedTileState {
  id: number;
  type: MjTileType | null;
  x: number;
  y: number;
  z: number;
  isDiscarded: boolean;
  isSelected: boolean;
  isHinted: boolean;
  isSelectable: boolean;
  active: boolean;
  position?: {
    row: number;
    col: number;
    depth: number;
  };
}

interface GameStateCache {
  tiles: CachedTileState[];
  score: number;
  timer: number;
  currentCombo: number;
  selectedTileId: number | null;
  timestamp: number;
  checksum: string;
}

/**
 * Cache manager for preserving tile state across tab switches
 */
export class TileStateCache {
  private static readonly CACHE_KEY = 'tileStateCache';
  private static readonly MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Save current tile state to cache
   */
  static saveState(tiles: MjTile[], gameState: any): void {
    try {
      const cacheData: GameStateCache = {
        tiles: tiles.map(tile => ({
          id: tile.id,
          type: tile.type,
          x: tile.x,
          y: tile.y,
          z: tile.z,
          isDiscarded: (tile as any).isDiscarded || false,
          isSelected: tile.isSelected,
          isHinted: tile.isHinted,
          isSelectable: (tile as any).isSelectable || tile.isSelected,
          active: tile.active,
          position: (tile as any).position
        })),
        score: gameState.score || 0,
        timer: gameState.timer || 0,
        currentCombo: gameState.currentCombo || 0,
        selectedTileId: gameState.selectedTileId || null,
        timestamp: Date.now(),
        checksum: this.generateChecksum(tiles)
      };
      
      // Save to localStorage for quick access
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      
      // Also save to sessionStorage as backup
      sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      
      console.log('[TileStateCache] State saved with checksum:', cacheData.checksum);
    } catch (error) {
      console.error('[TileStateCache] Failed to save state:', error);
    }
  }
  
  /**
   * Load cached tile state
   */
  static loadState(): GameStateCache | null {
    try {
      // Try localStorage first
      let cacheData = localStorage.getItem(this.CACHE_KEY);
      
      // Fallback to sessionStorage
      if (!cacheData) {
        cacheData = sessionStorage.getItem(this.CACHE_KEY);
      }
      
      if (!cacheData) {
        return null;
      }
      
      const parsed: GameStateCache = JSON.parse(cacheData);
      
      // Check if cache is too old
      const age = Date.now() - parsed.timestamp;
      if (age > this.MAX_CACHE_AGE) {
        console.log('[TileStateCache] Cache too old, discarding');
        this.clearCache();
        return null;
      }
      
      console.log('[TileStateCache] State loaded with checksum:', parsed.checksum);
      return parsed;
    } catch (error) {
      console.error('[TileStateCache] Failed to load state:', error);
      this.clearCache();
      return null;
    }
  }
  
  /**
   * Validate cached state integrity
   */
  static validateCache(cache: GameStateCache, currentTiles: MjTile[]): boolean {
    if (!cache || !cache.tiles) {
      return false;
    }
    
    // Check tile count matches
    if (cache.tiles.length !== currentTiles.length) {
      console.warn('[TileStateCache] Tile count mismatch');
      return false;
    }
    
    // Verify checksum
    const currentChecksum = this.generateChecksum(currentTiles);
    if (cache.checksum !== currentChecksum) {
      console.warn('[TileStateCache] Checksum mismatch');
      // Don't fail on checksum mismatch, tiles might have moved
    }
    
    return true;
  }
  
  /**
   * Clear cached state
   */
  static clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    sessionStorage.removeItem(this.CACHE_KEY);
    console.log('[TileStateCache] Cache cleared');
  }
  
  /**
   * Generate checksum for tile state validation
   */
  private static generateChecksum(tiles: MjTile[]): string {
    const tileData = tiles
      .filter(t => t.active)
      .map(t => `${t.id}:${t.type}:${t.x}:${t.y}:${t.z}`)
      .sort()
      .join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < tileData.length; i++) {
      const char = tileData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16);
  }
  
  /**
   * Restore tiles from cached state
   */
  static restoreTiles(cachedTiles: CachedTileState[], currentTiles: MjTile[]): void {
    const tileMap = new Map<number, CachedTileState>();
    cachedTiles.forEach(cached => {
      tileMap.set(cached.id, cached);
    });
    
    currentTiles.forEach(tile => {
      const cached = tileMap.get(tile.id);
      if (cached) {
        // Restore visual state
        (tile as any).isDiscarded = cached.isDiscarded;
        tile.isSelected = cached.isSelected;
        tile.isHinted = cached.isHinted;
        (tile as any).isSelectable = cached.isSelectable;
        tile.active = cached.active;
        
        // Restore position if needed
        if (cached.x !== undefined) tile.x = cached.x;
        if (cached.y !== undefined) tile.y = cached.y;
        if (cached.z !== undefined) tile.z = cached.z;
      }
    });
    
    console.log('[TileStateCache] Tiles restored from cache');
  }
}