<template>
  <nav 
    class="navigation-menu" 
    :class="[variant, { 'hidden': !isVisible }]"
    :aria-label="variant === 'mobile' ? 'Navegação principal' : 'Menu de navegação'"
  >
    <!-- Mobile Bottom Navigation -->
    <div v-if="variant === 'mobile'" class="nav-container mobile">
      <button
        v-for="item in mobileNavItems"
        :key="item.id"
        class="nav-item"
        :class="{ 
          'active': isActive(item.id),
          'primary': item.primary 
        }"
        @click="navigate(item.id)"
        :aria-label="item.label"
        :aria-current="isActive(item.id) ? 'page' : undefined"
      >
        <div class="nav-icon">
          <component :is="getIcon(item.id)" />
          <span v-if="item.badge" class="badge">{{ item.badge }}</span>
        </div>
        <span class="nav-label">{{ item.label }}</span>
      </button>
      
      <!-- Gesture indicator for iOS -->
      <div class="gesture-indicator" />
    </div>
    
    <!-- Desktop Header Navigation -->
    <div v-else class="nav-container desktop">
      <div class="nav-group left">
        <button 
          v-if="navigationStore.canGoBack" 
          class="nav-back"
          @click="goBack"
          aria-label="Voltar"
        >
          <ArrowLeftIcon />
        </button>
        
        <div class="app-logo">
          <img src="/icons/icon-192x192.png" alt="Mahjong Logo" />
          <span>Mahjong</span>
        </div>
      </div>
      
      <div class="nav-group center">
        <TransitionGroup name="nav-fade">
          <button
            v-for="item in desktopNavItems"
            :key="item.id"
            class="nav-item"
            :class="{ 'active': isActive(item.id) }"
            @click="navigate(item.id)"
            :aria-current="isActive(item.id) ? 'page' : undefined"
          >
            <component :is="getIcon(item.id)" />
            <span>{{ item.label }}</span>
          </button>
        </TransitionGroup>
      </div>
      
      <div class="nav-group right">
        <button 
          class="nav-item icon-only"
          :class="{ 'active': isActive('settings') }"
          @click="navigate('settings')"
          aria-label="Configurações"
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useNavigationStore } from '@/stores/navigation.store';
import type { ViewType } from '@/stores/navigation.store';

// Icons
import HomeIcon from '@/components/icons/HomeIcon.vue';
import GameIcon from '@/components/icons/GameIcon.vue';
import TrophyIcon from '@/components/icons/TrophyIcon.vue';
import StoreIcon from '@/components/icons/StoreIcon.vue';
import UserIcon from '@/components/icons/UserIcon.vue';
import SettingsIcon from '@/components/icons/SettingsIcon.vue';
import ArrowLeftIcon from '@/components/icons/ArrowLeftIcon.vue';

interface Props {
  variant?: 'mobile' | 'desktop';
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'mobile',
  visible: true
});

const navigationStore = useNavigationStore();

// Navigation items configuration
interface NavItem {
  id: ViewType;
  label: string;
  order: number;
  primary?: boolean;
  badge?: string | number;
}

const mobileNavItems: NavItem[] = [
  { id: 'home', label: 'Início', order: 1 },
  { id: 'achievements', label: 'Conquistas', order: 2 },
  { id: 'game', label: 'Jogar', order: 3, primary: true },
  { id: 'store', label: 'Loja', order: 4 },
  { id: 'profile', label: 'Perfil', order: 5 }
];

const desktopNavItems: NavItem[] = [
  { id: 'home', label: 'Início', order: 1 },
  { id: 'game', label: 'Jogar', order: 2 },
  { id: 'achievements', label: 'Conquistas', order: 3 },
  { id: 'store', label: 'Loja', order: 4 },
  { id: 'profile', label: 'Perfil', order: 5 }
];

// Icon mapping
const iconMap = {
  home: HomeIcon,
  game: GameIcon,
  achievements: TrophyIcon,
  store: StoreIcon,
  profile: UserIcon,
  settings: SettingsIcon
};

// Computed
const isVisible = computed(() => {
  if (props.visible !== undefined) {
    return props.visible;
  }
  return navigationStore.isBottomNavVisible;
});

// Methods
function isActive(viewId: ViewType): boolean {
  return navigationStore.currentView === viewId;
}

function navigate(viewId: ViewType): void {
  if (isActive(viewId)) return;
  
  navigationStore.navigateTo(viewId);
}

function goBack(): void {
  navigationStore.goBack();
}

function getIcon(viewId: ViewType) {
  return iconMap[viewId] || HomeIcon;
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.navigation-menu {
  --nav-height: 56px;
  --nav-bg: var(--bg-secondary);
  --nav-border: var(--border-color);
  --nav-item-active: var(--accent);
  --nav-item-inactive: var(--text-secondary);
}

// Mobile Bottom Navigation
.navigation-menu.mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--nav-bg);
  border-top: 1px solid var(--nav-border);
  padding-bottom: env(safe-area-inset-bottom);
  transition: transform 0.3s ease;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  
  &.hidden {
    transform: translateY(calc(100% + env(safe-area-inset-bottom)));
  }
  
  .nav-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: var(--nav-height);
    padding: 0 8px;
  }
  
  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: none;
    border: none;
    color: var(--nav-item-inactive);
    position: relative;
    cursor: pointer;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    
    &:active {
      transform: scale(0.95);
    }
    
    &.active {
      color: var(--nav-item-active);
      
      .nav-icon {
        transform: translateY(-2px);
      }
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 20%;
        right: 20%;
        height: 3px;
        background: var(--nav-item-active);
        border-radius: 0 0 3px 3px;
        animation: slideDown 0.2s ease;
      }
    }
    
    &.primary:not(.active) {
      .nav-icon {
        background: var(--accent);
        color: white;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
      }
    }
  }
  
  .nav-icon {
    position: relative;
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
    transition: transform 0.2s ease;
    
    svg {
      width: 100%;
      height: 100%;
    }
    
    .badge {
      position: absolute;
      top: -4px;
      right: -8px;
      background: var(--danger);
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 2px 4px;
      border-radius: 10px;
      min-width: 16px;
      text-align: center;
    }
  }
  
  .nav-label {
    font-size: 11px;
    font-weight: 500;
    transition: opacity 0.2s ease;
  }
  
  .gesture-indicator {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 134px;
    height: 5px;
    background: var(--nav-item-inactive);
    border-radius: 100px;
    opacity: 0.3;
  }
}

// Desktop Header Navigation
.navigation-menu.desktop {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--nav-border);
  z-index: 100;
  backdrop-filter: blur(10px);
  
  .nav-container {
    display: flex;
    align-items: center;
    height: 64px;
    padding: 0 24px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .nav-group {
    display: flex;
    align-items: center;
    gap: 16px;
    
    &.left {
      flex: 0 0 auto;
    }
    
    &.center {
      flex: 1 1 auto;
      justify-content: center;
    }
    
    &.right {
      flex: 0 0 auto;
    }
  }
  
  .app-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 18px;
    color: var(--text-primary);
    
    img {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }
  }
  
  .nav-back {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--bg-hover);
    }
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: none;
    border: none;
    color: var(--nav-item-inactive);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    position: relative;
    
    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
    
    &.active {
      color: var(--nav-item-active);
      background: rgba(66, 184, 131, 0.1);
    }
    
    &.icon-only {
      padding: 8px;
      
      svg {
        width: 20px;
        height: 20px;
      }
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
}

// Animations
@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.nav-fade-enter-active,
.nav-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-fade-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.nav-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

// Dark theme adjustments
.theme-dark {
  .navigation-menu {
    --nav-bg: #1a1a1a;
    --nav-border: #333;
    --nav-item-inactive: #888;
  }
}

// Tablet adjustments
@media (min-width: 768px) and (max-width: 1024px) {
  .navigation-menu.mobile {
    .nav-container {
      max-width: 600px;
      margin: 0 auto;
    }
  }
}

// Landscape mobile adjustments
@media (max-width: 768px) and (orientation: landscape) {
  .navigation-menu.mobile {
    --nav-height: 48px;
    
    .nav-label {
      display: none;
    }
    
    .nav-icon {
      margin-bottom: 0;
    }
  }
}
</style>