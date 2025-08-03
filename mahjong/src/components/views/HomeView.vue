<template>
  <div class="home-view">
    <div class="home-header">
      <h1>Mahjong Solitaire</h1>
      <p class="subtitle">Bem-vindo de volta!</p>
    </div>

    <div class="stats-summary">
      <div class="stat-card">
        <i class="fas fa-trophy"></i>
        <div class="stat-content">
          <span class="stat-value">{{ userStore.level }}</span>
          <span class="stat-label">Nível</span>
        </div>
      </div>
      
      <div class="stat-card">
        <i class="fas fa-fire"></i>
        <div class="stat-content">
          <span class="stat-value">{{ dailyStreakStore.streakData.currentStreak }}</span>
          <span class="stat-label">Dias de Ofensiva</span>
        </div>
      </div>
      
      <div class="stat-card">
        <i class="fas fa-trophy"></i>
        <div class="stat-content">
          <span class="stat-value">{{ userStore.tokens }}</span>
          <span class="stat-label">Tokens</span>
        </div>
      </div>
      
      <div class="stat-card">
        <i class="fas fa-gamepad"></i>
        <div class="stat-content">
          <span class="stat-value">{{ userStore.profile.stats.gamesPlayed }}</span>
          <span class="stat-label">Jogos</span>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <button class="action-button primary" @click="startNewGame">
        <i class="fas fa-play"></i>
        <span>Jogar</span>
      </button>
      
      <button class="action-button" @click="continueGame" :disabled="!canContinue">
        <i class="fas fa-redo"></i>
        <span>Continuar</span>
      </button>
    </div>

    <div class="challenges-preview" v-if="activeChallenges.length > 0">
      <h2>Desafios do Dia</h2>
      <div class="challenge-list">
        <div 
          v-for="challenge in activeChallenges.slice(0, 3)" 
          :key="challenge.id"
          class="challenge-item"
        >
          <div class="challenge-icon">
            <i :class="getChallengeIcon(challenge.type)"></i>
          </div>
          <div class="challenge-info">
            <h3>{{ challenge.title }}</h3>
            <p>{{ challenge.description }}</p>
            <div class="challenge-reward">
              <i class="fas fa-coins"></i>
              <span>{{ challenge.reward.tokens }} tokens</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserProfileStore } from '../../stores/gamification/userProfile.store';
import { useDailyStreakStore } from '../../stores/gamification/dailyStreak.store';
import { useChallengesStore } from '../../stores/gamification/challenges.store';
import { useNavigationStore } from '../../stores/navigation.store';
import { useGameStore } from '../../stores/game.store';

const userStore = useUserProfileStore();
const dailyStreakStore = useDailyStreakStore();
const challengesStore = useChallengesStore();
const navigationStore = useNavigationStore();
const gameStore = useGameStore();

const activeChallenges = computed(() => challengesStore.activeChallenges);
const canContinue = computed(() => gameStore.tiles.some(t => t.active));

function startNewGame() {
  // Por enquanto, navegar direto para o jogo
  navigationStore.navigateTo('game');
}

function continueGame() {
  navigationStore.navigateTo('game');
}

function getChallengeIcon(type: string) {
  const icons: Record<string, string> = {
    daily: 'fas fa-calendar-day',
    weekly: 'fas fa-calendar-week',
    achievement: 'fas fa-medal',
    special: 'fas fa-star'
  };
  return icons[type] || 'fas fa-tasks';
}
</script>

<style scoped>
.home-view {
  padding: 2rem 1.5rem;
  padding-top: 5rem; /* Extra space for header */
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}

.home-header {
  text-align: center;
  margin-bottom: 2rem;
}

.home-header h1 {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card i {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 0.75rem;
  display: block;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.quick-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-button {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: var(--border-radius-lg);
  background: var(--surface-color);
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: var(--shadow-sm);
}

.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-button.primary {
  background: var(--primary-color);
  color: white;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.challenges-preview h2 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.challenge-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.challenge-item {
  display: flex;
  gap: 1rem;
  background: var(--surface-color);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.challenge-icon {
  width: 40px;
  height: 40px;
  background: var(--primary-color-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.challenge-icon i {
  color: var(--primary-color);
  font-size: 1.25rem;
}

.challenge-info {
  flex: 1;
}

.challenge-info h3 {
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.challenge-info p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.challenge-reward {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .home-view {
    padding: 2rem 1rem;
    padding-top: 5rem; /* Extra space for header */
    padding-bottom: 80px; /* Espaço para menu bottom */
  }
  
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .quick-actions {
    flex-direction: column;
  }
}
</style>