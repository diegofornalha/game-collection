<template>
  <div class="settings-view">
    <h1>Configurações</h1>
    <div class="settings-content">
      <div class="setting-item">
        <label>
          <input type="checkbox" v-model="soundEnabled" @change="toggleSound">
          Sons do Jogo
        </label>
      </div>
      <div class="setting-item">
        <label>Velocidade da Animação</label>
        <select v-model="animationSpeed" @change="updateAnimationSpeed">
          <option value="slow">Lenta</option>
          <option value="normal">Normal</option>
          <option value="fast">Rápida</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGamePreferencesStore } from '@/stores/gamePreferences.store';

const preferencesStore = useGamePreferencesStore();

const soundEnabled = computed({
  get: () => preferencesStore.soundEnabled,
  set: (value) => preferencesStore.updatePreferences({ soundEnabled: value })
});

const animationSpeed = computed({
  get: () => preferencesStore.animationSpeed,
  set: (value) => preferencesStore.setAnimationSpeed(value as 'slow' | 'normal' | 'fast')
});

function toggleSound() {
  preferencesStore.toggleSound();
}

function updateAnimationSpeed() {
  // Animation speed is already updated through v-model
}
</script>

<style scoped>
.settings-view {
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.settings-content {
  font-size: 1.1rem;
}

.setting-item {
  margin: 1rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.setting-item select {
  margin-top: 0.5rem;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
</style>