<template>
  <AppModal v-if="show" :actions="modalActions">
    <div class="level-up-content">
      <div class="level-up-animation">
        <div class="level-badge">
          <div class="level-number">{{ newLevel }}</div>
          <div class="level-stars">
            <span v-for="i in 3" :key="i" class="star">⭐</span>
          </div>
        </div>
      </div>
      
      <h1 class="level-up-title">🎉 Parabéns! 🎉</h1>
      <p class="level-up-subtitle">Você alcançou o nível {{ newLevel }}!</p>
      
      <div class="rewards">
        <div class="reward-item">
          <span class="reward-icon">🪙</span>
          <span class="reward-text">+{{ tokensEarned }} Tokens</span>
        </div>
        
        <div v-if="unlocked" class="reward-item">
          <span class="reward-icon">🎁</span>
          <span class="reward-text">{{ unlocked }}</span>
        </div>
      </div>
      
      <div class="progress-info">
        <p>Próximo nível em {{ nextLevelXP }} XP</p>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppModal from './AppModal.vue';
import { audioService } from '@/services/audio.service';

interface Props {
  show: boolean;
  newLevel: number;
  tokensEarned: number;
  nextLevelXP: number;
  unlocked?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const modalActions = computed(() => [
  {
    label: 'Continuar Jogando',
    primary: true,
    action: () => {
      emit('close');
    }
  }
]);

// Play level up sound when modal shows
if (props.show) {
  audioService.play('levelup');
}
</script>

<style scoped>
.level-up-content {
  text-align: center;
  padding: 20px;
}

.level-up-animation {
  margin-bottom: 30px;
}

.level-badge {
  display: inline-block;
  position: relative;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-radius: 50%;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  animation: pulse 2s ease-in-out infinite;
}

.level-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.level-stars {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
}

.star {
  font-size: 20px;
  animation: starPulse 1s ease-in-out infinite;
}

.star:nth-child(2) {
  animation-delay: 0.2s;
}

.star:nth-child(3) {
  animation-delay: 0.4s;
}

.level-up-title {
  font-size: 32px;
  margin: 20px 0 10px;
  color: var(--text-primary);
}

.level-up-subtitle {
  font-size: 20px;
  color: var(--text-secondary);
  margin-bottom: 30px;
}

.rewards {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 30px 0;
  align-items: center;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
  font-size: 18px;
}

.reward-icon {
  font-size: 24px;
}

.reward-text {
  color: var(--text-primary);
  font-weight: 500;
}

.progress-info {
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-tertiary);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 50px rgba(255, 215, 0, 0.8);
  }
}

@keyframes starPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

@media (max-width: 480px) {
  .level-badge {
    width: 100px;
    height: 100px;
  }
  
  .level-number {
    font-size: 36px;
  }
  
  .level-up-title {
    font-size: 24px;
  }
  
  .level-up-subtitle {
    font-size: 16px;
  }
}
</style>