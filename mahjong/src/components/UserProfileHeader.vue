<template>
  <header :class="computedClasses">
    <div class="user-section">
      <div class="user-stats">
        <UserLevelDisplay
          :level="userStore.level"
          :experience="userStore.experiencePoints"
          :nextLevelExp="userStore.nextLevelExperience"
          compact
        />
        <TokenDisplay
          :tokens="userStore.tokens"
          :show-animation="true"
          compact
        />
      </div>
    </div>

    <div class="action-section">
      <!-- Game stats when in game mode -->
      <div v-if="showGameStats && navigationStore.currentView === 'game'" class="game-stats">
        <div class="game-score">
          <span class="label">Pontos:</span>
          <span class="value">{{ gameStore.score }}</span>
        </div>
        <div class="game-timer">
          <i class="fas fa-clock"></i>
          <span>{{ formattedTime }}</span>
        </div>
      </div>
      
      <!-- Daily Streak sempre visível -->
      <DailyStreakIndicator
        :streak="dailyStreakStore.streakData.currentStreak"
        :is-active="dailyStreakStore.isStreakActive"
        :vacation-mode="dailyStreakStore.streakData.isVacationMode"
        :vacation-days-left="dailyStreakStore.vacationDaysLeft"
        :next-reward="dailyStreakStore.nextReward"
        :days-until-reward="dailyStreakStore.daysUntilNextReward"
        compact
      />
      
      <!-- Navigation Menu inline para desktop -->
      <NavigationMenu v-if="!isMobile" variant="inline" />
    </div>
    
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserProfileStore } from '../stores/gamification/userProfile.store'
import { useGameStore } from '../stores/game.store'
import { useDailyStreakStore } from '../stores/gamification/dailyStreak.store'
import { useNavigationStore } from '../stores/navigation.store'
import UserLevelDisplay from './common/UserLevelDisplay.vue'
import TokenDisplay from './TokenDisplay.vue'
import DailyStreakIndicator from './DailyStreakIndicator.vue'
import NavigationMenu from './NavigationMenu.vue'

interface Props {
  variant?: 'default' | 'compact' | 'expanded'
  showSettings?: boolean
  showGameStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  showSettings: true,
  showGameStats: false
})


const userStore = useUserProfileStore()
const gameStore = useGameStore()
const dailyStreakStore = useDailyStreakStore()
const navigationStore = useNavigationStore()
// Detectar se é mobile
const isMobile = computed(() => window.innerWidth < 768)

const computedClasses = computed(() => [
  'user-profile-header',
  `variant-${props.variant}`,
  {
    'show-settings': props.showSettings
  }
])

const formattedTime = computed(() => {
  const minutes = Math.floor(gameStore.timer / 60)
  const seconds = gameStore.timer % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})
</script>

<script lang="ts">
export default {
  name: 'UserProfileHeader'
}
</script>

<style scoped>
.user-profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--surface-color);
  border-radius: 0;
  box-shadow: var(--shadow-md);
  gap: 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-bottom: 1px solid var(--border-color);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.user-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.action-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.game-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 0.875rem;
}

.game-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .label {
    color: var(--text-secondary);
  }
  
  .value {
    font-weight: 600;
    color: var(--primary-color);
    font-size: 1rem;
  }
}

.game-timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  
  i {
    font-size: 0.875rem;
  }
}

/* Estilos removidos - menu agora está no NavigationMenu component */

/* Safe area for iOS devices */
.user-profile-header {
  padding-top: calc(1rem + env(safe-area-inset-top));
}

/* Responsive */
@media (max-width: 768px) {
  .user-profile-header {
    padding: 0.75rem;
    padding-top: calc(0.75rem + env(safe-area-inset-top));
  }
  
  .user-stats {
    gap: 1rem;
  }
  
  /* Adjust action section on mobile */
  .action-section {
    gap: 0.5rem;
  }
}

/* Variant: Compact */
.variant-compact {
  padding: 0.75rem;
  padding-top: calc(0.75rem + env(safe-area-inset-top));
}

.variant-compact .user-name {
  font-size: 0.875rem;
}

.variant-compact .user-stats {
  gap: 0.75rem;
}

/* Variant: Expanded */
.variant-expanded {
  flex-direction: column;
  align-items: flex-start;
  padding: 1.5rem;
  gap: 1.5rem;
}

.variant-expanded .user-section {
  width: 100%;
}

.variant-expanded .action-section {
  width: 100%;
  justify-content: flex-end;
}
</style>