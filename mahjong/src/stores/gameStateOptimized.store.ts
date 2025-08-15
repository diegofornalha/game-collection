import { defineStore } from 'pinia';
import { ref, shallowRef, computed, triggerRef } from 'vue';
import { MjTile } from '@/models/tile.model';
import { Move } from '@/types/game.types';

interface UndoItem {
  tile1: MjTile;
  tile2: MjTile;
  previousScore: number;
  selectedTile: MjTile | null;
}

export const useGameStateOptimizedStore = defineStore('gameStateOptimized', () => {
  // OTIMIZAÇÃO: Use shallowRef para objetos complexos e arrays
  const tiles = shallowRef<MjTile[]>([]);
  const selectedTile = shallowRef<MjTile | null>(null);
  const undoStack = shallowRef<UndoItem[]>([]);
  const redoStack = shallowRef<UndoItem[]>([]);
  const moves = shallowRef<Move[]>([]);
  const history = shallowRef<Move[]>([]);
  
  // Valores primitivos podem usar ref normal
  const score = ref(0);
  const timer = ref(0);
  const isPaused = ref(false);
  const isGameComplete = ref(false);
  const currentLayout = ref('');
  
  // Cache para computeds pesados
  const gameStatsCache = ref({
    activeTilesCount: 0,
    freeTilesCount: 0,
    lastUpdate: 0
  });
  
  // OTIMIZAÇÃO: Computed com cache e debounce
  const isPlaying = computed(() => {
    // Cache simple boolean computation
    const result = !isPaused.value && !isGameComplete.value && tiles.value.length > 0;
    return result;
  });
  
  // OTIMIZAÇÃO: Computeds caros só recalculam quando necessário
  const gameStats = computed(() => {
    const now = Date.now();
    
    // Cache válido por 100ms para evitar recálculos excessivos
    if (now - gameStatsCache.value.lastUpdate < 100) {
      return {
        activeTilesCount: gameStatsCache.value.activeTilesCount,
        freeTilesCount: gameStatsCache.value.freeTilesCount
      };
    }
    
    const activeTilesCount = tiles.value.filter(t => t.active).length;
    const freeTilesCount = tiles.value.filter(t => t.active && t.isFree()).length;
    
    // Update cache
    gameStatsCache.value = {
      activeTilesCount,
      freeTilesCount,
      lastUpdate: now
    };
    
    return { activeTilesCount, freeTilesCount };
  });
  
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);
  
  // UI states
  const showHint = ref(false);
  const permanentHint = ref(false);
  
  // Game statistics
  const hintsUsed = ref(0);
  const undoCount = ref(0);
  const wrongMatches = ref(0);
  const maxCombo = ref(0);
  const currentCombo = ref(0);
  const gameStartTime = ref(0);
  
  // Token animation trigger
  const tokenAnimationTrigger = shallowRef<{ source?: HTMLElement; amount: number } | null>(null);
  
  // Auto-shuffle state
  const isAutoShuffling = ref(false);
  const autoShuffleCount = ref(0);
  
  // Tab visibility state
  const isTabActive = ref(true);
  const lastTabChangeTime = ref(Date.now());
  const stateBeforeTabChange = shallowRef<any>(null);
  
  // OTIMIZAÇÃO: Batch updates para melhor performance
  function batchUpdateTiles(updates: Array<{ tile: MjTile; property: string; value: any }>) {
    // Aplicar todas as mudanças sem triggerar reatividade
    updates.forEach(({ tile, property, value }) => {
      (tile as any)[property] = value;
    });
    
    // Trigger uma única vez após todas as mudanças
    triggerRef(tiles);
  }
  
  // OTIMIZAÇÃO: Invalidate cache quando tiles mudarem
  function invalidateGameStatsCache() {
    gameStatsCache.value.lastUpdate = 0;
  }
  
  // State management functions
  function resetState() {
    tiles.value = [];
    selectedTile.value = null;
    score.value = 0;
    timer.value = 0;
    isPaused.value = false;
    isGameComplete.value = false;
    currentLayout.value = '';
    moves.value = [];
    undoStack.value = [];
    redoStack.value = [];
    showHint.value = false;
    hintsUsed.value = 0;
    undoCount.value = 0;
    wrongMatches.value = 0;
    maxCombo.value = 0;
    currentCombo.value = 0;
    gameStartTime.value = Date.now();
    autoShuffleCount.value = 0;
    isAutoShuffling.value = false;
    
    // Reset cache
    invalidateGameStatsCache();
  }
  
  function updateScore(amount: number) {
    score.value += amount;
  }
  
  function incrementTimer() {
    timer.value++;
  }
  
  function setGameComplete(complete: boolean) {
    isGameComplete.value = complete;
  }
  
  function setPaused(paused: boolean) {
    isPaused.value = paused;
  }
  
  function addMove(move: Move) {
    // OTIMIZAÇÃO: Use push com manual trigger
    moves.value.push(move);
    history.value.push(move);
    triggerRef(moves);
    triggerRef(history);
  }
  
  function popMove() {
    const result = moves.value.pop();
    triggerRef(moves);
    return result;
  }
  
  function addUndoItem(item: UndoItem) {
    undoStack.value.push(item);
    triggerRef(undoStack);
  }
  
  function popUndoItem() {
    const result = undoStack.value.pop();
    triggerRef(undoStack);
    return result;
  }
  
  function addRedoItem(item: UndoItem) {
    redoStack.value.push(item);
    triggerRef(redoStack);
  }
  
  function popRedoItem() {
    const result = redoStack.value.pop();
    triggerRef(redoStack);
    return result;
  }
  
  function clearRedoStack() {
    redoStack.value = [];
    triggerRef(redoStack);
  }
  
  function incrementHintsUsed() {
    hintsUsed.value++;
  }
  
  function incrementUndoCount() {
    undoCount.value++;
  }
  
  function incrementWrongMatches() {
    wrongMatches.value++;
  }
  
  function updateCombo(combo: number) {
    currentCombo.value = combo;
    if (combo > maxCombo.value) {
      maxCombo.value = combo;
    }
  }
  
  function resetCombo() {
    currentCombo.value = 0;
  }
  
  function setTokenAnimation(trigger: { source?: HTMLElement; amount: number } | null) {
    tokenAnimationTrigger.value = trigger;
  }
  
  function setAutoShuffling(shuffling: boolean) {
    isAutoShuffling.value = shuffling;
  }
  
  function incrementAutoShuffleCount() {
    autoShuffleCount.value++;
  }
  
  // OTIMIZAÇÃO: Debounced tile updates
  let tileUpdateTimeout: number | null = null;
  function debouncedTileUpdate(callback: () => void) {
    if (tileUpdateTimeout) {
      clearTimeout(tileUpdateTimeout);
    }
    
    tileUpdateTimeout = window.setTimeout(() => {
      callback();
      invalidateGameStatsCache();
    }, 16); // ~60fps
  }
  
  // Tab visibility management functions
  function handleTabVisibilityChange(isVisible: boolean) {
    const now = Date.now();
    
    if (!isVisible) {
      // Tab is being hidden - save current state
      isTabActive.value = false;
      lastTabChangeTime.value = now;
      
      // Save minimal state to reduce memory usage
      stateBeforeTabChange.value = {
        selectedTileId: selectedTile.value?.id || null,
        score: score.value,
        timer: timer.value,
        isPaused: isPaused.value,
        currentCombo: currentCombo.value,
        undoStackSize: undoStack.value.length
      };
      
      // Pause the game to prevent timer running
      if (!isPaused.value) {
        setPaused(true);
      }
    } else {
      // Tab is becoming visible - restore state
      isTabActive.value = true;
      const timeSinceHidden = now - lastTabChangeTime.value;
      
      // If tab was hidden for more than 1 second, trigger recovery
      if (timeSinceHidden > 1000 && stateBeforeTabChange.value) {
        return true; // Signal that recovery is needed
      }
      
      // Resume game if it was paused by tab change
      if (isPaused.value && stateBeforeTabChange.value && !stateBeforeTabChange.value.isPaused) {
        setPaused(false);
      }
    }
    
    return false;
  }
  
  function validateTilesIntegrity(): boolean {
    if (!tiles.value || tiles.value.length === 0) {
      return false;
    }
    
    // Check if tiles have lost their methods/properties
    for (const tile of tiles.value) {
      if (!tile || typeof tile.getId !== 'function') {
        console.warn('Tile lost its methods, recovery needed');
        return false;
      }
    }
    
    return true;
  }
  
  function getStateSnapshot() {
    return {
      tiles: tiles.value,
      selectedTile: selectedTile.value,
      score: score.value,
      timer: timer.value,
      isPaused: isPaused.value,
      isGameComplete: isGameComplete.value,
      currentLayout: currentLayout.value,
      moves: moves.value,
      undoStack: undoStack.value,
      currentCombo: currentCombo.value
    };
  }
  
  function restoreFromSnapshot(snapshot: any) {
    if (!snapshot) return;
    
    // Restore basic state
    score.value = snapshot.score || 0;
    timer.value = snapshot.timer || 0;
    isPaused.value = snapshot.isPaused || false;
    isGameComplete.value = snapshot.isGameComplete || false;
    currentLayout.value = snapshot.currentLayout || '';
    currentCombo.value = snapshot.currentCombo || 0;
    
    // Invalidate cache after restore
    invalidateGameStatsCache();
  }
  
  return {
    // State
    tiles,
    selectedTile,
    score,
    timer,
    isPaused,
    isGameComplete,
    isPlaying,
    currentLayout,
    moves,
    showHint,
    permanentHint,
    canUndo,
    canRedo,
    undoStack,
    redoStack,
    history,
    hintsUsed,
    undoCount,
    wrongMatches,
    maxCombo,
    currentCombo,
    gameStartTime,
    tokenAnimationTrigger,
    isAutoShuffling,
    autoShuffleCount,
    isTabActive,
    lastTabChangeTime,
    stateBeforeTabChange,
    gameStats, // Optimized computed
    
    // Actions
    resetState,
    updateScore,
    incrementTimer,
    setGameComplete,
    setPaused,
    addMove,
    popMove,
    addUndoItem,
    popUndoItem,
    addRedoItem,
    popRedoItem,
    clearRedoStack,
    incrementHintsUsed,
    incrementUndoCount,
    incrementWrongMatches,
    updateCombo,
    resetCombo,
    setTokenAnimation,
    setAutoShuffling,
    incrementAutoShuffleCount,
    handleTabVisibilityChange,
    validateTilesIntegrity,
    getStateSnapshot,
    restoreFromSnapshot,
    
    // Optimized methods
    batchUpdateTiles,
    debouncedTileUpdate,
    invalidateGameStatsCache
  };
});