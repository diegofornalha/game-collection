<template>
  <div class="profile-view">
    <div class="profile-header">
      <h1>Perfil do Jogador</h1>
    </div>
    
    <div class="profile-container">
      <!-- Coluna Esquerda: Informações do Jogador -->
      <div class="profile-info">
        <div class="avatar-section">
          <div class="avatar">
            <span class="avatar-icon">👤</span>
          </div>
          <h2 class="username">{{ username }}</h2>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">⭐</span>
            <span class="stat-label">Nível</span>
            <span class="stat-value">{{ level }}</span>
          </div>
          
          <div class="stat-card">
            <span class="stat-icon">✨</span>
            <span class="stat-label">Experiência</span>
            <span class="stat-value">{{ experience }} XP</span>
          </div>
          
          <div class="stat-card">
            <span class="stat-icon">🪙</span>
            <span class="stat-label">Tokens</span>
            <span class="stat-value">{{ tokens }}</span>
          </div>
          
          <div class="stat-card">
            <span class="stat-icon">🏆</span>
            <span class="stat-label">Jogos Ganhos</span>
            <span class="stat-value">{{ gamesWon }}</span>
          </div>
        </div>
        
        <!-- Conquistas Recentes -->
        <div class="achievements-section">
          <h3>Conquistas Recentes</h3>
          <div class="achievement-list">
            <div class="achievement-item">
              <span class="achievement-icon">🎯</span>
              <span>Primeira Vitória</span>
            </div>
            <div class="achievement-item">
              <span class="achievement-icon">🔥</span>
              <span>Ofensiva de 3 Dias</span>
            </div>
            <div class="achievement-item">
              <span class="achievement-icon">⚡</span>
              <span>Vitória Rápida</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Coluna Direita: Calendário de Ofensivas -->
      <div class="calendar-section">
        <h2 class="section-title">📅 Calendário de Ofensivas</h2>
        <StreakCalendar />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserProfileStore } from '@/stores/gamification/userProfile.store';
import { useGameStore } from '@/stores/game.store';
import StreakCalendar from '@/components/StreakCalendar.vue';

const userProfileStore = useUserProfileStore();
const gameStore = useGameStore();

const username = computed(() => userProfileStore.username || 'Jogador');
const level = computed(() => userProfileStore.level);
const experience = computed(() => userProfileStore.experiencePoints);
const tokens = computed(() => userProfileStore.tokens);
const gamesWon = computed(() => gameStore.gamesWon || 0);
</script>

<style scoped>
.profile-view {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-header h1 {
  font-size: 2.5rem;
  color: #FFD700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  margin: 0;
}

.profile-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Informações do Perfil */
.profile-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.avatar-section {
  text-align: center;
  margin-bottom: 24px;
}

.avatar {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
}

.avatar-icon {
  font-size: 3rem;
}

.username {
  font-size: 1.5rem;
  color: #FFD700;
  margin: 0;
}

/* Grid de Estatísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid rgba(255, 215, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  font-size: 1.3rem;
  color: #FFD700;
  font-weight: bold;
}

/* Conquistas */
.achievements-section {
  background: rgba(255, 215, 0, 0.05);
  border-radius: 12px;
  padding: 16px;
}

.achievements-section h3 {
  color: #FFD700;
  margin: 0 0 16px 0;
  font-size: 1.2rem;
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: #f0e6d2;
  transition: transform 0.2s;
}

.achievement-item:hover {
  transform: translateX(4px);
  background: rgba(255, 215, 0, 0.1);
}

.achievement-icon {
  font-size: 1.2rem;
}

/* Seção do Calendário */
.calendar-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  color: #FFD700;
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  text-align: center;
}

/* Responsividade */
@media (max-width: 768px) {
  .profile-container {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .profile-header h1 {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .profile-view {
    padding: 10px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>