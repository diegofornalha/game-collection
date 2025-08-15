<template>
  <div 
    class="tile-field-outer"
    :style="{
      paddingLeft: `${paddingLeft}px`,
      paddingRight: `${paddingRight}px`,
      paddingTop: `${paddingTop}px`,
      paddingBottom: `${paddingBottom}px`
    }"
  >
    <div 
      v-if="tilesReady && !paused && isVisible"
      class="tile-field"
      role="application"
      aria-label="Campo de jogo Mahjong"
      :aria-busy="isLoading ? 'true' : 'false'"
      :style="{
        width: `${windowWidth}px`,
        height: `${windowHeight}px`
      }"
      @click="onFieldClick"
    >
      <!-- OPTIMIZAÇÃO: Canvas para tiles estáticos -->
      <canvas 
        ref="staticTilesCanvas"
        class="static-tiles-layer"
        :width="windowWidth * 2"
        :height="windowHeight * 2"
        :style="{
          width: `${windowWidth}px`,
          height: `${windowHeight}px`,
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }"
      ></canvas>
      
      <!-- OPTIMIZAÇÃO: Apenas tiles interativos em DOM -->
      <div 
        v-for="tile in interactiveTiles" 
        :key="`interactive-${tile.id}`"
        class="tile-interactive"
        :class="getTileClasses(tile)"
        :style="getTileStyle(tile)"
        :aria-label="getTileAriaLabel(tile)"
        :aria-pressed="tile.selected ? 'true' : 'false'"
        :tabindex="tile.isFree() ? 0 : -1"
        role="button"
        @click.stop="onTileClick(tile)"
        @keydown.enter.stop="onTileClick(tile)"
        @keydown.space.stop.prevent="onTileClick(tile)"
      >
        <!-- Mystical dragon spirit hint -->
        <div 
          v-if="tile.showHint && showHints"
          class="dragon-spirit-hint"
        >
          <div class="dragon-orb">
            <div class="orb-core"></div>
            <div class="orb-glow"></div>
          </div>
          <div class="spirit-particles">
            <div class="particle" v-for="n in 6" :key="n" :style="`--particle-delay: ${n * 0.3}s`"></div>
          </div>
          <div class="energy-ribbon ribbon-1"></div>
          <div class="energy-ribbon ribbon-2"></div>
        </div>
        
        <div class="tile-content">
          <div 
            class="secondary-character"
            :style="{
              fontSize: `${fontSizeSecondary}px`,
              lineHeight: `${fontSizeSecondary - 5}px`
            }"
          >
            {{ tile.type.getSecondaryCharacter() }}
          </div>

          <div 
            class="primary-character-wrap"
            :style="{
              ...(tile.type.group === 'dragon' && tile.type.getPrimaryCharacter() === '龙' ? {
                paddingRight: `${fontSizePrimary * 0.075}px`
              } : {})
            }"
          >
            <span 
              class="primary-character"
              :style="{
                fontSize: `${tile.type.group === 'dragon' && tile.type.getPrimaryCharacter() === '龙' ? fontSizePrimary / 2 : fontSizePrimary}px`,
                lineHeight: `${tile.type.group === 'dragon' && tile.type.getPrimaryCharacter() === '龙' ? fontSizePrimary / 2 : fontSizePrimary}px`
              }"
              v-html="tile.type.getPrimaryCharacter()"
            ></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed, inject } from 'vue';
import { useGameStore } from '@/stores/game.store';
import { useGameStateStore } from '@/stores/gameState.store';
import { MjTile, MjTileType } from '@/models/tile.model';
import { turtleLayout, mobileTurtleLayout, type TilePosition } from '@/data/layouts';
import { audioService } from '@/services/audio.service';

const props = defineProps<{
  layout: string;
  paused: boolean;
}>();

const emit = defineEmits<{
  ready: [];
  tileCleared: [];
  click: [];
  continue: [];
}>();

const gameStore = useGameStore();
const isMobile = inject('isMobile', ref(false));

// Component state
const tiles = ref<MjTile[]>([]);
const tilesReady = ref(false);
const isVisible = ref(true);
const showHints = ref(false);
const isLoading = ref(false);
const staticTilesCanvas = ref<HTMLCanvasElement | null>(null);

// Selected tile tracking
const selectedTile = ref<MjTile | null>(null);

// Field dimensions
const elementPixelWidth = ref(40);
const elementPixelHeight = ref(50);
const windowWidth = ref(800);
const windowHeight = ref(600);
const paddingLeft = ref(0);
const paddingRight = ref(0);
const paddingTop = ref(0);
const paddingBottom = ref(0);
const fieldWidth = ref(0);
const fieldHeight = ref(0);

// Performance optimization constants
const shiftProportion = 0.14;
const depthProportion = 0.15;

// Computed values for tile dimensions
const shiftX = computed(() => Math.floor(elementPixelWidth.value * shiftProportion));
const shiftY = computed(() => Math.floor(elementPixelHeight.value * shiftProportion));
const depthSize = computed(() => Math.max(8, Math.floor(Math.min(elementPixelWidth.value, elementPixelHeight.value) * depthProportion)));

// Font size calculations
const fontSizePrimary = computed(() => {
  const adjustedElementSize = Math.min(
    elementPixelHeight.value,
    elementPixelWidth.value * 1.5
  );
  return Math.floor(adjustedElementSize * 1.5);
});

const fontSizeSecondary = computed(() => {
  const adjustedElementSize = Math.min(
    elementPixelHeight.value,
    elementPixelWidth.value * 1.5
  );
  return Math.floor(adjustedElementSize / 3);
});

// OPTIMIZAÇÃO CRÍTICA: Separar tiles interativos dos estáticos
const interactiveTiles = computed(() => {
  return tiles.value.filter(tile => 
    tile.active && (tile.isFree() || tile.selected || tile.showHint)
  );
});

const staticTiles = computed(() => {
  return tiles.value.filter(tile => 
    tile.active && !tile.isFree() && !tile.selected && !tile.showHint
  );
});

// Canvas rendering para tiles estáticos
function renderStaticTiles() {
  if (!staticTilesCanvas.value) return;
  
  const canvas = staticTilesCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set high DPI scaling
  const scale = window.devicePixelRatio || 1;
  ctx.scale(scale, scale);
  
  // Render static tiles
  staticTiles.value.forEach(tile => {
    drawTileToCanvas(ctx, tile);
  });
}

function drawTileToCanvas(ctx: CanvasRenderingContext2D, tile: MjTile) {
  const x = tile.x * elementPixelWidth.value + tile.z * shiftX.value + tile.chaosOffsetX;
  const y = tile.y * elementPixelHeight.value - tile.z * shiftY.value + tile.chaosOffsetY;
  const width = elementPixelWidth.value * 2 - 4;
  const height = elementPixelHeight.value * 2 - 4;
  
  // Draw tile shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  // Draw tile body
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, '#FFF5D4');
  gradient.addColorStop(0.4, '#FEF2C7');
  gradient.addColorStop(1, '#F5E6B8');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  
  // Draw tile border
  ctx.strokeStyle = '#D4A017';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  
  // Draw tile content
  if (tile.type) {
    ctx.fillStyle = tile.type.getColor();
    ctx.font = `${fontSizePrimary.value}px FreeSerifNF`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      tile.type.getPrimaryCharacter(),
      x + width / 2,
      y + height / 2
    );
  }
}

// Watch for changes that require canvas re-render
watch([staticTiles, elementPixelWidth, elementPixelHeight], () => {
  nextTick(() => {
    renderStaticTiles();
  });
});

// Rest of the existing TileField logic...
// [Implementar métodos essenciais do TileField original aqui]

onMounted(() => {
  // Initialize component
  nextTick(() => {
    renderStaticTiles();
  });
});

// Implement remaining methods from original TileField...
function onTileClick(tile: MjTile) {
  // Implementation
}

function onFieldClick() {
  // Implementation
}

function getTileClasses(tile: MjTile) {
  return {
    selected: tile.selected,
    free: tile.isFree() && !tile.selected,
    locked: !tile.isFree() && tile.active,
    'hint-active': tile.showHint && showHints.value
  };
}

function getTileStyle(tile: MjTile) {
  return {
    position: 'absolute',
    left: `${tile.x * elementPixelWidth.value + tile.z * shiftX.value + tile.chaosOffsetX}px`,
    top: `${tile.y * elementPixelHeight.value - tile.z * shiftY.value + tile.chaosOffsetY}px`,
    width: `${elementPixelWidth.value * 2 - 4}px`,
    height: `${elementPixelHeight.value * 2 - 4}px`,
    zIndex: tile.z * 1000 + 3,
    transform: `rotate3d(0, 0, 1, ${tile.chaosRotation}deg) translateZ(0)`,
  };
}

function getTileAriaLabel(tile: MjTile) {
  // Implementation
  return '';
}

</script>

<style lang="scss" scoped>
.tile-field-outer {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tile-field {
  position: relative;
  margin: 0 auto;
  transform-style: preserve-3d;
  transform: perspective(1200px) rotateX(3deg);
  isolation: isolate;
}

.static-tiles-layer {
  pointer-events: none;
}

.tile-interactive {
  font-family: FreeSerifNF;
  overflow: visible;
  transform-origin: 50% 50%;
  position: absolute;
  border-radius: 10%;
  cursor: pointer;
  background: linear-gradient(145deg, #FFF5D4 0%, #FEF2C7 40%, #F5E6B8 100%);
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.15s ease-out;
  will-change: transform, filter;
  backface-visibility: hidden;

  &.free:hover {
    filter: brightness(1.08);
    box-shadow: 
      0 8px 16px rgba(0, 0, 0, 0.2),
      0 4px 8px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  &.locked {
    cursor: not-allowed;
    opacity: 0.7;
  }

  &.selected {
    background: linear-gradient(145deg, #FFB885 0%, #FEAA6E 40%, #F59956 100%);
    box-shadow: 
      0 12px 24px rgba(0, 0, 0, 0.3),
      0 6px 12px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.6),
      inset 0 -1px 0 rgba(0, 0, 0, 0.15),
      0 0 20px rgba(254, 170, 110, 0.4);
    filter: brightness(1.08);
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
}

// Hint animations
.dragon-spirit-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 100;
}

.dragon-orb {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: 
    dragon-wobble 4s ease-in-out infinite,
    dragon-float 2.5s ease-in-out infinite alternate;
}

.orb-core {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 228, 181, 0.5), rgba(255, 215, 0, 0.5), rgba(255, 99, 71, 0.5));
  border-radius: 50%;
  opacity: 0.5;
  box-shadow: 
    0 0 10px rgba(255, 215, 0, 0.5),
    0 0 20px rgba(255, 99, 71, 0.5),
    inset -2px -2px 4px rgba(255, 99, 71, 0.25);
  animation: orb-pulse 1.5s ease-in-out infinite;
}

.orb-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  animation: orb-glow-pulse 1.5s ease-in-out infinite;
}

@keyframes dragon-wobble {
  0% { transform: translate(-50%, -50%) translateX(0px) translateY(0px); }
  25% { transform: translate(-50%, -50%) translateX(12px) translateY(-8px); }
  50% { transform: translate(-50%, -50%) translateX(-15px) translateY(5px); }
  75% { transform: translate(-50%, -50%) translateX(6px) translateY(-6px); }
  100% { transform: translate(-50%, -50%) translateX(0px) translateY(0px); }
}

@keyframes dragon-float {
  0% { filter: brightness(1) hue-rotate(0deg); }
  50% { filter: brightness(1.3) hue-rotate(20deg); }
  100% { filter: brightness(0.9) hue-rotate(-20deg); }
}

@keyframes orb-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes orb-glow-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}
</style>