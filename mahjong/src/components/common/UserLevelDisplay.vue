<template>
  <div class="user-level-display">
    <div class="level-badge" :class="{ 'level-up': isLevelingUp }">
      <svg class="level-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
              fill="currentColor"/>
      </svg>
      <span class="level-number">{{ level }}</span>
    </div>
    
    <div v-if="showProgress" class="level-info">
      <span class="level-text">Nível {{ level }}</span>
      <div class="progress-container">
        <div 
          class="progress-bar" 
          :style="{ width: progressPercentage + '%' }"
        >
          <span class="progress-shine"></span>
        </div>
        <span class="progress-text">
          {{ experience }} / {{ nextLevelExp }} XP
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  level: number
  experience: number
  nextLevelExp: number
  showProgress?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showProgress: true,
  compact: false
})

const isLevelingUp = ref(false)
const previousLevel = ref(props.level)

const progressPercentage = computed(() => {
  if (props.nextLevelExp <= 0) return 100
  return Math.min((props.experience / props.nextLevelExp) * 100, 100)
})

// Detectar mudança de nível para animação
watch(() => props.level, (newLevel) => {
  if (newLevel > previousLevel.value) {
    isLevelingUp.value = true
    setTimeout(() => {
      isLevelingUp.value = false
    }, 1000)
  }
  previousLevel.value = newLevel
})
</script>

<script lang="ts">
export default {
  name: 'UserLevelDisplay'
}
</script>

<style scoped>
.user-level-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Badge do nível */
.level-badge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.level-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.6);
}

/* Animação ao subir de nível */
.level-badge.level-up {
  animation: levelUp 1s ease-out;
}

@keyframes levelUp {
  0% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.3) rotate(180deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
  }
}

.level-icon {
  position: absolute;
  width: 32px;
  height: 32px;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.level-number {
  position: relative;
  font-weight: 700;
  font-size: 18px;
  color: #333;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
  z-index: 1;
}

/* Informações do nível */
.level-info {
  flex: 1;
  min-width: 150px;
}

.level-text {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

/* Barra de progresso */
.progress-container {
  position: relative;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
  overflow: hidden;
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  to {
    left: 100%;
  }
}

.progress-text {
  position: absolute;
  width: 100%;
  text-align: center;
  line-height: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* Responsividade */
@media (max-width: 768px) {
  .user-level-display {
    gap: 8px;
  }
  
  .level-badge {
    width: 40px;
    height: 40px;
  }
  
  .level-icon {
    width: 26px;
    height: 26px;
  }
  
  .level-number {
    font-size: 16px;
  }
  
  .level-info {
    min-width: 120px;
  }
  
  .progress-container {
    height: 16px;
  }
  
  .progress-text {
    line-height: 16px;
    font-size: 11px;
  }
}
</style>