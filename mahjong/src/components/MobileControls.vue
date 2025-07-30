<template>
  <div 
    class="mobile-controls" 
    :class="{ 'landscape-mode': !isPortrait }"
    :style="mobileStyles"
  >
    <!-- Header Mobile -->
    <header class="mobile-header">
      <button 
        class="control-button menu-button"
        data-test="menu-button"
        @click="$emit('menu')"
        aria-label="Menu"
      >
        ≡
      </button>
      
      <div class="game-info">
        <span class="score">Pontos: {{ score }}</span>
        <span class="timer">⏱ {{ formattedTime }}</span>
      </div>
      
      <button 
        class="control-button pause-button"
        data-test="pause-button"
        @click="togglePause"
        :aria-label="isPaused ? 'Continuar' : 'Pausar'"
      >
        {{ isPaused ? '▶' : '⏸' }}
      </button>
    </header>

    <!-- Botões de Ação Principais -->
    <div class="action-buttons">
      <button 
        v-for="action in mainActions"
        :key="action.id"
        class="control-button action-button"
        :class="{ 'loading': action.loading, 'disabled': action.disabled }"
        :data-test="`${action.id}-button`"
        :disabled="action.disabled"
        @click="handleAction(action)"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
        :aria-label="action.label"
      >
        <span class="icon">{{ action.icon }}</span>
        <span class="label">{{ action.text }}</span>
        <span v-if="action.loading" class="loading-indicator">⟳</span>
      </button>
    </div>

    <!-- Barra de Ações Flutuante -->
    <div 
      class="floating-actions"
      :class="{ 'hidden': hideFloatingBar }"
      ref="floatingBar"
    >
      <button
        v-for="action in quickActions"
        :key="action.id"
        class="floating-button"
        :data-test="`${action.id}-button`"
        @click="handleQuickAction(action)"
        :aria-label="action.label"
      >
        {{ action.icon }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMobileUI } from '../composables/useMobileUI';
// import { useGameStore } from '../stores/game.store';

interface Props {
  score?: number;
  time?: number;
  isPaused?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  canHint?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  score: 0,
  time: 0,
  isPaused: false,
  canUndo: true,
  canRedo: false,
  canHint: true
});

const emit = defineEmits<{
  menu: [];
  pause: [];
  resume: [];
  hint: [];
  undo: [];
  redo: [];
  reset: [];
}>();

// const gameStore = useGameStore(); // Not used
const { 
  isPortrait, 
  mobileStyles, 
  vibrate,
  addTouchFeedback 
} = useMobileUI();

// Estado local
const hideFloatingBar = ref(false);
const lastScrollY = ref(0);

// Ações principais
const mainActions = computed(() => [
  {
    id: 'hint',
    icon: '💡',
    text: 'Dica',
    label: 'Mostrar dica',
    disabled: !props.canHint,
    loading: false
  },
  {
    id: 'undo',
    icon: '↶',
    text: 'Desfazer',
    label: 'Desfazer jogada',
    disabled: !props.canUndo,
    loading: false
  },
  {
    id: 'redo',
    icon: '↷',
    text: 'Refazer',
    label: 'Refazer jogada',
    disabled: !props.canRedo,
    loading: false
  },
  {
    id: 'reset',
    icon: '🔄',
    text: 'Reiniciar',
    label: 'Reiniciar jogo',
    disabled: false,
    loading: false
  }
]);

// Ações rápidas na barra flutuante
const quickActions = [
  { id: 'hint', icon: '💡', label: 'Dica rápida' },
  { id: 'undo', icon: '↶', label: 'Desfazer rápido' },
  { id: 'pause', icon: '⏸', label: 'Pausar' }
];

// Tempo formatado
const formattedTime = computed(() => {
  const minutes = Math.floor(props.time / 60);
  const seconds = props.time % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Handlers
const togglePause = () => {
  if (props.isPaused) {
    emit('resume');
  } else {
    emit('pause');
  }
  vibrate(10);
};

const handleAction = async (action: any) => {
  if (action.disabled || action.loading) return;
  
  action.loading = true;
  vibrate(10);
  
  try {
    emit(action.id as any);
    
    // Simular loading por um breve momento
    await new Promise(resolve => setTimeout(resolve, 300));
  } finally {
    action.loading = false;
  }
};

const handleQuickAction = (action: any) => {
  vibrate(5);
  
  if (action.id === 'pause') {
    togglePause();
  } else {
    emit(action.id as any);
  }
};

// Touch feedback
const onTouchStart = (event: TouchEvent) => {
  const target = event.currentTarget as HTMLElement;
  target.classList.add('active');
};

const onTouchEnd = (event: TouchEvent) => {
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('active');
};

// Auto-hide da barra flutuante ao fazer scroll
const handleScroll = () => {
  const currentScrollY = window.scrollY;
  
  if (currentScrollY > lastScrollY.value && currentScrollY > 100) {
    hideFloatingBar.value = true;
  } else {
    hideFloatingBar.value = false;
  }
  
  lastScrollY.value = currentScrollY;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Adicionar feedback tátil aos botões
  const buttons = document.querySelectorAll('.control-button, .floating-button');
  buttons.forEach(button => {
    addTouchFeedback(button as HTMLElement);
  });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style lang="scss" scoped>
.mobile-controls {
  --button-size: calc(44px * var(--ui-scale, 1));
  --spacing: calc(8px * var(--ui-scale, 1));
  --header-height: 60px;
  
  position: relative;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  &.landscape-mode {
    .mobile-header {
      height: 50px;
    }
    
    .action-buttons {
      flex-direction: row;
      justify-content: center;
      gap: var(--spacing);
    }
  }
}

.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: linear-gradient(to bottom, #2c3e50, #34495e);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing);
  padding-top: var(--safe-area-top, 0);
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.control-button {
  min-width: var(--button-size);
  min-height: var(--button-size);
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  font-size: calc(20px * var(--ui-scale, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    z-index: -1;
  }
  
  &:active,
  &.active {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 0.2);
  }
  
  &:disabled,
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.loading {
    pointer-events: none;
    
    .loading-indicator {
      position: absolute;
      animation: spin 1s linear infinite;
    }
  }
}

.game-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: calc(14px * var(--ui-scale, 1));
  gap: 2px;
  
  .score {
    font-weight: 600;
  }
  
  .timer {
    opacity: 0.9;
  }
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: calc(12px * var(--ui-scale, 1));
  padding: calc(var(--header-height) + 20px) var(--spacing) 80px;
  padding-top: calc(var(--header-height) + var(--safe-area-top, 0) + 20px);
}

.action-button {
  width: 100%;
  height: calc(56px * var(--ui-scale, 1));
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  font-size: calc(16px * var(--ui-scale, 1));
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  .icon {
    font-size: calc(24px * var(--ui-scale, 1));
  }
  
  .label {
    font-size: calc(16px * var(--ui-scale, 1));
  }
  
  &:active {
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.4);
  }
}

.floating-actions {
  position: fixed;
  bottom: var(--safe-area-bottom, 20px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(44, 62, 80, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: 8px 16px;
  display: flex;
  gap: 16px;
  transition: all 0.3s ease;
  z-index: 99;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  
  &.hidden {
    transform: translateX(-50%) translateY(100px);
  }
}

.floating-button {
  width: calc(48px * var(--ui-scale, 1));
  height: calc(48px * var(--ui-scale, 1));
  border: none;
  background: transparent;
  color: white;
  font-size: calc(24px * var(--ui-scale, 1));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:active {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Modo escuro
@media (prefers-color-scheme: dark) {
  .mobile-controls {
    .mobile-header {
      background: linear-gradient(to bottom, #1a1a1a, #2d2d2d);
    }
    
    .action-button {
      background: linear-gradient(135deg, #2c3e50, #34495e);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    }
  }
}

// Suporte a telas muito pequenas
@media (max-width: 320px) {
  .mobile-controls {
    --button-size: 40px;
    
    .action-button {
      height: 48px;
      
      .label {
        font-size: 14px;
      }
    }
  }
}
</style>

<script lang="ts">
export default {
  name: 'MobileControls'
}
</script>