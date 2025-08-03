<template>
  <div class="profile-view">
    <h1>Perfil do Jogador</h1>
    <div class="profile-content">
      <p>Nome: {{ username }}</p>
      <p>Nível: {{ level }}</p>
      <p>Experiência: {{ experience }}</p>
      <p>Tokens: {{ tokens }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserProfileStore } from '@/stores/gamification/userProfile.store';

const userProfileStore = useUserProfileStore();

const username = computed(() => userProfileStore.username);
const level = computed(() => userProfileStore.level);
const experience = computed(() => userProfileStore.experiencePoints);
const tokens = computed(() => userProfileStore.tokens);
</script>

<style scoped>
.profile-view {
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.profile-content {
  font-size: 1.1rem;
  line-height: 1.8;
}

.profile-content p {
  margin: 0.5rem 0;
}
</style>