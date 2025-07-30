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
      <div v-if="showGameStats" class="game-stats">
        <div class="game-score">
          <span class="label">Pontos:</span>
          <span class="value">{{ gameStore.score }}</span>
        </div>
        <div class="game-timer">
          <i class="fas fa-clock"></i>
          <span>{{ formattedTime }}</span>
        </div>
      </div>
      
      <DailyStreakIndicator
        v-else
        :streak="dailyStreakStore.streakData.currentStreak"
        :is-active="dailyStreakStore.isStreakActive"
        :vacation-mode="dailyStreakStore.streakData.isVacationMode"
        :vacation-days-left="dailyStreakStore.vacationDaysLeft"
        :next-reward="dailyStreakStore.nextReward"
        :days-until-reward="dailyStreakStore.daysUntilNextReward"
        compact
      />
      
      <button @click="toggleMenu" class="menu-toggle" aria-label="Menu">
        <i class="fas fa-bars"></i>
      </button>
      
      <RouterLink to="/settings" class="settings-link desktop-only">
        <i class="fas fa-cog"></i>
      </RouterLink>
    </div>
    
    <!-- Mobile Menu Overlay -->
    <Transition name="menu">
      <div v-if="menuOpen" class="mobile-menu" @click="closeMenu">
        <div class="menu-content" @click.stop>
          <div class="menu-header">
            <h3>Menu</h3>
            <button @click="closeMenu" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <nav class="menu-nav">
            <RouterLink to="/" @click="closeMenu">
              <i class="fas fa-home"></i> Início
            </RouterLink>
            <RouterLink to="/profile" @click="closeMenu">
              <i class="fas fa-user"></i> Perfil
            </RouterLink>
            <RouterLink to="/settings" @click="closeMenu">
              <i class="fas fa-cog"></i> Configurações
            </RouterLink>
            <RouterLink to="/achievements" @click="closeMenu">
              <i class="fas fa-trophy"></i> Conquistas
            </RouterLink>
            <RouterLink to="/store" @click="closeMenu">
              <i class="fas fa-store"></i> Loja
            </RouterLink>
          </nav>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserProfileStore } from '../stores/gamification/userProfile.store'
import { useGameStore } from '../stores/game.store'
import { useDailyStreakStore } from '../stores/gamification/dailyStreak.store'
import UserLevelDisplay from './common/UserLevelDisplay.vue'
import TokenDisplay from './TokenDisplay.vue'
import DailyStreakIndicator from './DailyStreakIndicator.vue'

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

const emit = defineEmits<{
  'toggle-menu': []
}>()

const userStore = useUserProfileStore()
const gameStore = useGameStore()
const dailyStreakStore = useDailyStreakStore()
const menuOpen = ref(false)

const computedClasses = computed(() => [
  'user-profile-header',
  `variant-${props.variant}`,
  {
    'show-settings': props.showSettings,
    'menu-open': menuOpen.value
  }
])

const toggleMenu = () => {
  // Emit event for mobile integration
  emit('toggle-menu')
  // Keep internal menu for desktop
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}

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
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  gap: 1rem;
  position: relative;
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

.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.menu-toggle:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
}

.settings-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
  transition: all 0.2s;
}

.settings-link:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
}

/* Mobile Menu */
.mobile-menu {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.menu-content {
  background: var(--surface-color);
  width: 280px;
  height: 100%;
  padding: 1.5rem;
  overflow-y: auto;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.menu-header h3 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--border-radius-md);
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.menu-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-nav a {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  transition: all 0.2s;
}

.menu-nav a:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
}

.menu-nav a.router-link-active {
  background: var(--primary-color);
  color: white;
}

.menu-nav i {
  width: 20px;
  text-align: center;
}

/* Transitions */
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.3s;
}

.menu-enter-active .menu-content,
.menu-leave-active .menu-content {
  transition: transform 0.3s;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}

.menu-enter-from .menu-content,
.menu-leave-to .menu-content {
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
  }
  
  .desktop-only {
    display: none;
  }
  
  .user-stats {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}

/* Variant: Compact */
.variant-compact {
  padding: 0.75rem;
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