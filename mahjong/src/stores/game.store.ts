import { defineStore } from 'pinia';
import { computed } from 'vue';
import { MjTile } from '@/models/tile.model';
import { useGameStateStore } from './gameState.store';
import { useGameActionsStore } from './gameActions.store';
import { useGamePreferencesStore } from './gamePreferences.store';
import { useGameTimerStore } from './gameTimer.store';

// This store now acts as a facade for the modular stores

export const useGameStore = defineStore('game', () => {
  // Import modular stores
  const stateStore = useGameStateStore();
  const actionsStore = useGameActionsStore();
  const preferencesStore = useGamePreferencesStore();
  const timerStore = useGameTimerStore();
  
  // Expose state from modular stores
  const tiles = computed(() => stateStore.tiles);
  const selectedTile = computed(() => stateStore.selectedTile);
  const score = computed(() => stateStore.score);
  const timer = computed(() => stateStore.timer);
  const isPaused = computed(() => stateStore.isPaused);
  const isGameComplete = computed(() => stateStore.isGameComplete);
  const isPlaying = computed(() => stateStore.isPlaying);
  const currentLayout = computed(() => stateStore.currentLayout);
  const moves = computed(() => stateStore.moves);
  const showHint = computed(() => stateStore.showHint);
  const permanentHint = computed(() => stateStore.permanentHint);
  const canUndo = computed(() => stateStore.canUndo);
  const canRedo = computed(() => stateStore.canRedo);
  const undoStack = computed(() => stateStore.undoStack);
  const history = computed(() => stateStore.history);
  const hintsUsed = computed(() => stateStore.hintsUsed);
  const undoCount = computed(() => stateStore.undoCount);
  const wrongMatches = computed(() => stateStore.wrongMatches);
  const maxCombo = computed(() => stateStore.maxCombo);
  const currentCombo = computed(() => stateStore.currentCombo);
  const gameStartTime = computed(() => stateStore.gameStartTime);
  const tokenAnimationTrigger = computed(() => stateStore.tokenAnimationTrigger);
  
  // Preferences from preferences store
  const preferences = computed(() => preferencesStore.preferences);
  const soundEnabled = computed(() => preferencesStore.soundEnabled);
  const musicEnabled = computed(() => preferencesStore.musicEnabled);
  const animationSpeed = computed(() => preferencesStore.animationSpeed);
  const theme = computed(() => preferencesStore.theme);
  const autoShuffleEnabled = computed(() => preferencesStore.autoShuffleEnabled);
  const autoShuffleDelay = computed(() => preferencesStore.autoShuffleDelay);
  const isAutoShuffling = computed(() => stateStore.isAutoShuffling);
  const autoShuffleCount = computed(() => stateStore.autoShuffleCount);
  
  // Delegate actions to appropriate stores
  function initializeGame(layout: string, tilesData: MjTile[]) {
    actionsStore.initializeGame(layout, tilesData);
  }
  
  function selectTile(tile: MjTile) {
    actionsStore.selectTile(tile);
  }
  
  function setSelectedTile(tile: MjTile | null) {
    stateStore.selectedTile = tile;
  }
  
  function clearSelection() {
    if (stateStore.selectedTile) {
      stateStore.selectedTile.unselect();
      stateStore.selectedTile = null;
    }
  }
  
  function clearUndoRedo() {
    stateStore.undoStack = [];
    stateStore.redoStack = [];
  }
  
  function undo() {
    actionsStore.undo();
  }
  
  function redo() {
    actionsStore.redo();
  }
  
  function requestHint() {
    actionsStore.requestHint();
  }
  
  function stopHint() {
    actionsStore.stopHint();
  }
  
  function setPermanentHint(enabled: boolean) {
    stateStore.permanentHint = enabled;
    if (!enabled) {
      actionsStore.stopHint();
    }
  }
  
  function pauseGame() {
    timerStore.pauseGame();
  }
  
  function resumeGame() {
    timerStore.resumeGame();
  }
  
  function toggleSound() {
    preferencesStore.toggleSound();
  }
  
  function toggleMusic() {
    preferencesStore.toggleMusic();
  }
  
  function updatePreferences(updates: Partial<typeof preferences.value>) {
    preferencesStore.updatePreferences(updates);
  }
  
  function loadPreferences() {
    preferencesStore.loadPreferences();
  }
  
  function saveGameState(completed: boolean) {
    actionsStore.saveGameState(completed);
  }
  
  function clearSavedGame() {
    actionsStore.clearSavedGame();
  }
  
  function updateChallengeProgress() {
    actionsStore.updateChallengeProgress();
  }
  
  function getGameContext() {
    return actionsStore.getGameContext();
  }
  
  function setAutoShuffle(enabled: boolean) {
    preferencesStore.setAutoShuffle(enabled);
  }
  
  function setAutoShuffleDelay(delay: number) {
    preferencesStore.setAutoShuffleDelay(delay);
  }
  
  function cancelAutoShuffle() {
    actionsStore.cancelAutoShuffle();
  }
  
  function hasValidMovesCheck() {
    return actionsStore.hasValidMovesCheck();
  }
  
  function cleanup() {
    actionsStore.cleanup();
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
    history,
    hintsUsed,
    undoCount,
    wrongMatches,
    maxCombo,
    currentCombo,
    gameStartTime,
    tokenAnimationTrigger,
    
    // Preferences
    preferences,
    soundEnabled,
    musicEnabled,
    animationSpeed,
    theme,
    
    // Actions
    initializeGame,
    selectTile,
    setSelectedTile,
    clearSelection,
    clearUndoRedo,
    undo,
    redo,
    requestHint,
    stopHint,
    setPermanentHint,
    pauseGame,
    resumeGame,
    toggleSound,
    toggleMusic,
    updatePreferences,
    loadPreferences,
    saveGameState,
    clearSavedGame,
    updateChallengeProgress,
    getGameContext,
    
    // Auto-shuffle functions
    autoShuffleEnabled,
    autoShuffleDelay,
    isAutoShuffling,
    autoShuffleCount,
    setAutoShuffle,
    setAutoShuffleDelay,
    cancelAutoShuffle,
    hasValidMovesCheck,
    cleanup
  };
});