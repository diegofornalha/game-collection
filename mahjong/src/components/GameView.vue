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

    <!-- Restart Dialog -->
    <AppModal v-if="showRestartDialog" :actions="restartGameModalActions" @close="showRestartDialog = false">
      <h1>Escolha uma opção de reinício:</h1>
      <p style="margin: 15px 0;">
        <strong>Embaralhar Restantes:</strong> Continue jogando com as peças atuais em novas posições<br/>
        <strong>Reiniciar Atual:</strong> Recomeça com o mesmo layout<br/>
        <strong>Novo Jogo:</strong> Inicia um jogo completamente novo
      </p>
    </AppModal>

    <!-- No More Moves Modal -->
    <AppModal v-if="showTieModal" :actions="tieModalActions">
      <h1>Sem Mais Pares Disponíveis</h1>
      <p>Não há mais peças correspondentes que possam ser removidas.</p>
      <p>Escolha sua próxima jogada:</p>
      <ul style="text-align: left; display: inline-block; margin: 10px 0;">
        <li><strong>Embaralhar Restantes:</strong> Mistura as peças restantes para criar novas combinações</li>
        <li><strong>Reiniciar Atual:</strong> Recomeça com o mesmo layout</li>
        <li><strong>Novo Jogo:</strong> Inicia um jogo completamente novo</li>
      </ul>
    </AppModal>

    <!-- Win Modal -->
    <AppModal v-if="showWinModal" :actions="winModalActions">
      <h1>🎉 Parabéns!</h1>
      <p>Você removeu todas as peças com sucesso!</p>
      <p><strong>Sua pontuação final: {{ gameStore.score }}</strong></p>
      
      <!-- Ofensiva concluída -->
      <div v-if="dailyStreakStore.isStreakActive" style="margin: 15px 0; padding: 10px; background: rgba(255, 200, 0, 0.1); border-radius: 8px; border: 2px solid #FFC000;">
        <p style="margin: 5px 0; color: #FFA500;">
          <strong>🔥 Ofensiva Diária Concluída! 🔥</strong>
        </p>
        <p style="margin: 5px 0;">
          Ofensiva atual: <strong>{{ dailyStreakStore.streakData.currentStreak }} {{ dailyStreakStore.streakData.currentStreak === 1 ? 'dia' : 'dias' }}</strong>
        </p>
        <p v-if="dailyStreakStore.nextReward" style="margin: 5px 0; font-size: 0.9em;">
          Próxima recompensa em {{ dailyStreakStore.daysUntilNextReward }} {{ dailyStreakStore.daysUntilNextReward === 1 ? 'dia' : 'dias' }}
        </p>
      </div>
      
      <p>Muito bem jogado! Pronto para outra jornada?</p>
    </AppModal>

    <!-- Auto-shuffle notification -->
    <AutoShuffleNotification />

    <div class="game-component">
      <div v-if="!isInMobileView" class="header-section">
        <UserProfileHeader 
          :variant="'compact'"
          :show-settings="true"
          :show-game-stats="true"
        />
      </div>

      <div class="statusfield">
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
        <TileField
          ref="tileFieldRef"
          :layout="currentLayout"
          :paused="gameStore.isPaused"
          @ready="onTileCollectionReady"
          @tile-cleared="onTileCleared"
          @click="onClick"
          @continue="onContinueGame"
        />
      </div>
    </div>
    
    <!-- Tutorial overlay - rendered last to ensure it's on top -->
    <TutorialOverlay />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useGameStore } from '@/stores/game.store';
import { useDailyStreakStore } from '@/stores/gamification/dailyStreak.store';
import { useUserProfileStore } from '@/stores/gamification/userProfile.store';
import { useNavigationStore } from '@/stores/navigation.store';
import AppModal from './AppModal.vue';
import StatusBar from './StatusBar.vue';
import TileField from './TileField.vue';
import UserProfileHeader from './UserProfileHeader.vue';
import AutoShuffleNotification from './AutoShuffleNotification.vue';
import TutorialOverlay from './TutorialOverlay.vue';
import { audioService } from '@/services/audio.service';
import { storageService } from '@/services/storage.service';

const gameStore = useGameStore();
const dailyStreakStore = useDailyStreakStore();
const userProfileStore = useUserProfileStore();
const navigationStore = useNavigationStore();

// Component refs
const tileFieldRef = ref<InstanceType<typeof TileField> | null>(null);

// Check if running inside MobileGameView
const isInMobileView = ref(false);

// Modal states
const showMainMenu = ref(true);
const showRestartDialog = ref(false);
const showTieModal = ref(false);
const showWinModal = ref(false);

// Game state
const currentLayout = ref('default');
const numberOfHints = ref(3);
const hasSavedGame = ref(false);

// Modal actions
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

const tieModalActions = [
  {
    label: 'Shuffle Remaining',
    primary: true,
    action: () => {
      showTieModal.value = false;
      shuffleRemainingTiles();
    }
  },
  {
    label: 'Restart Current',
    action: () => {
      showTieModal.value = false;
      restartCurrentGame();
    }
  },
  {
    label: 'Start New',
    action: () => {
      showTieModal.value = false;
      startNewGame();
    }
  }
];

const winModalActions = [
  {
    label: 'Iniciar Nova Jornada',
    primary: true,
    action: () => {
      showWinModal.value = false;
      startNewGame();
    }
  },
  {
    label: 'Voltar ao Menu',
    action: () => {
      showWinModal.value = false;
      showMainMenu.value = true;
    }
  }
];

// Game methods
function startNewGame() {
  showMainMenu.value = false;
  
  // Verificar e atualizar daily streak
  dailyStreakStore.checkAndUpdateStreak();
  
  // Wait for next tick to ensure component is ready
  nextTick(() => {
    if (tileFieldRef.value) {
      tileFieldRef.value.initializeNewGame();
    }
  });
}

async function continueGame() {
  showMainMenu.value = false;
  
  // Verificar e atualizar daily streak
  dailyStreakStore.checkAndUpdateStreak();
  
  await nextTick();
  await loadSavedGame();
}

async function loadSavedGame() {
  try {
    const savedGame = await storageService.get('currentGame', 1);
    if (savedGame && tileFieldRef.value) {
      // Load the saved game state
      await tileFieldRef.value.loadSavedGame(savedGame);
    }
  } catch (error) {
    console.error('Failed to load saved game:', error);
    // Fall back to new game if loading fails
    startNewGame();
  }
}

// function replayGame() {
//   // TODO: Replay with same layout
// }

function restartCurrentGame() {
  // Emit event to TileField to regenerate with same layout
  if (tileFieldRef.value) {
    tileFieldRef.value.regenerateLayout();
  }
}

function reshuffleGame() {
  // Reshuffle tiles with animation
  if (tileFieldRef.value) {
    tileFieldRef.value.reshuffleWithAnimation();
  }
}

function shuffleRemainingTiles() {
  // Shuffle only the remaining tiles keeping the same pieces
  if (tileFieldRef.value) {
    tileFieldRef.value.shuffleRemainingTiles();
  }
}

function onTileCollectionReady() {
  // Game is ready to play
}

function onTileCleared() {
  audioService.play('click');
  
  // Check game state
  if (gameStore.isGameComplete) {
    if (gameStore.tiles.filter(t => t.active).length === 0) {
      // Win
      showWinModal.value = true;
      audioService.play('win');
      
      // Marcar jogo como completado para a ofensiva diária
      dailyStreakStore.markGameCompleted();
      
      // Recompensar com tokens bonus por completar o jogo durante streak
      if (dailyStreakStore.isStreakActive) {
        const bonusTokens = Math.floor(dailyStreakStore.streakData.currentStreak / 5) * 10;
        if (bonusTokens > 0) {
          userProfileStore.addTokens(bonusTokens);
          console.log(`Bônus de streak: +${bonusTokens} tokens!`);
        }
      }
    } else {
      // No more moves
      showTieModal.value = true;
      audioService.play('lose');
    }
  }
}

function onClick() {
  audioService.play('click', 0);
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

function onContinueGame() {
  gameStore.resumeGame();
}

// Keyboard shortcuts
function handleKeyPress(event: KeyboardEvent) {
  // Don't handle if user is typing in an input field
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }

  // Ctrl/Cmd + key combinations
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'z':
        event.preventDefault();
        if (gameStore.canUndo) {
          onUndo();
        }
        break;
      case 'y':
        event.preventDefault();
        if (gameStore.canRedo) {
          onRedo();
        }
        break;
      case 'm':
        event.preventDefault();
        // Toggle music
        gameStore.toggleMusic();
        break;
    }
    return;
  }

  // Single key shortcuts
  switch (event.key.toLowerCase()) {
    case 'h':
      event.preventDefault();
      // Request hint
      gameStore.requestHint();
      audioService.play('hint');
      break;
    case 'p':
      event.preventDefault();
      // Toggle pause
      if (gameStore.isPaused) {
        gameStore.resumeGame();
      } else {
        gameStore.pauseGame();
      }
      break;
    case 'n':
      event.preventDefault();
      // New game
      showRestartDialog.value = true;
      break;
    case 'e':
      event.preventDefault();
      // Shuffle remaining tiles
      shuffleRemainingTiles();
      break;
    case 'm':
      event.preventDefault();
      // Toggle sound
      gameStore.toggleSound();
      break;
    case 'escape':
      event.preventDefault();
      // Go to home menu
      navigationStore.navigateTo('home');
      break;
    case 'f':
      event.preventDefault();
      // Toggle fullscreen
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      break;
    case '+':
    case '=':
      event.preventDefault();
      // Zoom in - could be implemented later
      console.log('Zoom in');
      break;
    case '-':
    case '_':
      event.preventDefault();
      // Zoom out - could be implemented later
      console.log('Zoom out');
      break;
  }
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: number | null = null;
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  }) as T;
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeyPress);
  
  // Check if we're in mobile view
  const checkMobile = () => {
    isInMobileView.value = window.matchMedia('(max-width: 768px)').matches;
  };
  
  // Debounced resize handler (200ms delay)
  const debouncedCheckMobile = debounce(checkMobile, 200);
  
  checkMobile();
  window.addEventListener('resize', debouncedCheckMobile);
  
  // Check for saved game
  try {
    const savedGame = await storageService.get('currentGame', 1);
    hasSavedGame.value = !!savedGame;
  } catch (error) {
    console.error('Failed to check for saved game:', error);
  }
  
  // Load sounds
  audioService.load({
    'click': ['/sounds/click1.wav', '/sounds/click2.wav'],
    'start': ['/sounds/ding.mp3'],
    'win': ['/sounds/win.wav'],
    'lose': ['/sounds/lose.wav'],
    'undo': ['/sounds/back.wav'],
    'redo': ['/sounds/blip.wav'],
    'hint': ['/sounds/question.wav'],
    'bonus': ['/sounds/bonus.wav'],
    'coin': ['/sounds/coin1.wav', '/sounds/coin2.wav', '/sounds/coin3.wav']
  });
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
  // Store cleanup will be handled by stores themselves
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
    
    &::before {
      content: attr(data-text);
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      background: none;
      -webkit-text-fill-color: #8B4513;
      text-shadow: none;
      opacity: 0.3;
      transform: translate(2px, 2px);
      overflow: hidden;
    }
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
  
  .decorative-border {
    width: 80%;
    height: 3px;
    margin: 0 auto;
    background: linear-gradient(90deg, 
      transparent, 
      #FFD700 20%, 
      #FFD700 80%, 
      transparent
    );
    position: relative;
    
    &::before,
    &::after {
      content: '◆';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      color: #FFD700;
      font-size: 16px;
      text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
    }
    
    &::before {
      left: 15%;
    }
    
    &::after {
      right: 15%;
    }
    
    &.top {
      margin-bottom: 20px;
    }
    
    &.bottom {
      margin-top: 20px;
    }
  }
}
</style>

<script lang="ts">
export default {
  name: 'GameView'
}
</script>