<template>
  <div class="view-container">
    <Transition :name="transitionName" mode="out-in">
      <component 
        :is="currentViewComponent" 
        :key="navigationStore.currentView"
        @navigate="handleNavigate"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, defineAsyncComponent } from 'vue';
import { useNavigationStore } from '../stores/navigation.store';
import type { ViewType } from '../stores/navigation.store';

// Importações síncronas para views críticas
import GameView from './GameView.vue';
import MobileGameView from './MobileGameView.vue';

// Lazy loading para outras views
const HomeView = defineAsyncComponent(() => import('./views/HomeView.vue'));
const ProfileView = defineAsyncComponent(() => import('./views/ProfileView.vue'));
const SettingsView = defineAsyncComponent(() => import('./views/SettingsView.vue'));
const AchievementsView = defineAsyncComponent(() => import('./views/AchievementsView.vue'));
const StoreView = defineAsyncComponent(() => import('./views/StoreView.vue'));

const navigationStore = useNavigationStore();

// Detectar se é mobile
const isMobile = ref(window.innerWidth < 768);
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768;
});

// Compute if header is visible
const hasHeader = computed(() => {
  return navigationStore.currentView !== 'game' || !isMobile.value;
});

// Componente atual baseado na view
const currentViewComponent = computed(() => {
  const viewMap = {
    home: HomeView,
    game: isMobile.value ? MobileGameView : GameView,
    profile: ProfileView,
    settings: SettingsView,
    achievements: AchievementsView,
    store: StoreView
  };
  
  return viewMap[navigationStore.currentView];
});

// Controle de transições
const transitionName = ref('slide-left');

// Determinar direção da transição
watch(() => navigationStore.currentView, (newView, oldView) => {
  if (!oldView) {
    transitionName.value = 'fade';
    return;
  }

  const viewOrder: ViewType[] = ['home', 'game', 'profile', 'settings', 'achievements', 'store'];
  const oldIndex = viewOrder.indexOf(oldView);
  const newIndex = viewOrder.indexOf(newView);

  if (newIndex > oldIndex) {
    transitionName.value = 'slide-left';
  } else {
    transitionName.value = 'slide-right';
  }
});

// Handler para navegação
function handleNavigate(view: ViewType) {
  navigationStore.navigateTo(view);
}
</script>

<style scoped>
.view-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  /* Dynamic padding based on header visibility */
  padding-top: v-bind('hasHeader ? "80px" : "0"');
  transition: padding-top 0.3s ease;
}

/* Ensure proper height calculation */
.view-container {
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
}

/* Account for bottom navigation on mobile */
@media (max-width: 768px) {
  .view-container {
    padding-bottom: 60px;
    padding-bottom: calc(60px + env(safe-area-inset-bottom));
  }
  
  /* Game view mobile takes full screen */
  .view-container:has(.mobile-game-view) {
    padding-top: 0;
    padding-bottom: 0;
  }
}

/* Transições */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease-out;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Garantir que as views ocupem todo o espaço */
.view-container > * {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Safe area padding */
  padding-top: var(--safe-area-top, 0);
  padding-bottom: var(--safe-area-bottom, 0);
  padding-left: var(--safe-area-left, 0);
  padding-right: var(--safe-area-right, 0);
}
</style>