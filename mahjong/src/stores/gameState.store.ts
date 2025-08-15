import { defineStore } from 'pinia';
import { ref, shallowRef, computed } from 'vue';
import { MjTile } from '@/models/tile.model';
import { Move } from '@/types/game.types';

interface UndoItem {
  tile1: MjTile;
  tile2: MjTile;
  previousScore: number;
  selectedTile: MjTile | null;
}

export const useGameStateStore = defineStore('gameState', () => {
  // Core game state
  const tiles = shallowRef<MjTile[]>([]);
  const selectedTile = ref<MjTile | null>(null);
  const score = ref(0);
  const timer = ref(0);
  const isPaused = ref(false);
  const isGameComplete = ref(false);
  const isPlaying = computed(() => !isPaused.value && !isGameComplete.value && tiles.value.length > 0);
  const currentLayout = ref('');
  const moves = ref<Move[]>([]);
  
  // Undo/redo stacks
  const undoStack = ref<UndoItem[]>([]);
  const redoStack = ref<UndoItem[]>([]);
  
  // UI states
  const showHint = ref(false);
  const permanentHint = ref(false);
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);
  
  // Game statistics
  const history = ref<Move[]>([]);
  const hintsUsed = ref(0);
  const undoCount = ref(0);
  const wrongMatches = ref(0);
  const maxCombo = ref(0);
  const currentCombo = ref(0);
  const gameStartTime = ref(0);
  
  // Token animation trigger
  const tokenAnimationTrigger = ref<{ source?: HTMLElement; amount: number } | null>(null);
  
  // Auto-shuffle state
  const isAutoShuffling = ref(false);
  const autoShuffleCount = ref(0);
  
  // Tab visibility state
  const isTabActive = ref(true);
  const lastTabChangeTime = ref(Date.now());
  const stateBeforeTabChange = ref<any>(null);
  
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
    moves.value.push(move);
    history.value.push(move);
  }
  
  function popMove() {
    return moves.value.pop();
  }
  
  function addUndoItem(item: UndoItem) {
    undoStack.value.push(item);
  }
  
  function popUndoItem() {
    return undoStack.value.pop();
  }
  
  function addRedoItem(item: UndoItem) {
    redoStack.value.push(item);
  }
  
  function popRedoItem() {
    return redoStack.value.pop();
  }
  
  function clearRedoStack() {
    redoStack.value = [];
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
  
  // Tab visibility management functions
  function handleTabVisibilityChange(isVisible: boolean) {
    const now = Date.now();
    
    if (!isVisible) {
      // Tab is being hidden - save current state
      isTabActive.value = false;
      lastTabChangeTime.value = now;
      
      // Save complete game state
      stateBeforeTabChange.value = {
        tiles: tiles.value.map(t => ({
          id: t.id,
          type: t.type,
          isDiscarded: t.isDiscarded,
          isSelected: t.isSelected,
          isHinted: t.isHinted,
          isSelectable: t.isSelectable,
          position: t.position
        })),
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
        // Mark that we need to restore state
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
    
    // Note: tiles restoration should be handled by TileField component
    // as it needs to recreate tile instances with proper methods
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
    restoreFromSnapshot
  };
});