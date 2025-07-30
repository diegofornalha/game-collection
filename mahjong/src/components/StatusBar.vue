<template>
  <div v-if="isVisible" class="status noselect">
    <div class="status-bar">
      <!-- left side block -->
      <div class="left-block">
        <span 
          @click="onHintClick" 
          class="hint" 
          :class="{ active: hintCurrentlyShowing, permanent: permanentHint }"
          title="Dica (H) | Dica permanente (Ctrl+D)"
        >
          <i class="fa fa-star-o" aria-hidden="true"></i>&nbsp;Dica
        </span>

        <span 
          class="undo" 
          @click="onUndoClick" 
          :class="{ disabled: !gameStore.canUndo }"
          title="Desfazer (Ctrl+Z)"
        >
          <i class="fa fa-arrow-left" aria-hidden="true"></i>
        </span>
        <span 
          class="redo" 
          @click="onRedoClick" 
          :class="{ disabled: !gameStore.canRedo }"
          title="Refazer (Ctrl+Y)"
        >
          <i class="fa fa-arrow-right" aria-hidden="true"></i>
        </span>
      </div>

      <!-- middle block -->
      <div class="middle-block">
        <!-- Score and timer moved to UserProfileHeader to avoid duplication -->
      </div>

      <!-- right side block -->
      <div class="right-block">
        <span class="sound highlight" @click="onSoundClick">
          <i v-if="gameStore.soundEnabled" class="fa fa-volume-up" aria-hidden="true"></i>
          <i v-else class="fa fa-volume-off" aria-hidden="true"></i>
        </span>

        <span class="pause highlight" @click="onPauseClick">
          <i v-if="gameStore.isPaused" class="fa fa-play-circle-o" aria-hidden="true"></i>
          <i v-else class="fa fa-pause-circle-o" aria-hidden="true"></i>
        </span>

        <span class="restart highlight" @click="$emit('restart')">
          <i class="fa fa-undo" aria-hidden="true"></i>
        </span>
      </div>
    </div>

    <div class="debug-block" v-if="showDebugFields">
      <span class="highlight" @click="onStepClick">
        Click to make one step: <i class="fa fa-play-circle-o" aria-hidden="true"></i>
      </span>
      <br/>
      <span class="highlight" @click="onSolveClick">
        Click to solve: <i class="fa fa-play-circle-o" aria-hidden="true"></i>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/game.store';

defineProps<{
  hintsCount: number;
  score: number;
  timer: number;
  showDebugFields: boolean;
}>();

const emit = defineEmits<{
  undo: [];
  redo: [];
  restart: [];
}>();

const gameStore = useGameStore();

const isVisible = ref(true);
const hintCurrentlyShowing = computed(() => gameStore.showHint);

// Removido - não usado

function onHintClick() {
  gameStore.requestHint();
}

function onUndoClick() {
  if (gameStore.canUndo) {
    emit('undo');
  }
}

function onRedoClick() {
  if (gameStore.canRedo) {
    emit('redo');
  }
}

function onSoundClick() {
  gameStore.toggleSound();
}

function onPauseClick() {
  if (gameStore.isPaused) {
    gameStore.resumeGame();
  } else {
    gameStore.pauseGame();
  }
}

function onStepClick() {
  // Debug functionality
  console.log('Step clicked');
}

function onSolveClick() {
  // Debug functionality
  console.log('Solve clicked');
}

// Track permanent hint state
const permanentHint = ref(false);

// Keyboard shortcuts
function handleKeyPress(event: KeyboardEvent) {
  // Hint shortcut: H key
  if (event.key.toLowerCase() === 'h' && !event.ctrlKey && !event.altKey && !event.metaKey) {
    event.preventDefault();
    onHintClick();
  }
  // Permanent hint toggle: Ctrl+D
  else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
    event.preventDefault();
    togglePermanentHint();
  }
  // Undo shortcut: Ctrl/Cmd + Z
  else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
    event.preventDefault();
    onUndoClick();
  }
  // Redo shortcut: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
  else if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) {
    event.preventDefault();
    onRedoClick();
  }
}

function togglePermanentHint() {
  permanentHint.value = !permanentHint.value;
  if (permanentHint.value) {
    gameStore.requestHint();
    gameStore.setPermanentHint(true);
  } else {
    gameStore.setPermanentHint(false);
    gameStore.stopHint();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.status {
  width: 100%;
  background: rgba(0, 0, 0, 0.8);
  color: var(--text-primary, #ffffff);
  font-size: 16px;
  
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 20px;
    
    @media (max-width: $tablet) {
      flex-wrap: wrap;
      gap: 10px;
    }
  }
  
  .left-block,
  .middle-block,
  .right-block {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .middle-block {
    @media (max-width: $tablet) {
      order: -1;
      width: 100%;
      justify-content: center;
    }
  }
  
  span {
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover:not(.disabled) {
      color: $primary;
      transform: scale(1.1);
    }
    
    &.disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }
  
  .hint {
    padding: 5px 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    
    &.active {
      border-color: $secondary;
      color: $secondary;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      background: rgba(255, 215, 0, 0.1);
      
      i {
        animation: pulse 1s ease-in-out infinite;
      }
    }
    
    &.permanent {
      border-color: #ff6347;
      background: rgba(255, 99, 71, 0.2);
      
      &::after {
        content: " 🔒";
        font-size: 0.8em;
      }
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
  }
  
  .highlight {
    color: var(--text-primary, #ffffff);
    font-weight: bold;
  }
  
  .score {
    font-size: 1.2em;
  }
  
  .timer {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  i {
    font-size: 1.2em;
  }
  
  .debug-block {
    padding: 10px 20px;
    background: rgba(255, 0, 0, 0.1);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.noselect {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>

<script lang="ts">
export default {
  name: 'StatusBar'
}
</script>