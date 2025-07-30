import { defineStore } from 'pinia';
import { ref, shallowRef, computed } from 'vue';
import { MjTile } from '@/models/tile.model';
import { GameState, Move } from '@/types/game.types';
import { preferencesService, UserPreferences } from '@/services/preferences.service';
import { storageService } from '@/services/storage.service';

interface UndoItem {
  tile1: MjTile;
  tile2: MjTile;
  previousScore: number;
  selectedTile: MjTile | null;
}

interface SavedGameState {
  id?: number;
  layout: string;
  score: number;
  timer: number;
  moves: Move[];
  tiles: Array<{
    x: number;
    y: number;
    z: number;
    typeGroup: string;
    typeIndex: number;
    active: boolean;
    selected: boolean;
    chaosOffsetX: number;
    chaosOffsetY: number;
    chaosRotation: number;
  }>;
  undoStack: Array<{
    tile1: { x: number; y: number; z: number; typeGroup: string; typeIndex: number };
    tile2: { x: number; y: number; z: number; typeGroup: string; typeIndex: number };
    previousScore: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  completed: boolean;
}

export const useGameStore = defineStore('game', () => {
  // Game state
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
  
  // Additional game stats
  const history = ref<Move[]>([]);
  const hintsUsed = ref(0);
  const undoCount = ref(0);
  
  // Preferences
  const preferences = ref<UserPreferences>(preferencesService.getCurrentPreferences());
  const soundEnabled = computed(() => preferences.value.soundEnabled);
  const musicEnabled = computed(() => preferences.value.musicEnabled);
  const animationSpeed = computed(() => preferences.value.animationSpeed);
  const theme = computed(() => preferences.value.theme);
  
  // Timer
  let timerInterval: number | null = null;
  
  function startTimer() {
    if (!timerInterval && !isPaused.value) {
      timerInterval = window.setInterval(() => {
        if (!isPaused.value && !isGameComplete.value) {
          timer.value++;
        }
      }, 1000);
    }
  }
  
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  
  function pauseGame() {
    isPaused.value = true;
    stopTimer();
  }
  
  function resumeGame() {
    isPaused.value = false;
    startTimer();
  }
  
  // Game actions
  function initializeGame(layout: string, tilesData: MjTile[]) {
    tiles.value = tilesData;
    selectedTile.value = null;
    score.value = 0;
    timer.value = 0;
    isPaused.value = false;
    isGameComplete.value = false;
    currentLayout.value = layout;
    moves.value = [];
    undoStack.value = [];
    redoStack.value = [];
    showHint.value = false;
    
    startTimer();
    
    // Save initial game state
    saveCurrentGame();
  }
  
  function selectTile(tileParam: any) {
    // Handle Vue reactive wrapping
    const tile = tileParam as MjTile;
    if (!tile.isFree() || isPaused.value || isGameComplete.value) {
      return;
    }
    
    if (selectedTile.value === tile) {
      tile.unselect();
      selectedTile.value = null;
      return;
    }
    
    if (selectedTile.value) {
      if (selectedTile.value.matches(tile)) {
        // Match found!
        removeTiles(selectedTile.value, tile);
      } else {
        // No match
        selectedTile.value.unselect();
        tile.select();
        selectedTile.value = tile;
      }
    } else {
      tile.select();
      selectedTile.value = tile;
    }
  }
  
  function setSelectedTile(tile: MjTile | null) {
    selectedTile.value = tile;
  }
  
  function clearSelection() {
    if (selectedTile.value) {
      selectedTile.value.unselect();
      selectedTile.value = null;
    }
  }
  
  function clearUndoRedo() {
    undoStack.value = [];
    redoStack.value = [];
  }
  
  function removeTiles(tile1Param: any, tile2Param: any) {
    const tile1 = tile1Param as MjTile;
    const tile2 = tile2Param as MjTile;
    
    // Save state for undo
    undoStack.value.push({
      tile1: tile1,
      tile2: tile2,
      previousScore: score.value,
      selectedTile: selectedTile.value
    });
    
    // Clear redo stack when making a new move
    redoStack.value = [];
    
    // Remove tiles
    tile1.remove();
    tile2.remove();
    selectedTile.value = null;
    
    // Update score
    const baseScore = 10;
    const timeBonus = Math.max(0, 10 - Math.floor(timer.value / 30));
    score.value += baseScore + timeBonus;
    
    // Record move
    const move = {
      tile1: {
        x: tile1.x,
        y: tile1.y,
        z: tile1.z,
        typeGroup: tile1.type!.group,
        typeIndex: tile1.type!.index
      },
      tile2: {
        x: tile2.x,
        y: tile2.y,
        z: tile2.z,
        typeGroup: tile2.type!.group,
        typeIndex: tile2.type!.index
      },
      timestamp: Date.now()
    };
    moves.value.push(move);
    history.value.push(move);
    
    // Check for game completion
    checkGameComplete();
    
    // Save current game state
    saveCurrentGame();
    
    // If permanent hint is enabled, request a new hint
    if (permanentHint.value && !isGameComplete.value) {
      // Small delay to allow UI to update
      setTimeout(() => {
        requestHint();
      }, 100);
    }
  }
  
  function undo() {
    if (undoStack.value.length === 0) return;
    
    const lastAction = undoStack.value.pop()!;
    
    // Clear current selection
    if (selectedTile.value) {
      selectedTile.value.unselect();
      selectedTile.value = null;
    }
    
    // Restore tiles
    lastAction.tile1.returnToField();
    lastAction.tile2.returnToField();
    
    // Restore score
    score.value = lastAction.previousScore;
    
    // Restore previous selection if any
    if (lastAction.selectedTile && lastAction.selectedTile !== lastAction.tile1 && lastAction.selectedTile !== lastAction.tile2) {
      lastAction.selectedTile.select();
      selectedTile.value = lastAction.selectedTile;
    }
    
    // Remove last move
    moves.value.pop();
    
    // Save to redo stack
    redoStack.value.push(lastAction);
    
    // Increment undo count
    undoCount.value++;
    
    // Save current game state
    saveCurrentGame();
  }
  
  function redo() {
    if (redoStack.value.length === 0) return;
    
    const action = redoStack.value.pop()!;
    
    // Clear current selection
    if (selectedTile.value) {
      selectedTile.value.unselect();
      selectedTile.value = null;
    }
    
    // Re-remove tiles
    action.tile1.remove();
    action.tile2.remove();
    
    // Restore score after redo
    const baseScore = 10;
    const timeBonus = Math.max(0, 10 - Math.floor(timer.value / 30));
    score.value = action.previousScore + baseScore + timeBonus;
    
    // Re-add the move
    moves.value.push({
      tile1: {
        x: action.tile1.x,
        y: action.tile1.y,
        z: action.tile1.z,
        typeGroup: action.tile1.type!.group,
        typeIndex: action.tile1.type!.index
      },
      tile2: {
        x: action.tile2.x,
        y: action.tile2.y,
        z: action.tile2.z,
        typeGroup: action.tile2.type!.group,
        typeIndex: action.tile2.type!.index
      },
      timestamp: Date.now()
    });
    
    // Move action back to undo stack
    undoStack.value.push(action);
    
    // Save current game state
    saveCurrentGame();
  }
  
  function requestHint() {
    if (isPaused.value || isGameComplete.value) return;
    
    // Clear any existing hint (unless permanent hint is enabled)
    if (showHint.value && !permanentHint.value) {
      stopHint();
    }
    
    // Find all free tiles
    const freeTiles = tiles.value.filter(t => t.active && t.isFree());
    
    // Find all matching pairs and save them
    const matchingPairs: Array<[MjTile, MjTile]> = [];
    const highlightedTiles = new Set<MjTile>();
    
    for (let i = 0; i < freeTiles.length; i++) {
      for (let j = i + 1; j < freeTiles.length; j++) {
        if (freeTiles[i].matches(freeTiles[j])) {
          matchingPairs.push([freeTiles[i], freeTiles[j]]);
          highlightedTiles.add(freeTiles[i]);
          highlightedTiles.add(freeTiles[j]);
        }
      }
    }
    
    if (matchingPairs.length > 0) {
      // Only set showHint to true if we found matches
      showHint.value = true;
      hintsUsed.value++;
      
      // Highlight all tiles that are part of matching pairs
      highlightedTiles.forEach(tile => {
        tile.startHint();
      });
      
      console.log(`Encontrados ${matchingPairs.length} pares correspondentes:`, matchingPairs.map(pair => 
        `${pair[0].type?.toString()} <-> ${pair[1].type?.toString()}`
      ));
    } else {
      // No matches found
      showHint.value = false;
    }
  }
  
  function stopHint() {
    // Stop all tile hints
    tiles.value.forEach(tile => {
      if (tile.showHint) {
        tile.stopHint();
      }
    });
    
    showHint.value = false;
  }
  
  function setPermanentHint(enabled: boolean) {
    permanentHint.value = enabled;
    if (!enabled) {
      stopHint();
    }
  }
  
  function checkGameComplete() {
    const activeTiles = tiles.value.filter(t => t.active);
    
    if (activeTiles.length === 0) {
      isGameComplete.value = true;
      stopTimer();
      saveGameState(true);
      return;
    }
    
    // Check if any moves are possible
    const freeTiles = activeTiles.filter(t => t.isFree());
    for (let i = 0; i < freeTiles.length; i++) {
      for (let j = i + 1; j < freeTiles.length; j++) {
        if (freeTiles[i].matches(freeTiles[j])) {
          return; // Game can continue
        }
      }
    }
    
    // No moves possible - game over
    isGameComplete.value = true;
    stopTimer();
    saveGameState(false);
  }
  
  async function saveCurrentGame() {
    if (!currentLayout.value || isGameComplete.value) return;
    
    const savedGame: SavedGameState = {
      id: 1, // Always use ID 1 for the current game
      layout: currentLayout.value,
      score: score.value,
      timer: timer.value,
      moves: moves.value,
      tiles: tiles.value.map(t => ({
        x: t.x,
        y: t.y,
        z: t.z,
        typeGroup: t.type ? t.type.group : '',
        typeIndex: t.type ? t.type.index : 0,
        active: t.active,
        selected: t.selected,
        chaosOffsetX: t.chaosOffsetX || 0,
        chaosOffsetY: t.chaosOffsetY || 0,
        chaosRotation: t.chaosRotation || 0
      })),
      undoStack: undoStack.value.map(item => ({
        tile1: { x: item.tile1.x, y: item.tile1.y, z: item.tile1.z, typeGroup: item.tile1.type!.group, typeIndex: item.tile1.type!.index },
        tile2: { x: item.tile2.x, y: item.tile2.y, z: item.tile2.z, typeGroup: item.tile2.type!.group, typeIndex: item.tile2.type!.index },
        previousScore: item.previousScore
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      completed: false
    };
    
    try {
      // Use JSON serialization to ensure plain data
      const plainData = JSON.parse(JSON.stringify(savedGame));
      await storageService.save('currentGame', plainData);
    } catch (error) {
      console.error('Failed to save current game:', error);
    }
  }
  
  async function clearSavedGame() {
    try {
      await storageService.delete('currentGame', 1);
    } catch (error) {
      console.error('Failed to clear saved game:', error);
    }
  }
  
  async function saveGameState(completed: boolean) {
    const gameState: GameState = {
      layout: currentLayout.value,
      score: score.value,
      timer: timer.value,
      moves: moves.value,
      remainingTiles: tiles.value
        .filter(t => t.active)
        .map(t => ({
          x: t.x,
          y: t.y,
          z: t.z,
          typeGroup: t.type!.group,
          typeIndex: t.type!.index
        })),
      createdAt: new Date(),
      updatedAt: new Date(),
      completed
    };
    
    try {
      await storageService.save('gameStates', gameState);
      
      // Clear the current game save if completed
      if (completed) {
        await clearSavedGame();
      }
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }
  
  // Preferences
  async function updatePreferences(updates: Partial<UserPreferences>) {
    preferences.value = await preferencesService.updatePreferences(updates);
  }
  
  function toggleSound() {
    updatePreferences({ soundEnabled: !soundEnabled.value });
  }
  
  function toggleMusic() {
    updatePreferences({ musicEnabled: !musicEnabled.value });
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
    
    // Preferences
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
    saveGameState,
    clearSavedGame
  };
});