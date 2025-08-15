<template>
  <div class="tile-container">
    <!-- Tile bottom layer -->
    <div
      v-if="tile.active && (tile.active || isSelected)"
      class="tile-bottom"
      :style="tileBottomStyle"
    ></div>
    
    <!-- Tile side bottom -->
    <div
      v-if="tile.active && (tile.active || isSelected)"
      class="tile-side-bottom"
      :style="tileSideBottomStyle"
    ></div>
    
    <!-- Tile side left -->
    <div
      v-if="tile.active && (tile.active || isSelected)"
      class="tile-side-left"
      :style="tileSideLeftStyle"
    ></div>
    
    <!-- Main tile face -->
    <div
      v-if="tile.active && (tile.active || isSelected)"
      class="tile optimized"
      :class="tileClasses"
      :style="tileStyle"
      :aria-label="tileAriaLabel"
      :aria-pressed="isSelected ? 'true' : 'false'"
      :tabindex="isFree ? 0 : -1"
      role="button"
      @click.stop="handleClick"
      @keydown.enter.stop="handleClick"
      @keydown.space.stop.prevent="handleClick"
    >
      <!-- Optimized hint display -->
      <div 
        v-if="showHint"
        class="dragon-spirit-hint optimized-hint"
      >
        <div class="dragon-orb">
          <div class="orb-core"></div>
          <div class="orb-glow"></div>
        </div>
        
        <!-- Reduced particles for performance -->
        <div class="spirit-particles">
          <div 
            class="particle" 
            v-for="n in particleCount" 
            :key="n" 
            :style="`--particle-delay: ${n * 0.5}s`"
          ></div>
        </div>
        
        <div class="energy-ribbon ribbon-1"></div>
        <div class="energy-ribbon ribbon-2"></div>
      </div>
      
      <!-- Optimized edge gradients -->
      <div class="tile-edge-gradient-h optimized-gradient"></div>
      <div class="tile-edge-gradient-v optimized-gradient"></div>
      
      <!-- Tile content optimized -->
      <div class="tile-content">
        <div 
          class="secondary-character"
          :style="secondaryCharacterStyle"
        >
          {{ tile.type?.getSecondaryCharacter() }}
        </div>

        <div 
          class="primary-character-wrap"
          :style="primaryCharacterWrapStyle"
        >
          <span 
            class="primary-character"
            :style="primaryCharacterStyle"
            v-html="tile.type?.getPrimaryCharacter()"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { MjTile } from '@/models/tile.model';
import { useGamePerformance } from '@/composables/useGamePerformance';

interface Props {
  tile: MjTile;
  isSelected: boolean;
  isFree: boolean;
  showHint: boolean;
  elementWidth: number;
  elementHeight: number;
  depthSize: number;
  shiftX: number;
  shiftY: number;
  fontSizePrimary: number;
  fontSizeSecondary: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  tileClick: [tile: MjTile];
}>();

const { metrics } = useGamePerformance();

// Performance-aware particle count
const particleCount = computed(() => {
  if (metrics.value.fps < 30) return 2;
  if (metrics.value.fps < 45) return 4;
  return 6;
});

// Memoized position calculations
const basePosition = computed(() => ({
  left: props.tile.x * props.elementWidth + props.tile.z * props.shiftX + props.tile.chaosOffsetX,
  top: props.tile.y * props.elementHeight - props.tile.z * props.shiftY + props.tile.chaosOffsetY
}));

const tileBottomStyle = computed(() => {
  const { left, top } = basePosition.value;
  return {
    position: 'absolute' as const,
    top: `${top - props.shiftX * 2 + props.depthSize}px`,
    left: `${left + props.shiftY * 2 - props.depthSize}px`,
    width: `${props.elementWidth * 2 - 4}px`,
    height: `${props.elementHeight * 2 - 4}px`,
    zIndex: props.tile.z * 1000 + 0,
    transform: `rotate3d(0, 0, 1, ${props.tile.chaosRotation}deg) translateZ(0)`,
    '--depth-size': `${props.depthSize}px`
  };
});

const tileSideBottomStyle = computed(() => {
  const { left, top } = basePosition.value;
  return {
    position: 'absolute' as const,
    top: `${top - props.shiftX * 2 + props.elementHeight * 2 - 4}px`,
    left: `${left + props.shiftY * 2 + props.depthSize * 0.7}px`,
    width: `${props.elementWidth * 2 - 4 - props.depthSize * 0.7}px`,
    height: `${props.depthSize}px`,
    zIndex: props.tile.z * 1000 + 1,
    transform: `skewX(-45deg) translateX(${-props.depthSize * 0.3}px) translateZ(0)`,
    transformOrigin: 'top left',
    '--depth-size': `${props.depthSize}px`
  };
});

const tileSideLeftStyle = computed(() => {
  const { left, top } = basePosition.value;
  const tileTop = top - props.shiftX * 2;
  const tileLeft = left + props.shiftY * 2;
  const tileHeight = props.elementHeight * 2 - 4;
  
  return {
    position: 'absolute' as const,
    top: `${tileTop + tileHeight * 0.11 + 1}px`,
    left: `${tileLeft - props.depthSize}px`,
    width: `${props.depthSize}px`,
    height: `${tileHeight * 0.89}px`,
    zIndex: props.tile.z * 1000 + 2,
    transform: `skewY(-45deg) translateZ(0)`,
    transformOrigin: 'top left',
    '--depth-size': `${props.depthSize}px`
  };
});

const tileStyle = computed(() => {
  const { left, top } = basePosition.value;
  return {
    position: 'absolute' as const,
    top: `${top - props.shiftX * 2}px`,
    left: `${left + props.shiftY * 2}px`,
    width: `${props.elementWidth * 2 - 4}px`,
    height: `${props.elementHeight * 2 - 4}px`,
    color: props.isSelected ? '#5C5749' : props.tile.type?.getColor(),
    textShadow: `0 0 ${Math.floor(props.elementWidth * 0.8)}px ${props.tile.type?.getColor()}`,
    zIndex: props.tile.z * 1000 + 3,
    transform: `rotate3d(0, 0, 1, ${props.tile.chaosRotation}deg) translateZ(0)`,
    '--depth-size': `${props.depthSize}px`
  };
});

const tileClasses = computed(() => ({
  selected: props.isSelected,
  [`layer${props.tile.z}`]: props.tile.z <= 5,
  free: props.isFree && !props.isSelected,
  locked: !props.isFree && props.tile.active,
  'hint-active': props.showHint,
  'performance-optimized': metrics.value.fps < 45
}));

// Optimized font styles
const secondaryCharacterStyle = computed(() => ({
  fontSize: `${props.fontSizeSecondary}px`,
  lineHeight: `${props.fontSizeSecondary - 5}px`
}));

const primaryCharacterWrapStyle = computed(() => {
  const isDragonSpecial = props.tile.type?.group === 'dragon' && 
    props.tile.type?.getPrimaryCharacter() === '龙';
  
  return isDragonSpecial ? {
    paddingRight: `${props.fontSizePrimary * 0.075}px`
  } : {};
});

const primaryCharacterStyle = computed(() => {
  const isDragonSpecial = props.tile.type?.group === 'dragon' && 
    props.tile.type?.getPrimaryCharacter() === '龙';
  
  const fontSize = isDragonSpecial ? props.fontSizePrimary / 2 : props.fontSizePrimary;
  
  return {
    fontSize: `${fontSize}px`,
    lineHeight: `${fontSize}px`
  };
});

// Optimized aria label
const tileAriaLabel = computed(() => {
  if (!props.tile.type) return '';
  
  const typeGroup = props.tile.type.group;
  const typeIndex = props.tile.type.index;
  
  const typeLabels: Record<string, string[]> = {
    character: Array.from({ length: 9 }, (_, i) => `Caractere chinês ${i + 1}`),
    bamboo: Array.from({ length: 9 }, (_, i) => `Bambu ${i + 1}`),
    circle: Array.from({ length: 9 }, (_, i) => `Círculo ${i + 1}`),
    dragon: ['Dragão Vermelho', 'Dragão Verde', 'Dragão Branco'],
    wind: ['Vento Leste', 'Vento Sul', 'Vento Oeste', 'Vento Norte'],
    flower: Array.from({ length: 4 }, (_, i) => `Flor ${i + 1}`),
    season: ['Primavera', 'Verão', 'Outono', 'Inverno']
  };
  
  const label = typeLabels[typeGroup]?.[typeIndex] || `Peça ${typeGroup} ${typeIndex + 1}`;
  const position = `, camada ${props.tile.z + 1}`;
  const status = props.isSelected ? ', selecionada' : 
                 props.isFree ? ', livre para jogar' : ', bloqueada';
  
  return label + position + status;
});

// Optimized click handler
const handleClick = () => {
  if (props.isFree && !props.tile.isLoading) {
    emit('tileClick', props.tile);
  }
};
</script>

<style lang="scss" scoped>
// Base tile styles optimized for performance
.tile-container {
  // Use contain for better performance
  contain: layout style;
}

.tile-bottom {
  border-radius: 10%;
  background: linear-gradient(145deg, #B5A57C 0%, #A59572 40%, #958568 100%);
  box-shadow: 
    inset 0 -2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(0, 0, 0, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.2);
  transform-origin: center center;
  transition: transform 0.15s ease-out;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  isolation: isolate;
  will-change: transform;
  backface-visibility: hidden;
}

.tile-side-bottom {
  background: linear-gradient(to bottom, 
    #D9C89E 0%, 
    #C5B58C 30%, 
    #B5A57C 60%, 
    #A59572 100%);
  border-radius: 0 2px 2px 2px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 -1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.1s ease-out;
  pointer-events: none;
  isolation: isolate;
  will-change: transform;
  backface-visibility: hidden;
}

.tile-side-left {
  background: linear-gradient(to right, 
    #A59572 0%, 
    #B5A57C 40%, 
    #C5B58C 70%, 
    #D9C89E 100%);
  border-radius: 2px 0 0 2px;
  box-shadow: 
    -1px 0 3px rgba(0, 0, 0, 0.3),
    inset 2px 0 2px rgba(0, 0, 0, 0.1);
  transition: all 0.1s ease-out;
  pointer-events: none;
  isolation: isolate;
  will-change: transform;
  backface-visibility: hidden;
}

.tile {
  font-family: FreeSerifNF;
  overflow: visible;
  transform-origin: 50% 50%;
  border-radius: 10%;
  cursor: default;
  background: linear-gradient(145deg, #FFF5D4 0%, #FEF2C7 40%, #F5E6B8 100%);
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.1s ease-out;
  will-change: transform, filter;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;

  // Performance optimizations
  &.optimized {
    contain: layout style paint;
    isolation: isolate;
  }

  &.performance-optimized {
    // Reduce effects when FPS is low
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.05s ease-out;
    
    .dragon-spirit-hint {
      display: none !important;
    }
  }

  &.free {
    cursor: pointer;
    
    &:hover:not(.performance-optimized) {
      filter: brightness(1.05);
      box-shadow: 
        0 6px 12px rgba(0, 0, 0, 0.2),
        0 3px 6px rgba(0, 0, 0, 0.15);
    }

    &.performance-optimized:hover {
      filter: brightness(1.02);
    }
  }

  &.locked {
    cursor: not-allowed;
    opacity: 0.95;
    
    &:hover {
      filter: brightness(0.98);
    }
  }

  // Layer colors optimized
  &.layer0 { background: linear-gradient(145deg, #FFF5D4 0%, #FEF2C7 40%, #F5E6B8 100%); }
  &.layer1 { background: linear-gradient(145deg, #D5EED6 0%, #BEDDBF 40%, #A5CCA6 100%); }
  &.layer2 { background: linear-gradient(145deg, #FFF0C4 0%, #FFE1A2 40%, #F5D08A 100%); }
  &.layer3 { background: linear-gradient(145deg, #FFF5D4 0%, #FEF2C7 40%, #F5E6B8 100%); }
  &.layer4 { background: linear-gradient(145deg, #FFF5D4 0%, #FEF2C7 40%, #F5E6B8 100%); }
  &.layer5 { background: linear-gradient(145deg, #FFB885 0%, #FEAA6E 40%, #F59956 100%); }

  &.selected {
    background: linear-gradient(145deg, #FFB885 0%, #FEAA6E 40%, #F59956 100%);
    box-shadow: 
      0 8px 16px rgba(0, 0, 0, 0.25),
      0 4px 8px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.6),
      inset 0 -1px 0 rgba(0, 0, 0, 0.15),
      0 0 15px rgba(254, 170, 110, 0.3);
    filter: brightness(1.05);
    cursor: pointer;
  }
}

// Optimized gradients
.optimized-gradient {
  border-radius: 10%;
  pointer-events: none;
  
  &.tile-edge-gradient-h {
    background: linear-gradient(to right,
      rgba(181, 165, 124, 0.2) 0%,
      rgba(181, 165, 124, 0.1) 3%,
      transparent 10%,
      transparent 90%,
      rgba(181, 165, 124, 0.1) 97%,
      rgba(181, 165, 124, 0.2) 100%);
  }

  &.tile-edge-gradient-v {
    background: linear-gradient(to bottom,
      rgba(181, 165, 124, 0.2) 0%,
      rgba(181, 165, 124, 0.1) 3%,
      transparent 10%,
      transparent 90%,
      rgba(181, 165, 124, 0.1) 97%,
      rgba(181, 165, 124, 0.2) 100%);
  }
}

.tile-content {
  margin: 5px;
  padding: 0px;
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100% - 10px);

  .secondary-character {
    filter: drop-shadow(0.5px 0.5px 0.5px rgba(0, 0, 0, 0.15));
    text-align: left;
  }

  .primary-character-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;

    .primary-character {
      filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.2));
    }
  }
}

// Optimized hint effects
.optimized-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 100;
  
  // Performance optimization
  contain: layout style;
  will-change: opacity;
}

.dragon-orb {
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: dragon-float 2s ease-in-out infinite alternate;
}

.orb-core {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 30%, 
    rgba(255, 228, 181, 0.4), 
    rgba(255, 215, 0, 0.4), 
    rgba(255, 99, 71, 0.4));
  border-radius: 50%;
  opacity: 0.7;
  animation: orb-pulse 1.2s ease-in-out infinite;
}

.orb-glow {
  position: absolute;
  top: -6px;
  left: -6px;
  width: 28px;
  height: 28px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: orb-glow-pulse 1.2s ease-in-out infinite;
}

.spirit-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #FFD700;
  border-radius: 50%;
  box-shadow: 0 0 4px #FFD700;
  opacity: 0;
  animation: particle-float 2.5s ease-in-out infinite;
  animation-delay: var(--particle-delay);
}

.particle:nth-child(1) { top: 15%; left: 25%; }
.particle:nth-child(2) { top: 25%; right: 20%; }
.particle:nth-child(3) { bottom: 20%; left: 15%; }
.particle:nth-child(4) { bottom: 25%; right: 25%; }
.particle:nth-child(5) { top: 50%; left: 10%; }
.particle:nth-child(6) { top: 50%; right: 10%; }

.energy-ribbon {
  position: absolute;
  width: 110%;
  height: 110%;
  top: -5%;
  left: -5%;
  border: 1px solid transparent;
  border-radius: 15%;
  opacity: 0.5;
}

.ribbon-1 {
  border-image: linear-gradient(45deg, transparent, #FFD700, #FF6347, transparent) 1;
  animation: ribbon-rotate 3s linear infinite;
}

.ribbon-2 {
  border-image: linear-gradient(-45deg, transparent, #FF6347, #FFD700, transparent) 1;
  animation: ribbon-rotate 3s linear infinite reverse;
  animation-delay: 1.5s;
}

// Optimized animations
@keyframes dragon-float {
  0% { filter: brightness(1); }
  100% { filter: brightness(1.2); }
}

@keyframes orb-pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
}

@keyframes orb-glow-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.2); }
}

@keyframes particle-float {
  0% { opacity: 0; transform: translateY(8px) scale(0.8); }
  30% { opacity: 1; transform: translateY(-3px) scale(1); }
  70% { opacity: 1; transform: translateY(-15px) scale(1); }
  100% { opacity: 0; transform: translateY(-25px) scale(0.8); }
}

@keyframes ribbon-rotate {
  0% { transform: rotate(0deg) scale(1); opacity: 0.3; }
  50% { transform: rotate(180deg) scale(1.05); opacity: 0.6; }
  100% { transform: rotate(360deg) scale(1); opacity: 0.3; }
}

// Performance mode optimizations
@media (prefers-reduced-motion: reduce) {
  .tile.optimized {
    .dragon-spirit-hint,
    .dragon-orb,
    .spirit-particles,
    .energy-ribbon {
      animation: none !important;
      display: none !important;
    }
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .tile {
    &:hover {
      // Disable hover effects on mobile
      filter: none !important;
      transform: none !important;
    }
  }
  
  .dragon-spirit-hint {
    // Reduce hint effects on mobile
    .spirit-particles {
      display: none;
    }
    
    .energy-ribbon {
      opacity: 0.3;
    }
  }
}
</style>