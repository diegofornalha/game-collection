<template>
  <div class="profile-view">
    <div class="profile-header">
      <h1>Meu Perfil</h1>
    </div>

    <div class="profile-content">
      <div class="level-section">
        <UserLevelDisplay
          :level="userStore.level"
          :experience="userStore.experiencePoints"
          :nextLevelExp="userStore.nextLevelExperience"
          :show-progress="true"
        />
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <i class="fas fa-gamepad"></i>
          <div class="stat-info">
            <span class="stat-value">{{ userStore.profile.stats.gamesPlayed }}</span>
            <span class="stat-label">Jogos Totais</span>
          </div>
        </div>

        <div class="stat-box">
          <i class="fas fa-trophy"></i>
          <div class="stat-info">
            <span class="stat-value">{{ userStore.profile.stats.gamesWon }}</span>
            <span class="stat-label">Vitórias</span>
          </div>
        </div>

        <div class="stat-box">
          <i class="fas fa-percentage"></i>
          <div class="stat-info">
            <span class="stat-value">{{ Math.round(userStore.profile.stats.winRate) }}%</span>
            <span class="stat-label">Taxa de Vitória</span>
          </div>
        </div>

        <div class="stat-box">
          <i class="fas fa-clock"></i>
          <div class="stat-info">
            <span class="stat-value">{{ formatTime(userStore.profile.stats.bestTime) }}</span>
            <span class="stat-label">Melhor Tempo</span>
          </div>
        </div>

        <div class="stat-box">
          <i class="fas fa-fire"></i>
          <div class="stat-info">
            <span class="stat-value">{{ userStore.profile.stats.longestStreak }}</span>
            <span class="stat-label">Maior Ofensiva</span>
          </div>
        </div>

        <div class="stat-box">
          <i class="fas fa-coins"></i>
          <div class="stat-info">
            <span class="stat-value">{{ userStore.tokens }}</span>
            <span class="stat-label">Tokens</span>
          </div>
        </div>
      </div>

      <div class="achievements-section">
        <h2>Conquistas Recentes</h2>
        <div class="achievement-list">
          <div 
            v-for="achievement in recentAchievements" 
            :key="achievement.id"
            class="achievement-item"
          >
            <div class="achievement-icon">
              <i :class="achievement.icon"></i>
            </div>
            <div class="achievement-info">
              <h3>{{ achievement.name }}</h3>
              <p>{{ achievement.description }}</p>
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
import UserLevelDisplay from '../common/UserLevelDisplay.vue';

const userStore = useUserProfileStore();

const recentAchievements = computed(() => 
  userStore.profile.achievements
    .filter(a => a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3)
);

function formatTime(seconds?: number): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
</script>

<style scoped>
.profile-view {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}

.profile-header {
  margin-bottom: 2rem;
}

.profile-header h1 {
  font-size: 1.75rem;
  color: var(--text-primary);
}

.level-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 3rem;
}

.stat-box {
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-box i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.achievements-section h2 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.achievement-item {
  display: flex;
  gap: 1rem;
  background: var(--surface-color);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.achievement-icon {
  width: 50px;
  height: 50px;
  background: var(--primary-color-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.achievement-icon i {
  color: var(--primary-color);
  font-size: 1.5rem;
}

.achievement-info {
  flex: 1;
}

.achievement-info h3 {
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.achievement-info p {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .profile-view {
    padding: 1rem;
    padding-bottom: 80px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>