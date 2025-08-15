import { ref, Ref } from 'vue';
import { useGameStore } from '@/stores/game.store';
import { storageService } from '@/services/storage.service';

interface TabState {
  isVisible: boolean;
  lastHiddenTime: number;
  lastVisibleTime: number;
  visibilityChangeCount: number;
  requiresFullRecovery: boolean;
}

export class TabVisibilityManager {
  private static instance: TabVisibilityManager;
  private tabState: Ref<TabState>;
  private visibilityHandler: ((event: Event) => void) | null = null;
  private focusHandler: ((event: FocusEvent) => void) | null = null;
  private blurHandler: ((event: FocusEvent) => void) | null = null;
  private recoveryCallbacks: Set<() => Promise<void>> = new Set();
  private isRecovering = ref(false);
  
  private constructor() {
    this.tabState = ref<TabState>({
      isVisible: true,
      lastHiddenTime: 0,
      lastVisibleTime: Date.now(),
      visibilityChangeCount: 0,
      requiresFullRecovery: false
    });
  }
  
  static getInstance(): TabVisibilityManager {
    if (!TabVisibilityManager.instance) {
      TabVisibilityManager.instance = new TabVisibilityManager();
    }
    return TabVisibilityManager.instance;
  }
  
  /**
   * Initialize tab visibility monitoring
   */
  public initialize() {
    console.log('[TabVisibilityManager] Initializing...');
    
    // Remove any existing listeners first
    this.cleanup();
    
    // Create visibility change handler
    this.visibilityHandler = this.handleVisibilityChange.bind(this);
    this.focusHandler = this.handleFocus.bind(this) as EventListener;
    this.blurHandler = this.handleBlur.bind(this) as EventListener;
    
    // Listen to multiple events for better detection
    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('focus', this.focusHandler);
    window.addEventListener('blur', this.blurHandler);
    
    // Also listen for pageshow/pagehide events (for mobile browsers)
    window.addEventListener('pageshow', this.focusHandler);
    window.addEventListener('pagehide', this.blurHandler);
    
    // Initial state check
    this.checkVisibility();
  }
  
  /**
   * Clean up event listeners
   */
  public cleanup() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
      window.removeEventListener('pageshow', this.focusHandler);
    }
    if (this.blurHandler) {
      window.removeEventListener('blur', this.blurHandler);
      window.removeEventListener('pagehide', this.blurHandler);
    }
    
    this.visibilityHandler = null;
    this.focusHandler = null;
    this.blurHandler = null;
  }
  
  /**
   * Register a callback for state recovery
   */
  public onRecoveryNeeded(callback: () => Promise<void>) {
    this.recoveryCallbacks.add(callback);
    return () => {
      this.recoveryCallbacks.delete(callback);
    };
  }
  
  /**
   * Check current visibility state
   */
  private checkVisibility(): boolean {
    const isVisible = document.visibilityState === 'visible' && document.hasFocus();
    return isVisible;
  }
  
  /**
   * Handle visibility change event
   */
  private async handleVisibilityChange(_event: Event) {
    const wasVisible = this.tabState.value.isVisible;
    const isNowVisible = document.visibilityState === 'visible';
    
    console.log(`[TabVisibilityManager] Visibility changed: ${wasVisible} -> ${isNowVisible}`);
    
    if (wasVisible === isNowVisible) {
      return; // No actual change
    }
    
    this.tabState.value.visibilityChangeCount++;
    
    if (!isNowVisible) {
      // Tab is being hidden
      await this.handleTabHidden();
    } else {
      // Tab is becoming visible
      await this.handleTabVisible();
    }
  }
  
  /**
   * Handle window focus event
   */
  private async handleFocus(_event: Event) {
    if (!this.tabState.value.isVisible) {
      console.log('[TabVisibilityManager] Window focused');
      await this.handleTabVisible();
    }
  }
  
  /**
   * Handle window blur event
   */
  private async handleBlur(_event: Event) {
    // Small delay to avoid false positives from clicking browser UI
    setTimeout(() => {
      if (!document.hasFocus() && this.tabState.value.isVisible) {
        console.log('[TabVisibilityManager] Window blurred');
        this.handleTabHidden();
      }
    }, 100);
  }
  
  /**
   * Handle tab becoming hidden
   */
  private async handleTabHidden() {
    this.tabState.value.isVisible = false;
    this.tabState.value.lastHiddenTime = Date.now();
    
    console.log('[TabVisibilityManager] Tab hidden - saving state...');
    
    const gameStore = useGameStore();
    
    // Save complete game state to storage
    try {
      const gameState = {
        tiles: gameStore.tiles.map((tile: any) => ({
          id: tile.id,
          type: tile.type,
          x: tile.x,
          y: tile.y,
          z: tile.z,
          isDiscarded: tile.isDiscarded,
          isSelected: tile.isSelected,
          active: tile.active
        })),
        score: gameStore.score,
        timer: gameStore.timer,
        currentCombo: gameStore.currentCombo,
        timestamp: Date.now()
      };
      
      // Save to both localStorage and IndexedDB for redundancy
      localStorage.setItem('tabHiddenState', JSON.stringify(gameState));
      // Save to IndexedDB
      await storageService.set('tabHiddenState', gameState, 1);
      
      console.log('[TabVisibilityManager] State saved successfully');
    } catch (error) {
      console.error('[TabVisibilityManager] Failed to save state:', error);
    }
    
    // Pause the game
    if (!gameStore.isPaused) {
      gameStore.pauseGame();
    }
  }
  
  /**
   * Handle tab becoming visible
   */
  private async handleTabVisible() {
    const wasHidden = !this.tabState.value.isVisible;
    this.tabState.value.isVisible = true;
    this.tabState.value.lastVisibleTime = Date.now();
    
    if (!wasHidden) {
      return; // Tab was already visible
    }
    
    const hiddenDuration = Date.now() - this.tabState.value.lastHiddenTime;
    console.log(`[TabVisibilityManager] Tab visible after ${hiddenDuration}ms`);
    
    // Determine if we need full recovery
    this.tabState.value.requiresFullRecovery = hiddenDuration > 2000; // More than 2 seconds
    
    if (this.tabState.value.requiresFullRecovery) {
      await this.performFullRecovery();
    } else {
      await this.performQuickRecovery();
    }
  }
  
  /**
   * Perform quick recovery for short tab switches
   */
  private async performQuickRecovery() {
    console.log('[TabVisibilityManager] Performing quick recovery...');
    
    const gameStore = useGameStore();
    
    // Resume game if it was paused by tab change
    if (gameStore.isPaused && gameStore.stateBeforeTabChange?.isPaused === false) {
      gameStore.resumeGame();
    }
    
    // Trigger light refresh for all recovery callbacks
    for (const callback of this.recoveryCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.error('[TabVisibilityManager] Recovery callback failed:', error);
      }
    }
  }
  
  /**
   * Perform full recovery for long tab switches
   */
  private async performFullRecovery() {
    if (this.isRecovering.value) {
      console.log('[TabVisibilityManager] Recovery already in progress');
      return;
    }
    
    this.isRecovering.value = true;
    console.log('[TabVisibilityManager] Performing full recovery...');
    
    try {
      // Try to restore from saved state
      let savedState = null;
      
      // Try localStorage first (faster)
      const localState = localStorage.getItem('tabHiddenState');
      if (localState) {
        try {
          savedState = JSON.parse(localState);
        } catch (e) {
          console.error('[TabVisibilityManager] Failed to parse localStorage state:', e);
        }
      }
      
      // Fallback to IndexedDB
      if (!savedState) {
        savedState = await storageService.get('tabHiddenState', 1);
      }
      
      if (savedState && savedState.timestamp) {
        const stateAge = Date.now() - savedState.timestamp;
        
        // Only use saved state if it's recent (less than 5 minutes old)
        if (stateAge < 5 * 60 * 1000) {
          console.log('[TabVisibilityManager] Restoring from saved state...');
          
          // Trigger recovery callbacks with saved state
          for (const callback of this.recoveryCallbacks) {
            try {
              await callback();
            } catch (error) {
              console.error('[TabVisibilityManager] Recovery callback failed:', error);
            }
          }
        } else {
          console.log('[TabVisibilityManager] Saved state too old, triggering fresh recovery');
          
          // State is too old, trigger fresh recovery
          for (const callback of this.recoveryCallbacks) {
            try {
              await callback();
            } catch (error) {
              console.error('[TabVisibilityManager] Recovery callback failed:', error);
            }
          }
        }
      } else {
        console.log('[TabVisibilityManager] No saved state found, triggering recovery');
        
        // No saved state, trigger recovery
        for (const callback of this.recoveryCallbacks) {
          try {
            await callback();
          } catch (error) {
            console.error('[TabVisibilityManager] Recovery callback failed:', error);
          }
        }
      }
      
      // Clean up saved state
      localStorage.removeItem('tabHiddenState');
      // Clear from IndexedDB
      try {
        await storageService.clear('tabHiddenState', 1);
      } catch (e) {
        console.error('[TabVisibilityManager] Failed to clear IndexedDB:', e);
      }
      
    } catch (error) {
      console.error('[TabVisibilityManager] Full recovery failed:', error);
    } finally {
      this.isRecovering.value = false;
      this.tabState.value.requiresFullRecovery = false;
    }
  }
  
  /**
   * Get current tab state
   */
  public getState(): TabState {
    return this.tabState.value;
  }
  
  /**
   * Check if tab is currently visible
   */
  public isTabVisible(): boolean {
    return this.tabState.value.isVisible;
  }
  
  /**
   * Check if recovery is in progress
   */
  public isRecoveringState(): boolean {
    return this.isRecovering.value;
  }
}

// Export singleton instance
export const tabVisibilityManager = TabVisibilityManager.getInstance();