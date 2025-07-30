<template>
  <div :class="['game-stats', { 'game-stats--compact': compact }]">
    <div class="stat-item">
      <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M12 7C14.21 7 16 8.79 16 11V22H14V18H10V22H8V11C8 8.79 9.79 7 12 7M10 11V16H14V11C14 9.9 13.1 9 12 9C10.9 9 10 9.9 10 11Z" 
              fill="currentColor"/>
      </svg>
      <span class="stat-value">{{ formattedScore }}</span>
      <span v-if="!compact" class="stat-label">pontos</span>
    </div>
    
    <div class="stat-divider"></div>
    
    <div class="stat-item">
      <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.6 20 4 16.4 4 12S7.6 4 12 4 20 7.6 20 12 16.4 20 12 20M12.5 7H11V13L16.3 15.8L17 14.5L12.5 12.3V7Z" 
              fill="currentColor"/>
      </svg>
      <span class="stat-value">{{ formattedTime }}</span>
      <span v-if="!compact" class="stat-label">tempo</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  score: number
  timer: number
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const formattedScore = computed(() => {
  // Formatar pontuação com separador de milhares
  return props.score.toLocaleString('pt-BR')
})

const formattedTime = computed(() => {
  // Converter segundos em formato MM:SS
  const minutes = Math.floor(props.timer / 60)
  const seconds = props.timer % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})
</script>

<style scoped>
.game-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.game-stats:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Versão compacta */
.game-stats--compact {
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
}

.game-stats--compact .stat-item {
  gap: 6px;
}

.game-stats--compact .stat-icon {
  width: 18px;
  height: 18px;
}

.game-stats--compact .stat-value {
  font-size: 16px;
}

/* Item de estatística */
.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  width: 24px;
  height: 24px;
  color: #666;
  flex-shrink: 0;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* Divisor */
.stat-divider {
  width: 1px;
  height: 24px;
  background: #d0d0d0;
  margin: 0 4px;
}

.game-stats--compact .stat-divider {
  height: 20px;
}

/* Responsividade */
@media (max-width: 768px) {
  .game-stats {
    gap: 12px;
    padding: 10px 16px;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .stat-icon {
    width: 20px;
    height: 20px;
  }
}

/* Tema escuro (se necessário) */
@media (prefers-color-scheme: dark) {
  .game-stats {
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  }
  
  .stat-value {
    color: #f0f0f0;
  }
  
  .stat-label {
    color: #999;
  }
  
  .stat-icon {
    color: #999;
  }
  
  .stat-divider {
    background: #444;
  }
}
</style>

<script lang="ts">
export default {
  name: 'GameStats'
}
</script>