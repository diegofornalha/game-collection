<template>
  <div class="achievements-view">
    <h1>Conquistas</h1>
    <div class="achievements-list">
      <div class="achievement-item" v-for="achievement in achievements" :key="achievement.id">
        <h3>{{ achievement.title }}</h3>
        <p>{{ achievement.description }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: achievement.progress + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Mock achievements data
const achievements = ref([
  {
    id: 1,
    title: 'Primeira Vitória',
    description: 'Complete seu primeiro jogo',
    progress: 100
  },
  {
    id: 2,
    title: 'Mestre do Tempo',
    description: 'Complete um jogo em menos de 5 minutos',
    progress: 60
  },
  {
    id: 3,
    title: 'Combo Master',
    description: 'Faça 10 combos seguidos',
    progress: 30
  }
]);
</script>

<style scoped>
.achievements-view {
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.achievement-item {
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.achievement-item h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.achievement-item p {
  margin: 0 0 1rem 0;
  color: #666;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}
</style>