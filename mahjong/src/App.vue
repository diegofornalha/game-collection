<template>
  <div id="app" :class="appClasses" :style="mobileStyles">
    <!-- Header with navigation for all views -->
    <UserProfileHeader 
      v-if="showHeader"
      :show-game-stats="navigationStore.currentView === 'game'"
      :variant="headerVariant"
    />
    
    <!-- View Container with navigation -->
    <ViewContainer />
    
    <!-- Navigation Menu (Mobile only) -->
    <NavigationMenu v-if="isMobile" variant="bottom" />
    
    <!-- Auto-shuffle notification will be added to GameView directly -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide } from 'vue';
import ViewContainer from './components/ViewContainer.vue';
import NavigationMenu from './components/NavigationMenu.vue';
import UserProfileHeader from './components/UserProfileHeader.vue';
import { useMobileUI } from './composables/useMobileUI';
import { useGameStore } from './stores/game.store';
import { useNavigationStore } from './stores/navigation.store';

// Mobile UI setup
const { 
  isMobile, 
  isTablet, 
  isPortrait,
  mobileStyles,
  setViewportMeta 
} = useMobileUI();

// Stores
const gameStore = useGameStore();
const navigationStore = useNavigationStore();

// Refs

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
  'theme-dark': gameStore.theme === 'dark',
  'has-header': showHeader.value,
  'game-view': navigationStore.currentView === 'game'
}));

// Header visibility and variant
const showHeader = computed(() => {
  return navigationStore.currentView !== 'game' || !isMobile.value;
});

const headerVariant = computed(() => {
  if (isMobile.value && navigationStore.currentView === 'game') {
    return 'compact';
  }
  return 'default';
});


// Initialize mobile settings
onMounted(() => {
  setViewportMeta();
  
  // Load user preferences with slow animation for both mobile and desktop
  gameStore.updatePreferences({
    animationSpeed: 'slow'
  });
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  // CSS Variables from mobile composable
  --safe-area-top: v-bind('mobileStyles["--safe-area-top"]');
  --safe-area-bottom: v-bind('mobileStyles["--safe-area-bottom"]');
  --safe-area-left: v-bind('mobileStyles["--safe-area-left"]');
  --safe-area-right: v-bind('mobileStyles["--safe-area-right"]');
  --ui-scale: v-bind('mobileStyles["--ui-scale"]');
  --tile-size: v-bind('mobileStyles["--tile-size"]');
  
  // Header height for layout calculations
  --header-height: 80px;
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

// Layout adjustments when header is present
.has-header {
  // ViewContainer already handles padding
}

// Game view specific adjustments
.game-view.app-mobile {
  // Full screen game on mobile
  .user-profile-header {
    display: none;
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

// Ensure proper layering
.user-profile-header {
  z-index: 1000;
}

.navigation-menu {
  z-index: 1001;
}

.view-container {
  z-index: 1;
  flex: 1;
  min-height: 0;
}
</style>