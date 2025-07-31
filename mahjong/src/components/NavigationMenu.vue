<template>
  <nav :class="menuClasses">
    <button 
      v-for="item in menuItems" 
      :key="item.view"
      @click="navigateTo(item.view)"
      :class="getItemClasses(item.view)"
      :aria-label="item.label"
    >
      <i :class="item.icon"></i>
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
  { view: 'home' as ViewType, icon: 'fas fa-home', label: 'Início' },
  { view: 'game' as ViewType, icon: 'fas fa-gamepad', label: 'Jogar' },
  { view: 'profile' as ViewType, icon: 'fas fa-user', label: 'Perfil' },
  { view: 'achievements' as ViewType, icon: 'fas fa-keyboard', label: 'Atalhos' },
  { view: 'settings' as ViewType, icon: 'fas fa-cog', label: 'Configurações' }
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

.menu-item i {
  font-size: 1.25rem;
  transition: transform 0.2s;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
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

.variant-bottom .menu-item.active i {
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
  
  .variant-inline .menu-item:hover i {
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
  
  .variant-inline .menu-item i {
    font-size: 1rem;
    width: 1rem;
    height: 1rem;
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