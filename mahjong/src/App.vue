<template>
  <div id="app" :class="appClasses" :style="mobileStyles">
    <!-- Mobile View -->
    <MobileGameView v-if="isMobile" />
    
    <!-- Desktop View -->
    <GameView v-else />
    
    <!-- Global Dialogs -->
    <!-- GameDialog will be rendered by TileField component when needed -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide } from 'vue';
import GameView from './components/GameView.vue';
import MobileGameView from './components/MobileGameView.vue';
import { useMobileUI } from './composables/useMobileUI';
import { useGameStore } from './stores/game.store';

// Mobile UI setup
const { 
  isMobile, 
  isTablet, 
  isPortrait,
  mobileStyles,
  setViewportMeta 
} = useMobileUI();

// Game store
const gameStore = useGameStore();

// Provide mobile context globally
provide('isMobile', isMobile);
provide('isTablet', isTablet);
provide('isPortrait', isPortrait);

// App classes for styling
const appClasses = computed(() => ({
  'app-mobile': isMobile.value,
  'app-tablet': isTablet.value,
  'app-desktop': !isMobile.value && !isTablet.value,
  'app-portrait': isPortrait.value,
  'app-landscape': !isPortrait.value,
  'theme-dark': gameStore.theme === 'dark'
}));

// Initialize mobile settings
onMounted(() => {
  setViewportMeta();
  
  // Load user preferences
  if (isMobile.value) {
    // Enable mobile-specific features
    gameStore.updatePreferences({
      animationSpeed: 'fast',
      soundEnabled: true
    });
  }
});
</script>

<style lang="scss">
@use './assets/styles/variables.scss' as *;
@use './assets/styles/mobile.scss' as *;

// Reset and base styles
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  position: relative;
  background: var(--bg-primary);
  color: var(--text-primary);
  
  // CSS Variables from mobile composable
  --safe-area-top: v-bind('mobileStyles["--safe-area-top"]');
  --safe-area-bottom: v-bind('mobileStyles["--safe-area-bottom"]');
  --safe-area-left: v-bind('mobileStyles["--safe-area-left"]');
  --safe-area-right: v-bind('mobileStyles["--safe-area-right"]');
  --ui-scale: v-bind('mobileStyles["--ui-scale"]');
  --tile-size: v-bind('mobileStyles["--tile-size"]');
}

// Mobile-specific styles
.app-mobile {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  
  // Prevent bounce scrolling on iOS
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

// Tablet styles
.app-tablet {
  // Larger touch targets for tablet
  --min-touch-size: 56px;
}

// Dark theme
.theme-dark {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --accent: #42b883;
}

// Landscape adjustments
.app-landscape.app-mobile {
  .game-controls {
    position: fixed;
    right: var(--safe-area-right);
    top: 50%;
    transform: translateY(-50%);
    flex-direction: column;
  }
}

// Smooth transitions
* {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

// Disable transitions during resize
.resizing * {
  transition: none !important;
}
</style>