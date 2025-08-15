import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStateStore } from '@/stores/gameState.store';
import { MjTile } from '@/models/tile.model';

describe('GameStateStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const store = useGameStateStore();
    
    expect(store.tiles).toEqual([]);
    expect(store.selectedTile).toBeNull();
    expect(store.score).toBe(0);
    expect(store.timer).toBe(0);
    expect(store.isPaused).toBe(false);
    expect(store.isGameComplete).toBe(false);
    expect(store.isPlaying).toBe(false);
  });

  it('should reset state correctly', () => {
    const store = useGameStateStore();
    
    // Modify state
    store.score = 100;
    store.timer = 60;
    store.isPaused = true;
    store.hintsUsed = 3;
    
    // Reset
    store.resetState();
    
    // Verify reset
    expect(store.score).toBe(0);
    expect(store.timer).toBe(0);
    expect(store.isPaused).toBe(false);
    expect(store.hintsUsed).toBe(0);
  });

  it('should update score correctly', () => {
    const store = useGameStateStore();
    
    store.updateScore(10);
    expect(store.score).toBe(10);
    
    store.updateScore(15);
    expect(store.score).toBe(25);
  });

  it('should manage combo correctly', () => {
    const store = useGameStateStore();
    
    // Initial combo
    store.updateCombo(1);
    expect(store.currentCombo).toBe(1);
    expect(store.maxCombo).toBe(1);
    
    // Increase combo
    store.updateCombo(2);
    expect(store.currentCombo).toBe(2);
    expect(store.maxCombo).toBe(2);
    
    // Reset combo
    store.resetCombo();
    expect(store.currentCombo).toBe(0);
    expect(store.maxCombo).toBe(2); // Max combo should remain
  });

  it('should manage undo/redo stacks', () => {
    const store = useGameStateStore();
    
    const mockTile1 = { x: 0, y: 0, z: 0 } as MjTile;
    const mockTile2 = { x: 1, y: 0, z: 0 } as MjTile;
    
    const undoItem = {
      tile1: mockTile1,
      tile2: mockTile2,
      previousScore: 0,
      selectedTile: null
    };
    
    // Add to undo stack
    store.addUndoItem(undoItem);
    expect(store.canUndo).toBe(true);
    expect(store.undoStack.length).toBe(1);
    
    // Pop from undo stack
    const popped = store.popUndoItem();
    expect(popped).toEqual(undoItem);
    expect(store.canUndo).toBe(false);
    
    // Add to redo stack
    store.addRedoItem(undoItem);
    expect(store.canRedo).toBe(true);
    
    // Clear redo stack
    store.clearRedoStack();
    expect(store.canRedo).toBe(false);
  });

  it('should track game statistics correctly', () => {
    const store = useGameStateStore();
    
    store.incrementHintsUsed();
    store.incrementHintsUsed();
    expect(store.hintsUsed).toBe(2);
    
    store.incrementUndoCount();
    expect(store.undoCount).toBe(1);
    
    store.incrementWrongMatches();
    store.incrementWrongMatches();
    store.incrementWrongMatches();
    expect(store.wrongMatches).toBe(3);
  });

  it('should manage token animation trigger', () => {
    const store = useGameStateStore();
    
    const trigger = { amount: 20 };
    store.setTokenAnimation(trigger);
    expect(store.tokenAnimationTrigger).toEqual(trigger);
    
    store.setTokenAnimation(null);
    expect(store.tokenAnimationTrigger).toBeNull();
  });

  it('should calculate isPlaying correctly', () => {
    const store = useGameStateStore();
    
    // Not playing initially
    expect(store.isPlaying).toBe(false);
    
    // Add tiles but paused
    store.tiles = [{ active: true } as MjTile];
    store.isPaused = true;
    expect(store.isPlaying).toBe(false);
    
    // Unpause
    store.isPaused = false;
    expect(store.isPlaying).toBe(true);
    
    // Game complete
    store.isGameComplete = true;
    expect(store.isPlaying).toBe(false);
  });
});