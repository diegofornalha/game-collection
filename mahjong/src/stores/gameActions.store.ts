import { defineStore } from 'pinia';
import { MjTile } from '@/models/tile.model';
import { useGameStateStore } from './gameState.store';
import { useGamePreferencesStore } from './gamePreferences.store';
import { useGameTimerStore } from './gameTimer.store';
import { useChallengesStore } from './gamification/challenges.store';
import { storageService } from '@/services/storage.service';
import type { GameContext } from '@/types/gamification.types';
import type { Move } from '@/types/game.types';

export const useGameActionsStore = defineStore('gameActions', () => {
  const stateStore = useGameStateStore();
  const preferencesStore = useGamePreferencesStore();
  const timerStore = useGameTimerStore();
  
  // Mutex for auto-shuffle
  let autoShuffleMutex = false;
  let autoShuffleTimer: number | null = null;
  
  function initializeGame(layout: string, tilesData: MjTile[]) {
    stateStore.resetState();
    stateStore.tiles = tilesData;
    stateStore.currentLayout = layout;
    timerStore.startTimer();
    saveCurrentGame();
  }
  
  function selectTile(tile: MjTile) {
    // Ensure tile has all necessary methods
    if (!tile || typeof tile.isFree !== 'function' || !tile.isFree() || stateStore.isPaused || stateStore.isGameComplete) {
      return;
    }
    
    if (stateStore.selectedTile === tile) {
      tile.unselect();
      stateStore.selectedTile = null;
      return;
    }
    
    if (stateStore.selectedTile) {
      if (stateStore.selectedTile.matches(tile)) {
        // Match found!
        removeTiles(stateStore.selectedTile, tile);
      } else {
        // No match
        stateStore.incrementWrongMatches();
        stateStore.resetCombo();
        stateStore.selectedTile.unselect();
        tile.select();
        stateStore.selectedTile = tile;
      }
    } else {
      tile.select();
      stateStore.selectedTile = tile;
    }
  }
  
  function removeTiles(tile1: MjTile, tile2: MjTile) {
    // Save state for undo
    stateStore.addUndoItem({
      tile1,
      tile2,
      previousScore: stateStore.score,
      selectedTile: stateStore.selectedTile
    });
    
    // Clear redo stack when making a new move
    stateStore.clearRedoStack();
    
    // Remove tiles
    tile1.remove();
    tile2.remove();
    stateStore.selectedTile = null;
    
    // Update combo
    stateStore.updateCombo(stateStore.currentCombo + 1);
    
    // Calculate score
    const baseScore = 10;
    const timeBonus = Math.max(0, 10 - Math.floor(stateStore.timer / 30));
    const comboBonus = stateStore.currentCombo > 1 ? (stateStore.currentCombo - 1) * 5 : 0;
    const totalScore = baseScore + timeBonus + comboBonus;
    stateStore.updateScore(totalScore);
    
    // Trigger token animation if significant score
    if (totalScore >= 15) {
      stateStore.setTokenAnimation({
        source: undefined,
        amount: totalScore
      });
      setTimeout(() => {
        stateStore.setTokenAnimation(null);
      }, 100);
    }
    
    // Record move
    const move: Move = {
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
    stateStore.addMove(move);
    
    // Update challenge progress
    updateChallengeProgress();
    
    // Check for game completion
    checkGameComplete();
    
    // Save current game state
    saveCurrentGame();
    
    // Request new hint if permanent hint is enabled
    if (stateStore.permanentHint && !stateStore.isGameComplete) {
      setTimeout(() => {
        requestHint();
      }, 100);
    }
  }
  
  function undo() {
    const lastAction = stateStore.popUndoItem();
    if (!lastAction) return;
    
    // Clear current selection
    if (stateStore.selectedTile) {
      stateStore.selectedTile.unselect();
      stateStore.selectedTile = null;
    }
    
    // Restore tiles
    lastAction.tile1.returnToField();
    lastAction.tile2.returnToField();
    
    // Restore score
    stateStore.score = lastAction.previousScore;
    
    // Restore previous selection if any
    if (lastAction.selectedTile && 
        lastAction.selectedTile !== lastAction.tile1 && 
        lastAction.selectedTile !== lastAction.tile2) {
      lastAction.selectedTile.select();
      stateStore.selectedTile = lastAction.selectedTile;
    }
    
    // Remove last move
    stateStore.popMove();
    
    // Save to redo stack
    stateStore.addRedoItem(lastAction);
    
    // Increment undo count
    stateStore.incrementUndoCount();
    
    // Save current game state
    saveCurrentGame();
  }
  
  function redo() {
    const action = stateStore.popRedoItem();
    if (!action) return;
    
    // Clear current selection
    if (stateStore.selectedTile) {
      stateStore.selectedTile.unselect();
      stateStore.selectedTile = null;
    }
    
    // Re-remove tiles
    action.tile1.remove();
    action.tile2.remove();
    
    // Restore score after redo
    const baseScore = 10;
    const timeBonus = Math.max(0, 10 - Math.floor(stateStore.timer / 30));
    stateStore.score = action.previousScore + baseScore + timeBonus;
    
    // Re-add the move
    stateStore.addMove({
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
    stateStore.addUndoItem(action);
    
    // Save current game state
    saveCurrentGame();
  }
  
  function requestHint() {
    if (stateStore.isPaused || stateStore.isGameComplete) return;
    
    // Clear existing hint unless permanent hint is enabled
    if (stateStore.showHint && !stateStore.permanentHint) {
      stopHint();
    }
    
    // Find all free tiles
    const freeTiles = stateStore.tiles.filter(t => t.active && t.isFree());
    
    // Find all matching pairs
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
      stateStore.showHint = true;
      stateStore.incrementHintsUsed();
      
      // Highlight all tiles that are part of matching pairs
      highlightedTiles.forEach(tile => {
        tile.startHint();
      });
    } else {
      stateStore.showHint = false;
    }
  }
  
  function stopHint() {
    stateStore.tiles.forEach(tile => {
      if (tile.showHint) {
        tile.stopHint();
      }
    });
    stateStore.showHint = false;
  }
  
  function checkGameComplete() {
    const activeTiles = stateStore.tiles.filter(t => t.active);
    
    if (activeTiles.length === 0) {
      stateStore.setGameComplete(true);
      timerStore.stopTimer();
      saveGameState(true);
      
      // Complete challenges when game ends
      const challengesStore = useChallengesStore();
      const gameContext = getGameContext();
      challengesStore.updateProgress('complete-game', gameContext);
      
      return;
    }
    
    // Check if any moves are possible
    const hasValidMoves = hasValidMovesCheck();
    
    if (hasValidMoves) {
      // Cancel any pending auto-shuffle
      if (autoShuffleTimer) {
        clearTimeout(autoShuffleTimer);
        autoShuffleTimer = null;
      }
      return;
    }
    
    // No moves possible - trigger auto-shuffle if enabled
    if (preferencesStore.autoShuffleEnabled && activeTiles.length > 0) {
      // Check mutex to prevent race conditions
      if (autoShuffleMutex) {
        console.log('Auto-shuffle já em progresso, ignorando...');
        return;
      }
      
      // Set mutex
      autoShuffleMutex = true;
      
      // Mark that we're preparing to auto-shuffle
      stateStore.setAutoShuffling(true);
      
      // Emit event to show notification
      window.dispatchEvent(new CustomEvent('auto-shuffle-pending', {
        detail: {
          delay: preferencesStore.autoShuffleDelay,
          canCancel: true
        }
      }));
      
      // Set a timer to auto-shuffle after delay
      autoShuffleTimer = window.setTimeout(() => {
        if (!hasValidMovesCheck() && stateStore.isAutoShuffling && autoShuffleMutex) {
          console.log('Auto-shuffle ativado!');
          stateStore.incrementAutoShuffleCount();
          
          // Track auto-shuffle in challenges
          const challengesStore = useChallengesStore();
          const context = getGameContext();
          context.metadata = { 
            ...context.metadata, 
            autoShuffleUsed: true, 
            autoShuffleCount: stateStore.autoShuffleCount 
          };
          challengesStore.updateProgress('use-auto-shuffle', context);
          
          // Emit event to trigger shuffle in TileField
          window.dispatchEvent(new CustomEvent('auto-shuffle-execute'));
        }
        autoShuffleTimer = null;
        stateStore.setAutoShuffling(false);
        autoShuffleMutex = false; // Release mutex
      }, preferencesStore.autoShuffleDelay);
    } else {
      // Auto-shuffle disabled or no tiles left - game over
      stateStore.setGameComplete(true);
      timerStore.stopTimer();
      saveGameState(false);
    }
  }
  
  function hasValidMovesCheck(): boolean {
    const activeTiles = stateStore.tiles.filter(t => t.active);
    const freeTiles = activeTiles.filter(t => t.isFree());
    
    for (let i = 0; i < freeTiles.length; i++) {
      for (let j = i + 1; j < freeTiles.length; j++) {
        if (freeTiles[i].matches(freeTiles[j])) {
          return true;
        }
      }
    }
    return false;
  }
  
  function cancelAutoShuffle() {
    if (autoShuffleTimer) {
      clearTimeout(autoShuffleTimer);
      autoShuffleTimer = null;
    }
    stateStore.setAutoShuffling(false);
    autoShuffleMutex = false;
    console.log('Auto-shuffle cancelado');
  }
  
  function updateChallengeProgress() {
    const challengesStore = useChallengesStore();
    const context = getGameContext();
    
    // Update progress for match-based challenges
    challengesStore.updateProgress('make-match', context);
    
    // Update combo challenges if applicable
    if (stateStore.maxCombo >= 5) {
      challengesStore.updateProgress('combo-5', context);
    }
  }
  
  function getGameContext(): GameContext {
    return {
      score: stateStore.score,
      timeTaken: Date.now() - stateStore.gameStartTime,
      timeElapsed: stateStore.timer * 1000,
      hintsUsed: stateStore.hintsUsed,
      undoUsed: stateStore.undoCount,
      undoCount: stateStore.undoCount,
      wrongMatches: stateStore.wrongMatches,
      perfectGame: stateStore.wrongMatches === 0,
      matchCount: stateStore.moves.length,
      maxCombo: stateStore.maxCombo,
      gameWon: false,
      gameCompleted: false,
      movesCount: stateStore.moves.length,
      metadata: {
        currentCombo: stateStore.currentCombo,
        layout: stateStore.currentLayout
      }
    };
  }
  
  async function saveCurrentGame() {
    if (!stateStore.currentLayout || stateStore.isGameComplete) return;
    
    const savedGame = {
      id: 1,
      layout: stateStore.currentLayout,
      score: stateStore.score,
      timer: stateStore.timer,
      moves: stateStore.moves,
      tiles: stateStore.tiles.map(t => ({
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
      undoStack: stateStore.undoStack.map(item => ({
        tile1: { 
          x: item.tile1.x, 
          y: item.tile1.y, 
          z: item.tile1.z, 
          typeGroup: item.tile1.type!.group, 
          typeIndex: item.tile1.type!.index 
        },
        tile2: { 
          x: item.tile2.x, 
          y: item.tile2.y, 
          z: item.tile2.z, 
          typeGroup: item.tile2.type!.group, 
          typeIndex: item.tile2.type!.index 
        },
        previousScore: item.previousScore
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      completed: false
    };
    
    try {
      const plainData = JSON.parse(JSON.stringify(savedGame));
      await storageService.save('currentGame', plainData);
    } catch (error) {
      console.error('Failed to save current game:', error);
    }
  }
  
  async function saveGameState(completed: boolean) {
    const gameState = {
      layout: stateStore.currentLayout,
      score: stateStore.score,
      timer: stateStore.timer,
      moves: stateStore.moves,
      remainingTiles: stateStore.tiles
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
      
      if (completed) {
        await clearSavedGame();
      }
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }
  
  async function clearSavedGame() {
    try {
      await storageService.delete('currentGame', 1);
    } catch (error) {
      console.error('Failed to clear saved game:', error);
    }
  }
  
  function cleanup() {
    cancelAutoShuffle();
    timerStore.cleanup();
  }
  
  return {
    // Actions
    initializeGame,
    selectTile,
    removeTiles,
    undo,
    redo,
    requestHint,
    stopHint,
    checkGameComplete,
    hasValidMovesCheck,
    cancelAutoShuffle,
    updateChallengeProgress,
    getGameContext,
    saveCurrentGame,
    saveGameState,
    clearSavedGame,
    cleanup
  };
});