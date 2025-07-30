<template>
  <div 
    class="mobile-tile-wrapper"
    :style="wrapperStyles"
  >
    <!-- Área de toque expandida -->
    <div class="touch-area" />
    
    <!-- Tile visual -->
    <div 
      ref="tileElement"
      class="tile"
      :class="tileClasses"
      :style="tileStyles"
      @click="handleClick"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
      @touchmove="handleTouchMove"
      :role="tile.isBlocked ? 'img' : 'button'"
      :tabindex="tile.isBlocked ? -1 : 0"
      :aria-label="`${tile.type?.group || 'tile'}${tile.isBlocked ? ' (bloqueada)' : ''}`"
      :aria-pressed="tile.isSelected"
      :aria-disabled="tile.isBlocked"
    >
      <!-- Glow de seleção -->
      <div v-if="tile.isSelected" class="selection-glow" />
      
      <!-- Pulse de dica -->
      <div v-if="tile.isHinted" class="hint-pulse" />
      
      <!-- Conteúdo do tile -->
      <div class="tile-content">
        <span class="tile-symbol">{{ getTileSymbol() }}</span>
      </div>
      
      <!-- Preview (long press) -->
      <div v-if="showPreview" class="tile-preview">
        <span>{{ tile.type?.group || 'unknown' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { MjTile } from '../models/tile.model';
import { useMobileUI } from '../composables/useMobileUI';

interface Props {
  tile: MjTile;
  isMobile?: boolean;
  scaleFactor?: number;
  isMatching?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: true,
  scaleFactor: 1,
  isMatching: false
});

const emit = defineEmits<{
  select: [tile: MjTile];
  preview: [tile: Tile];
}>();

const { vibrate, tileSize } = useMobileUI();

// Estado local
const tileElement = ref<HTMLElement>();
const showPreview = ref(false);
const touchStartPos = ref({ x: 0, y: 0 });
const touchStartTime = ref(0);
const isMoving = ref(false);
const longPressTimer = ref<number>();

// Classes do tile
const tileClasses = computed(() => ({
  'tile-enter': true,
  'touch-active': false,
  'selected': props.tile.isSelected,
  'hinted': props.tile.isHinted,
  'blocked': props.tile.isBlocked,
  'tile-match': props.isMatching,
  'tile-error': false,
  'mobile-optimized': props.isMobile
}));

// Estilos do wrapper (posicionamento)
const wrapperStyles = computed(() => {
  const baseSize = tileSize.value;
  const scale = props.scaleFactor;
  
  // Ajustar posição para layout mobile compacto
  const mobileOffsetX = props.isMobile ? 0.7 : 1; // Sobreposição horizontal
  const mobileOffsetY = props.isMobile ? 0.8 : 1; // Sobreposição vertical
  // const mobileOffsetZ = props.isMobile ? 15 : 20; // Menor offset em Z - Not used
  
  return {
    position: 'absolute' as const,
    transform: `translate3d(
      ${props.tile.x * baseSize * scale * mobileOffsetX}px,
      ${props.tile.y * baseSize * scale * mobileOffsetY}px,
      0
    )`,
    zIndex: props.tile.z * 10 + props.tile.y,
    width: `${baseSize}px`,
    height: `${baseSize * 1.3}px`,
    willChange: 'transform' as const
  };
});

// Estilos do tile (aparência)
const tileStyles = computed(() => {
  // const baseSize = tileSize.value; // Not used
  const depth = props.tile.z * (props.isMobile ? 2 : 3);
  
  return {
    width: '100%',
    height: '100%',
    transform: `translateZ(${depth}px)`,
    boxShadow: props.tile.isSelected 
      ? '0 0 20px rgba(52, 152, 219, 0.8), 0 4px 15px rgba(0, 0, 0, 0.3)'
      : `${depth}px ${depth}px ${depth * 2}px rgba(0, 0, 0, 0.2)`,
    opacity: props.tile.isBlocked ? 0.6 : 1
  };
});

// Obter símbolo do tile
const getTileSymbol = () => {
  if (!props.tile.type) return '?';
  
  // Use the primary character from the tile type
  return props.tile.type.getPrimaryCharacter();
};

// Handlers de toque
const handleTouchStart = (event: TouchEvent) => {
  if (props.tile.isBlocked) return;
  
  const touch = event.touches[0];
  touchStartPos.value = { x: touch.clientX, y: touch.clientY };
  touchStartTime.value = Date.now();
  isMoving.value = false;
  
  // Feedback tátil imediato
  if (!props.tile.isBlocked) {
    vibrate(10);
    (event.currentTarget as HTMLElement)?.classList.add('touch-active');
  }
  
  // Long press para preview
  longPressTimer.value = window.setTimeout(() => {
    if (!isMoving.value) {
      showPreview.value = true;
      vibrate(20);
    }
  }, 500);
};

const handleTouchMove = (event: TouchEvent) => {
  const touch = event.touches[0];
  const deltaX = Math.abs(touch.clientX - touchStartPos.value.x);
  const deltaY = Math.abs(touch.clientY - touchStartPos.value.y);
  
  // Se moveu mais de 10px, cancelar seleção
  if (deltaX > 10 || deltaY > 10) {
    isMoving.value = true;
    clearTimeout(longPressTimer.value);
    showPreview.value = false;
  }
};

const handleTouchEnd = (event: TouchEvent) => {
  clearTimeout(longPressTimer.value);
  showPreview.value = false;
  (event.currentTarget as HTMLElement)?.classList.remove('touch-active');
  
  // Se não moveu e foi um toque rápido, selecionar
  const touchDuration = Date.now() - touchStartTime.value;
  if (!isMoving.value && touchDuration < 500 && !props.tile.isBlocked) {
    handleClick();
  }
};

const handleClick = () => {
  if (props.tile.isBlocked) return;
  emit('select', props.tile);
  vibrate(10);
};

// Mostrar erro com animação
const showError = () => {
  tileElement.value?.classList.add('tile-error');
  vibrate([50, 100, 50]);
  
  setTimeout(() => {
    tileElement.value?.classList.remove('tile-error');
  }, 500);
};

// Animação de entrada
onMounted(() => {
  setTimeout(() => {
    tileElement.value?.classList.remove('tile-enter');
  }, 300);
});

// Expor método de erro para o parent
defineExpose({ showError });
</script>

<style lang="scss" scoped>
.mobile-tile-wrapper {
  pointer-events: none;
  transform-style: preserve-3d;
  
  .touch-area,
  .tile {
    pointer-events: auto;
  }
}

.touch-area {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  z-index: 1;
}

.tile {
  position: relative;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  border: 2px solid #d0d0d0;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  &.mobile-optimized {
    border-radius: 6px;
    border-width: 1px;
  }
  
  &.tile-enter {
    opacity: 0;
    transform: scale(0.8) translateZ(-20px);
  }
  
  &.touch-active,
  &:active {
    transform: scale(1.05) translateZ(5px) !important;
    filter: brightness(1.1);
  }
  
  &.selected {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    border-color: #2980b9;
    color: white;
    transform: scale(1.05) translateZ(10px);
  }
  
  &.hinted {
    animation: hint-pulse 1s ease-in-out infinite;
  }
  
  &.blocked {
    cursor: not-allowed;
    filter: grayscale(0.5);
    
    &:active {
      transform: none !important;
    }
  }
  
  &.tile-match {
    animation: match-animation 0.6s ease-out;
  }
  
  &.tile-error {
    animation: error-shake 0.5s ease-out;
  }
}

.tile-content {
  font-size: calc(20px * var(--ui-scale, 1));
  font-weight: bold;
  text-align: center;
  z-index: 2;
  
  .mobile-optimized & {
    font-size: calc(16px * var(--ui-scale, 1));
  }
}

.selection-glow {
  position: absolute;
  inset: -5px;
  background: radial-gradient(circle, rgba(52, 152, 219, 0.4) 0%, transparent 70%);
  animation: glow-pulse 2s ease-in-out infinite;
  pointer-events: none;
}

.hint-pulse {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(241, 196, 15, 0.3) 0%, transparent 70%);
  animation: hint-pulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

.tile-preview {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-10px);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }
}

@keyframes hint-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; transform: scale(1.1); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes match-animation {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.3) rotate(180deg); }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
}

@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

// Modo escuro
@media (prefers-color-scheme: dark) {
  .tile {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    border-color: #1a252f;
    color: #ecf0f1;
    
    &.selected {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      border-color: #c0392b;
    }
  }
}

// Otimizações para telas pequenas
@media (max-width: 375px) {
  .tile-content {
    font-size: 14px !important;
  }
}
</style>

<script lang="ts">
export default {
  name: 'MobileTile'
}
</script>