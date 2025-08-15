<template>
  <div class="home-view">
    <h1>Bem-vindo ao Mahjong</h1>
    <button @click="startGame">Jogar</button>
  </div>
</template>

<script setup lang="ts">
import { useNavigationStore } from '@/stores/navigation.store';

const navigationStore = useNavigationStore();

function startGame() {
  navigationStore.navigateTo('game');
}
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  opacity: 0.9;
}
</style>