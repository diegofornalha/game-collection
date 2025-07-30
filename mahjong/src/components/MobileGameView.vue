<template>
  <div class="mobile-game-view">
    <UserProfileHeader 
      :variant="'compact'"
      :show-settings="false"
      :show-game-stats="true"
      @toggle-menu="toggleMenu"
      class="mobile-profile-header"
    />

    <div class="mobile-game-area">
      <GameView />
      
      <!-- Mobile Pause Overlay -->
      <div v-if="gameStore.isPaused" class="pause-overlay" @click="handlePause">
        <div class="pause-content">
          <div class="pause-icon">⏸</div>
          <h2>Jogo Pausado</h2>
          <button class="resume-button" @click.stop="handlePause">
            <span class="icon">▶</span>
            <span>Continuar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Slide-out Menu -->
    <transition name="slide-menu">
      <div v-if="showMenu" class="slide-menu-overlay" @click="closeMenu">
        <div class="slide-menu" @click.stop>
          <div class="menu-header">
            <h3>Menu</h3>
            <button class="close-menu" @click="closeMenu">✕</button>
          </div>
          
          <div class="menu-controls">
            <button 
              class="menu-button" 
              @click="gameStore.requestHint"
              :disabled="!gameStore.isPlaying"
            >
              <span class="icon">💡</span>
              <span class="label">Dica</span>
            </button>
            
            <button 
              class="menu-button" 
              @click="gameStore.undo"
              :disabled="!gameStore.canUndo"
            >
              <span class="icon">↶</span>
              <span class="label">Desfazer</span>
            </button>
            
            <button 
              class="menu-button" 
              @click="handlePause"
            >
              <span class="icon">{{ gameStore.isPaused ? '▶' : '⏸' }}</span>
              <span class="label">{{ gameStore.isPaused ? 'Continuar' : 'Pausar' }}</span>
            </button>
            
            <button 
              class="menu-button" 
              @click="resetGame"
            >
              <span class="icon">🔄</span>
              <span class="label">Novo Jogo</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '@/stores/game.store';
import GameView from './GameView.vue';
import UserProfileHeader from './UserProfileHeader.vue';

const gameStore = useGameStore();
const showMenu = ref(false);

// Removido - não usado

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const closeMenu = () => {
  showMenu.value = false;
};

const handlePause = () => {
  if (gameStore.isPaused) {
    gameStore.resumeGame();
  } else {
    gameStore.pauseGame();
  }
  closeMenu();
};

const resetGame = () => {
  if (confirm('Iniciar novo jogo?')) {
    location.reload(); // Temporário até implementar reset apropriado
  }
  closeMenu();
};
</script>

<style lang="scss" scoped>
.mobile-game-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #f5f5f5);
  position: relative;
  overflow: hidden;
}

.mobile-profile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  :deep(.menu-toggle) {
    display: flex !important;
  }
  
  :deep(.desktop-only) {
    display: none !important;
  }
}

.mobile-game-area {
  flex: 1;
  position: relative;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// Slide Menu Styles
.slide-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
}

.slide-menu {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  max-width: 80vw;
  height: 100%;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  
  h3 {
    margin: 0;
    font-size: 20px;
    color: #333;
  }
}

.close-menu {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  border-radius: 50%;
  
  &:active {
    background: rgba(0, 0, 0, 0.05);
  }
}

.menu-controls {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  
  .icon {
    font-size: 24px;
    width: 32px;
    text-align: center;
  }
  
  .label {
    font-size: 16px;
    color: #333;
    font-weight: 500;
  }
  
  &:active {
    background: #e0e0e0;
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Slide Menu Animation
.slide-menu-enter-active,
.slide-menu-leave-active {
  transition: opacity 0.3s ease;
  
  .slide-menu {
    transition: transform 0.3s ease;
  }
}

.slide-menu-enter-from,
.slide-menu-leave-to {
  opacity: 0;
  
  .slide-menu {
    transform: translateX(100%);
  }
}

// Pause Overlay
.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.pause-content {
  text-align: center;
  color: white;
  padding: 32px;
  
  .pause-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.8;
  }
  
  h2 {
    font-size: 24px;
    margin-bottom: 24px;
    font-weight: 600;
  }
}

.resume-button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: var(--primary, #42b883);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  .icon {
    font-size: 24px;
  }
  
  &:active {
    transform: scale(0.95);
    background: var(--primary-dark, #359d6f);
  }
}

// Ajustes para landscape
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-header {
    padding: 8px 16px;
  }
  
  .pause-content {
    padding: 16px;
    
    .pause-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }
    
    h2 {
      font-size: 20px;
      margin-bottom: 16px;
    }
  }
  
  .slide-menu {
    width: 320px;
  }
}
</style>

<script lang="ts">
export default {
  name: 'MobileGameView'
}
</script>