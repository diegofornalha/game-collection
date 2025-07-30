<template>
  <div 
    class="mobile-game-board"
    :style="boardStyles"
    ref="boardElement"
  >
    <!-- Container das peças com layout otimizado -->
    <div 
      class="tiles-container"
      :style="containerStyles"
    >
      <MobileTile
        v-for="tile in visibleTiles"
        :key="tile.id"
        :tile="tile"
        :scale-factor="scaleFactor"
        :is-mobile="true"
        @select="handleTileSelect"
      />
    </div>
    
    <!-- Indicador de peças disponíveis -->
    <div class="tiles-info">
      <span class="available-count">
        {{ availableTilesCount }} peças disponíveis
      </span>
      <span class="layer-indicator">
        Camada {{ currentLayer }} de {{ totalLayers }}
      </span>
    </div>
    
    <!-- Área de preview para peças selecionadas -->
    <div v-if="selectedTiles.length > 0" class="selected-preview">
      <div class="selected-tile" v-for="tile in selectedTiles" :key="tile.id">
        <span>{{ getTileDisplay(tile) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { MjTile } from '../models/tile.model';
import { useMobileUI } from '../composables/useMobileUI';
// import { useGameStore } from '../stores/game.store';
import MobileTile from './MobileTile.vue';

interface Props {
  tiles: MjTile[];
  layout?: 'dragon' | 'turtle' | 'simple' | 'mobile';
  selectedTiles?: MjTile[];
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'mobile',
  selectedTiles: () => []
});

const emit = defineEmits<{
  tileSelect: [tile: MjTile];
  match: [tiles: MjTile[]];
}>();

// const gameStore = useGameStore(); // Not used
const { isMobile, tileSize, width, height } = useMobileUI();

// Estado local
const boardElement = ref<HTMLElement>();
const scaleFactor = ref(1);
const boardDimensions = ref({ width: 0, height: 0 });

// Configurações de layout mobile otimizado
const mobileLayoutConfig = {
  // Reduzir número de colunas e linhas visíveis
  maxColumns: 6,
  maxRows: 5,
  maxLayers: 4,
  // Maior sobreposição para economizar espaço
  overlapX: 0.6, // 60% de sobreposição horizontal
  overlapY: 0.7, // 70% de sobreposição vertical
  overlapZ: 0.8  // 80% de sobreposição em profundidade
};

// Filtrar apenas peças visíveis/acessíveis
const visibleTiles = computed(() => {
  if (!isMobile.value) return props.tiles;
  
  // Em mobile, mostrar apenas peças que podem ser jogadas
  // ou que estão nas camadas superiores
  return props.tiles.filter(tile => {
    // Sempre mostrar peças não bloqueadas
    if (!tile.isBlocked) return true;
    
    // Mostrar peças das duas camadas superiores
    const maxZ = Math.max(...props.tiles.map(t => t.z));
    return tile.z >= maxZ - 1;
  });
});

// Calcular dimensões do tabuleiro
const calculateBoardDimensions = () => {
  if (!props.tiles.length) return { width: 0, height: 0 };
  
  const maxX = Math.max(...props.tiles.map(t => t.x));
  const maxY = Math.max(...props.tiles.map(t => t.y));
  
  const tileWidth = tileSize.value;
  const tileHeight = tileSize.value * 1.3;
  
  if (isMobile.value) {
    // Aplicar sobreposição para mobile
    return {
      width: (maxX + 1) * tileWidth * mobileLayoutConfig.overlapX,
      height: (maxY + 1) * tileHeight * mobileLayoutConfig.overlapY
    };
  }
  
  return {
    width: (maxX + 1) * tileWidth,
    height: (maxY + 1) * tileHeight
  };
};

// Calcular fator de escala para caber na tela
const calculateScaleFactor = () => {
  const board = calculateBoardDimensions();
  const viewportWidth = width.value * 0.9;
  const viewportHeight = height.value * 0.6; // Deixar espaço para controles
  
  const scaleX = viewportWidth / board.width;
  const scaleY = viewportHeight / board.height;
  
  return Math.min(scaleX, scaleY, 1); // Não aumentar além do tamanho original
};

// Informações sobre o jogo
const availableTilesCount = computed(() => 
  props.tiles.filter(t => !t.isBlocked).length
);

const currentLayer = computed(() => {
  const selectedZ = props.selectedTiles[0]?.z || 0;
  return Math.max(...props.tiles.map(t => t.z)) - selectedZ + 1;
});

const totalLayers = computed(() => {
  const zValues = props.tiles.map(t => t.z);
  return Math.max(...zValues) - Math.min(...zValues) + 1;
});

// Estilos do tabuleiro
const boardStyles = computed(() => ({
  '--tile-size': `${tileSize.value}px`,
  '--scale-factor': scaleFactor.value,
  position: 'relative' as const,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px 10px 80px'
}));

// Estilos do container
const containerStyles = computed(() => ({
  position: 'relative' as const,
  transform: `scale(${scaleFactor.value})`,
  transformOrigin: 'center center',
  width: `${boardDimensions.value.width}px`,
  height: `${boardDimensions.value.height}px`,
  transition: 'transform 0.3s ease'
}));

// Obter display do tile
const getTileDisplay = (tile: MjTile) => {
  if (!tile.type) return '?';
  
  const displays: Record<string, string> = {
    'ball': '●',
    'bam': '🎋',
    'num': '字',
    'wind': '風',
    'dragon': '龍',
    'flower': '🌸',
    'season': '季'
  };
  
  return displays[tile.type.group] || tile.type.getPrimaryCharacter();
};

// Handler de seleção
const handleTileSelect = (tile: MjTile) => {
  emit('tileSelect', tile);
};

// Atualizar dimensões quando tiles mudam
watch(() => props.tiles, () => {
  boardDimensions.value = calculateBoardDimensions();
  scaleFactor.value = calculateScaleFactor();
}, { immediate: true });

// Recalcular ao redimensionar
onMounted(() => {
  const resizeObserver = new ResizeObserver(() => {
    scaleFactor.value = calculateScaleFactor();
  });
  
  if (boardElement.value) {
    resizeObserver.observe(boardElement.value);
  }
  
  // Auto ajustar zoom inicial
  if (isMobile.value) {
    setTimeout(() => {
      scaleFactor.value = calculateScaleFactor();
    }, 100);
  }
  
  return () => {
    resizeObserver.disconnect();
  };
});
</script>

<style lang="scss" scoped>
.mobile-game-board {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #f5f5f5 0%, #e0e0e0 100%);
  position: relative;
}

.tiles-container {
  perspective: 1000px;
  transform-style: preserve-3d;
  margin: 0 auto;
}

.tiles-info {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  gap: 16px;
  z-index: 10;
  
  .available-count {
    font-weight: 600;
  }
  
  .layer-indicator {
    opacity: 0.8;
  }
}

.selected-preview {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  z-index: 20;
}

.selected-tile {
  width: 40px;
  height: 52px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border: 2px solid #2980b9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: selected-bounce 0.3s ease-out;
}

@keyframes selected-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

// Modo escuro
@media (prefers-color-scheme: dark) {
  .mobile-game-board {
    background: radial-gradient(ellipse at center, #2c3e50 0%, #1a252f 100%);
  }
  
  .tiles-info {
    background: rgba(255, 255, 255, 0.1);
  }
}

// Otimizações para orientação landscape
@media (orientation: landscape) {
  .mobile-game-board {
    padding: 10px 10px 60px;
  }
  
  .tiles-info {
    top: 5px;
    font-size: 11px;
    padding: 4px 12px;
  }
}

// Telas muito pequenas
@media (max-width: 320px) {
  .selected-tile {
    width: 36px;
    height: 46px;
    font-size: 16px;
  }
}
</style>

<script lang="ts">
export default {
  name: 'MobileGameBoard'
}
</script>