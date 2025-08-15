<template>
  <div class="view-container" :class="containerClasses">
    <Transition 
      :name="transitionName" 
      mode="out-in"
      @before-enter="onBeforeEnter"
      @after-leave="onAfterLeave"
    >
      <KeepAlive :include="keepAliveList">
        <component 
          :is="currentViewComponent" 
          :key="currentView"
          v-bind="viewProps"
          @ready="onViewReady"
        />
      </KeepAlive>
    </Transition>
    
    <!-- Loading overlay during transitions -->
    <Transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, shallowRef } from 'vue';
import { useNavigationStore } from '@/stores/navigation.store';
import type { ViewType } from '@/stores/navigation.store';

// Import GameView directly since it's critical
import GameView from '@/components/GameView.vue';

interface Props {
  // Allow external control of current view
  view?: ViewType;
  
  // Transition customization
  transitionDuration?: number;
  transitionType?: 'slide' | 'fade' | 'scale';
  
  // Performance options
  preloadViews?: ViewType[];
  keepAliveViews?: ViewType[];
}

const props = withDefaults(defineProps<Props>(), {
  transitionDuration: 300,
  transitionType: 'slide',
  keepAliveViews: () => ['game']
});

const navigationStore = useNavigationStore();

// Component loading state
const isLoading = ref(false);
const loadError = ref<Error | null>(null);

// Current view from props or store
const currentView = computed(() => props.view || navigationStore.currentView);

// Lazy load view components
const viewComponents = {
  home: defineAsyncComponent({
    loader: () => import('@/views/HomeView.vue'),
    loadingComponent: undefined,
    delay: 200,
    onError(error) {
      console.error('Failed to load HomeView:', error);
      loadError.value = error;
    }
  }),
  
  game: GameView, // Use direct import for critical component
  
  profile: defineAsyncComponent({
    loader: () => import('@/views/ProfileView.vue'),
    loadingComponent: undefined,
    delay: 200
  }),
  
  settings: defineAsyncComponent({
    loader: () => import('@/views/SettingsView.vue'),
    loadingComponent: undefined,
    delay: 200
  }),
  
  achievements: defineAsyncComponent({
    loader: () => import('@/views/AchievementsView.vue'),
    loadingComponent: undefined,
    delay: 200
  }),
  
  store: defineAsyncComponent({
    loader: () => import('@/views/StoreView.vue'),
    loadingComponent: undefined,
    delay: 200
  })
};

// Current component
const currentViewComponent = shallowRef(viewComponents[currentView.value]);

// Update component when view changes
watch(currentView, (newView) => {
  isLoading.value = true;
  currentViewComponent.value = viewComponents[newView];
});

// View props to pass down
const viewProps = computed(() => ({
  isActive: true,
  viewParams: undefined // params removed from navigation
}));

// Container classes
const containerClasses = computed(() => ({
  'view-transitioning': navigationStore.isTransitioning,
  'view-loading': isLoading.value,
  [`transition-${props.transitionType}`]: true,
  [`view-${currentView.value}`]: true
}));

// Transition name based on direction and type
const transitionName = computed(() => {
  const direction = navigationStore.transitionDirection;
  const type = props.transitionType;
  
  if (type === 'slide') {
    return direction === 'backward' ? 'slide-back' : 'slide';
  }
  
  return type;
});

// Keep alive list
const keepAliveList = computed(() => {
  // Convert component names to match what Vue expects
  return props.keepAliveViews.map(view => {
    switch (view) {
      case 'game': return 'GameView';
      case 'home': return 'HomeView';
      case 'profile': return 'ProfileView';
      case 'settings': return 'SettingsView';
      case 'achievements': return 'AchievementsView';
      case 'store': return 'StoreView';
      default: return '';
    }
  }).filter(Boolean);
});

// Transition hooks
function onBeforeEnter() {
  navigationStore.setTransitioning(true);
}

function onAfterLeave() {
  navigationStore.setTransitioning(false);
  isLoading.value = false;
}

function onViewReady() {
  isLoading.value = false;
}

// Preload views on mount
const preloadViews = async () => {
  const viewsToPreload = props.preloadViews || ['home'];
  
  for (const view of viewsToPreload) {
    if (view !== 'game' && viewComponents[view]) { // Game is already loaded
      try {
        await (viewComponents[view] as any)();
      } catch (error) {
        console.warn(`Failed to preload ${view} view:`, error);
      }
    }
  }
};

// Preload on idle
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => preloadViews());
} else {
  setTimeout(preloadViews, 1000);
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.view-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

// Loading overlay
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  text-align: center;
  color: white;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }
  
  p {
    font-size: 16px;
    opacity: 0.8;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Slide transitions (mobile)
.slide-enter-active,
.slide-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-30%);
  opacity: 0;
}

// Slide backward
.slide-back-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-back-leave-to {
  transform: translateX(30%);
  opacity: 0;
}

// Fade transitions (desktop)
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Scale transitions (modals)
.scale-enter-active,
.scale-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.scale-enter-from {
  transform: scale(0.95);
  opacity: 0;
}

.scale-leave-to {
  transform: scale(1.05);
  opacity: 0;
}

// View-specific styles
.view-game {
  background: transparent; // Game has its own background
}

// Disable transitions during resize
.view-transitioning {
  pointer-events: none;
  
  * {
    pointer-events: none;
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .slide-enter-active,
  .slide-leave-active,
  .slide-back-enter-active,
  .slide-back-leave-active {
    transition-duration: 0.25s; // Faster on mobile
  }
}

// Reduced motion preference
@media (prefers-reduced-motion: reduce) {
  .slide-enter-active,
  .slide-leave-active,
  .slide-back-enter-active,
  .slide-back-leave-active,
  .fade-enter-active,
  .fade-leave-active,
  .scale-enter-active,
  .scale-leave-active {
    transition: none !important;
  }
}
</style>