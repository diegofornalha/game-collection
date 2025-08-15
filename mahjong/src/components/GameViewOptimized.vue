<template>
  <div class="game-view">
    <!-- Main Menu Modal -->
    <AppModal v-if="showMainMenu" :actions="mainMenuModalActions" @close="startNewGame">
      <div class="main-menu-content">
        <div class="decorative-border top"></div>
        <h1 class="title" data-text="Mahjong Solitaire">Mahjong<br/>Solitaire</h1>
        <div class="subtitle">Jogo Ancestral de Peças</div>
        <div class="decorative-border bottom"></div>
      </div>
    </AppModal>

    <!-- OTIMIZAÇÃO: Lazy load modais pesados -->
    <LazyComponentLoader
      v-if="showRestartDialog"
      :component-factory="() => import('./AppModal.vue')"
      :component-props="{ actions: restartGameModalActions }"
      :component-events="['close']"
      @close="showRestartDialog = false"
    >
      <template v-slot:default="{ component }">
        <component 
          :is="component" 
          :actions="restartGameModalActions" 
          @close="showRestartDialog = false"
        >
          <h1>Escolha uma opção de reinício:</h1>
          <p style="margin: 15px 0;">
            <strong>Embaralhar Restantes:</strong> Continue jogando com as peças atuais em novas posições<br/>
            <strong>Reiniciar Atual:</strong> Recomeça com o mesmo layout<br/>
            <strong>Novo Jogo:</strong> Inicia um jogo completamente novo
          </p>
        </component>
      </template>
    </LazyComponentLoader>

    <div class="game-component">
      <div v-if="!isInMobileView" class="header-section">
        <!-- OTIMIZAÇÃO: Lazy load header apenas quando necessário -->
        <LazyComponentLoader
          :component-factory="() => import('./UserProfileHeader.vue')"
          :component-props="{
            variant: 'compact',
            showSettings: true,
            showGameStats: true
          }"
          loading-text="Carregando perfil..."
          :loading-delay="100"
        />
      </div>

      <div class="statusfield">
        <!-- StatusBar é sempre necessário, manter eager loading -->
        <StatusBar
          @undo="onUndo"
          @redo="onRedo"
          @restart="onRestartRequest"
          :hints-count="numberOfHints"
          :score="gameStore.score"
          :timer="gameStore.timer"
          :show-debug-fields="false"
        />
      </div>

      <div class="gamefield noselect">
        <!-- OTIMIZAÇÃO: Lazy load TileField otimizado -->
        <LazyComponentLoader
          :component-factory="loadTileFieldComponent"
          :component-props="{
            layout: currentLayout,
            paused: gameStore.isPaused
          }"
          :component-events="['ready', 'tile-cleared', 'click', 'continue']"
          loading-text="Inicializando jogo..."
          :loading-delay="50"
          @ready="onTileCollectionReady"
          @tile-cleared="onTileCleared"
          @click="onClick"
          @continue="onContinueGame"
        />
      </div>
    </div>
    
    <!-- OTIMIZAÇÃO: Lazy load tutorial apenas quando necessário -->
    <LazyComponentLoader
      v-if="showTutorial"
      :component-factory="() => import('./TutorialOverlay.vue')"
      loading-text="Carregando tutorial..."
    />
    
    <!-- OTIMIZAÇÃO: XP Displays com pooling -->
    <div class="xp-displays-pool">
      <XPDisplay 
        v-for="xp in activeXPDisplays" 
        :key="xp.id"
        :xp-amount="xp.amount"
        :x="xp.x"
        :y="xp.y"
        @animation-complete="onXPAnimationComplete(xp.id)"
      />
    </div>
    
    <!-- OTIMIZAÇÃO: Lazy load modal de level up -->
    <LazyComponentLoader
      v-if="showLevelUpModal"
      :component-factory="() => import('./LevelUpModal.vue')"
      :component-props="{
        show: showLevelUpModal,
        newLevel: levelUpData.newLevel,
        tokensEarned: levelUpData.tokensEarned,
        nextLevelXP: levelUpData.nextLevelXP
      }"
      :component-events="['close']"
      @close="showLevelUpModal = false"
      loading-text="Carregando level up..."
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, shallowRef } from 'vue';
import { useGameStore } from '@/stores/game.store';
import { useDailyStreakStore } from '@/stores/gamification/dailyStreak.store';
import { useUserProfileStore } from '@/stores/gamification/userProfile.store';
import { useNavigationStore } from '@/stores/navigation.store';
import { useMemoryManager } from '@/composables/useMemoryManager';

// Eager imports para componentes críticos
import AppModal from './AppModal.vue';
import StatusBar from './StatusBar.vue';
import LazyComponentLoader from './LazyComponentLoader.vue';
import XPDisplay from './XPDisplay.vue';

// Services
import { audioService } from '@/services/audio.service';
import { storageService } from '@/services/storage.service';
import { xpCalculatorService } from '@/services/xpCalculator.service';

const gameStore = useGameStore();
const dailyStreakStore = useDailyStreakStore();
const userProfileStore = useUserProfileStore();
const navigationStore = useNavigationStore();
const memoryManager = useMemoryManager();

// Component refs - usando shallowRef para performance
const tileFieldRef = shallowRef<any>(null);

// State
const isInMobileView = ref(false);
const currentLayout = ref('default');
const numberOfHints = ref(3);
const hasSavedGame = ref(false);
const showTutorial = ref(false);

// Modal states
const showMainMenu = ref(false);
const showRestartDialog = ref(false);
const showLevelUpModal = ref(false);

// OTIMIZAÇÃO: XP Display pooling para melhor performance
const xpDisplayPool = shallowRef<Array<{ id: number; amount: number; x: number; y: number }>>([]);
const activeXPDisplays = computed(() => xpDisplayPool.value.slice(0, 5)); // Máximo 5 simultâneos

const levelUpData = ref({
  newLevel: 0,
  tokensEarned: 0,
  nextLevelXP: 0
});

// OTIMIZAÇÃO: Dynamic import para TileField baseado em device
async function loadTileFieldComponent() {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    return import('./MobileTileField.vue').catch(() => {
      // Fallback para versão desktop se mobile falhar
      console.warn('Mobile TileField failed to load, using desktop version');
      return import('./TileFieldOptimized.vue');
    });
  } else {
    return import('./TileFieldOptimized.vue');
  }
}

// Modal actions (mantidos iguais)
const mainMenuModalActions = computed(() => {
  if (hasSavedGame.value) {
    return [
      {
        label: 'Continue Journey',
        primary: true,
        action: () => continueGame()
      },
      {
        label: 'Start Journey',
        action: () => startNewGame()
      }
    ];
  } else {
    return [
      {
        label: 'Begin Journey',
        primary: true,
        action: () => startNewGame()
      }
    ];
  }
});

const restartGameModalActions = [
  {
    label: 'Shuffle Remaining',
    primary: true,
    action: () => {
      showRestartDialog.value = false;
      shuffleRemainingTiles();
    }
  },
  {
    label: 'Restart Current',
    action: () => {
      showRestartDialog.value = false;
      restartCurrentGame();
    }
  },
  {
    label: 'Start New',
    action: () => {
      showRestartDialog.value = false;
      reshuffleGame();
    }
  },
  {
    label: 'Cancel',
    action: () => {
      showRestartDialog.value = false;
    }
  }
];

// OTIMIZAÇÃO: Debounced functions para performance
const debouncedCheckMobile = memoryManager.createDebouncedFunction(() => {
  isInMobileView.value = window.matchMedia('(max-width: 768px)').matches;
}, 200);

// Game methods (simplificados)
function startNewGame() {
  showMainMenu.value = false;
  dailyStreakStore.checkAndUpdateStreak();
  
  nextTick(() => {
    if (tileFieldRef.value) {
      tileFieldRef.value.initializeNewGame();
    }
  });
}

function onTileCollectionReady() {
  // Game is ready
}

// OTIMIZAÇÃO: XP display com pooling
function onTileCleared(event?: MouseEvent) {
  audioService.play('click');
  
  const remainingTiles = gameStore.tiles.filter(t => t.active).length;
  const matchXP = xpCalculatorService.calculateMatchXP(gameStore.currentCombo, remainingTiles);
  
  // Adicionar ao pool com limite
  if (xpDisplayPool.value.length < 10) { // Limite máximo
    const xpDisplay = {
      id: Date.now() + Math.random(),
      amount: matchXP,
      x: event?.clientX || window.innerWidth / 2,
      y: event?.clientY || window.innerHeight / 2
    };
    
    xpDisplayPool.value.push(xpDisplay);
  }
  
  userProfileStore.addXP(matchXP);
}

// OTIMIZAÇÃO: Cleanup de XP displays
function onXPAnimationComplete(id: number) {
  const index = xpDisplayPool.value.findIndex(xp => xp.id === id);
  if (index !== -1) {
    xpDisplayPool.value.splice(index, 1);
  }
}

function onUndo() {
  gameStore.undo();
  audioService.play('undo');
}

function onRedo() {
  gameStore.redo();
  audioService.play('redo');
}

function onRestartRequest() {
  showRestartDialog.value = true;
}

function onClick() {
  audioService.play('click', 0);
}

function onContinueGame() {
  gameStore.resumeGame();
}

// Simplified methods (implementations would be similar to original)
function continueGame() {
  // Implementation
}

function restartCurrentGame() {
  // Implementation
}

function reshuffleGame() {
  // Implementation
}

function shuffleRemainingTiles() {
  // Implementation
}

// OTIMIZAÇÃO: Setup with memory management
onMounted(async () => {
  // Setup event listeners with memory management
  memoryManager.addEventListener(window, 'resize', debouncedCheckMobile);
  
  debouncedCheckMobile();
  
  // Preload critical sounds
  audioService.load({
    'click': ['/sounds/click1.wav'],
    'undo': ['/sounds/back.wav'],
    'redo': ['/sounds/blip.wav']
  });
  
  // Check for saved game
  try {
    const savedGame = await storageService.get('currentGame', 1);
    hasSavedGame.value = !!(savedGame && savedGame.tiles);
  } catch (error) {
    console.error('Failed to check saved game:', error);
    hasSavedGame.value = false;
  }
  
  // Auto-start if no saved game
  if (!hasSavedGame.value && !gameStore.isPlaying) {
    startNewGame();
  }
});

onUnmounted(() => {
  // Memory cleanup handled by useMemoryManager
  gameStore.cleanup();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.game-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: url('/img/backgrounds/oriental-1.jpg') center/cover;
  position: relative;
}

.game-component {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-section {
  flex: 0 0 auto;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.statusfield {
  flex: 0 0 auto;
  background: rgba(0, 0, 0, 0.7);
  padding: 5px;
}

.gamefield {
  flex: 1 1 auto;
  position: relative;
  overflow: hidden;
}

.noselect {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

// OTIMIZAÇÃO: XP displays container
.xp-displays-pool {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

// Main menu content (mantido igual)
.main-menu-content {
  width: 100%;
  padding: 20px 0;
  text-align: center;
  overflow: hidden;
  
  .title {
    font-size: clamp(2rem, 7vw, 4rem);
    background: linear-gradient(135deg, #FFD700, #FFE55A);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 
      2px 2px 4px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(255, 215, 0, 0.3);
    letter-spacing: 3px;
    margin: 20px 0;
    line-height: 1.2;
    position: relative;
    text-transform: uppercase;
    font-family: "Palatino", "Garamond", "Courier new";
  }
  
  .subtitle {
    font-family: "Palatino", "Garamond", serif;
    font-size: clamp(1rem, 3vw, 1.5rem);
    color: #FFE5B4;
    text-align: center;
    margin: 10px 0 30px 0;
    letter-spacing: 2px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    font-style: italic;
  }
}
</style>

<script lang="ts">
export default {
  name: 'GameViewOptimized'
}
</script>