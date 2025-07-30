<template>
  <div :class="indicatorClasses">
    <div class="streak-icon" :class="{ 'at-risk': isAtRisk }">
      <i v-if="vacationMode" class="fas fa-umbrella-beach"></i>
      <i v-else-if="streak === 0" class="fas fa-fire-extinguisher"></i>
      <i v-else class="fas fa-fire"></i>
      
      <div v-if="streak > 0 && !vacationMode" class="flame-animation">
        <span v-for="n in 3" :key="n" class="flame"></span>
      </div>
    </div>
    
    <div class="streak-info">
      <div class="streak-count">
        <span v-if="vacationMode">Modo Férias</span>
        <span v-else-if="streak === 0">Sem ofensiva</span>
        <span v-else>{{ streak }} {{ streak === 1 ? 'dia' : 'dias' }}</span>
      </div>
      
      <div v-if="!compact" class="streak-details">
        <div v-if="isAtRisk && !vacationMode" class="risk-warning">
          <i class="fas fa-exclamation-triangle"></i>
          Jogue hoje para manter!
        </div>
        
        <div v-else-if="daysUntilReward && !vacationMode" class="next-reward">
          <i class="fas fa-gift"></i>
          {{ daysUntilReward }} {{ daysUntilReward === 1 ? 'dia' : 'dias' }} para próxima recompensa
        </div>
        
        <div v-else-if="vacationMode" class="vacation-info">
          Ofensiva protegida
        </div>
      </div>
    </div>
    
    <Tooltip v-if="compact">
      <template v-if="vacationMode">
        Modo férias ativado - sua ofensiva está protegida
      </template>
      <template v-else-if="streak === 0">
        Jogue todos os dias para construir sua ofensiva diária!
      </template>
      <template v-else-if="isAtRisk">
        ⚠️ Jogue hoje para manter sua ofensiva de {{ streak }} dias!
      </template>
      <template v-else>
        Ofensiva de {{ streak }} dias! Continue jogando diariamente.
      </template>
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { differenceInHours } from 'date-fns'
import Tooltip from './common/Tooltip.vue'

interface Props {
  streak: number
  lastLogin?: Date | string
  vacationMode?: boolean
  compact?: boolean
  isActive?: boolean
  vacationDaysLeft?: number
  nextReward?: { day: number; xp?: number; experience?: number; tokens: number; achievement?: string; bonus?: string } | null
  daysUntilReward?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  streak: 0,
  vacationMode: false,
  compact: false,
  isActive: true,
  vacationDaysLeft: 0,
  nextReward: null,
  daysUntilReward: null
})

// Removido - usando recompensas da store

const indicatorClasses = computed(() => [
  'daily-streak-indicator',
  {
    'compact': props.compact,
    'at-risk': isAtRisk.value && !props.vacationMode,
    'vacation-mode': props.vacationMode,
    'no-streak': props.streak === 0
  }
])

const isAtRisk = computed(() => {
  if (!props.lastLogin || props.vacationMode) return false
  
  const lastLoginDate = typeof props.lastLogin === 'string' 
    ? new Date(props.lastLogin) 
    : props.lastLogin
    
  const hoursSinceLogin = differenceInHours(new Date(), lastLoginDate)
  return hoursSinceLogin >= 23
})

// Removido - não é usado
</script>

<script lang="ts">
export default {
  name: 'DailyStreakIndicator'
}
</script>

<style scoped>
.daily-streak-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  position: relative;
  transition: all 0.3s;
}

.daily-streak-indicator:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Ícone com animações */
.streak-icon {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--orange-500);
  transition: all 0.3s;
}

.streak-icon.at-risk {
  animation: pulse 1.5s infinite;
  color: var(--red-500);
}

.vacation-mode .streak-icon {
  color: var(--blue-500);
}

.no-streak .streak-icon {
  color: var(--text-tertiary);
}

/* Animação de chamas */
.flame-animation {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.flame {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 4px;
  height: 8px;
  background: var(--orange-400);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transform: translateX(-50%);
  animation: flame 0.8s ease-in-out infinite alternate;
}

.flame:nth-child(1) {
  left: 40%;
  animation-delay: 0s;
  height: 6px;
}

.flame:nth-child(2) {
  left: 50%;
  animation-delay: 0.2s;
  height: 10px;
}

.flame:nth-child(3) {
  left: 60%;
  animation-delay: 0.4s;
  height: 6px;
}

@keyframes flame {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(-12px) scale(0.8);
    opacity: 0.6;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Informações da ofensiva */
.streak-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.streak-count {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.streak-details {
  font-size: 0.875rem;
}

.risk-warning {
  color: var(--red-500);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.risk-warning i {
  font-size: 0.75rem;
}

.next-reward {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.next-reward i {
  color: var(--yellow-500);
  font-size: 0.875rem;
}

.vacation-info {
  color: var(--blue-500);
  font-style: italic;
}

/* Versão compacta */
.compact {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid var(--border-color);
}

.compact:hover {
  background: var(--hover-bg);
  transform: none;
  box-shadow: none;
}

.compact .streak-icon {
  width: 32px;
  height: 32px;
  font-size: 1.25rem;
}

.compact .streak-count {
  font-size: 0.875rem;
}

.compact .flame {
  height: 6px;
}

.compact .flame:nth-child(2) {
  height: 8px;
}

/* Estados especiais */
.at-risk {
  border-color: var(--red-200);
  background: var(--red-50);
}

.vacation-mode {
  border-color: var(--blue-200);
  background: var(--blue-50);
}

.no-streak {
  opacity: 0.7;
}

/* Responsivo */
@media (max-width: 480px) {
  .daily-streak-indicator:not(.compact) {
    padding: 0.5rem 0.75rem;
  }
  
  .streak-icon {
    width: 32px;
    height: 32px;
    font-size: 1.25rem;
  }
  
  .streak-count {
    font-size: 0.875rem;
  }
  
  .streak-details {
    font-size: 0.75rem;
  }
}
</style>