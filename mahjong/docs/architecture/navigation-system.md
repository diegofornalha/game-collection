# Navigation System Architecture

## Overview

The navigation system provides a seamless, mobile-first navigation experience for the Mahjong application. It supports both mobile (bottom navigation) and desktop (header navigation) layouts with smooth transitions and state preservation.

## 1. NavigationStore (Pinia Store)

### State Structure

```typescript
interface NavigationState {
  // Current navigation state
  currentView: ViewType;
  previousView: ViewType | null;
  navigationHistory: NavigationEntry[];
  
  // UI state
  isTransitioning: boolean;
  transitionDirection: 'forward' | 'backward';
  
  // Game state preservation
  gameStateSnapshot: GameStateSnapshot | null;
  shouldPreserveGameState: boolean;
  
  // Mobile specific
  isBottomNavVisible: boolean;
  activeTabIndex: number;
}

interface NavigationEntry {
  view: ViewType;
  timestamp: number;
  params?: Record<string, any>;
  scrollPosition?: number;
}

interface GameStateSnapshot {
  tiles: any[];
  score: number;
  timer: number;
  isPaused: boolean;
  timestamp: number;
}

type ViewType = 'home' | 'game' | 'profile' | 'settings' | 'achievements' | 'store';
```

### Actions

```typescript
class NavigationStore {
  // Navigation actions
  navigateTo(view: ViewType, params?: Record<string, any>): Promise<void>;
  goBack(): Promise<void>;
  canGoBack(): boolean;
  
  // Game state management
  preserveGameState(): void;
  restoreGameState(): void;
  clearGameStateSnapshot(): void;
  
  // UI state
  setTransitioning(isTransitioning: boolean): void;
  toggleBottomNav(visible?: boolean): void;
  
  // History management
  clearHistory(): void;
  getHistoryDepth(): number;
}
```

### Getters

```typescript
getters: {
  // Navigation state
  isInGame: (state) => state.currentView === 'game';
  canGoBack: (state) => state.navigationHistory.length > 1;
  currentViewTitle: (state) => VIEW_TITLES[state.currentView];
  
  // UI helpers
  shouldShowBackButton: (state) => state.currentView !== 'home' && state.canGoBack;
  navigationItems: (state) => getNavigationItems(state.currentView);
  
  // Game state
  hasPreservedGameState: (state) => state.gameStateSnapshot !== null;
  gameStateAge: (state) => state.gameStateSnapshot ? Date.now() - state.gameStateSnapshot.timestamp : null;
}
```

## 2. ViewContainer Component

### Structure

```vue
<template>
  <div class="view-container" :class="containerClasses">
    <Transition 
      :name="transitionName" 
      mode="out-in"
      @before-enter="onBeforeEnter"
      @after-leave="onAfterLeave"
    >
      <KeepAlive :include="keepAliveViews">
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
        <LoadingSpinner />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
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

// Lazy load view components
const viewComponents = {
  home: defineAsyncComponent(() => import('./views/HomeView.vue')),
  game: defineAsyncComponent(() => import('./GameView.vue')),
  profile: defineAsyncComponent(() => import('./views/ProfileView.vue')),
  settings: defineAsyncComponent(() => import('./views/SettingsView.vue')),
  achievements: defineAsyncComponent(() => import('./views/AchievementsView.vue')),
  store: defineAsyncComponent(() => import('./views/StoreView.vue'))
};
</script>
```

### Features

- **Lazy Loading**: Views are loaded on-demand using `defineAsyncComponent`
- **Keep-Alive**: Game view is kept alive to preserve state
- **Smooth Transitions**: Configurable transition effects between views
- **Loading States**: Shows spinner during async component loading
- **Preloading**: Option to preload critical views

## 3. NavigationMenu Component

### Mobile Version (Bottom Navigation)

```vue
<template>
  <nav class="navigation-menu mobile" :class="{ 'hidden': !isVisible }">
    <div class="nav-container">
      <button
        v-for="item in navigationItems"
        :key="item.id"
        class="nav-item"
        :class="{ 'active': isActive(item.id) }"
        @click="navigate(item.id)"
        :aria-label="item.label"
      >
        <div class="nav-icon">
          <component :is="item.icon" />
          <span v-if="item.badge" class="badge">{{ item.badge }}</span>
        </div>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </div>
    
    <!-- Gesture indicator for iOS -->
    <div class="gesture-indicator" />
  </nav>
</template>

<style lang="scss">
.navigation-menu.mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--nav-bg);
  border-top: 1px solid var(--border-color);
  padding-bottom: env(safe-area-inset-bottom);
  transition: transform 0.3s ease;
  z-index: 1000;
  
  &.hidden {
    transform: translateY(100%);
  }
  
  .nav-container {
    display: flex;
    justify-content: space-around;
    padding: 8px 0;
  }
  
  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    background: none;
    border: none;
    color: var(--text-secondary);
    position: relative;
    
    &.active {
      color: var(--accent);
      
      &::before {
        content: '';
        position: absolute;
        top: -1px;
        left: 20%;
        right: 20%;
        height: 3px;
        background: var(--accent);
        border-radius: 0 0 3px 3px;
      }
    }
  }
}
</style>
```

### Desktop Version (Header Navigation)

```vue
<template>
  <nav class="navigation-menu desktop">
    <div class="nav-container">
      <div class="nav-group left">
        <button 
          v-if="canGoBack" 
          class="nav-back"
          @click="goBack"
          aria-label="Go back"
        >
          <ArrowLeftIcon />
        </button>
      </div>
      
      <div class="nav-group center">
        <TransitionGroup name="nav-fade">
          <button
            v-for="item in mainNavItems"
            :key="item.id"
            class="nav-item"
            :class="{ 'active': isActive(item.id) }"
            @click="navigate(item.id)"
          >
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </button>
        </TransitionGroup>
      </div>
      
      <div class="nav-group right">
        <button 
          class="nav-item icon-only"
          @click="navigate('settings')"
          aria-label="Settings"
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  </nav>
</template>
```

### Navigation Items Configuration

```typescript
const navigationConfig = {
  mobile: [
    { id: 'home', label: 'Início', icon: HomeIcon, order: 1 },
    { id: 'achievements', label: 'Conquistas', icon: TrophyIcon, order: 2 },
    { id: 'game', label: 'Jogar', icon: GameIcon, order: 3, primary: true },
    { id: 'store', label: 'Loja', icon: StoreIcon, order: 4 },
    { id: 'profile', label: 'Perfil', icon: UserIcon, order: 5 }
  ],
  desktop: [
    { id: 'home', label: 'Início', icon: HomeIcon },
    { id: 'game', label: 'Jogar', icon: GameIcon },
    { id: 'achievements', label: 'Conquistas', icon: TrophyIcon },
    { id: 'store', label: 'Loja', icon: StoreIcon },
    { id: 'profile', label: 'Perfil', icon: UserIcon }
  ]
};
```

## 4. View Components

### HomeView

```vue
<template>
  <div class="home-view">
    <!-- Quick Stats -->
    <section class="quick-stats">
      <StatCard 
        title="Jogos Hoje" 
        :value="todayGames" 
        icon="game"
        trend="+2"
      />
      <StatCard 
        title="Sequência" 
        :value="currentStreak" 
        icon="fire"
        :highlight="currentStreak > 0"
      />
      <StatCard 
        title="Melhor Tempo" 
        :value="bestTime" 
        icon="clock"
        format="time"
      />
    </section>
    
    <!-- Quick Actions -->
    <section class="quick-actions">
      <ActionButton
        label="Continuar Jogo"
        icon="play"
        :disabled="!hasSavedGame"
        @click="continueGame"
        primary
      />
      <ActionButton
        label="Novo Jogo"
        icon="plus"
        @click="startNewGame"
      />
    </section>
    
    <!-- Recent Activity -->
    <section class="recent-activity">
      <h2>Atividade Recente</h2>
      <ActivityList :items="recentActivity" />
    </section>
    
    <!-- Daily Challenge Preview -->
    <section class="daily-challenge">
      <DailyChallengeCard 
        :challenge="todayChallenge"
        @start="startChallenge"
      />
    </section>
  </div>
</template>
```

### ProfileView

```vue
<template>
  <div class="profile-view">
    <!-- User Info -->
    <section class="user-info">
      <UserAvatar 
        :user="currentUser" 
        size="large"
        editable
        @edit="editAvatar"
      />
      <h1>{{ currentUser.displayName }}</h1>
      <p class="user-level">Nível {{ currentUser.level }} - {{ currentUser.title }}</p>
    </section>
    
    <!-- Progress Overview -->
    <section class="progress-overview">
      <ProgressRing 
        :progress="levelProgress" 
        :label="`${experienceToNext} XP para próximo nível`"
      />
    </section>
    
    <!-- Statistics -->
    <section class="statistics">
      <StatGrid :stats="userStatistics" />
    </section>
    
    <!-- Achievement Showcase -->
    <section class="achievement-showcase">
      <h2>Conquistas Recentes</h2>
      <AchievementList 
        :achievements="recentAchievements" 
        compact
      />
    </section>
  </div>
</template>
```

### SettingsView

```vue
<template>
  <div class="settings-view">
    <SettingsSection title="Preferências do Jogo">
      <ToggleOption 
        label="Sons" 
        v-model="soundEnabled"
        description="Efeitos sonoros do jogo"
      />
      <ToggleOption 
        label="Música" 
        v-model="musicEnabled"
        description="Música de fundo"
      />
      <SelectOption
        label="Velocidade das Animações"
        v-model="animationSpeed"
        :options="animationSpeedOptions"
      />
    </SettingsSection>
    
    <SettingsSection title="Aparência">
      <ToggleOption 
        label="Modo Escuro" 
        v-model="darkMode"
      />
      <SelectOption
        label="Tema das Peças"
        v-model="tileTheme"
        :options="tileThemeOptions"
      />
    </SettingsSection>
    
    <SettingsSection title="Conta">
      <ButtonOption 
        label="Gerenciar Perfil"
        @click="manageProfile"
      />
      <ButtonOption 
        label="Privacidade"
        @click="showPrivacy"
      />
    </SettingsSection>
  </div>
</template>
```

## 5. Integration with Existing Code

### App.vue Modifications

```vue
<template>
  <div id="app" :class="appClasses" :style="mobileStyles">
    <!-- Navigation Header (Desktop) -->
    <NavigationMenu 
      v-if="!isMobile" 
      variant="desktop"
      class="app-navigation"
    />
    
    <!-- Main Content Area -->
    <main class="app-content">
      <ViewContainer 
        :keep-alive-views="['game']"
        :transition-type="isMobile ? 'slide' : 'fade'"
      />
    </main>
    
    <!-- Bottom Navigation (Mobile) -->
    <NavigationMenu 
      v-if="isMobile" 
      variant="mobile"
      :visible="!navigationStore.isInGame || showNavInGame"
    />
  </div>
</template>

<script setup lang="ts">
import { useNavigationStore } from '@/stores/navigation.store';
import NavigationMenu from '@/components/navigation/NavigationMenu.vue';
import ViewContainer from '@/components/navigation/ViewContainer.vue';

const navigationStore = useNavigationStore();
const showNavInGame = ref(false);

// Handle game state preservation
watch(() => navigationStore.currentView, (newView, oldView) => {
  if (oldView === 'game' && newView !== 'game') {
    navigationStore.preserveGameState();
  }
});
</script>
```

### GameView Integration

```typescript
// In GameView.vue
const navigationStore = useNavigationStore();

// Preserve state when navigating away
onBeforeUnmount(() => {
  if (navigationStore.shouldPreserveGameState) {
    gameStore.saveCurrentState();
  }
});

// Restore state when returning
onMounted(() => {
  if (navigationStore.hasPreservedGameState) {
    gameStore.restoreState(navigationStore.gameStateSnapshot);
    navigationStore.clearGameStateSnapshot();
  }
});
```

## 6. Transition System

### Transition Styles

```scss
// Slide transitions (mobile)
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

// Slide backward
.slide-back-enter-from {
  transform: translateX(-100%);
}

.slide-back-leave-to {
  transform: translateX(100%);
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
  transform: scale(0.9);
  opacity: 0;
}

.scale-leave-to {
  transform: scale(1.1);
  opacity: 0;
}
```

## 7. Route Guards and Middleware

```typescript
// Navigation guards
navigationStore.$onAction(({ name, args, after }) => {
  if (name === 'navigateTo') {
    // Pre-navigation checks
    const [targetView] = args;
    
    // Check if game needs saving
    if (navigationStore.isInGame && targetView !== 'game') {
      if (gameStore.hasUnsavedProgress) {
        // Show confirmation dialog
        return showConfirmDialog({
          title: 'Salvar Progresso?',
          message: 'Você tem um jogo em andamento. Deseja salvar?',
          onConfirm: () => gameStore.saveGame(),
          onCancel: () => navigationStore.clearGameStateSnapshot()
        });
      }
    }
    
    // Analytics tracking
    after(() => {
      trackNavigation(targetView);
    });
  }
});
```

## 8. Performance Optimizations

### View Preloading

```typescript
// Preload critical views
const preloadViews = async () => {
  const criticalViews = ['home', 'game'];
  
  for (const view of criticalViews) {
    if (viewComponents[view]) {
      viewComponents[view]().catch(() => {
        console.warn(`Failed to preload ${view} view`);
      });
    }
  }
};

// Prefetch on idle
if ('requestIdleCallback' in window) {
  requestIdleCallback(preloadViews);
} else {
  setTimeout(preloadViews, 1000);
}
```

### Memory Management

```typescript
// Clean up unused views
const cleanupInactiveViews = () => {
  const activeViews = ['game', navigationStore.currentView];
  const viewCache = new Set(activeViews);
  
  // Clear component instances not in cache
  Object.keys(viewComponents).forEach(view => {
    if (!viewCache.has(view)) {
      // Vue will handle cleanup on next GC
      delete viewComponents[view].__instance;
    }
  });
};
```

## 9. Accessibility Features

- **ARIA Labels**: All navigation items have descriptive labels
- **Keyboard Navigation**: Full keyboard support with Tab/Arrow keys
- **Focus Management**: Proper focus restoration after navigation
- **Screen Reader Support**: Announces view changes
- **High Contrast Mode**: Respects system preferences

## 10. Testing Strategy

### Unit Tests

```typescript
describe('NavigationStore', () => {
  it('should preserve game state when navigating away', () => {
    const store = useNavigationStore();
    store.currentView = 'game';
    store.navigateTo('home');
    
    expect(store.gameStateSnapshot).toBeDefined();
  });
  
  it('should maintain navigation history', () => {
    const store = useNavigationStore();
    store.navigateTo('home');
    store.navigateTo('profile');
    store.navigateTo('settings');
    
    expect(store.navigationHistory).toHaveLength(3);
    expect(store.canGoBack).toBe(true);
  });
});
```

### E2E Tests

```typescript
describe('Navigation Flow', () => {
  it('should navigate between views smoothly', () => {
    cy.visit('/');
    cy.get('[data-nav="profile"]').click();
    cy.url().should('include', '#profile');
    cy.get('.profile-view').should('be.visible');
  });
});
```

## Architecture Benefits

1. **Modularity**: Each component has a single responsibility
2. **Extensibility**: Easy to add new views and navigation items
3. **Performance**: Lazy loading and smart caching
4. **User Experience**: Smooth transitions and state preservation
5. **Maintainability**: Clear separation of concerns
6. **Accessibility**: Built-in a11y support