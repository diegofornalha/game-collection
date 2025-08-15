/**
 * Diagnostic utilities for debugging and fixing game state issues
 */

export class GameDiagnostics {
  /**
   * Check if the game state is valid
   */
  static async validateGameState(): Promise<boolean> {
    try {
      const gameState = localStorage.getItem('gameState');
      if (!gameState) return true; // No state is valid
      
      const parsed = JSON.parse(gameState);
      
      // Check required fields
      const isValid = 
        parsed && 
        typeof parsed === 'object' &&
        (parsed.tiles === undefined || Array.isArray(parsed.tiles)) &&
        (parsed.score === undefined || typeof parsed.score === 'number') &&
        (parsed.timer === undefined || typeof parsed.timer === 'number');
      
      if (!isValid) {
        console.error('Invalid game state structure:', parsed);
      }
      
      return isValid;
    } catch (error) {
      console.error('Failed to validate game state:', error);
      return false;
    }
  }
  
  /**
   * Clear all game-related storage
   */
  static async clearAllStorage(): Promise<void> {
    console.log('Clearing all game storage...');
    
    // Clear localStorage items
    const keysToRemove = [
      'gameState',
      'currentGame',
      'userProfile',
      'dailyStreak',
      'settings',
      'tutorial',
      'achievements'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear IndexedDB
    try {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name?.includes('mahjong') || db.name?.includes('game')) {
          await indexedDB.deleteDatabase(db.name);
          console.log(`Deleted database: ${db.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('All game storage cleared');
  }
  
  /**
   * Repair corrupted game state
   */
  static async repairGameState(): Promise<void> {
    const isValid = await this.validateGameState();
    
    if (!isValid) {
      console.log('Corrupted game state detected, clearing...');
      localStorage.removeItem('gameState');
      localStorage.removeItem('currentGame');
      
      // Clear any cached tile data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('tile') || key.includes('game')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('Game state repaired');
    } else {
      console.log('Game state is valid');
    }
  }
  
  /**
   * Get diagnostic information
   */
  static getDiagnosticInfo(): Record<string, any> {
    const info: Record<string, any> = {
      localStorage: {},
      sessionStorage: {},
      memory: {},
      browser: {}
    };
    
    // LocalStorage info
    info.localStorage.size = localStorage.length;
    info.localStorage.keys = Object.keys(localStorage);
    
    // SessionStorage info
    info.sessionStorage.size = sessionStorage.length;
    info.sessionStorage.keys = Object.keys(sessionStorage);
    
    // Memory info (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      info.memory = {
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
      };
    }
    
    // Browser info
    info.browser = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
    
    return info;
  }
  
  /**
   * Run full diagnostic and repair
   */
  static async runFullDiagnostic(): Promise<void> {
    console.log('Running full diagnostic...');
    console.log('Diagnostic Info:', this.getDiagnosticInfo());
    
    const isValid = await this.validateGameState();
    console.log('Game state valid:', isValid);
    
    if (!isValid) {
      await this.repairGameState();
      console.log('Game state repaired');
    }
    
    console.log('Diagnostic complete');
  }
}

// Expose to window in development
if (import.meta.env.DEV) {
  (window as any).GameDiagnostics = GameDiagnostics;
  console.log('GameDiagnostics available. Run GameDiagnostics.runFullDiagnostic() to diagnose issues.');
}