<template>
  <div class="shortcuts-view">
    <!-- Header com informações do jogo -->
    <div class="game-status-header">
      <div class="status-info">
        <div class="timer-display">
          <span class="timer-icon">⏱️</span>
          <span class="timer-value">{{ formatTime(gameStore.timer) }}</span>
        </div>
        <div class="tiles-remaining">
          <span class="tiles-icon">🀄</span>
          <span class="tiles-value">{{ remainingTiles }}/144</span>
        </div>
      </div>
    </div>

    <!-- Mapa de Progresso -->
    <div class="progress-map">
      <svg class="path-svg" viewBox="0 0 400 600">
        <!-- Caminho sinuoso -->
        <path
          d="M 200 550 Q 100 500, 150 450 T 250 350 Q 150 300, 200 250 T 300 150 Q 200 100, 250 50"
          fill="none"
          stroke="rgba(255, 215, 0, 0.2)"
          stroke-width="3"
          stroke-dasharray="5,5"
        />
      </svg>

      <!-- Checkpoints do Progresso -->
      <div class="checkpoint" :class="getCheckpointClass(1)" style="bottom: 10%; left: 50%;">
        <div class="checkpoint-number">1</div>
        <div class="checkpoint-label">Início</div>
      </div>

      <div class="checkpoint" :class="getCheckpointClass(2)" style="bottom: 25%; left: 30%;">
        <div class="checkpoint-number">2</div>
        <div class="checkpoint-label">25%</div>
      </div>

      <div class="checkpoint" :class="getCheckpointClass(3)" style="bottom: 40%; left: 65%;">
        <div class="checkpoint-number">3</div>
        <div class="checkpoint-label">50%</div>
      </div>

      <div class="checkpoint" :class="getCheckpointClass(4)" style="bottom: 55%; left: 35%;">
        <div class="checkpoint-number">4</div>
        <div class="checkpoint-label">75%</div>
      </div>

      <div class="checkpoint" :class="getCheckpointClass(5)" style="bottom: 70%; left: 60%;">
        <div class="checkpoint-number">5</div>
        <div class="checkpoint-label">90%</div>
      </div>

      <!-- Objetivo Final -->
      <div class="final-goal" style="top: 10%; left: 50%;">
        <div class="goal-icon">🏆</div>
        <div class="goal-label">Vitória!</div>
      </div>

      <!-- Indicador de Posição Atual -->
      <div 
        class="current-position" 
        :style="getCurrentPositionStyle()"
      >
        <div class="position-marker">
          <span class="marker-icon">📍</span>
        </div>
        <div class="position-info">
          <span>{{ gameProgress }}% concluído</span>
        </div>
      </div>
    </div>

    <!-- Aviso sobre Ofensiva -->
    <div class="streak-warning" v-if="gameStore.isPlaying && !gameStore.isPaused">
      <div class="warning-icon">⚠️</div>
      <div class="warning-content">
        <h3>Jogo em Andamento!</h3>
        <p>Complete o jogo para manter sua ofensiva de <strong>{{ dailyStreakStore.streakData.currentStreak }} dias</strong></p>
        <p class="warning-note">Sair agora resultará na perda da ofensiva diária</p>
      </div>
    </div>

    <!-- Estatísticas do Jogo Atual -->
    <div class="game-stats">
      <div class="stat-item">
        <span class="stat-icon">💯</span>
        <span class="stat-label">Pontuação</span>
        <span class="stat-value">{{ gameStore.score }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🎯</span>
        <span class="stat-label">Combos</span>
        <span class="stat-value">{{ gameStore.currentCombo }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">⚡</span>
        <span class="stat-label">Velocidade</span>
        <span class="stat-value">{{ getSpeedRating() }}</span>
      </div>
    </div>

    <!-- Botão de Ação -->
    <div class="action-section">
      <button 
        @click="continueGame" 
        class="continue-button"
        v-if="gameStore.isPlaying"
      >
        <span class="button-icon">🎮</span>
        Continuar Jogo
      </button>
      
      <button 
        @click="startNewGame" 
        class="new-game-button"
        v-else
      >
        <span class="button-icon">🆕</span>
        Novo Jogo
      </button>
    </div>

    <!-- Dicas -->
    <div class="tips-section">
      <h3>💡 Dicas Rápidas</h3>
      <ul class="tips-list">
        <li>Complete o jogo diariamente para manter sua ofensiva</li>
        <li>Combos aumentam sua pontuação exponencialmente</li>
        <li>Use as dicas quando estiver travado</li>
        <li>Pratique para melhorar seu tempo</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/game.store';
import { useDailyStreakStore } from '@/stores/gamification/dailyStreak.store';
import { useNavigationStore } from '@/stores/navigation.store';

const gameStore = useGameStore();
const dailyStreakStore = useDailyStreakStore();
const navigationStore = useNavigationStore();

// Computed para progresso do jogo
const gameProgress = computed(() => {
  const totalTiles = 144;
  const removed = totalTiles - (gameStore.remainingTiles || totalTiles);
  return Math.round((removed / totalTiles) * 100);
});

const remainingTiles = computed(() => gameStore.remainingTiles || 144);

// Formatar tempo
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Classe do checkpoint baseado no progresso
function getCheckpointClass(checkpoint: number): string {
  const thresholds = [0, 25, 50, 75, 90];
  const isCompleted = gameProgress.value >= thresholds[checkpoint - 1];
  const isCurrent = checkpoint === getCurrentCheckpoint();
  
  return [
    'checkpoint',
    isCompleted && 'completed',
    isCurrent && 'current'
  ].filter(Boolean).join(' ');
}

// Checkpoint atual
function getCurrentCheckpoint(): number {
  const progress = gameProgress.value;
  if (progress >= 90) return 5;
  if (progress >= 75) return 4;
  if (progress >= 50) return 3;
  if (progress >= 25) return 2;
  return 1;
}

// Estilo da posição atual no mapa
function getCurrentPositionStyle() {
  const progress = gameProgress.value;
  
  // Calcular posição baseada no progresso
  let bottom = 10 + (progress * 0.6); // 10% até 70%
  let left = 50;
  
  // Ajustar left baseado no checkpoint
  const checkpoint = getCurrentCheckpoint();
  switch(checkpoint) {
    case 2: left = 30; break;
    case 3: left = 65; break;
    case 4: left = 35; break;
    case 5: left = 60; break;
  }
  
  return {
    bottom: `${bottom}%`,
    left: `${left}%`
  };
}

// Avaliar velocidade do jogo
function getSpeedRating(): string {
  const timePerTile = gameStore.timer / (144 - remainingTiles.value || 1);
  if (timePerTile < 3) return 'Rápido';
  if (timePerTile < 5) return 'Normal';
  return 'Calmo';
}

// Continuar jogo
function continueGame() {
  navigationStore.navigateTo('game');
  if (gameStore.isPaused) {
    gameStore.resumeGame();
  }
}

// Novo jogo
function startNewGame() {
  navigationStore.navigateTo('game');
}
</script>

<style scoped>
.shortcuts-view {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #2c1810 0%, #3d2418 100%);
  color: #f0e6d2;
}

/* Header de Status */
.game-status-header {
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 15px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.timer-display,
.tiles-remaining {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
}

.timer-icon,
.tiles-icon {
  font-size: 1.5rem;
}

.timer-value,
.tiles-value {
  color: #FFD700;
  font-weight: bold;
}

/* Mapa de Progresso */
.progress-map {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 500px;
  margin: 0 auto 30px;
  background: linear-gradient(135deg, rgba(139, 111, 78, 0.1) 0%, rgba(160, 130, 95, 0.1) 100%);
  border-radius: 20px;
  border: 2px solid rgba(255, 215, 0, 0.2);
  overflow: hidden;
}

.path-svg {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.3;
}

/* Checkpoints */
.checkpoint {
  position: absolute;
  transform: translate(-50%, 50%);
  transition: all 0.3s;
}

.checkpoint-number {
  width: 40px;
  height: 40px;
  background: rgba(139, 111, 78, 0.8);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 auto 5px;
}

.checkpoint.completed .checkpoint-number {
  background: #4CAF50;
  border-color: #66BB6A;
  color: white;
}

.checkpoint.current .checkpoint-number {
  background: #FFD700;
  border-color: #FFA500;
  color: #2c1810;
  animation: pulse 2s infinite;
}

.checkpoint-label {
  font-size: 0.8rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Objetivo Final */
.final-goal {
  position: absolute;
  transform: translate(-50%, 0);
  text-align: center;
}

.goal-icon {
  font-size: 2.5rem;
  margin-bottom: 5px;
  filter: grayscale(0.5);
  opacity: 0.5;
}

.goal-label {
  font-size: 0.9rem;
  color: rgba(255, 215, 0, 0.5);
}

/* Posição Atual */
.current-position {
  position: absolute;
  transform: translate(-50%, 50%);
  text-align: center;
  z-index: 10;
}

.position-marker {
  animation: bounce 2s infinite;
}

.marker-icon {
  font-size: 2rem;
}

.position-info {
  background: rgba(0, 0, 0, 0.8);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  margin-top: 5px;
  white-space: nowrap;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Aviso de Ofensiva */
.streak-warning {
  background: linear-gradient(135deg, rgba(255, 140, 0, 0.2), rgba(255, 0, 0, 0.1));
  border: 2px solid rgba(255, 140, 0, 0.5);
  border-radius: 12px;
  padding: 20px;
  margin: 20px auto;
  max-width: 500px;
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.warning-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.warning-content h3 {
  margin: 0 0 8px 0;
  color: #FFA500;
  font-size: 1.2rem;
}

.warning-content p {
  margin: 5px 0;
  color: #f0e6d2;
}

.warning-note {
  font-size: 0.9rem;
  color: rgba(255, 140, 0, 0.8);
  font-style: italic;
}

/* Estatísticas */
.game-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 30px 0;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  min-width: 100px;
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.3rem;
  color: #FFD700;
  font-weight: bold;
}

/* Botões de Ação */
.action-section {
  display: flex;
  justify-content: center;
  margin: 30px 0;
}

.continue-button,
.new-game-button {
  padding: 16px 32px;
  font-size: 1.2rem;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.continue-button {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
}

.continue-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.new-game-button {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #2c1810;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
}

.new-game-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
}

.button-icon {
  font-size: 1.3rem;
}

/* Dicas */
.tips-section {
  max-width: 500px;
  margin: 40px auto 20px;
  padding: 20px;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.tips-section h3 {
  margin: 0 0 15px 0;
  color: #FFD700;
  font-size: 1.1rem;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  padding: 8px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  position: relative;
  padding-left: 20px;
}

.tips-list li:before {
  content: '•';
  position: absolute;
  left: 0;
  color: #FFD700;
  font-weight: bold;
}

/* Responsividade */
@media (max-width: 768px) {
  .shortcuts-view {
    padding: 10px;
  }
  
  .progress-map {
    height: 400px;
  }
  
  .game-stats {
    gap: 15px;
  }
  
  .stat-item {
    min-width: 80px;
    padding: 10px;
  }
}
</style>