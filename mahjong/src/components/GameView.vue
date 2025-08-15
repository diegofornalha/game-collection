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
      <div class="victory-content">
        <h1 style="color: #FFD700; font-size: 2.5em; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);">🏆 Vitória! 🏆</h1>
        
        <!-- Ofensiva Liberada -->
        <div style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2)); padding: 20px; border-radius: 12px; border: 2px solid #FFD700; margin-bottom: 20px;">
          <h2 style="color: #FFA500; margin-bottom: 10px; font-size: 1.5em;">
            🔥 Ofensiva Liberada! 🔥
          </h2>
          <p style="font-size: 1.1em; margin-bottom: 10px;">
            Você completou o desafio e liberou uma nova ofensiva!
          </p>
          <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px;">
            <div style="text-align: center;">
              <p style="color: #FFD700; font-size: 2em; font-weight: bold; margin: 0;">{{ dailyStreakStore.streakData.currentStreak || 1 }}</p>
              <p style="font-size: 0.9em; opacity: 0.8;">{{ dailyStreakStore.streakData.currentStreak === 1 ? 'dia' : 'dias' }} de ofensiva</p>
            </div>
            <div style="text-align: center;">
              <p style="color: #FFD700; font-size: 2em; font-weight: bold; margin: 0;">{{ gameStore.score }}</p>
              <p style="font-size: 0.9em; opacity: 0.8;">pontos conquistados</p>
            </div>
          </div>
        </div>
        
        <!-- XP Ganho -->
        <div v-if="(window as any).lastXPResult" style="background: rgba(100, 200, 255, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(100, 200, 255, 0.3); margin-bottom: 15px;">
          <p style="color: #64C8FF; font-weight: bold; margin-bottom: 8px;">✨ Experiência Conquistada</p>
          <div style="font-size: 0.9em; opacity: 0.9;">
            <p v-for="(line, index) in (window as any).lastXPResult.breakdown" :key="index" style="margin: 3px 0;">
              {{ line }}
            </p>
          </div>
        </div>
        
        <p style="font-size: 1.1em; margin-top: 15px;">
          Continue sua jornada e aumente sua sequência de ofensivas!
        </p>
        
        <!-- Auto redirect countdown -->
        <div style="margin-top: 20px; padding: 10px; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
          <p style="color: #FFA500; font-size: 0.9em;">
            Redirecionando para o perfil em <strong>{{ autoRedirectCountdown }}</strong> segundos...
          </p>
        </div>
      </div>
    </AppModal>

    <!-- Auto-shuffle notification removed - now instant shuffle -->

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
          :key="tileFieldKey"
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
    
    <!-- XP Displays -->
    <XPDisplay 
      v-for="xp in xpDisplays" 
      :key="xp.id"
      :xp-amount="xp.amount"
      :x="xp.x"
      :y="xp.y"
    />
    
    <!-- Level Up Modal -->
    <LevelUpModal
      :show="showLevelUpModal"
      :new-level="levelUpData.newLevel"
      :tokens-earned="levelUpData.tokensEarned"
      :next-level-x-p="levelUpData.nextLevelXP"
      @close="showLevelUpModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, nextTick, watch } from 'vue';
import { useGameStore } from '@/stores/game.store';
import { useDailyStreakStore } from '@/stores/gamification/dailyStreak.store';
import { useUserProfileStore } from '@/stores/gamification/userProfile.store';
import { useNavigationStore } from '@/stores/navigation.store';
import AppModal from './AppModal.vue';
import StatusBar from './StatusBar.vue';
import TileField from './TileField.vue';
import UserProfileHeader from './UserProfileHeader.vue';
// AutoShuffleNotification removed - now using instant shuffle
import TutorialOverlay from './TutorialOverlay.vue';
import { audioService } from '@/services/audio.service';
import { storageService } from '@/services/storage.service';
import { xpCalculatorService } from '@/services/xpCalculator.service';
import XPDisplay from './XPDisplay.vue';
import LevelUpModal from './LevelUpModal.vue';
import { GameDiagnostics } from '@/utils/diagnostics';

const gameStore = useGameStore();
const dailyStreakStore = useDailyStreakStore();
const userProfileStore = useUserProfileStore();
const navigationStore = useNavigationStore();

// Component refs
const tileFieldRef = ref<InstanceType<typeof TileField> | null>(null);

// Check if running inside MobileGameView
const isInMobileView = ref(false);

// Force re-render key
const tileFieldKey = ref(0);

// Modal states
const showMainMenu = ref(false);
const showRestartDialog = ref(false);
const showTieModal = ref(false);
const showWinModal = ref(false);
const showLevelUpModal = ref(false);
const autoRedirectCountdown = ref(8);
let autoRedirectTimer: NodeJS.Timeout | null = null;

// Game state
const currentLayout = ref('default');
const numberOfHints = ref(3);
const hasSavedGame = ref(false);

// XP Display state
const xpDisplays = ref<Array<{ id: number; amount: number; x: number; y: number }>>([]);
const levelUpData = ref({
  newLevel: 0,
  tokensEarned: 0,
  nextLevelXP: 0
});

// Removido auto-restart - agora o usuário escolhe a próxima ação

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
    label: '🔥 Ver Ofensivas',
    primary: true,
    action: () => {
      if (autoRedirectTimer) {
        clearInterval(autoRedirectTimer);
        autoRedirectTimer = null;
      }
      showWinModal.value = false;
      navigationStore.navigateTo('profile');
    }
  },
  {
    label: 'Jogar Novamente',
    primary: false,
    action: () => {
      if (autoRedirectTimer) {
        clearInterval(autoRedirectTimer);
        autoRedirectTimer = null;
      }
      showWinModal.value = false;
      startNewGame();
    }
  }
];

// Emergency cache clear function
async function clearAllGameData() {
  try {
    // Clear all storage
    await storageService.remove('currentGame', 1);
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset game state
    gameStore.$reset?.();
    
    // Force complete re-render
    tileFieldKey.value = Date.now(); // Use timestamp for unique key
    
    console.log('All game data cleared');
  } catch (error) {
    console.error('Failed to clear game data:', error);
  }
}

// Game methods
function startNewGame() {
  showMainMenu.value = false;
  
  // Force re-render of TileField when starting new game
  tileFieldKey.value++;
  
  // Verificar e atualizar daily streak
  dailyStreakStore.checkAndUpdateStreak();
  
  // Wait for next tick to ensure component is ready
  nextTick(() => {
    if (tileFieldRef.value) {
      tileFieldRef.value.initializeNewGame();
    }
  });
}

// Expose emergency clear function to window for debugging
if (import.meta.env.DEV) {
  (window as any).clearGameCache = clearAllGameData;
}

async function continueGame() {
  showMainMenu.value = false;
  
  // Force re-render when continuing game
  tileFieldKey.value++;
  
  // Verificar e atualizar daily streak
  dailyStreakStore.checkAndUpdateStreak();
  
  await nextTick();
  await loadSavedGame();
}

async function loadSavedGame() {
  try {
    const savedGame = await storageService.get('currentGame', 1);
    
    // Validate saved game before loading
    if (savedGame && typeof savedGame === 'object' && savedGame.tiles && Array.isArray(savedGame.tiles)) {
      // Force re-render before loading saved game
      tileFieldKey.value++;
      await nextTick();
      
      if (tileFieldRef.value) {
        // Load the saved game state
        await tileFieldRef.value.loadSavedGame(savedGame);
      }
    } else {
      console.warn('Invalid or missing saved game, starting new game');
      // Clear invalid data
      await storageService.remove('currentGame', 1);
      startNewGame();
    }
  } catch (error) {
    console.error('Failed to load saved game:', error);
    // Clear corrupted data and fall back to new game
    try {
      await storageService.remove('currentGame', 1);
      localStorage.removeItem('gameState');
    } catch (e) {
      console.error('Failed to clear data:', e);
    }
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

function onTileCleared(event?: MouseEvent) {
  audioService.play('click');
  
  // Calculate and show XP for the match
  const remainingTiles = gameStore.tiles.filter(t => t.active).length;
  const matchXP = xpCalculatorService.calculateMatchXP(gameStore.currentCombo, remainingTiles);
  
  // Show XP animation at mouse position or center
  const xpDisplay = {
    id: Date.now(),
    amount: matchXP,
    x: event?.clientX || window.innerWidth / 2,
    y: event?.clientY || window.innerHeight / 2
  };
  
  xpDisplays.value.push(xpDisplay);
  
  // Remove after animation
  setTimeout(() => {
    xpDisplays.value = xpDisplays.value.filter(xp => xp.id !== xpDisplay.id);
  }, 1000);
  
  // Add XP to user profile
  const previousLevel = userProfileStore.level;
  userProfileStore.addXP(matchXP);
  
  // Check for level up
  if (userProfileStore.level > previousLevel) {
    handleLevelUp();
  }
  
  // Check game state
  if (gameStore.isGameComplete) {
    if (gameStore.tiles.filter(t => t.active).length === 0) {
      // Win
      audioService.play('win');
      
      // Calculate game stats for XP
      const gameStats = {
        timeInSeconds: gameStore.timer,
        maxCombo: gameStore.maxCombo,
        hintsUsed: gameStore.hintsUsed,
        undoCount: gameStore.undoCount,
        score: gameStore.score,
        remainingTiles: 0,
        layoutId: currentLayout.value
      };
      
      // Calculate win XP
      const xpResult = xpCalculatorService.calculateWinXP(gameStats, dailyStreakStore.streakData);
      
      // Add win XP
      const previousLevel = userProfileStore.level;
      userProfileStore.addXP(xpResult.totalXP);
      
      // Show XP in modal (store for display)
      (window as any).lastXPResult = xpResult;
      
      // Check for level up before showing win modal
      if (userProfileStore.level > previousLevel) {
        handleLevelUp();
      }
      
      showWinModal.value = true;
      
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
      
      // Iniciar countdown e auto-redirecionar
      autoRedirectCountdown.value = 8;
      autoRedirectTimer = setInterval(() => {
        autoRedirectCountdown.value--;
        if (autoRedirectCountdown.value <= 0) {
          if (autoRedirectTimer) {
            clearInterval(autoRedirectTimer);
            autoRedirectTimer = null;
          }
          if (showWinModal.value) {
            showWinModal.value = false;
            // Redirecionar para o perfil para ver as ofensivas
            navigationStore.navigateTo('profile');
          }
        }
      }, 1000);
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

function handleLevelUp() {
  const level = userProfileStore.level;
  const tokensEarned = level * 50; // 50 tokens per level
  const nextLevelXP = xpCalculatorService.calculateXPForLevel(level + 1);
  
  // Update level up data
  levelUpData.value = {
    newLevel: level,
    tokensEarned,
    nextLevelXP
  };
  
  // Add tokens
  userProfileStore.addTokens(tokensEarned);
  
  // Play level up sound
  audioService.play('levelup');
  
  // Show level up modal
  showLevelUpModal.value = true;
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
      case 'r':
        event.preventDefault();
        if (event.shiftKey) {
          // Shift+Ctrl+R: Clear all game data and restart
          console.log('Emergency cache clear triggered');
          clearAllGameData().then(() => {
            window.location.reload();
          });
        }
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
      // Show restart dialog when ESC is pressed
      showRestartDialog.value = true;
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
  
  // Run diagnostics first
  if (import.meta.env.DEV) {
    await GameDiagnostics.runFullDiagnostic();
  } else {
    // In production, just repair if needed
    await GameDiagnostics.repairGameState();
  }
  
  // Check if we're in mobile view
  const checkMobile = () => {
    isInMobileView.value = window.matchMedia('(max-width: 768px)').matches;
  };
  
  // Debounced resize handler (200ms delay)
  const debouncedCheckMobile = debounce(checkMobile, 200);
  
  checkMobile();
  window.addEventListener('resize', debouncedCheckMobile);
  
  // Clear any corrupted saved game data that might cause rendering issues
  try {
    const savedGame = await storageService.get('currentGame', 1);
    
    // Validate saved game data
    if (savedGame) {
      // Check if saved game has valid structure
      const isValid = savedGame && 
                      typeof savedGame === 'object' && 
                      savedGame.tiles && 
                      Array.isArray(savedGame.tiles);
      
      if (!isValid) {
        console.warn('Invalid saved game data detected, clearing...');
        await storageService.remove('currentGame', 1);
        localStorage.removeItem('gameState'); // Clear any legacy localStorage
        hasSavedGame.value = false;
      } else {
        hasSavedGame.value = true;
      }
    } else {
      hasSavedGame.value = false;
    }
  } catch (error) {
    console.error('Failed to check for saved game:', error);
    // Clear corrupted data
    try {
      await storageService.remove('currentGame', 1);
      localStorage.removeItem('gameState');
    } catch (e) {
      console.error('Failed to clear corrupted data:', e);
    }
    hasSavedGame.value = false;
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
  
  // Force component refresh
  tileFieldKey.value++;
  
  // Auto-start new game if no saved game exists
  await nextTick();
  if (!hasSavedGame.value && !gameStore.isPlaying) {
    startNewGame();
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
  // Limpar timer de redirecionamento
  if (autoRedirectTimer) {
    clearInterval(autoRedirectTimer);
    autoRedirectTimer = null;
  }
  // Store cleanup will be handled by stores themselves
  gameStore.cleanup();
});

// When component is activated (user navigates back to game view)
onActivated(() => {
  // Force re-render of TileField by incrementing key
  tileFieldKey.value++;
  
  // Ensure game state is properly initialized
  nextTick(() => {
    if (tileFieldRef.value && gameStore.isPlaying) {
      // Force a refresh of the tile field
      tileFieldRef.value.$forceUpdate?.();
    }
  });
});

// Watch for navigation changes to game view
watch(() => navigationStore.currentView, async (newView, oldView) => {
  if (newView === 'game' && oldView !== 'game') {
    // Force complete re-initialization when coming back to game view
    tileFieldKey.value++;
    
    // Clear any potentially corrupted runtime state
    await nextTick();
    
    // If no game is playing, ensure we start fresh
    if (!gameStore.isPlaying) {
      // Clear any saved state that might be corrupted
      try {
        const savedGame = await storageService.get('currentGame', 1);
        if (savedGame && !savedGame.tiles) {
          await storageService.remove('currentGame', 1);
          hasSavedGame.value = false;
        }
      } catch (e) {
        console.error('Error checking saved game:', e);
      }
      
      // Start a new game if needed
      if (!hasSavedGame.value) {
        startNewGame();
      }
    }
    
    // Additional refresh after a small delay to ensure everything is loaded
    setTimeout(() => {
      if (tileFieldRef.value) {
        tileFieldRef.value.$forceUpdate?.();
      }
    }, 100);
  }
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