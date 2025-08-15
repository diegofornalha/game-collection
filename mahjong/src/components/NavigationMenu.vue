<template>
  <nav :class="menuClasses">
    <button 
      v-for="item in menuItems" 
      :key="item.view"
      @click="navigateTo(item.view)"
      :class="getItemClasses(item.view)"
      :aria-label="item.label"
    >
      <span class="menu-icon" v-html="item.icon"></span>
      <span class="menu-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useNavigationStore } from '../stores/navigation.store';
import type { ViewType } from '../stores/navigation.store';

interface Props {
  variant?: 'bottom' | 'inline';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'bottom'
});

const navigationStore = useNavigationStore();

const menuItems = [
  { 
    view: 'game' as ViewType, 
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
    label: 'Jogar' 
  },
  { 
    view: 'profile' as ViewType, 
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
    label: 'Perfil' 
  },
  { 
    view: 'achievements' as ViewType, 
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>',
    label: 'Atalhos' 
  },
  { 
    view: 'settings' as ViewType, 
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
    label: 'Configurações' 
  }
];

const menuClasses = computed(() => [
  'navigation-menu',
  `variant-${props.variant}`
]);

function navigateTo(view: ViewType) {
  navigationStore.navigateTo(view);
}

function getItemClasses(view: ViewType) {
  return [
    'menu-item',
    { active: navigationStore.currentView === view }
  ];
}
</script>

<style scoped>
.navigation-menu {
  display: flex;
  background: var(--surface-color);
  box-shadow: var(--shadow-lg);
}

/* Bottom navigation for mobile */
.variant-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  justify-content: space-around;
  z-index: 100;
  border-top: 1px solid var(--border-color);
}

/* Inline navigation for desktop */
.variant-inline {
  gap: 0.5rem;
  padding: 0;
  border-radius: 0;
  justify-content: center;
  background: transparent;
  box-shadow: none;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  min-width: 60px;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: transform 0.2s;
}

.menu-icon svg {
  width: 100%;
  height: 100%;
}

.menu-label {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Variant bottom specific */
.variant-bottom .menu-item {
  flex: 1;
  max-width: 80px;
}

.variant-bottom .menu-item:active {
  transform: scale(0.95);
}

/* Active state */
.menu-item.active {
  color: var(--primary-color);
}

.variant-bottom .menu-item.active .menu-icon {
  transform: translateY(-2px);
}

.variant-bottom .menu-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: var(--primary-color);
  border-radius: 0 0 3px 3px;
}

/* Inline active state */
.variant-inline .menu-item.active {
  background: var(--primary-color-light);
  color: var(--primary-color);
}

/* Hover effects for desktop */
@media (hover: hover) {
  .menu-item:hover {
    color: var(--primary-color);
    background: var(--hover-bg);
    border-radius: var(--border-radius-md);
  }
  
  .variant-inline .menu-item:hover .menu-icon {
    transform: translateY(-2px);
  }
}

/* Desktop adjustments */
@media (min-width: 768px) {
  .variant-bottom {
    display: none;
  }
  
  .variant-inline .menu-label {
    display: none; /* Ocultar labels no desktop inline */
  }
  
  .variant-inline .menu-item {
    padding: 0.5rem;
    border-radius: var(--border-radius-md);
    min-width: 36px;
    width: 36px;
    height: 36px;
  }
  
  .variant-inline .menu-icon {
    width: 20px;
    height: 20px;
  }
  
  .variant-inline .menu-icon svg {
    width: 100%;
    height: 100%;
  }
  
  .variant-inline .menu-item.active::before {
    display: none;
  }
}

/* Acessibilidade */
.menu-item:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Animação de entrada */
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.variant-bottom {
  animation: slideUp 0.3s ease-out;
}
</style>