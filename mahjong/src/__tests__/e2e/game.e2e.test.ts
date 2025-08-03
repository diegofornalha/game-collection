import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from '@/App.vue';
import { useGameStore } from '@/stores/game.store';

// Mock audio service
vi.mock('@/services/audio.service', () => ({
  audioService: {
    load: vi.fn(),
    play: vi.fn(),
    stopAll: vi.fn(),
    cleanup: vi.fn()
  }
}));

describe('Mahjong E2E Tests', () => {
  let wrapper: any;
  let router: any;
  let gameStore: any;

  beforeEach(async () => {
    // Setup
    setActivePinia(createPinia());
    
    // Create router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/game', name: 'game', component: { template: '<div>Game</div>' } },
        { path: '/settings', name: 'settings', component: { template: '<div>Settings</div>' } }
      ]
    });

    // Mount app
    wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });

    gameStore = useGameStore();
    await router.isReady();
  });

  describe('Complete Game Flow', () => {
    it('should complete a full game flow', async () => {
      // 1. Navigate to home
      await router.push('/');
      expect(router.currentRoute.value.path).toBe('/');

      // 2. Start new game
      await router.push('/game');
      expect(router.currentRoute.value.path).toBe('/game');

      // 3. Initialize game
      const mockTiles = createMockTiles();
      gameStore.initializeGame('default', mockTiles);
      
      expect(gameStore.isPlaying).toBe(true);
      expect(gameStore.score).toBe(0);
      expect(gameStore.timer).toBe(0);

      // 4. Make a match
      const tile1 = mockTiles[0];
      const tile2 = mockTiles[1];
      
      gameStore.selectTile(tile1);
      expect(gameStore.selectedTile).toBe(tile1);
      
      gameStore.selectTile(tile2);
      expect(gameStore.score).toBeGreaterThan(0);
      expect(gameStore.moves.length).toBe(1);

      // 5. Test undo
      gameStore.undo();
      expect(gameStore.moves.length).toBe(0);
      expect(tile1.active).toBe(true);
      expect(tile2.active).toBe(true);

      // 6. Test redo
      gameStore.redo();
      expect(gameStore.moves.length).toBe(1);
      expect(tile1.active).toBe(false);
      expect(tile2.active).toBe(false);

      // 7. Complete game
      // Remove all tiles
      for (let i = 2; i < mockTiles.length; i += 2) {
        if (mockTiles[i] && mockTiles[i + 1]) {
          gameStore.selectTile(mockTiles[i]);
          gameStore.selectTile(mockTiles[i + 1]);
        }
      }

      // Check game complete
      expect(gameStore.isGameComplete).toBe(true);
      expect(gameStore.isPlaying).toBe(false);
    });

    it('should handle no more moves scenario', async () => {
      // Create tiles that will result in no valid moves
      const blockedTiles = createBlockedTiles();
      gameStore.initializeGame('default', blockedTiles);

      // Make some moves
      gameStore.selectTile(blockedTiles[0]);
      gameStore.selectTile(blockedTiles[1]);

      // Should trigger no more moves
      expect(gameStore.hasValidMovesCheck()).toBe(false);
      
      // Auto-shuffle should be triggered if enabled
      if (gameStore.autoShuffleEnabled) {
        expect(gameStore.isAutoShuffling).toBe(true);
      }
    });

    it('should handle pause and resume', async () => {
      const mockTiles = createMockTiles();
      gameStore.initializeGame('default', mockTiles);

      expect(gameStore.isPlaying).toBe(true);

      // Pause game
      gameStore.pauseGame();
      expect(gameStore.isPaused).toBe(true);
      expect(gameStore.isPlaying).toBe(false);

      // Resume game
      gameStore.resumeGame();
      expect(gameStore.isPaused).toBe(false);
      expect(gameStore.isPlaying).toBe(true);
    });
  });

  describe('Settings Integration', () => {
    it('should persist and apply settings', async () => {
      // Navigate to settings
      await router.push('/settings');

      // Change settings
      gameStore.toggleSound();
      expect(gameStore.soundEnabled).toBe(false);

      gameStore.toggleMusic();
      expect(gameStore.musicEnabled).toBe(false);

      gameStore.setAnimationSpeed('fast');
      expect(gameStore.animationSpeed).toBe('fast');

      // Settings should persist after navigation
      await router.push('/game');
      expect(gameStore.soundEnabled).toBe(false);
      expect(gameStore.musicEnabled).toBe(false);
      expect(gameStore.animationSpeed).toBe('fast');
    });
  });

  describe('Tutorial Flow', () => {
    it('should show tutorial for first-time users', async () => {
      // Clear localStorage to simulate first-time user
      localStorage.removeItem('mahjong-tutorial-completed');

      await router.push('/game');

      // Tutorial should be visible
      const tutorialElement = wrapper.find('.tutorial-overlay');
      expect(tutorialElement.exists()).toBe(true);
    });

    it('should not show tutorial for returning users', async () => {
      // Set tutorial as completed
      localStorage.setItem('mahjong-tutorial-completed', 'true');

      await router.push('/game');

      // Tutorial should not be visible
      const tutorialElement = wrapper.find('.tutorial-overlay');
      expect(tutorialElement.exists()).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard shortcuts', async () => {
      const mockTiles = createMockTiles();
      gameStore.initializeGame('default', mockTiles);

      // Test hint shortcut
      const hintEvent = new KeyboardEvent('keydown', { key: 'h' });
      window.dispatchEvent(hintEvent);
      expect(gameStore.showHint).toBe(true);

      // Test undo shortcut
      gameStore.selectTile(mockTiles[0]);
      gameStore.selectTile(mockTiles[1]);
      
      const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      window.dispatchEvent(undoEvent);
      expect(gameStore.moves.length).toBe(0);

      // Test pause shortcut
      const pauseEvent = new KeyboardEvent('keydown', { key: 'p' });
      window.dispatchEvent(pauseEvent);
      expect(gameStore.isPaused).toBe(true);
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt to mobile viewport', async () => {
      // Simulate mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      window.dispatchEvent(new Event('resize'));

      await wrapper.vm.$nextTick();

      // Check mobile-specific elements
      const mobileView = wrapper.find('.mobile-view');
      expect(mobileView.exists()).toBe(true);
    });
  });
});

// Helper functions
function createMockTiles() {
  const tiles = [];
  // Create 4 matching pairs
  for (let i = 0; i < 4; i++) {
    const type = { group: 'bamboo', index: i, matchAny: false, getColor: () => '#000' };
    tiles.push(
      { 
        x: i * 2, y: 0, z: 0, 
        type, 
        active: true, 
        selected: false,
        isFree: () => true,
        matches: (other: any) => other.type.group === type.group && other.type.index === type.index,
        remove: function() { this.active = false; },
        returnToField: function() { this.active = true; },
        unselect: function() { this.selected = false; },
        select: function() { this.selected = true; }
      },
      { 
        x: i * 2 + 1, y: 0, z: 0, 
        type, 
        active: true, 
        selected: false,
        isFree: () => true,
        matches: (other: any) => other.type.group === type.group && other.type.index === type.index,
        remove: function() { this.active = false; },
        returnToField: function() { this.active = true; },
        unselect: function() { this.selected = false; },
        select: function() { this.selected = true; }
      }
    );
  }
  return tiles;
}

function createBlockedTiles() {
  const tiles = [];
  const type1 = { group: 'bamboo', index: 0, matchAny: false };
  const type2 = { group: 'circle', index: 0, matchAny: false };
  
  // Create a scenario where remaining tiles have no valid moves
  tiles.push(
    { x: 0, y: 0, z: 0, type: type1, active: true, isFree: () => true },
    { x: 1, y: 0, z: 0, type: type1, active: true, isFree: () => true },
    { x: 0, y: 1, z: 0, type: type2, active: true, isFree: () => false }, // blocked
    { x: 1, y: 1, z: 0, type: type2, active: true, isFree: () => false }  // blocked
  );
  
  return tiles;
}